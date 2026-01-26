import uuid
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from google.cloud import firestore
from google.cloud import storage
from google.cloud.firestore import FieldFilter
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_vertexai import ChatVertexAI
from app.core.config import get_settings
from app.schemas.case import Case, CaseCreate, InvolvedPerson

logger = logging.getLogger(__name__)
settings = get_settings()

class CaseService:
    def __init__(self):
        self._db = None
        self.collection_name = "cases"
        self.protocol_collection_name = "case_protocols"
        self.documents_collection_name = "case_documents"
        self._llm = None
        self._storage_client = None

    @property
    def db(self):
        if self._db is None:
            self._db = firestore.Client(project=settings.PROJECT_ID, database=settings.FIRESTORE_DATABASE)
        return self._db

    def get_student_stats(self, student_id: str) -> dict:
        """Obtiene estadísticas de un estudiante"""
        try:
            # Query cases by student_id
            cases_ref = self.db.collection(self.collection_name).where(filter=FieldFilter("student_id", "==", student_id))
            cases = list(cases_ref.stream())

            casos_activos = 0
            casos_cerrados = 0
            
            # Simple aggregation
            for doc in cases:
                data = doc.to_dict()
                status = data.get("status", "active")
                if status == "active" or status == "abierto" or status == "pendiente":
                    casos_activos += 1
                else:
                    casos_cerrados += 1

            # Mocking other metrics for now until we have dedicated collections/links
            # In V2 we should introspect protocols or dedicated Interview/Commitment collections
            entrevistas = 0 # Placeholder for now, or count case documents of type interview?
            compromisos_activos = 0 # Placeholder
            
            return {
                "casosActivos": casos_activos,
                "casosCerrados": casos_cerrados,
                "entrevistas": entrevistas,
                "compromisosActivos": compromisos_activos
            }
        except Exception as e:
            logger.error(f"Error getting student stats: {e}")
            return {
                "casosActivos": 0,
                "casosCerrados": 0,
                "entrevistas": 0,
                "compromisosActivos": 0
            }


    def get_cases_by_student(self, student_id: str) -> List[dict]:
        """Obtiene lista completa de casos de un estudiante"""
        try:
            cases_ref = self.db.collection(self.collection_name).where(filter=FieldFilter("student_id", "==", student_id))
            docs = list(cases_ref.stream())
            return [doc.to_dict() | {"id": doc.id} for doc in docs]
        except Exception as e:
            logger.error(f"Error getting student cases: {e}")
            return []
            
    @property
    def llm(self):
        if self._llm is None:
            model_name = settings.VERTEX_MODEL_FLASH or settings.VERTEX_MODEL_REASON or settings.VERTEX_MODEL
            
            logger.info(f"🤖 [CASE_SERVICE] Initializing LLM with model: {model_name}")
            self._llm = ChatVertexAI(
                model_name=model_name,
                temperature=0.1, # Low temperature for extraction
                project=settings.PROJECT_ID,
                location=settings.VERTEX_LOCATION or "us-central1",
            )
        return self._llm

    @property
    def storage_client(self):
        if self._storage_client is None:
            self._storage_client = storage.Client(project=settings.PROJECT_ID)
        return self._storage_client

    async def generate_case_from_session(
        self,
        session_id: str,
        owner_id: str,
        colegio_id: str,
        owner_name: Optional[str] = None
    ) -> Case:
        """
        Analiza el historial del chat y genera un caso estructurado.

        Args:
            session_id: ID de la sesión de chat
            owner_id: ID del usuario que crea el caso"""
    async def generate_case_from_session(self, session_id: str, owner_id: str = None, colegio_id: str = None, owner_name: str = None) -> Case:
        """Genera un caso a partir del historial de una sesión de chat."""
        # 1. Obtener historial
        # Resolver bucket si existe colegio
        bucket_name = None
        if colegio_id:
             from app.services.storage_service import storage_service
             bucket_name = storage_service.get_school_bucket_name(colegio_id)
        
        from app.services.chat.history_service import history_service
        history = await history_service.load_history(session_id, bucket_name)
        if not history:
            logger.warning(f"No history found for session {session_id}")
            raise ValueError("No se encontró historial de chat para esta sesión. Asegúrate de haber conversado con el asistente antes de generar el caso.")

        # Convertir historial a texto
        conversation_text = ""
        for msg in history:
            role = "Usuario" if isinstance(msg, HumanMessage) else "Asistente"
            conversation_text += f"{role}: {msg.content}\n"

        # 2. Extraer información con LLM
        prompt = ChatPromptTemplate.from_template("""
        Actúa como un experto en Convivencia Escolar. Tu tarea es analizar la siguiente conversación y estructurar un Caso de Convivencia Escolar formal.

        Conversación:
        {conversation}

        Instrucciones:
        1.  **Título**: Crea un título profesional y descriptivo (ej: "Agresión física entre estudiantes de 8vo básico").
        2.  **Descripción**: Redacta un resumen cronológico y objetivo de los hechos mencionados. Incluye qué pasó, dónde, cuándo y quiénes participaron.
        3.  **Tipo de Caso**: Clasifícalo en una de estas categorías: "Conflicto entre estudiantes", "Maltrato escolar", "Disrupción en el aula", "Faltas de asistencia", "Problemas con apoderados", "Vulneración de derechos". Si no estás seguro, usa "Otro".
        4.  **Involucrados**: Identifica a TODAS las personas mencionadas (estudiantes, docentes, apoderados).
            -   Para cada persona, intenta inferir su Rol (Estudiante, Docente, Apoderado, Víctima, Agresor, Testigo).
            -   Si no se menciona el nombre, usa una descripción (ej: "Estudiante de 8vo B").
        5.  **Protocolo**: Si en la conversación se mencionó o sugirió un protocolo específico (ej: "Protocolo de Maltrato", "Protocolo de Retención"), indícalo. Si no, pon "Por definir".

        IMPORTANTE: No inventes información. Si algo no se menciona, usa "No especificado" o déjalo vacío.
        """)

        # Usar with_structured_output temporal sin owner_id y colegio_id
        # Ya que el LLM solo extrae info del chat, no conoce estos datos
        from pydantic import BaseModel

        class TempCaseExtract(BaseModel):
            title: str
            description: str
            case_type: str
            status: str = "active"
            involved: List[InvolvedPerson] = []
            protocol: Optional[str] = None

        structured_llm = self.llm.with_structured_output(TempCaseExtract)
        chain = prompt | structured_llm

        try:
            extracted_data = await chain.ainvoke({"conversation": conversation_text})
        except Exception as e:
            logger.exception(f"Error extracting case data from conversation")
            raise ValueError("Failed to extract case data from conversation")

        # 3. Crear CaseCreate con owner_id y colegio_id
        case_data = CaseCreate(
            title=extracted_data.title,
            description=extracted_data.description,
            case_type=extracted_data.case_type,
            status=extracted_data.status,
            involved=extracted_data.involved,
            protocol=extracted_data.protocol,
            owner_id=owner_id,
            colegio_id=colegio_id,
            related_sessions=[session_id] # Vincular sesión origen
        )

        # 4. Guardar en Firestore
        new_case = self.create_case(case_data, owner_name)

        # 5. Intentar extraer y guardar el protocolo completo desde el historial
        # Esto es necesario porque durante el chat no teníamos case_id
        await self._extract_protocol_from_history(history, new_case.id, session_id)

        # 6. Guardar documentos del chat como documentos del caso
        docs_saved = self.save_case_documents(new_case.id, session_id, source="chat", bucket_name=bucket_name)
        if docs_saved > 0:
            logger.info(f"{docs_saved} documents from chat saved to case {new_case.id}")

        return new_case

    async def _extract_protocol_from_history(self, history: List, case_id: str, session_id: str):
        """
        Busca en el historial reciente si hubo un protocolo sugerido y lo guarda asociado al caso.
        """
        try:
            from app.services.protocols.protocol_extractor import protocol_extractor
            from app.services.protocols.protocol_execution_service import protocol_execution_service

            # Iterar desde el último mensaje hacia atrás
            for msg in reversed(history):
                if isinstance(msg, AIMessage):
                    # Intentar extraer protocolo
                    extracted = protocol_extractor.extract_protocol_from_response(msg.content, case_id, session_id)
                    if extracted and extracted.steps and len(extracted.steps) > 0:
                        # Guardar usando el servicio de ejecución de protocolos
                        await protocol_execution_service.save_dynamic_protocol(extracted)
                        return

        except Exception as e:
            logger.warning(f"Error extracting protocol from history: {e}")

    async def analyze_file_for_update(self, case_id: str, file_uri: str) -> dict:
        """
        Analiza un archivo adjunto y extrae información para actualizar la descripción e involucrados del caso.
        """
        try:
            # 1. Obtener caso actual
            case = self.get_case_by_id(case_id)
            if not case:
                raise ValueError("Caso no encontrado")

            logger.debug(f"Analyzing file for case {case_id}: {file_uri}")

            # 2. Detectar tipo MIME
            import mimetypes
            mime_type, _ = mimetypes.guess_type(file_uri)
            logger.debug(f"MIME type detected: {mime_type}")

            # 3. Preparar descripción actual de forma legible
            current_description = case.description or "Sin descripción previa"
            current_involved = [{"nombre": p.name, "rol": p.role or "Sin rol"} for p in case.involved] if case.involved else []

            # 4. Preparar prompt con la información actual del caso
            prompt_text = f"""Eres un experto en Convivencia Escolar. Analiza el archivo adjunto y extrae información para actualizar este caso.

CASO ACTUAL:
- Título: {case.title}
- Descripción: {current_description}
- Involucrados: {current_involved if current_involved else "Ninguno registrado"}

TAREAS:
1. Lee cuidadosamente TODO el contenido del archivo adjunto
2. Genera una descripción MEJORADA que:
   - Combine la información actual con los nuevos hallazgos
   - Sea cronológica, objetiva y detallada
   - NO pierda detalles importantes de la descripción actual
3. Identifica TODAS las personas mencionadas en el archivo:
   - Mantén las que ya existen en la lista actual
   - Agrega las nuevas con su rol (Estudiante, Apoderado, Docente, etc.)
   - Evita duplicar personas

RESPONDE EN FORMATO JSON VÁLIDO:
{{
  "description": "La descripción actualizada completa aquí...",
  "involved": [
    {{"name": "Nombre Completo", "role": "Estudiante"}},
    {{"name": "Otro Nombre", "role": "Apoderado"}}
  ]
}}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional antes o después."""

            # 5. Configurar mensaje con archivo
            content = [{"type": "text", "text": prompt_text}]

            # Agregar archivo según su tipo
            if mime_type and mime_type.startswith("image/"):
                content.append({"type": "image_url", "image_url": {"url": file_uri}})
                logger.debug("Processing as image")
            else:
                content.append({
                    "type": "media",
                    "mime_type": mime_type or "application/pdf",
                    "file_uri": file_uri
                })
                logger.debug(f"Processing as document ({mime_type or 'application/pdf'})")

            # 6. Crear mensaje para el LLM
            messages = [HumanMessage(content=content)]

            # 7. Ejecutar análisis (sin structured output, parseando JSON manualmente)
            logger.debug("Invoking AI for analysis...")
            response = await self.llm.ainvoke(messages)

            logger.debug(f"LLM response received (first 500 chars): {str(response.content)[:500]}")

            # 8. Parsear respuesta JSON
            import json
            import re

            # Extraer JSON de la respuesta (puede venir con markdown o texto extra)
            response_text = response.content

            # Buscar JSON en la respuesta
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if not json_match:
                logger.warning(f"No JSON found in response. Full response: {response_text}")
                raise ValueError("No se pudo extraer JSON de la respuesta del LLM")

            json_str = json_match.group(0)
            logger.debug(f"Extracted JSON: {json_str[:300]}...")

            parsed_data = json.loads(json_str)

            # 9. Validar y formatear datos
            description = parsed_data.get("description", case.description or "")
            involved_data = parsed_data.get("involved", [])

            # Formatear involucrados
            involved_list = []
            for person in involved_data:
                if isinstance(person, dict) and "name" in person:
                    involved_list.append({
                        "name": person["name"],
                        "role": person.get("role") or person.get("rol") or "Sin rol"
                    })

            logger.info(f"Analysis completed - Description: {len(description)} chars, Involved: {len(involved_list)}")

            return {
                "description": description,
                "involved": involved_list
            }

        except Exception as e:
            import traceback
            logger.exception("Error analyzing file for update")
            # En caso de error, devolver lo que teníamos para no romper nada
            if case:
                return {
                    "description": case.description or "",
                    "involved": [i.model_dump() for i in case.involved] if case.involved else []
                }
            raise e

    async def analyze_files_for_create(self, file_uris: List[str]) -> dict:
        """
        Analiza MÚLTIPLES archivos adjuntos y extrae información combinada para crear un nuevo caso.
        Usa structured output de Gemini para extracción rápida y garantizada.
        """
        try:
            if not file_uris:
                raise ValueError("No se proporcionaron archivos para analizar")

            logger.info(f"⚡ [FAST PATH] Analyzing {len(file_uris)} files for new case")

            import mimetypes
            from pydantic import BaseModel, Field
            
            # Schema para structured output
            class InvolvedPerson(BaseModel):
                name: str = Field(description="Nombre completo de la persona")
                role: str = Field(description="Rol: Estudiante, Docente, Apoderado, etc.")
            
            class CaseExtraction(BaseModel):
                title: str = Field(description="Título descriptivo y profesional del caso")
                description: str = Field(description="Resumen cronológico y objetivo de los hechos")
                involved: List[InvolvedPerson] = Field(description="Personas involucradas en el caso")
                case_type: str = Field(description="Tipo: Maltrato, Bullying, Conflicto, Violencia, u Otro")
            
            # Prompt conciso - no necesitamos instrucciones de JSON
            prompt_text = """Analiza el/los documento(s) adjunto(s) sobre este caso de convivencia escolar.

Extrae:
- Título profesional que describa el caso
- Descripción cronológica de los hechos
- Todas las personas mencionadas con sus roles
- Tipo de caso según el contenido"""

            # Preparar contenido con archivos
            content = [{"type": "text", "text": prompt_text}]
            
            for file_uri in file_uris:
                mime_type, _ = mimetypes.guess_type(file_uri)
                if mime_type and mime_type.startswith("image/"):
                    content.append({"type": "image_url", "image_url": {"url": file_uri}})
                else:
                    content.append({
                        "type": "media",
                        "mime_type": mime_type or "application/pdf",
                        "file_uri": file_uri
                    })

            # Structured output - mucho más rápido y confiable
            structured_llm = self.llm.with_structured_output(CaseExtraction)
            messages = [HumanMessage(content=content)]
            
            result = await structured_llm.ainvoke(messages)
            
            logger.info(f"✅ Structured extraction complete: title='{result.title[:50]}...', {len(result.involved)} involved, type={result.case_type}")

            # Formatear para respuesta
            involved_list = [
                {"name": person.name, "role": person.role}
                for person in result.involved
            ]

            return {
                "title": result.title,
                "description": result.description,
                "involved": involved_list,
                "case_type": result.case_type
            }

        except Exception as e:
            import traceback
            logger.exception("Error analyzing multiple files")
            raise ValueError(f"Error al analizar archivos: {str(e)}")





    async def analyze_file_for_create(self, file_uri: str) -> dict:
        """
        Analiza un archivo adjunto y extrae información para crear un nuevo caso.
        """
        try:
            logger.debug(f"Analyzing file for new case: {file_uri}")

            # 1. Detectar tipo MIME
            import mimetypes
            mime_type, _ = mimetypes.guess_type(file_uri)
            logger.debug(f"MIME type detected: {mime_type}")

            # 2. Preparar prompt para extraer información de caso nuevo
            prompt_text = """Eres un experto en Convivencia Escolar. Analiza el archivo adjunto y extrae información para crear un nuevo caso de convivencia.

TAREAS:
1. Lee cuidadosamente TODO el contenido del archivo adjunto
2. Genera una descripción detallada del caso que:
   - Sea cronológica, objetiva y completa
   - Incluya todos los detalles relevantes del incidente
   - Use un lenguaje profesional apropiado para un caso escolar
3. Identifica TODAS las personas mencionadas:
   - Incluye su nombre completo si está disponible
   - Asigna un rol apropiado (Estudiante, Apoderado, Docente, Inspector, Otro)
4. Determina el tipo de caso basándote en el contenido:
   - Opciones: "Bullying", "Violencia física", "Violencia verbal", "Ciberbullying",
     "Discriminación", "Conflicto entre pares", "Falta disciplinaria", "Otro"

RESPONDE EN FORMATO JSON VÁLIDO:
{
  "description": "La descripción completa del caso aquí...",
  "involved": [
    {"name": "Nombre Completo", "role": "Estudiante"},
    {"name": "Otro Nombre", "role": "Apoderado"}
  ],
  "case_type": "Tipo de caso detectado"
}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional antes o después."""

            # 3. Configurar mensaje con archivo
            content = [{"type": "text", "text": prompt_text}]

            # Agregar archivo según su tipo
            if mime_type and mime_type.startswith("image/"):
                content.append({"type": "image_url", "image_url": {"url": file_uri}})
                logger.debug("Processing as image")
            else:
                content.append({
                    "type": "media",
                    "mime_type": mime_type or "application/pdf",
                    "file_uri": file_uri
                })
                logger.debug(f"Processing as document ({mime_type or 'application/pdf'})")

            # 4. Crear mensaje para el LLM
            messages = [HumanMessage(content=content)]

            # 5. Ejecutar análisis
            logger.debug("Invoking AI for analysis...")
            response = await self.llm.ainvoke(messages)

            logger.debug(f"LLM response received (first 500 chars): {str(response.content)[:500]}")

            # 6. Parsear respuesta JSON
            import json
            import re

            response_text = response.content

            # Buscar JSON en la respuesta
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if not json_match:
                logger.warning(f"No JSON found in response. Full response: {response_text}")
                raise ValueError("No se pudo extraer JSON de la respuesta del LLM")

            json_str = json_match.group(0)
            logger.debug(f"Extracted JSON: {json_str[:300]}...")

            parsed_data = json.loads(json_str)

            # Validar estructura
            if "description" not in parsed_data or "involved" not in parsed_data:
                raise ValueError("La respuesta del LLM no contiene los campos necesarios (description, involved)")

            # Formatear involucrados
            involved_list = []
            for person in parsed_data.get("involved", []):
                if isinstance(person, dict) and "name" in person:
                    involved_list.append({
                        "name": person["name"],
                        "role": person.get("role") or person.get("rol") or "Sin rol"
                    })

            logger.info(f"Analysis completed: {len(involved_list)} involved detected")
            logger.debug(f"Case type detected: {parsed_data.get('case_type', 'Not specified')}")

            return {
                "description": parsed_data.get("description", ""),
                "involved": involved_list,
                "case_type": parsed_data.get("case_type", "Otro")
            }

        except Exception as e:
            import traceback
            logger.exception("Error analyzing file for new case")
            raise ValueError(f"Error al analizar archivo: {str(e)}")

    async def generate_case_summary(self, case_id: str, user_id: str = None) -> dict:
        """
        Genera un resumen inteligente del caso usando IA.
        """
        try:
            # 1. Obtener caso
            case = self.get_case_by_id(case_id)
            if not case:
                raise ValueError("Caso no encontrado")

            logger.info(f"Generating summary for case {case_id}: {case.title}")

            # 2. Preparar información del caso
            involved_text = ", ".join([p.name for p in case.involved]) if case.involved else "No especificados"

            # 3. Obtener documentos del caso
            documents = self.get_case_documents(case_id)
            
            # 4. Preparar contenido del mensaje (Prompt + Archivos)
            import mimetypes
            
            # Prompt base
            prompt_text = f"""Eres un experto en Convivencia Escolar. 
Analiza este caso y sus documentos adjuntos para generar un RESUMEN EJECUTIVO TÉCNICO.

INFORMACIÓN DEL CASO:
- Título: {case.title}
- Tipo: {case.case_type}
- Estado: {case.status}
- Involucrados: {involved_text}
- Descripción: {case.description or "Sin descripción"}

TU TAREA:
1. Analiza la descripción del caso y TODOS los documentos adjuntos (PDFs, textos, etc).
2. Genera un resumen que integre toda la información disponible.
3. NO des consejos, NO des recomendaciones, NO sugieras protocolos. Solo hechos.
4. Integra la información de manera fluida. NO cites fuentes explícitamente (ej: NO digas "(Fuente: ...)", ni "Según el archivo X").
5. NO menciones el estado del caso ("pendiente", etc.) ni su clasificación/tipo ("Vulneración", etc.) en los puntos clave.

GENERA UN JSON CON:
1. mainPoints: Lista de 5-7 puntos clave que resuman cronológicamente los hechos y hallazgos de los documentos.
   - Sé detallado y preciso.
   - Redacta de forma narrativa y profesional.

2. riskLevel: Nivel de riesgo ("Bajo", "Medio", "Alto") justificado por los hechos.

RESPONDE SOLO CON JSON VÁLIDO:
{{
  "mainPoints": [
    "Punto 1 detallado...",
    "Punto 2 detallado..."
  ],
  "riskLevel": "Alto - Justificación..."
}}"""

            content = [{"type": "text", "text": prompt_text}]

            # Agregar documentos válidos (PDF, TXT, Imagenes)
            docs_added = 0
            for doc in documents:
                # Validar URI
                gcs_uri = doc.get("gcs_uri")
                if not gcs_uri or not gcs_uri.startswith("gs://"):
                    continue
                
                # Validar tipo (solo lo que Vertex AI soporta bien: PDF, TXT, Imagenes)
                content_type = doc.get("content_type", "")
                name = doc.get("name", "").lower()
                
                is_supported = (
                    content_type.startswith("image/") or 
                    content_type == "application/pdf" or 
                    content_type.startswith("text/") or
                    name.endswith(".pdf") or 
                    name.endswith(".txt")
                )
                
                if is_supported:
                    mime = content_type or mimetypes.guess_type(name)[0] or "application/pdf"
                    
                    if mime.startswith("image/"):
                         content.append({"type": "image_url", "image_url": {"url": gcs_uri}})
                    else:
                         content.append({
                            "type": "media", 
                            "mime_type": mime, 
                            "file_uri": gcs_uri
                        })
                    docs_added += 1
            
            logger.info(f"Adding {docs_added} documents to summary analysis")

            # 5. Invocar LLM
            messages = [HumanMessage(content=content)]
            logger.debug("Invoking AI to generate summary with documents...")
            response = await self.llm.ainvoke(messages)
            
            logger.debug(f"Response received: {str(response.content)[:300]}...")

            # Track tokens if user_id provided
            if user_id and response.usage_metadata:
                try:
                    from app.services.users.user_service import user_service
                    user_service.update_token_usage(
                        user_id=user_id,
                        input_tokens=response.usage_metadata.get('input_tokens', 0),
                        output_tokens=response.usage_metadata.get('output_tokens', 0),
                        model_name=self.llm.model_name
                    )
                    logger.info(f"💰 [SUMMARY] Token usage tracked for {user_id}: {response.usage_metadata}")
                except Exception as e:
                    logger.warning(f"⚠️ [SUMMARY] Error tracking tokens: {e}")

            # 6. Parsear respuesta
            import json
            import re

            response_text = response.content
            json_match = re.search(r'\{[\s\S]*\}', response_text)

            if not json_match:
                logger.warning("No JSON found in response")
                raise ValueError("No se pudo extraer JSON de la respuesta del LLM")

            json_str = json_match.group(0)
            parsed_data = json.loads(json_str)

            # 7. Validar estructura
            required_fields = ["mainPoints", "riskLevel"]
            for field in required_fields:
                if field not in parsed_data:
                    # Intentar corregir si falta algo
                    if field == "mainPoints": parsed_data["mainPoints"] = ["No se pudieron extraer puntos clave."]
                    if field == "riskLevel": parsed_data["riskLevel"] = "Por definir"
            
            # Limpiar campos no deseados
            if "recommendations" in parsed_data:
                del parsed_data["recommendations"]
            if "nextSteps" in parsed_data:
                del parsed_data["nextSteps"]

            logger.info("Summary generated successfully with documents")
            
            # Persistir en Firestore
            try:
                # Generar texto para la descripción
                summary_text = ". ".join(parsed_data.get("mainPoints", []))
                if not summary_text.endswith("."):
                    summary_text += "."

                update_data = {
                    "ai_summary": parsed_data,
                    "description": summary_text,
                    "updated_at": datetime.utcnow()
                }

                logger.info(f"💾 Attempting to persist summary for case {case_id}")
                logger.debug(f"Payload: {str(update_data)}")
                
                self.db.collection(self.collection_name).document(case_id).set(update_data, merge=True)
                logger.info(f"✅ Summary persisted successfully for case {case_id}")
                
                # Verificación inmediata
                verify_doc = self.db.collection(self.collection_name).document(case_id).get()
                if verify_doc.exists:
                    verify_data = verify_doc.to_dict()
                    logger.info(f"🔍 Verification read: ai_summary present? {'ai_summary' in verify_data}")
                    if 'ai_summary' in verify_data:
                        logger.debug(f"🔍 Verification content (mainPoints len): {len(verify_data['ai_summary'].get('mainPoints', []))}")
                else:
                    logger.error("❌ Verification failed: Document not found after write!")
            except Exception as e:
                logger.error(f"❌ Error persisting summary: {e}")
                # Log traceback for deeper analysis
                import traceback
                logger.error(traceback.format_exc())

            
            return parsed_data

        except Exception as e:
            import traceback
            logger.exception("Error generating summary")
            raise ValueError(f"Error al generar resumen: {str(e)}")

    def _get_session_files(self, session_id: str, bucket_name: Optional[str] = None) -> List[dict]:
        """
        Obtiene todos los archivos de una sesión desde Google Cloud Storage (escuela o default).
        """
        try:
            # Determinar bucket
            target_bucket_name = bucket_name or f"{settings.PROJECT_ID}-chat-sessions"
            bucket = self.storage_client.bucket(target_bucket_name)

            # Buscar en path de escuela (sesiones/SESSION_ID) o default (SESSION_ID/)
            prefix = f"sesiones/{session_id}/" if bucket_name else f"{session_id}/"
            blobs = list(bucket.list_blobs(prefix=prefix))

            # Si no encuentra nada y se especificó bucket, intentar fallback a path antiguo
            if not blobs and bucket_name:
                 logger.info(f"Checking legacy path in school bucket: {session_id}/")
                 blobs = list(bucket.list_blobs(prefix=f"{session_id}/"))

            # Si sigue sin encontrar nada, fallback al bucket default global
            if not blobs and bucket_name:
                 logger.info(f"Checking default bucket fallback for files: {f'{settings.PROJECT_ID}-chat-sessions'}")
                 default_bucket = self.storage_client.bucket(f"{settings.PROJECT_ID}-chat-sessions")
                 blobs = list(default_bucket.list_blobs(prefix=f"{session_id}/"))

            files = []
            for blob in blobs:
                # Ignorar carpetas virtuales
                if blob.name.endswith("/"):
                    continue

                filename = blob.name.split("/")[-1]

                # Filtrar history.json
                if filename == "history.json":
                    continue

                # Manejar tamaño (puede ser None si es directorio o error)
                size_val = blob.size if blob.size is not None else 0

                files.append({
                    "name": filename,
                    "gcs_uri": f"gs://{blob.bucket.name}/{blob.name}",
                    "size": size_val,
                    "content_type": blob.content_type,
                    "created_at": blob.time_created
                })

            logger.info(f"Found {len(files)} files for session {session_id}")
            return files

        except Exception as e:
            logger.warning(f"Error getting session files: {e}")
            return []

    def save_case_documents(self, case_id: str, session_id: str, source: str = "chat", bucket_name: Optional[str] = None) -> int:
        """
        Guarda los documentos de una sesión como documentos del caso, evitando duplicados.
        """
        try:
            logger.info(f"Saving documents for case {case_id} from session {session_id} (Bucket: {bucket_name})")
            
            # 1. Obtener archivos de la sesión (usando bucket correcto)
            files = self._get_session_files(session_id, bucket_name)

            if not files:
                logger.info(f"No files found for session {session_id}")
                return 0

            # 2. Obtener documentos ya existentes para este caso para evitar duplicados
            existing_docs = (self.db.collection(self.documents_collection_name)
                            .where(filter=FieldFilter("case_id", "==", case_id))
                            .stream())
            existing_names = {doc.to_dict().get("name") for doc in existing_docs}

            logger.debug(f"Found {len(files)} files to save. Existing docs: {existing_names}")

            saved_count = 0
            for file in files:
                # 3. Verificar si ya existe
                if file["name"] in existing_names:
                    logger.info(f"Skipping duplicate file: {file['name']}")
                    continue

                doc_id = str(uuid.uuid4())
                now = datetime.utcnow()

                # Formatear tamaño
                size_bytes = file["size"]
                if size_bytes < 1024:
                    size_str = f"{size_bytes} B"
                elif size_bytes < 1024 * 1024:
                    size_str = f"{size_bytes / 1024:.1f} KB"
                else:
                    size_str = f"{size_bytes / (1024 * 1024):.1f} MB"

                document_data = {
                    "id": doc_id,
                    "case_id": case_id,
                    "name": file["name"],
                    "gcs_uri": file["gcs_uri"],
                    "size": size_str,
                    "size_bytes": size_bytes,
                    "content_type": file["content_type"],
                    "source": source,
                    "session_id": session_id,
                    "created_at": now,
                    "uploaded_at": file["created_at"]
                }

                self.db.collection(self.documents_collection_name).document(doc_id).set(document_data)
                saved_count += 1
                logger.debug(f"Document saved: {file['name']} (ID: {doc_id})")

            logger.info(f"Successfully saved {saved_count} new documents for case {case_id}")
            return saved_count

        except Exception as e:
            logger.exception("Error saving case documents")
            return 0

    def save_single_document(self, case_id: Optional[str], file_data: dict, source: str = "chat") -> Optional[str]:
        """
        Guarda un único documento asociado a un caso.

        Args:
            case_id: ID del caso
            file_data: Diccionario con datos del archivo (name, gcs_uri, size, content_type, session_id)
            source: Fuente del documento

        Returns:
            ID del documento creado o None si hubo error
        """
        try:
            doc_id = str(uuid.uuid4())
            now = datetime.utcnow()

            # Formatear tamaño del archivo
            size_bytes = file_data.get("size", 0)
            if size_bytes < 1024:
                size_str = f"{size_bytes} B"
            elif size_bytes < 1024 * 1024:
                size_str = f"{size_bytes / 1024:.1f} KB"
            else:
                size_str = f"{size_bytes / (1024 * 1024):.1f} MB"

            document_data = {
                "id": doc_id,
                "case_id": case_id,
                "name": file_data["name"],
                "gcs_uri": file_data["gcs_uri"],
                "size": size_str,
                "size_bytes": size_bytes,
                "content_type": file_data["content_type"],
                "source": source,
                "session_id": file_data.get("session_id"),
                "created_at": now,
                "uploaded_at": now
            }

            # Guardar en Firestore
            doc_ref = self.db.collection(self.documents_collection_name).document(doc_id)
            doc_ref.set(document_data)
            logger.info(f"Document saved to case {case_id}: {file_data['name']} (ID: {doc_id})")
            return doc_id

        except Exception as e:
            logger.error(f"Error saving single document: {e}")
            return None

    def get_case_documents(self, case_id: str) -> List[dict]:
        """
        Obtiene todos los documentos de un caso.

        Args:
            case_id: ID del caso

        Returns:
            Lista de documentos del caso
        """
        try:
            logger.debug(f" Getting documents for case {case_id}")
            # Se elimina order_by para evitar la necesidad de un índice compuesto en Firestore.
            # La ordenación se realizará en memoria en el servidor.
            docs = (self.db.collection(self.documents_collection_name)
                   .where(filter=FieldFilter("case_id", "==", case_id))
                   .stream())

            documents = []
            for doc in docs:
                try:
                    doc_data = doc.to_dict()
                    documents.append(doc_data)
                    logger.info(f"  📄 Found document: {doc_data.get('name')}")
                except Exception as e:
                    logger.warning(f"  Could not parse document {doc.id}: {e}")

            # Ordenar en memoria por created_at descendente
            documents.sort(key=lambda x: x.get('created_at', datetime.min), reverse=True)

            logger.info(f" Total documents found: {len(documents)}")
            return documents

        except Exception as e:
            logger.error(f"Error getting case documents: {e}")
            return []

    def delete_case_document(self, case_id: str, document_id: str) -> bool:
        """
        Elimina un documento de un caso.

        Args:
            case_id: ID del caso
            document_id: ID del documento a eliminar

        Returns:
            True si se eliminó exitosamente, False si no se encontró
        """
        try:
            logger.info(f"🗑️ Deleting document {document_id} from case {case_id}")

            # Verificar que el documento existe y pertenece al caso
            doc_ref = self.db.collection(self.documents_collection_name).document(document_id)
            doc = doc_ref.get()

            if not doc.exists:
                logger.info(f"❌ Document {document_id} not found")
                return False

            doc_data = doc.to_dict()
            if doc_data.get("case_id") != case_id:
                logger.info(f"❌ Document {document_id} does not belong to case {case_id}")
                return False

            # Eliminar documento de Firestore
            doc_ref.delete()
            logger.info(f" Document {document_id} deleted from Firestore")

            # TODO: Opcionalmente, eliminar archivo de GCS
            # if doc_data.get("gcs_uri"):
            #     # Eliminar de GCS
            #     pass

            return True

        except Exception as e:
            logger.error(f"Error deleting document: {e}")
            return False
            
    def rename_case_document(self, case_id: str, document_id: str, new_name: str) -> bool:
        """
        Renombra un documento de un caso.
        """
        try:
            logger.info(f"✏️ Renaming document {document_id} in case {case_id} to {new_name}")
            
            doc_ref = self.db.collection(self.documents_collection_name).document(document_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                logger.info(f"❌ Document {document_id} not found")
                return False
                
            doc_data = doc.to_dict()
            if doc_data.get("case_id") != case_id:
                logger.info(f"❌ Document {document_id} does not belong to case {case_id}")
                return False
                
            doc_ref.update({"name": new_name})
            logger.info(f" Document {document_id} renamed to {new_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error renaming document: {e}")
            return False

    def get_document_download_url(self, case_id: str, document_id: str, inline: bool = False) -> str:
        """
        Genera una URL firmada para descargar un documento.
        """
        try:
            logger.info(f"🔗 Generating download URL for document {document_id} in case {case_id} (inline={inline})")
            
            doc_ref = self.db.collection(self.documents_collection_name).document(document_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                raise ValueError("Documento no encontrado")
                
            doc_data = doc.to_dict()
            if doc_data.get("case_id") != case_id:
                raise ValueError("Documento no pertenece al caso")
                
            gcs_uri = doc_data.get("gcs_uri")
            if not gcs_uri:
                raise ValueError("Documento no tiene URI de almacenamiento")
                
            # gcs_uri es tipo gs://bucket-name/blob-name
            # Extraer bucket y blob name
            if not gcs_uri.startswith("gs://"):
                raise ValueError("URI de almacenamiento inválida")
                
            path_parts = gcs_uri.replace("gs://", "").split("/", 1)
            if len(path_parts) != 2:
                raise ValueError("Formato de URI de almacenamiento inválido")
                
            bucket_name = path_parts[0]
            blob_name = path_parts[1]
            
            bucket = self.storage_client.bucket(bucket_name)
            blob = bucket.blob(blob_name)
            
            # Obtener nombre del archivo para Content-Disposition
            file_name = doc_data.get("name", blob_name.split("/")[-1])
            
            # Determinar disposition type
            disposition_type = 'inline' if inline else 'attachment'
            
            # Generar URL firmada válida por 15 minutos con Content-Disposition para forzar descarga o visualización inline
            url = blob.generate_signed_url(
                version="v4",
                expiration=timedelta(minutes=15),
                method="GET",
                response_disposition=f'{disposition_type}; filename="{file_name}"'
            )
            
            logger.info(f" Download URL generated successfully")
            return url
            
        except Exception as e:
            logger.error(f"Error generating download URL: {e}")
            raise e

    def _generate_next_counter_case(self, user_id: str) -> str:
        """
        Genera el siguiente ID legible para el usuario.
        """
        try:
            # Buscar casos del usuario
            # Nota: No usamos order_by aquí para evitar requerir un índice compuesto
            docs = (self.db.collection(self.collection_name)
                   .where(filter=FieldFilter("owner_id", "==", user_id))
                   .stream())
            
            # Convertir a lista y ordenar en memoria
            cases_data = []
            for doc in docs:
                cases_data.append(doc.to_dict())
            
            # Ordenar por fecha creación descendente
            cases_data.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            
            last_counter = 0
            
            for data in cases_data:
                c_case = data.get("counter_case")
                if c_case and c_case.startswith("C-"):
                    try:
                        # Extraer número: "C-005" -> 5
                        num_part = int(c_case.split("-")[1])
                        if num_part > last_counter:
                            last_counter = num_part
                            # No hacemos break aquí porque queremos encontrar el MAXIMO, 
                            # y aunque ordenamos por fecha, es más seguro revisar todos 
                            # o confiar en el sort. Si confiamos en el sort (desc), 
                            # el primero que encontremos debería ser el más alto SI 
                            # la fecha correlaciona con el ID. 
                            # Para estar 100% seguros de encontrar el ID más alto usado 
                            # (por si hubo borrados o fechas raras), iteramos todo o usamos max()
                    except:
                        continue
            
            # Mejor enfoque: encontrar el maximo numero usado independientemente de la fecha
            # Re-iteramos para asegurar el maximo absoluto
            max_val = 0
            for data in cases_data:
                 c_case = data.get("counter_case")
                 if c_case and c_case.startswith("C-"):
                     try:
                         val = int(c_case.split("-")[1])
                         if val > max_val:
                             max_val = val
                     except:
                         pass
            
            next_counter = max_val + 1
            return f"C-{next_counter:03d}"
            
        except Exception as e:
            logger.info(f"Error generating counter_case: {e}")
            return "C-001" # Fallback

    async def _generate_ai_summary_with_llm(
        self, 
        case_data: CaseCreate,
        search_app_id: str = None
    ) -> Optional[dict]:
        """
        Genera un ai_summary usando LLM + RAG para clasificar correctamente el tipo de caso
        y generar un resumen de calidad (sin truncar).
        """
        try:
            from pydantic import BaseModel, Field
            from typing import List
            
            logger.info(f"🔍 [AI_SUMMARY] Iniciando generación con LLM + RAG...")
            
            # 1. Preparar contexto RAG si está disponible
            rag_context = ""
            if search_app_id:
                try:
                    from app.services.chat.rice_search_service import rice_search_service
                    
                    query = f"{case_data.title}. {case_data.description or ''}"
                    results = await rice_search_service.search_rice_for_case(
                        query=query[:500],
                        school_search_app_id=search_app_id,
                        case_type=case_data.case_type
                    )
                    
                    rag_context = rice_search_service.format_results_for_prompt(
                        rice_results=results.get("rice_results", []),
                        legal_results=results.get("legal_results", [])
                    )
                    logger.info(f"📚 [AI_SUMMARY] RAG context loaded: {len(rag_context)} chars")
                except Exception as e:
                    logger.warning(f"⚠️ [AI_SUMMARY] RAG search failed: {e}")
            
            # 2. Definir estructura de salida
            class AISummaryOutput(BaseModel):
                summary: str = Field(description="Resumen narrativo completo del caso (2-4 oraciones)")
                case_type_corrected: str = Field(description="Tipo de caso corregido según el protocolo aplicable")
                protocol_name: str = Field(description="Nombre OFICIAL del protocolo adecuado (ej: 'Protocolo de Acoso Sexual'). NO uses nombres de archivo ni guiones bajos.")
                risk_level: str = Field(description="Nivel de riesgo: Alto, Medio, o Bajo con justificación")
                main_points: List[str] = Field(description="3-5 puntos clave del caso")
                estudiantes: List[str] = Field(description="Lista de estudiantes involucrados")
                otros_involucrados: List[str] = Field(description="Lista de otros involucrados con su rol")
            
            # 3. Construir prompt
            involved_text = ""
            if case_data.involved:
                involved_list = [f"- {p.name} ({p.role or 'Sin rol'})" for p in case_data.involved]
                involved_text = "\n".join(involved_list)
            
            prompt = f"""Eres un experto en Convivencia Escolar chilena. Analiza este caso y genera un resumen estructurado.

DATOS DEL CASO:
- Título: {case_data.title}
- Tipo indicado: {case_data.case_type}
- Descripción: {case_data.description or "No especificada"}

INVOLUCRADOS:
{involved_text}

CONTEXTO NORMATIVO:
{rag_context}

INSTRUCCIONES:
1. Identifica el tipo de caso CORRECTO.
2. Genera resumen narrativo COMPLETO (no truncar).
3. Identifica el NOMBRE OFICIAL del protocolo aplicable (limpio, sin .pdf ni guiones_bajos).
4. Evalúa riesgo y puntos clave.

Genera el análisis estructurado:"""

            # 4. Invocar LLM
            structured_llm = self.llm.with_structured_output(AISummaryOutput)
            result = await structured_llm.ainvoke(prompt)
            
            # 5. Construir ai_summary
            ai_summary = {
                "summary": result.summary,
                "mainPoints": result.main_points,
                "riskLevel": result.risk_level,
                "extractedData": {
                    "estudiantes": result.estudiantes,
                    "fecha_incidente": "No especificada",
                    "lugar": "No especificado",
                    "tipo_caso": result.case_type_corrected,
                    "tipo_caso_original": case_data.case_type,
                    "protocolo_aplicable": result.protocol_name,
                    "involucrados": result.otros_involucrados,
                    "descripcion_conducta": case_data.description or "",
                    "tiene_tea_nee": "No especificado"
                },
                "lastUpdated": datetime.utcnow().isoformat()
            }
            
            # Log completo del resultado para debugging
            import json
            logger.info(f"📊 [AI_SUMMARY] RESULTADO FINAL:\n{json.dumps(ai_summary, ensure_ascii=False, indent=2)}")
            
            return ai_summary
            
        except Exception as e:
            logger.error(f"❌ [AI_SUMMARY] Error generando ai_summary con LLM: {e}")
            return self._generate_basic_ai_summary(case_data)

    def _generate_basic_ai_summary(self, case_data: CaseCreate) -> Optional[dict]:
        """Fallback: genera ai_summary básico sin LLM"""
        try:
            estudiantes = []
            otros_involucrados = []
            if case_data.involved:
                for person in case_data.involved:
                    role_lower = (person.role or "").lower()
                    if "estudiante" in role_lower or "alumno" in role_lower:
                        estudiantes.append(person.name)
                    else:
                        otros_involucrados.append(f"{person.name} ({person.role or 'Sin rol'})")
            
            summary = f"Caso: {case_data.title}. Tipo: {case_data.case_type}."
            if estudiantes:
                summary += f" Estudiantes: {', '.join(estudiantes)}."
            
            return {
                "summary": summary,
                "mainPoints": [f"Tipo de caso: {case_data.case_type}"],
                "riskLevel": "Por definir",
                "extractedData": {
                    "estudiantes": estudiantes,
                    "tipo_caso": case_data.case_type or "No especificado",
                    "involucrados": otros_involucrados,
                    "descripcion_conducta": case_data.description or ""
                },
                "lastUpdated": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"❌ Error en fallback básico: {e}")
            return None

    def update_case_ai_summary(self, case_id: str, extracted_data: dict) -> bool:
        """Actualiza ai_summary desde chat"""
        try:
            doc_ref = self.db.collection(self.collection_name).document(case_id)
            doc = doc_ref.get()
            if not doc.exists: return False
            
            case_data = doc.to_dict()
            current_ai_summary = case_data.get('ai_summary', {})
            current_extracted = current_ai_summary.get('extractedData', {})
            
            # Fusionar datos
            for key, value in extracted_data.items():
                if value and value not in ["No especificado", "No especificada"]:
                     current_extracted[key] = value
            
            updated_ai_summary = {
                **current_ai_summary,
                "extractedData": current_extracted,
                "lastUpdated": datetime.utcnow().isoformat()
            }
            
            update_payload = {"ai_summary": updated_ai_summary}
            
            # Si el protocolo cambió, actualizar también el campo raíz 'protocol'
            if "protocolo_aplicable" in current_extracted:
                new_protocol = current_extracted["protocolo_aplicable"]
                if new_protocol and new_protocol != case_data.get("protocol"):
                    update_payload["protocol"] = new_protocol
                    logger.info(f"🔄 [UPDATE_SUMMARY] Protocolo raíz actualizado a: {new_protocol}")
            
            doc_ref.update(update_payload)
            logger.info(f"✅ ai_summary actualizado para caso {case_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Error actualizando ai_summary: {e}")
            return False



    async def create_case_async(
        self, 
        case_data: CaseCreate, 
        owner_name: Optional[str] = None,
        search_app_id: str = None
    ) -> Case:
        """Crea caso versión async con LLM + RAG"""
        case_id = str(uuid.uuid4())
        now = datetime.utcnow()
        case_dict = case_data.model_dump()
        case_dict.update({
            "id": case_id, "created_at": now, "updated_at": now,
            "is_active": True, "is_shared": False, "owner_name": owner_name,
            "related_sessions": [],
            "counter_case": self._generate_next_counter_case(case_data.owner_id),
            "involved": [p.model_dump() for p in case_data.involved]
        })
        
        # Generar ai_summary
        ai_summary = await self._generate_ai_summary_with_llm(case_data, search_app_id)
        if ai_summary:
            case_dict["ai_summary"] = ai_summary
            # Corregir tipo y protocolo
            ext = ai_summary.get("extractedData", {})
            if ext.get("tipo_caso") and ext["tipo_caso"] != case_data.case_type:
                case_dict["case_type"] = ext["tipo_caso"]
            if ext.get("protocolo_aplicable"):
                case_dict["protocol"] = ext["protocolo_aplicable"]

        self.db.collection(self.collection_name).document(case_id).set(case_dict)
        logger.info(f"✅ Caso {case_id} creado (async)")
        return Case(**case_dict)

    def create_case(self, case_data: CaseCreate, owner_name: Optional[str] = None) -> Case:
        """Crea caso versión sync (fallback básico)"""
        case_id = str(uuid.uuid4())
        now = datetime.utcnow()
        case_dict = case_data.model_dump()
        case_dict.update({
            "id": case_id, "created_at": now, "updated_at": now,
            "is_active": True, "is_shared": False, "owner_name": owner_name,
            "related_sessions": [],
            "counter_case": self._generate_next_counter_case(case_data.owner_id),
            "involved": [p.model_dump() for p in case_data.involved]
        })
        
        ai_summary = self._generate_basic_ai_summary(case_data)
        if ai_summary:
            case_dict["ai_summary"] = ai_summary

        self.db.collection(self.collection_name).document(case_id).set(case_dict)
        logger.info(f"✅ Caso {case_id} creado (sync)")
        return Case(**case_dict)

    def add_session_to_case(self, case_id: str, session_id: str):
        """
        Vincula una sesión de chat a un caso existente.
        """
        try:
            doc_ref = self.db.collection(self.collection_name).document(case_id)
            doc = doc_ref.get()
            if not doc.exists:
                logger.warning(f" Case {case_id} not found when adding session {session_id}")
                return

            case_data = doc.to_dict()
            related_sessions = case_data.get("related_sessions", [])
            
            if session_id not in related_sessions:
                related_sessions.append(session_id)
                doc_ref.update({"related_sessions": related_sessions})
                logger.info(f" Session {session_id} linked to case {case_id}")
            
        except Exception as e:
            logger.exception("Error saving document to case")

    def get_cases(self) -> List[Case]:
        """
        DEPRECADO: Usa get_cases_for_user en su lugar
        Obtiene todos los casos sin filtros
        """
        docs = self.db.collection(self.collection_name).order_by("created_at", direction=firestore.Query.DESCENDING).stream()
        cases = []
        for doc in docs:
            cases.append(Case(**doc.to_dict()))
        return cases

    def get_cases_for_user(self, user_id: str, colegio_id: str) -> List[Case]:
        """
        Obtiene todos los casos accesibles para un usuario:
        - Casos donde el usuario es owner
        - Casos compartidos con el usuario
        - Filtrados por colegio

        Args:
            user_id: ID del usuario
            colegio_id: ID del colegio

        Returns:
            Lista de casos accesibles
        """
        from app.services.case_permission_service import case_permission_service

        owner_cases = []

        try:
            # 1. Intentar obtener casos donde el usuario es owner
            # Nota: Esto puede fallar si no existe índice compuesto o si hay casos sin owner_id
            owner_query = (self.db.collection(self.collection_name)
                          .where(filter=FieldFilter("owner_id", "==", user_id))
                          .where(filter=FieldFilter("colegio_id", "==", colegio_id)))

            for doc in owner_query.stream():
                try:
                    owner_cases.append(Case(**doc.to_dict()))
                except Exception as e:
                    logger.warning(f" Error parseando caso {doc.id}: {e}")
                    continue

        except Exception as e:
            logger.warning(f" Error en query de casos por owner (puede que falte índice): {e}")
            # Fallback: obtener todos los casos y filtrar manualmente
            try:
                all_docs = self.db.collection(self.collection_name).stream()
                for doc in all_docs:
                    try:
                        case_dict = doc.to_dict()
                        # Filtrar solo casos que coincidan con owner_id y colegio_id
                        if (case_dict.get("owner_id") == user_id and
                            case_dict.get("colegio_id") == colegio_id):
                            owner_cases.append(Case(**case_dict))
                    except Exception as parse_error:
                        logger.warning(f" Error parseando caso {doc.id}: {parse_error}")
                        continue
            except Exception as fallback_error:
                logger.error(f" Error en fallback de casos: {fallback_error}")

        # 2. Obtener casos compartidos con el usuario
        shared_case_ids = case_permission_service.get_cases_shared_with_user(user_id)

        shared_cases = []
        if shared_case_ids:
            # Obtener los casos compartidos que pertenezcan al mismo colegio
            for case_id in shared_case_ids:
                try:
                    case = self.get_case_by_id(case_id)
                    if case and case.colegio_id == colegio_id:
                        shared_cases.append(case)
                except Exception as e:
                    logger.warning(f" Error obteniendo caso compartido {case_id}: {e}")
                    continue

        # 3. TEMPORAL: Si no hay casos con owner, mostrar todos los casos como fallback
        # Esto permite ver casos antiguos antes de la migración
        legacy_cases = []
        if not owner_cases and not shared_cases:
            logger.info(f" No se encontraron casos con owner para usuario {user_id}, mostrando casos legacy")
            try:
                all_docs = self.db.collection(self.collection_name).stream()
                for doc in all_docs:
                    try:
                        case_dict = doc.to_dict()
                        # Solo incluir casos que NO tengan owner_id (casos antiguos)
                        if not case_dict.get("owner_id"):
                            legacy_cases.append(Case(**case_dict))
                    except Exception as e:
                        logger.warning(f" Error parseando caso legacy {doc.id}: {e}")
                        continue
            except Exception as e:
                logger.error(f" Error obteniendo casos legacy: {e}")

        # 4. Combinar todos: casos propios + compartidos + legacy (temporal)
        all_cases = {case.id: case for case in owner_cases + shared_cases + legacy_cases}

        # 5. Ordenar por fecha de creación descendente
        sorted_cases = sorted(all_cases.values(), key=lambda c: c.created_at, reverse=True)

        return sorted_cases

    def get_all_cases_by_school(self, colegio_id: str) -> List[Case]:
        """
        Obtiene TODOS los casos de un colegio sin filtrar por usuario.
        Usado por Directivos para ver estadísticas globales del colegio.

        Args:
            colegio_id: ID del colegio

        Returns:
            Lista de todos los casos del colegio
        """
        cases = []
        try:
            # Query simple sin order_by para evitar necesidad de índice compuesto
            query = self.db.collection(self.collection_name).where(
                filter=FieldFilter("colegio_id", "==", colegio_id)
            )

            for doc in query.stream():
                try:
                    cases.append(Case(**doc.to_dict()))
                except Exception as e:
                    logger.warning(f"Error parseando caso {doc.id}: {e}")
                    continue

            # Ordenar en memoria por fecha de creación descendente
            cases.sort(key=lambda c: c.created_at, reverse=True)

        except Exception as e:
            logger.error(f"Error obteniendo casos del colegio {colegio_id}: {e}")

        return cases

    def get_case_by_id(self, case_id: str) -> Optional[Case]:
        doc_ref = self.db.collection(self.collection_name).document(case_id)
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            if "ai_summary" in data:
                logger.info(f"🔍 Case {case_id} loaded WITH ai_summary")
            else:
                logger.info(f"⚠️ Case {case_id} loaded WITHOUT ai_summary")
            
            return Case(**data)
        return None

    def get_case_by_session_id(self, session_id: str) -> Optional[Case]:
        """
        Obtiene el caso asociado a una sesión de chat.
        """
        try:
            docs = (self.db.collection(self.collection_name)
                   .where(filter=FieldFilter("related_sessions", "array_contains", session_id))
                   .limit(1)
                   .stream())
            
            for doc in docs:
                return Case(**doc.to_dict())
            return None
        except Exception as e:
            logger.info(f"Error getting case by session id {session_id}: {e}")
            return None

    def update_case_shared_status(self, case_id: str, is_shared: bool) -> bool:
        """
        Actualiza el estado is_shared de un caso

        Args:
            case_id: ID del caso
            is_shared: Nuevo estado

        Returns:
            True si se actualizó exitosamente
        """
        try:
            doc_ref = self.db.collection(self.collection_name).document(case_id)
            doc_ref.update({
                "is_shared": is_shared,
                "updated_at": datetime.utcnow()
            })
            logger.info(f" Caso {case_id} actualizado: is_shared = {is_shared}")
            return True
        except Exception as e:
            logger.error(f" Error actualizando estado compartido del caso: {e}")
            return False

    def update_case(self, case_id: str, user_id: str, update_data: dict) -> Optional[Case]:
        """
        Actualiza los campos permitidos de un caso

        Args:
            case_id: ID del caso a actualizar
            user_id: ID del usuario que intenta actualizar
            update_data: Diccionario con los campos a actualizar (title, status)

        Returns:
            Case actualizado o None si no se pudo actualizar
        """
        # Verificar que el usuario tenga permisos para editar
        if not self.check_user_can_edit(case_id, user_id):
            raise ValueError("No tienes permiso para editar este caso")

        # Obtener el caso actual
        case = self.get_case_by_id(case_id)
        if not case:
            raise ValueError("Caso no encontrado")

        # Filtrar solo los campos permitidos
        allowed_fields = {"title", "status", "description", "involved", "pasosProtocolo", "student_id"}
        filtered_data = {k: v for k, v in update_data.items() if k in allowed_fields and v is not None}

        if not filtered_data:
            raise ValueError("No hay campos válidos para actualizar")

        # Agregar timestamp de actualización
        filtered_data["updated_at"] = datetime.utcnow()

        try:
            doc_ref = self.db.collection(self.collection_name).document(case_id)
            doc_ref.update(filtered_data)
            logger.info(f" Caso {case_id} actualizado por usuario {user_id}: {filtered_data}")

            # Retornar el caso actualizado
            return self.get_case_by_id(case_id)
        except Exception as e:
            logger.error(f" Error actualizando caso {case_id}: {e}")
            raise ValueError(f"Error actualizando caso: {str(e)}")

    def delete_case(self, case_id: str, user_id: str) -> bool:
        """
        Elimina un caso y todos sus documentos asociados

        Args:
            case_id: ID del caso a eliminar
            user_id: ID del usuario que intenta eliminar (debe ser el owner)

        Returns:
            True si se eliminó exitosamente, False en caso contrario
        """
        try:
            # Verificar que el usuario sea el propietario del caso
            case = self.get_case_by_id(case_id)
            if not case:
                raise ValueError("Caso no encontrado")

            if case.owner_id != user_id:
                raise ValueError("Solo el propietario puede eliminar el caso")

            # Eliminar todos los documentos asociados
            docs_ref = self.db.collection(self.documents_collection_name).where(
                filter=FieldFilter("case_id", "==", case_id)
            )
            docs = docs_ref.stream()
            for doc in docs:
                doc.reference.delete()
                logger.info(f"🗑️ Deleted document {doc.id} from case {case_id}")

            # Eliminar permisos asociados
            permissions_ref = self.db.collection("case_permissions").where(
                filter=FieldFilter("case_id", "==", case_id)
            )
            permissions = permissions_ref.stream()
            for perm in permissions:
                perm.reference.delete()
                logger.info(f"🗑️ Deleted permission {perm.id} from case {case_id}")

            # Eliminar protocolos asociados
            protocols_ref = self.db.collection(self.protocol_collection_name).where(
                filter=FieldFilter("case_id", "==", case_id)
            )
            protocols = protocols_ref.stream()
            for protocol in protocols:
                protocol.reference.delete()
                logger.info(f"🗑️ Deleted protocol {protocol.id} from case {case_id}")

            # Finalmente, eliminar el caso
            doc_ref = self.db.collection(self.collection_name).document(case_id)
            doc_ref.delete()
            logger.info(f" Case {case_id} deleted successfully")

            return True

        except ValueError as e:
            logger.error(f"Error deleting case: {e}")
            raise
        except Exception as e:
            logger.error(f"Error deleting case {case_id}: {e}")
            raise ValueError(f"Error eliminando caso: {str(e)}")

    def check_user_can_edit(self, case_id: str, user_id: str) -> bool:
        """
        Verifica si un usuario puede editar un caso

        Args:
            case_id: ID del caso
            user_id: ID del usuario

        Returns:
            True si puede editar, False si no
        """
        from app.services.case_permission_service import case_permission_service
        from app.schemas.case import PermissionType

        case = self.get_case_by_id(case_id)
        if not case:
            return False

        # Casos legacy sin owner: permitir edición a todos (temporal)
        if not case.owner_id:
            return True

        # El owner siempre puede editar
        if case.owner_id == user_id:
            return True

        # Verificar si tiene permiso de edición
        permission = case_permission_service.get_user_permission(case_id, user_id)
        return permission is not None and permission.permission_type == PermissionType.EDIT

    def update_case_system(self, case_id: str, update_data: dict) -> Optional[Case]:
        """
        Actualiza un caso omitiendo validaciones de permisos (uso interno del sistema / IA).
        
        Args:
            case_id: ID del caso
            update_data: Datos a actualizar
            
        Returns:
            Case actualizado
        """
        # Obtener el caso actual
        case = self.get_case_by_id(case_id)
        if not case:
            raise ValueError("Caso no encontrado")

        # Filtrar solo los campos permitidos
        allowed_fields = {"title", "status", "description", "involved", "pasosProtocolo", "protocol", "protocolo", "protocolSteps", "ai_summary"}
        filtered_data = {k: v for k, v in update_data.items() if k in allowed_fields and v is not None}

        if not filtered_data:
            raise ValueError("No hay campos válidos para actualizar")

        # Agregar timestamp de actualización
        filtered_data["updated_at"] = datetime.utcnow()

        try:
            doc_ref = self.db.collection(self.collection_name).document(case_id)
            doc_ref.update(filtered_data)
            logger.info(f"💾 [SYSTEM UPDATE] Case {case_id} updated: {list(filtered_data.keys())}")

            # Retornar el caso actualizado
            return self.get_case_by_id(case_id)
        except Exception as e:
            logger.error(f" Error actualizando caso {case_id}: {e}")
            raise ValueError(f"Error actualizando caso: {str(e)}")

    def check_user_can_view(self, case_id: str, user_id: str) -> bool:
        """
        Verifica si un usuario puede ver un caso

        Args:
            case_id: ID del caso
            user_id: ID del usuario

        Returns:
            True si puede ver, False si no
        """
        from app.services.case_permission_service import case_permission_service

        case = self.get_case_by_id(case_id)
        if not case:
            return False

        # Casos legacy sin owner: permitir visualización a todos (temporal)
        if not case.owner_id:
            return True

        # El owner siempre puede ver
        if case.owner_id == user_id:
            return True

        # Verificar si tiene algún permiso
        permission = case_permission_service.get_user_permission(case_id, user_id)
        return permission is not None
    
    # Métodos de protocolos hardcodeados removidos
    # Ahora los protocolos se extraen dinámicamente del RAG en tiempo real
    # Las interacciones de protocolos se manejan directamente en el chat service

case_service = CaseService()
