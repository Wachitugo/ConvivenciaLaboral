from typing import List, Optional
import datetime
import logging
import json
from langchain_google_vertexai import ChatVertexAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.core.config import get_settings
from app.services.chat.search_service import search_service
from app.services.chat.prompt_service import prompt_service

logger = logging.getLogger(__name__)
settings = get_settings()

class ProtocolAgent:
    """
    Agente simplificado para generación de protocolos.
    Usa RAG para obtener contexto y una sola llamada al LLM.
    NO usa ReAct loops para evitar errores de recursión y agotar cuota.
    """
    
    def __init__(self):
        self.project_id = settings.PROJECT_ID
        self.location = settings.LOCATION
        self.model_location = settings.VERTEX_LOCATION or "us-central1"
        self._llm = None

    @property
    def llm(self):
        if self._llm is None:
            model_name = settings.VERTEX_MODEL_FLASH or settings.VERTEX_MODEL
            
            self._llm = ChatVertexAI(
                model=model_name,
                temperature=0.2,
                max_output_tokens=4096,
                project=self.project_id,
                location=self.model_location,
            )
        return self._llm

    async def process_request(
        self, 
        message: str, 
        history: List, 
        school_name: str, 
        protocol_context: str = None, 
        files: List[str] = None, 
        bucket_name: str = None, 
        case_id: str = "temp", 
        session_id: str = "temp",
        user_id: str = None
    ):
        """
        Procesa una solicitud de protocolo usando RAG + una sola llamada al LLM.
        """
        from app.services.users.user_service import user_service
        try:
            logger.info(f"🧠 [PROTOCOL AGENT] Processing request for case_id={case_id}, session_id={session_id}")
            
            # 1. Obtener contexto RAG relevante
            rag_context = await self._get_rag_context(message, school_name)
            logger.info(f"📚 [PROTOCOL AGENT] RAG context retrieved: {len(rag_context)} characters")
            
            # 2. Construir prompt con contexto RAG
            system_prompt = self._build_protocol_prompt(school_name, rag_context, protocol_context)
            
            # 3. Preparar mensajes (historial + mensaje actual)
            messages = [SystemMessage(content=system_prompt)]
            
            # Incluir últimos 10 intercambios para contexto conversacional completo
            if history and len(history) > 0:
                recent_history = history[-20:]  # Últimos 10 intercambios (20 mensajes)
                messages.extend(recent_history)
                logger.info(f"📜 [PROTOCOL AGENT] Added {len(recent_history)} history messages for context")
            
            messages.append(HumanMessage(content=message))
            
            # 4. Llamada única al LLM
            logger.info(f"🤖 [PROTOCOL AGENT] Calling LLM...")
            response = await self.llm.ainvoke(messages)
            
            # Track Usage
            if user_id and hasattr(response, 'usage_metadata'):
                user_service.update_token_usage(
                    user_id=user_id,
                    input_tokens=response.usage_metadata.get('input_tokens', 0),
                    output_tokens=response.usage_metadata.get('output_tokens', 0),
                    model_name=self.llm.model_name
                )
            
            ai_response = response.content
            logger.info(f"✅ [PROTOCOL AGENT] LLM response received")
            
            # 5. Extraer y guardar protocolo del JSON en la respuesta
            protocol_saved = await self._extract_and_save_protocol(
                ai_response, case_id, session_id
            )
            
            if protocol_saved:
                logger.info(f"💾 [PROTOCOL AGENT] Protocol saved for case {case_id}")
            else:
                logger.warning(f"⚠️ [PROTOCOL AGENT] No protocol JSON found in response")
            
            return ai_response, []  # Retornamos lista vacía de mensajes (no hay tool calls)

        except Exception as e:
            logger.error(f"Error en ProtocolAgent: {str(e)}")
            raise e

    async def _get_rag_context(self, query: str, school_name: str) -> str:
        """
        Obtiene contexto relevante usando Vertex AI Search (RAG).
        """
        try:
            # Obtener la herramienta de búsqueda
            search_tool = search_service.create_search_tool()
            
            if not search_tool:
                logger.warning("⚠️ [PROTOCOL AGENT] Search tool not available")
                return "No hay herramienta de búsqueda configurada. Genera un protocolo general según normativa chilena."
            
            # Ejecutar búsqueda usando la herramienta existente
            # La herramienta es una función async decorada con @tool
            search_result = await search_tool.ainvoke(query)
            
            if search_result and "No se encontraron" not in search_result and "Error" not in search_result:
                logger.info(f"📚 [PROTOCOL AGENT] RAG search successful: {len(search_result)} chars")
                return f"=== DOCUMENTOS NORMATIVOS ENCONTRADOS ===\n{search_result}"
            
            # Si no encuentra resultados, intentar una búsqueda más general
            logger.info("🔍 [PROTOCOL AGENT] Trying broader search...")
            general_query = "protocolo convivencia escolar procedimiento"
            search_result = await search_tool.ainvoke(general_query)
            
            if search_result and "No se encontraron" not in search_result and "Error" not in search_result:
                return f"=== DOCUMENTOS NORMATIVOS ENCONTRADOS ===\n{search_result}"
            
            return "No se encontró contexto específico en los documentos. Genera un protocolo general según normativa chilena vigente."
            
        except Exception as e:
            logger.warning(f"Error obteniendo contexto RAG: {e}")
            return "Error obteniendo contexto. Genera un protocolo general según normativa chilena vigente."

    def _build_protocol_prompt(self, school_name: str, rag_context: str, protocol_context: str = None) -> str:
        """
        Construye el prompt del sistema con contexto RAG incluido.
        """
        prompt = f"""Eres un asistente especializado en protocolos de convivencia escolar para {school_name}.

TU TAREA: Generar un protocolo de acción basado en el contexto del caso y los documentos normativos.

=== CONTEXTO NORMATIVO (RAG) ===
{rag_context}

=== INSTRUCCIONES ===

1. ANALIZA el caso descrito en el mensaje del usuario
2. IDENTIFICA el tipo de protocolo necesario según la normativa
3. GENERA los pasos del protocolo en formato JSON

FORMATO DE RESPUESTA OBLIGATORIO:

Primero, escribe una breve justificación (2-3 líneas) explicando qué protocolo aplicarás y por qué.

Luego, incluye el JSON del protocolo en este formato EXACTO:

```json
{{
  "type": "protocol",
  "protocol_name": "Nombre del Protocolo",
  "steps": [
    {{
      "id": 1,
      "title": "Título del paso",
      "description": "Descripción detallada de las acciones a realizar",
      "estimated_time": "24 horas"
    }},
    {{
      "id": 2,
      "title": "Siguiente paso",
      "description": "Descripción...",
      "estimated_time": "5 días hábiles"
    }}
  ],
  "source_document": "Nombre del documento de referencia"
}}
```

REGLAS PARA LOS PASOS:
- Mínimo 4 pasos, máximo 8 pasos
- Cada paso debe tener descripción clara de acciones concretas
- Los plazos deben ser específicos (horas, días hábiles)
- Plazos típicos: Notificación 24h, Investigación 5-10 días, Resolución 3-5 días, Apelación 3-5 días

PLAZOS SEGÚN NORMATIVA CHILENA:
- Faltas leves: Resolución en 24-48 horas
- Faltas graves: Investigación 5 días hábiles, resolución 3 días
- Faltas gravísimas: Notificación inmediata, investigación 10 días, resolución 5 días
- Denuncia a autoridades (si aplica): Máximo 24 horas

NO OLVIDES incluir el bloque ```json en tu respuesta. Es OBLIGATORIO."""

        if protocol_context:
            prompt += f"\n\nContexto adicional:\n{protocol_context}"
        
        return prompt

    async def _extract_and_save_protocol(self, response: str, case_id: str, session_id: str) -> bool:
        """
        Extrae el JSON del protocolo de la respuesta y lo guarda.
        """
        try:
            import re
            
            # Buscar bloque JSON en la respuesta
            json_match = re.search(r'```json\s*([\s\S]*?)\s*```', response)
            
            if not json_match:
                logger.warning("No se encontró bloque JSON en la respuesta")
                return False
            
            json_str = json_match.group(1)
            protocol_data = json.loads(json_str)
            
            if protocol_data.get('type') != 'protocol':
                logger.warning(f"JSON encontrado pero no es de tipo 'protocol': {protocol_data.get('type')}")
                return False
            
            # Importar servicios necesarios
            from app.services.protocols.protocol_extractor import protocol_extractor
            from app.services.protocols.protocol_execution_service import protocol_execution_service
            from app.schemas.protocol import ExtractedProtocol, ProtocolStep
            from app.services.case_service import case_service
            
            # Obtener fecha base del caso
            base_date = None
            if case_id and case_id != "temp":
                try:
                    case = case_service.get_case_by_id(case_id)
                    if case and case.created_at:
                        base_date = case.created_at
                        if base_date.tzinfo:
                            base_date = base_date.replace(tzinfo=None)
                        logger.info(f"📅 [PROTOCOL AGENT] Using case date: {base_date}")
                except Exception as e:
                    logger.warning(f"No se pudo obtener fecha del caso: {e}")
            
            # Convertir a objetos ProtocolStep
            steps = []
            for s in protocol_data.get('steps', []):
                steps.append(ProtocolStep(
                    id=s.get('id'),
                    title=s.get('title'),
                    description=s.get('description'),
                    estimated_time=s.get('estimated_time'),
                    deadline=protocol_extractor.calculate_deadline(s.get('estimated_time'), base_date)
                ))
            
            # Crear protocolo
            protocol = ExtractedProtocol(
                protocol_name=protocol_data.get('protocol_name', 'Protocolo'),
                case_id=case_id,
                session_id=session_id,
                steps=steps,
                extracted_from_response="",
                current_step=1,
                source_document=protocol_data.get('source_document')
            )
            
            # Guardar protocolo
            await protocol_execution_service.save_dynamic_protocol(protocol)
            
            return True
            
        except json.JSONDecodeError as e:
            logger.error(f"Error parseando JSON del protocolo: {e}")
            return False
        except Exception as e:
            logger.error(f"Error guardando protocolo: {e}")
            return False


protocol_agent = ProtocolAgent()
