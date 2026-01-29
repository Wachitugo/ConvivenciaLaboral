"""
Case Creation Service

Servicio especializado en ayudar al usuario a documentar nuevos casos laborales (Ley Karin).
Usa conversación guiada para recopilar información necesaria.
"""

import logging
from typing import List
from langchain_google_vertexai import ChatVertexAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from app.core.config import get_settings
from app.services.storage_service import storage_service

logger = logging.getLogger(__name__)
settings = get_settings()


class CaseCreationService:
    """
    Servicio para ayudar a documentar casos laborales (Ley Karin) mediante conversación guiada.
    
    Características:
    - Prompt enfocado (solo documentación de casos)
    - Modelo Flash (conversación rápida)
    - Hace preguntas de seguimiento
    - Identifica tipo de caso
    - Sugiere próximos pasos
    """
    
    def __init__(self):
        self._llm = None
        self.model_location = settings.VERTEX_LOCATION or "us-central1"
    
    @property
    def llm(self):
        """LLM Flash para conversación rápida"""
        if self._llm is None:
            model_name = settings.VERTEX_MODEL_FLASH or "gemini-2.5-flash-lite"
            logger.info(f"🤖 [CASE_CREATION] Initializing Flash LLM: {model_name}")
            
            self._llm = ChatVertexAI(
                model_name=model_name,
                temperature=0.4,  # Moderada - empatía + precisión
                project=settings.PROJECT_ID,
                location=self.model_location
            )
        return self._llm
    
    async def analyze_case_description(
        self,
        message: str,
        school_name: str,
        history: List,
        user_context: dict = None,
        search_app_id: str = None,
        case_id: str = None  # ID del caso para actualizar ai_summary
    ) -> str:
        """
        Analiza descripción de caso y guía al usuario en la documentación.
        Usa RAG con Vertex AI Search para buscar en RICE y marco legal.
        """
        logger.info(f"📋 [CASE_CREATION] Processing case description: {message[:50]}...")
        
        try:
            # 1. Clasificar caso rápidamente (tipo para enriquecer búsqueda)
            case_info = await self._classify_case_quick(message, history)
            logger.info(f"📊 [CASE_CREATION] Case classified: {case_info}")
            
            # 2. Búsqueda RAG en Reglamento Interno + Ley Karin
            # Usamos search_app_id como el ID de la búsqueda de la empresa
            rag_context = await self._search_reglamento_rag(
                message=message,
                company_search_app_id=search_app_id,
                case_type=case_info.get('type')
            )
            
            # 2.5 Extraer datos ya conocidos del historial
            known_data = {}
            if history and len(history) > 0:
                known_data = await self._extract_known_data(history, message)
                if known_data:
                    logger.info(f"✅ [CASE_CREATION] Found known data: {list(known_data.keys())}")
                    
                    # Si hay case_id, actualizar ai_summary con los datos extraídos
                    if case_id and len(known_data) > 0:
                        try:
                            from app.services.case_service import case_service
                            case_service.update_case_ai_summary(case_id, known_data)
                            logger.info(f"📝 [CASE_CREATION] Updated ai_summary for case {case_id}")
                        except Exception as e:
                            logger.warning(f"⚠️ [CASE_CREATION] Error updating ai_summary: {e}")

            # 3. Construir prompt del sistema (con RAG context + datos conocidos)
            system_prompt = self._build_enhanced_prompt(
                school_name=school_name,
                user_context=user_context,
                rag_context=rag_context,
                case_info=case_info,
                known_data=known_data
            )
            
            # 3. Preparar mensajes (historial + mensaje actual)
            messages = [SystemMessage(content=system_prompt)]
            
            # Incluir últimos 10 intercambios para contexto conversacional completo
            if history and len(history) > 0:
                recent_history = history[-20:]  # Últimos 10 intercambios (20 mensajes)
                messages.extend(recent_history)
            
            messages.append(HumanMessage(content=message))
            
            # 4. Obtener respuesta del LLM (Sanitizando archivos grandes)
            clean_messages = self._sanitize_messages(messages)
            response = await self.llm.ainvoke(clean_messages)
            
            answer = response.content if hasattr(response, 'content') else str(response)
            
            # 🛑 FAILSAFE: Eliminar sección de referencias alucinada por el LLM para evitar duplicados
            if "REFERENCIAS Y ANEXOS" in answer:
                logger.warning("⚠️ [CASE_CREATION] LLM generated hallucinated references, stripping them.")
                answer = answer.split("REFERENCIAS Y ANEXOS")[0].strip()
            elif "### REFERENCIAS" in answer:
                answer = answer.split("### REFERENCIAS")[0].strip()
            
            # Limpiar artifacts de markdown al final (ej: "###" sueltos)
            import re
            answer = re.sub(r'[#\s]+$', '', answer).strip()

            # 5. Agregar referencias SOLAMENTE si es necesario
            should_include_references = False
            
            protocol_keywords = [
                "protocolo", "procedimiento", "investigación", "denuncia",
                "artículo", "articulo", "inciso", "letra",
                "ley", "código del trabajo", "reglamento interno", "dictamen"
            ]
            answer_lower = answer.lower()
            if any(k in answer_lower for k in protocol_keywords):
                should_include_references = True
                logger.info(f"✅ [CASE_CREATION] Including references: Specific protocol/legal citation detected in answer")

            # Chequear keywords en mensaje del usuario (solicitud explícita de verificación)
            verification_keywords = ["verificar", "referencia", "fuente", "documento", "basado en", "respaldo", "sustento", "norma", "según qué", "dónde dice", "donde dice"]
            message_lower = message.lower()
            if any(k in message_lower for k in verification_keywords):
                should_include_references = True
                logger.info(f"✅ [CASE_CREATION] Including references: Explicit verification requested by user")

            if should_include_references and rag_context and (rag_context.get("rice_results") or rag_context.get("legal_results")):
                from app.services.chat.reference_builder import build_references_section
                
                # LÓGICA DINÁMICA: Si el LLM mencionó explícitamente un documento en su respuesta,
                # priorizar ese documento como target, incluso si no fue el target original.
                current_target = rag_context.get("target_document")
                
                if not current_target:
                    # Buscar menciones de documentos legales en la respuesta
                    answer_upper = answer.upper()
                    legal_docs = rag_context.get("legal_results", [])
                    
                    # Buscar REX 782 específicamente si es común
                    if "LEY" in answer_upper and "21.643" in answer_upper:
                         current_target = "LEY 21.643 (LEY KARIN)"
                         logger.info(f"🎯 [CASE_CREATION] Detected mention of {current_target} in answer, setting as target")
                    else:
                        # Buscar otros documentos del contexto
                        for doc in legal_docs:
                            title = doc.get('title', '').upper()
                            # Extraer números significativos (ej "20.536", "782")
                            import re
                            nums = re.findall(r'(?:LEY|REX|DECRETO|CIRCULAR)[\s\-\.°N]*(\d+)', title)
                            for num in nums:
                                if num in answer_upper:
                                    # Verificar que el tipo también coincida (ej "LEY")
                                    doc_type = title.split()[0] # LEY, REX, etc
                                    if doc_type in answer_upper:
                                        current_target = title
                                        logger.info(f"🎯 [CASE_CREATION] Detected mention of {title} in answer, setting as target")
                                        break
                            if current_target: break

                references_section = build_references_section(
                    rice_results=rag_context.get("reglamento_results", []),
                    legal_results=rag_context.get("ley_karin_results", []),
                    target_document=current_target
                )
                
                if references_section:
                    answer += references_section
                    logger.info(f"📚 [CASE_CREATION] Added automatic references section")
            
            logger.info(f"✅ [CASE_CREATION] Response generated ({len(answer)} chars)")
            
            return answer
            
        except Exception as e:
            logger.error(f"❌ [CASE_CREATION] Error analyzing case: {e}")
            return ("Lo siento, tuve un problema al procesar la descripción del caso. "
                   "¿Podrías reformular lo que sucedió?")
    
    def _build_enhanced_prompt(
        self,
        school_name: str, # Mantenemos nombre variable por compatibilidad, pero es Company Name
        user_context: dict = None,
        rag_context: dict = None,
        case_info: dict = None,
        known_data: dict = None
    ) -> str:
        """
        Construye prompt enfocado para documentación de casos laborales (Ley Karin).
        """
        from datetime import datetime
        current_date = datetime.now().strftime("%A %d de %B de %Y")
        
        base_prompt = f"""Eres CONI, tu asistente de prevención y convivencia laboral para {school_name}.
Estás aquí para ayudar con la gestión de casos y situaciones laborales de forma práctica y cercana.
Hablas con el Encargado de Prevención / RRHH - trátalo como un colega.

TU ESTILO:
- Profesional, objetivo y empático.
- Basado estrictamente en la normativa laboral vigente (Ley Karin 21.643) y Reglamento Interno.

FECHA ACTUAL: {current_date}

SITUACIÓN: El usuario está describiendo un caso o incidente laboral.

═══════════════════════════════════════════════════════════════════
CRÍTICO - ADHERENCIA AL REGLAMENTO INTERNO Y LEY KARIN
═══════════════════════════════════════════════════════════════════

**REGLA FUNDAMENTAL:**
- TODO caso debe analizarse según el Reglamento Interno de {school_name} y la Ley 21.643.
- TU FUNCIÓN PRINCIPAL es determinar si los hechos descritos constituyen un caso según la normativa.
- NUNCA inventes o references documentos inexistentes.

═══════════════════════════════════════════════════════════════════
TU ESTRATEGIA - DOCUMENTACIÓN EFICIENTE E INTELIGENTE
═══════════════════════════════════════════════════════════════════

🚨 PROTOCOLO DE ANÁLISIS:
1. **Identificar Hechos:** ¿Qué pasó, quiénes, cuándo, dónde?
2. **Contrastar con Normativa (RAG):** Revisa los fragmentos adjuntos abajo. ¿La conducta está tipificada?
3. **Clasificar:** ¿Es Acoso Laboral? ¿Acoso Sexual? ¿Violencia en el trabajo? ¿Conflicto interpersonal?

**PASO 1 - IDENTIFICACIÓN:**
- Nombres completos de involucrados (agresor/víctima).
- Cargos o roles (Jefe, subordinado, par, cliente externo).
- Relación jerárquica (Crítico para acoso laboral).

🛑 REGLA CRÍTICA - NO PREGUNTES POR DATOS YA PROPORCIONADOS:
- Si el usuario menciona "Juan Pérez" → USA el nombre completo.
- Con respecto a cargos, si mencionó "Jefe de Ventas", no preguntes de nuevo.

**PASO 2 - RESPONDER + RECOPILAR:**
Si faltan datos clave para determinar si aplica Ley Karin (ej: si hubo reiteración en acoso laboral, o si hay relación jerárquica), PREGUNTA específicamente por eso.

TONO DE VOZ:
- **Formal y Profesional (Español Neutro).**
- Evita juicios de valor. Usa términos como "presunto", "reportado", "indica".
- **Ejemplo:** "Para determinar si aplica el protocolo de Acoso Laboral, necesito saber si estas conductas han sido reiteradas en el tiempo."

NO HAGAS:
- Dar consejos legales definitivos (eres un asistente).
- Activar protocolos automáticamente sin confirmación.
- Redactar correos en el chat (usa la herramienta).

Si el usuario necesita enviar correos, indícale que puedes ayudarle a redactarlos usando la función del sistema."""

        # Agregar contexto del usuario si existe
        if user_context:
            user_info = f"""

INFORMACIÓN DEL USUARIO:
- Nombre: {user_context.get('nombre', 'No especificado')}
- Rol: {user_context.get('rol', 'No especificado')}"""
            base_prompt += user_info
        
        # Add RAG context section
        if rag_context and (rag_context.get("reglamento_results") or rag_context.get("ley_karin_results")):
            
            # Formatear usando el helper del servicio de búsqueda si ya viene formateado o hacerlo aquí
            # En este caso asumimos que rag_context ya tiene las listas crudas y usamos el formateador
            # O si el servicio anterior devolvió strings, usarlos. 
            # Revisando el código anterior, _search_reglamento_rag devuelve dict con listas.
            
            # Necesitamos instanciar el servicio para formatear, o hacerlo manualmente aqui.
            # Mejor usar el string ya formateado si lo devolvimos (revisar _search_reglamento_rag más abajo).
            # Revisando _search_reglamento_rag implementación (que vamos a escribir):
            # Devolveremos 'rag_formatted' para simplificar.
            
            rag_section = f"""

═══════════════════════════════════════════════════════════════════
✅ CONTEXTO NORMATIVO (RAG) - REGLAMENTO INTERNO Y LEY
═══════════════════════════════════════════════════════════════════

{rag_context.get('rag_formatted', 'No se pudo formatear el contexto.')}

INSTRUCCIONES CRÍTICAS:
- BASA tu análisis EXCLUSIVAMENTE en los fragmentos anteriores.
- Si el reglamento define "Acoso Laboral" de cierta forma, USA ESA DEFINICIÓN.
- Si los hechos no calzan con la definición (ej: es un conflicto puntual y no reiterado), indícalo: "Según el Reglamento, esto podría tratarse de un conflicto interpersonal y no necesariamente acoso laboral, debido a..."
- CITA los artículos o secciones cuando corresponda.

Tokens usados: ~{rag_context.get('total_tokens', 0)} tokens
"""
        else:
            rag_section = f"""

⚠️ REGLAMENTO NO DISPONIBLE - MODO GENÉRICO
═══════════════════════════════════════════════════════════════════

NO se encontraron fragmentos específicos.

INSTRUCCIONES:
- Proporciona orientación GENERAL basada en la Ley Karin (Ley 21.643).
- Define claramente los conceptos generales de Acoso Laboral, Sexual y Violencia.
- RECOMIENDA verificar el Reglamento Interno físico de la empresa."""

        base_prompt += rag_section
        
        # NUEVO: Inyectar datos ya conocidos si existen
        if known_data:
            known_data_formatted = self._format_known_data(known_data)
            known_section = f"""

═══════════════════════════════════════════════════════════════════
🛑 DATOS YA PROPORCIONADOS POR EL USUARIO - NO VOLVER A PREGUNTAR
═══════════════════════════════════════════════════════════════════

{known_data_formatted}

⚠️ INSTRUCCIÓN CRÍTICA: Los datos anteriores YA fueron proporcionados.
NO preguntes nuevamente por ellos. Solo pregunta por datos que FALTAN.
"""
            base_prompt += known_section
        
        return base_prompt
    
    async def _classify_case_quick(self, message: str, history: List) -> dict:
        """
        Clasifica rápidamente el tipo de caso para enriquecer la búsqueda.
        Ahora SIN SEVERIDAD.
        """
        try:
            from langchain_core.messages import HumanMessage, SystemMessage
            
            classification_prompt = f"""Analiza este caso laboral y extrae palabras clave para búsqueda.

Caso: "{message}"

Identifica el TIPO de situación (solo uno):
- acoso_laboral (hostigamiento, menoscabo, reiterado)
- acoso_sexual (naturaleza sexual, indebido)
- violencia_trabajo (física, agresiones, externa)
- discriminación (exclusión, trato desigual)
- conflicto_interpersonal (problemas de clima, no necesariamente acoso)
- otro

Responde SOLO con JSON:
{{
  "type": "tipo_detectado"
}}"""
            
            messages = [
                SystemMessage(content="Eres un clasificador técnico. Responde solo JSON."),
                HumanMessage(content=classification_prompt)
            ]
            
            response = await self.llm.ainvoke(messages)
            content = response.content.strip()
            
            # Limpiar markdown
            if "```" in content:
                import re
                match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', content, re.DOTALL)
                if match:
                    content = match.group(1)
            
            import json
            classification = json.loads(content)
            
            return {
                "type": classification.get("type", "otro")
            }
            
        except Exception as e:
            logger.warning(f"⚠️ [CASE_CREATION] Error classifying case: {e}")
            return {"type": "otro"}
    
    async def _search_reglamento_rag(
        self,
        message: str,
        company_search_app_id: str,
        case_type: str = None
    ) -> dict:
        """
        Busca en Reglamento Interno y Ley Karin (RAG unificado).
        """
        try:
            from app.services.chat.reglamento_search_service import reglamento_search_service
            
            if not company_search_app_id:
                company_search_app_id = "demostracion_1767713503741"
                logger.warning(f"⚠️ [CASE_CREATION] No search_app_id provided, using default.")
            
            # Ejecutar búsqueda en ambos
            results = await reglamento_search_service.search_reglamento_for_case(
                query=message,
                company_search_app_id=company_search_app_id,
                case_type=case_type
            )
            
            # Formatear resultados
            rag_formatted = reglamento_search_service.format_results_for_prompt(
                reglamento_results=results.get("reglamento_results", []),
                ley_karin_results=results.get("ley_karin_results", [])
            )
            
            return {
                "reglamento_results": results.get("reglamento_results", []),
                "ley_karin_results": results.get("ley_karin_results", []),
                "rag_formatted": rag_formatted,
                "total_tokens": results.get("total_tokens", 0)
            }
            
        except Exception as e:
            logger.error(f"❌ [CASE_CREATION] Error in RAG search: {e}")
            return {
                "rag_formatted": "",
                "total_tokens": 0
            }
    
    async def _extract_known_data(self, history: List, current_message: str) -> dict:
        """
        Extrae datos ya proporcionados del historial usando un prompt rápido.
        
        IMPORTANTE: Esto evita que el LLM re-pregunte información que el usuario ya dio.
        
        Returns:
            {
                "trabajadores": ["Nombre Apellido (Cargo)"],
                "fecha_incidente": "DD/MM/YYYY",
                "lugar": "Lugar del incidente",
                "tipo_caso": "Tipo de caso",
                "involucrados": ["Relación con el trabajador/jefatura"],
                "descripcion_conducta": "Descripción breve"
            }
        """
        try:
            if not history or len(history) == 0:
                return {}
            
            # Extraer solo mensajes del usuario del historial
            user_messages = []
            for msg in history:
                if isinstance(msg, HumanMessage):
                    content = msg.content if isinstance(msg.content, str) else str(msg.content)
                    user_messages.append(content)
            
            if not user_messages:
                return {}
            
            # Agregar mensaje actual
            all_user_input = "\n---\n".join(user_messages + [current_message])
            
            # Prompt de extracción muy corto y estructurado
            extraction_prompt = f"""Extrae los datos del caso de los siguientes mensajes del usuario.
SOLO extrae datos que estén EXPLÍCITAMENTE mencionados. Si un dato no está, pon "No especificado".

MENSAJES:
{all_user_input}

Responde SOLO con JSON (sin markdown):
Responde SOLO con JSON (sin markdown):
{{"trabajadores": ["lista de involucrados con cargo"],
"fecha_incidente": "fecha si se menciona",
"lugar": "lugar si se menciona",
"tipo_caso": "tipo de situación",
"involucrados": ["otras personas mencionadas y su relación"],
"descripcion_conducta": "breve descripción de lo ocurrido"}}"""
            
            messages = [
                SystemMessage(content="Eres un extractor de datos. Responde solo JSON válido."),
                HumanMessage(content=extraction_prompt)
            ]
            
            response = await self.llm.ainvoke(messages)
            content = response.content.strip()
            
            # Limpiar markdown si existe
            if "```" in content:
                import re
                match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', content, re.DOTALL)
                if match:
                    content = match.group(1)
            
            import json
            known_data = json.loads(content)
            
            # Filtrar campos vacíos o "No especificado"
            filtered = {}
            for key, value in known_data.items():
                if value and value != "No especificado":
                    if isinstance(value, list):
                        # Filtrar listas vacías o con solo "No especificado"
                        clean_list = [v for v in value if v and v != "No especificado"]
                        if clean_list:
                            filtered[key] = clean_list
                    else:
                        filtered[key] = value
            
            logger.info(f"📝 [CASE_CREATION] Extracted known data: {list(filtered.keys())}")
            return filtered
            
        except Exception as e:
            logger.warning(f"⚠️ [CASE_CREATION] Error extracting known data (non-critical): {e}")
            return {}
    
    def _format_known_data(self, known_data: dict) -> str:
        """
        Formatea los datos conocidos para inyectar en el prompt.
        
        Returns:
            String formateado con los datos ya proporcionados
        """
        if not known_data:
            return "No hay datos previos del caso."
        
        lines = []
        
        field_labels = {
            "trabajadores": "👤 Involucrados (Víctima/Agresor)",
            "fecha_incidente": "📅 Fecha",
            "lugar": "📍 Lugar",
            "tipo_caso": "🏷️ Tipo de caso",
            "involucrados": "👥 Testigos/Otros",
            "descripcion_conducta": "📝 Descripción"
        }
        
        for key, label in field_labels.items():
            value = known_data.get(key)
            if value:
                if isinstance(value, list):
                    # Asegurarse de que todos los items sean strings
                    str_items = [str(item) if not isinstance(item, str) else item for item in value]
                    lines.append(f"{label}: {', '.join(str_items)}")
                elif isinstance(value, dict):
                    # Si es un dict, convertir a string representativo
                    lines.append(f"{label}: {str(value)}")
                else:
                    lines.append(f"{label}: {value}")
        
        return "\n".join(lines) if lines else "No hay datos previos del caso."

    def _sanitize_messages(self, messages: List) -> List:
        """
        Filtra archivos adjuntos demasiado grandes (>20MB) de los mensajes
        para evitar errores de Vertex AI (400 InvalidArgument).
        """
        try:
            clean_messages = []
            for msg in messages:
                # Si el contenido es string, pasa directo
                if isinstance(msg.content, str):
                    clean_messages.append(msg)
                    continue
                
                # Si es lista (multimodal)
                if isinstance(msg.content, list):
                    new_content = []
                    has_changes = False
                    
                    for part in msg.content:
                        # Identificar partes de archivo (file_uri o media)
                        file_uri = None
                        if isinstance(part, dict):
                            file_uri = part.get('file_uri') or part.get('image_url')
                        
                        if file_uri and isinstance(file_uri, str) and file_uri.startswith("gs://"):
                            # Verificar tamaño
                            try:
                                parts = file_uri.replace("gs://", "").split("/", 1)
                                if len(parts) == 2:
                                    bucket_name, blob_path = parts
                                    bucket = storage_service.client.bucket(bucket_name)
                                    blob = bucket.blob(blob_path)
                                    blob.reload()
                                    
                                    if blob.size and blob.size > 20 * 1024 * 1024: # 20MB limit
                                        logger.warning(f"⚠️ [CASE_CREATION] Dropping large file from history: {blob.name} ({blob.size} bytes)")
                                        # Reemplazar con texto placeholder
                                        new_content.append({
                                            "type": "text", 
                                            "text": f"[Archivo adjunto omitido por tamaño excesivo: {blob.name}]"
                                        })
                                        has_changes = True
                                        continue
                            except Exception as e:
                                logger.error(f"Error checking file size in sanitizer: {e}")
                        
                        # Si no es grande o falló check, mantener
                        new_content.append(part)
                    
                    # Reconstruir mensaje con contenido limpio
                    if has_changes:
                        from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
                        if isinstance(msg, HumanMessage):
                            clean_messages.append(HumanMessage(content=new_content))
                        elif isinstance(msg, SystemMessage):
                            clean_messages.append(SystemMessage(content=new_content))
                        elif isinstance(msg, AIMessage):
                            clean_messages.append(AIMessage(content=new_content))
                        else:
                            clean_messages.append(msg) # Tipo desconocido, pasar igual
                    else:
                        clean_messages.append(msg)
                else:
                    clean_messages.append(msg)
            
            return clean_messages
            
        except Exception as e:
            logger.error(f"❌ [CASE_CREATION] Error sanitizing messages: {e}")
            return messages # Fallback: return originals


# Singleton instance
case_creation_service = CaseCreationService()
