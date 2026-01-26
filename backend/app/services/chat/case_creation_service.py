"""
Case Creation Service

Servicio especializado en ayudar al usuario a documentar nuevos casos escolares.
Usa conversación guiada para recopilar información necesaria.

Casos de uso:
- "Tengo un caso de pelea entre 2 alumnos"
- "Se reportó un incidente de bullying"
- "Un estudiante agredió a otro"
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
    Servicio para ayudar a documentar casos escolares mediante conversación guiada.
    
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
            # 1. Clasificar caso rápidamente (tipo y gravedad)
            case_info = await self._classify_case_quick(message, history)
            logger.info(f"📊 [CASE_CREATION] Case classified: {case_info}")
            
            # 2. Búsqueda RAG en RICE + marco legal (según gravedad)
            rag_context = await self._search_rice_rag(
                message=message,
                search_app_id=search_app_id,
                case_type=case_info.get('type'),
                severity=case_info.get('severity')
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
                "protocolo de", "protocolo para", "protocolo tea", "protocolo nee",
                "artículo", "articulo", "inciso", "letra",
                "ley", "decreto", "circular", "rex"
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
                    if "REX" in answer_upper and "782" in answer_upper:
                         current_target = "REX 782"
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
                    rice_results=rag_context.get("rice_results", []),
                    legal_results=rag_context.get("legal_results", []),
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
        school_name: str,
        user_context: dict = None,
        rag_context: dict = None,
        case_info: dict = None,
        known_data: dict = None  # NUEVO: datos ya proporcionados por el usuario
    ) -> str:
        """
        Construye prompt enfocado para documentación de casos.
        
        Args:
            school_name: Nombre del colegio
            user_context: Información del usuario (opcional)
            
        Returns:
            Prompt del sistema optimizado para case creation
        """
        from datetime import datetime
        current_date = datetime.now().strftime("%A %d de %B de %Y")
        
        base_prompt = f"""Eres CONI, tu asistente de convivencia escolar para {school_name}.
Estás aquí para ayudar con la gestión de casos y situaciones escolares de forma práctica y cercana.
Hablas con el Encargado de Convivencia Escolar - trátalo como un colega, no como un cliente.

FECHA ACTUAL: {current_date}

SITUACIÓN: El usuario está describiendo un caso o incidente escolar que necesita ser documentado.

═══════════════════════════════════════════════════════════════════
CRÍTICO - ADHERENCIA AL RICE (REGLAMENTO INTERNO DE CONVIVENCIA ESCOLAR)
═══════════════════════════════════════════════════════════════════

**REGLA FUNDAMENTAL:**
- TODO caso debe gestionarse según el RICE del {school_name}
- SIEMPRE menciona que las acciones deben seguir el protocolo RICE del colegio
- NUNCA inventes o references documentos inexistentes
- NO menciones casos de otros colegios (ej: "Liceo Chileno", "Reporte de Medidas")
- Si no tienes el RICE disponible, indica que must follow colegio protocols

═══════════════════════════════════════════════════════════════════
TU ESTRATEGIA - DOCUMENTACIÓN EFICIENTE E INTELIGENTE
═══════════════════════════════════════════════════════════════════

🚨 REGLA #0 - RESPONDE PRIMERO A PREGUNTAS EXPLÍCITAS:
Si el usuario hace una PREGUNTA DIRECTA (ej: "¿qué se debe hacer?", "¿cuál es el siguiente paso?", "¿qué protocolo aplica?"):
→ RESPONDE ESA PREGUNTA PRIMERO con orientación práctica
→ LUEGO puedes solicitar datos adicionales si faltan
→ NUNCA ignores una pregunta para solo pedir datos

**PASO 1 - IDENTIFICACIÓN Y CONTEXTUALIZACIÓN:**
Cuando el usuario describe un caso, TÚ DEBES:
1. **EXTRAER y PRESERVAR toda información proporcionada** - nombres completos con apellidos, cursos, fechas, etc.
2. **CONTAR correctamente los involucrados** - Si hay UN estudiante, habla en SINGULAR. Si hay varios, en PLURAL.
3. **Inferir del contexto** lo máximo posible (ej: "1° Medio" → adolescente ~14-15 años)
4. **Reconocer el nivel de gravedad** del incidente

🛑 REGLA CRÍTICA - NO PREGUNTES POR DATOS YA PROPORCIONADOS:
- Si el usuario menciona "Nombre Apellido" → USA el nombre completo (NO solo el nombre de pila)
- Si el usuario dice "N° básico" o "N° medio" → YA TIENES el curso (NO preguntes de nuevo)
- Si el usuario da nombres con apellidos → CONSERVA los apellidos completos en tu respuesta
- ANTES de preguntar, verifica si el dato ya está en el mensaje del usuario

📊 SINGULAR VS PLURAL - ADAPTA TU LENGUAJE:
- Si falta información crítica (tipo, fecha, descripción completa), pídela amablemente pero con formalidad.

SOBRE INFORMACIÓN SENSIBLE (TEA/NEE):
- NO preguntes por diagnósticos TEA/NEE de forma rutinaria u obligatoria.
- SOLAMENTE pregunta si:
  a) Es estrictamente necesario para el contexto del incidente.
  b) El usuario ha mencionado dificultades de aprendizaje o comportamiento.
  c) La normativa o protocolo específico lo exige explícitamente para el tipo de caso.

**PASO 2 - RESPONDER + RECOPILAR:**
Si el usuario preguntó algo específico:
1. RESPONDE la pregunta con orientación clara y profesional.
2. Luego, solicita los datos faltantes (si los hay).

Si NO preguntó nada específico:
1. Reconoce la situación con seriedad profesional.
2. Agrupa los datos faltantes en UNA pregunta concisa.

**PASO 3 - CONVERGENCIA:**
- Una vez tengas la información suficiente, confirma los datos.
- Ofrece proceder con la gestión del caso.

TONO DE VOZ:
- **Formal y Profesional (Español Neutro):** Mantén una distancia profesional pero colaborativa. Nada de modismos chilenos o coloquialismos.
- **Directo pero cortés:** Evita saludos tipo carta ("Estimado usuario"), habla directamente como un asistente experto.
- **NO uses:** "Estimado", "Cordialmente", ni despedidas de correo en el chat.
- **Ejemplo correcto:** "Entiendo la situación. Para proceder adecuadamente con el registro, necesito que me indique el curso del estudiante involucrado."
- **Ejemplo incorrecto:** "Hola compadre, cuéntame qué pasó." / "Estimado Director, le informo que..."

NO HAGAS:
- Inventar documentos.
- Activar protocolos automáticamente.
- Dar consejos clínicos.
- Redactar correos en el chat (usa la herramienta de redactar correo).

Si el usuario necesita enviar correos, indícale que puedes ayudarle a redactarlos usando la función del sistema."""

        # Agregar contexto del usuario si existe
        if user_context:
            user_info = f"""

INFORMACIÓN DEL USUARIO:
- Nombre: {user_context.get('nombre', 'No especificado')}
- Rol: {user_context.get('rol', 'No especificado')}

Puedes personalizar tu respuesta según su rol."""
            base_prompt += user_info
        
        # Add RAG context section
        if rag_context and rag_context.get("rice_formatted"):
            rice_section = f"""

═══════════════════════════════════════════════════════════════════
✅ CONTEXTO RAG - FRAGMENTOS RELEVANTES DEL RICE Y MARCO LEGAL
═══════════════════════════════════════════════════════════════════

{rag_context['rice_formatted']}

INSTRUCCIONES CRÍTICAS:
- BASA tu respuesta en los fragmentos específicos mostrados arriba
- CITA artículos/secciones cuando los menciones
- SIGUE los protocolos descritos en los fragmentos
- NO inventes información que no esté en los fragmentos

⚠️ IMPORTANTE - MANEJO DE INFORMACIÓN FALTANTE:
- Si buscas un protocolo específico y NO aparece en los fragmentos anteriores, di:
  "Este protocolo específico no está presente en los fragmentos del RICE consultados"
- NUNCA digas "no tengo acceso" o "no tengo el contexto completo"
- El documento RICE YA ESTÁ CARGADO - si algo no aparece, es porque no está en el documento
- Si no encuentras un protocolo específico pero hay procedimientos generales aplicables, úsalos

Tokens usados: ~{rag_context.get('total_tokens', 0)} tokens
"""
        else:
            rice_section = f"""

⚠️ RICE NO DISPONIBLE - MODO GENÉRICO
═══════════════════════════════════════════════════════════════════

NO se encontraron fragmentos específicos del RICE.

INSTRUCCIONES:
- Proporciona orientación GENERAL según normativa chilena estándar
- INDICA claramente que son recomendaciones generales
- RECOMIENDA verificar con el RICE específico del {school_name}

💡 Nota: El RICE debe estar indexado en Vertex AI Search para búsqueda RAG."""

        base_prompt += rice_section
        
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
USA los nombres y cursos EXACTOS proporcionados arriba.
"""
            base_prompt += known_section
        
        return base_prompt
    
    async def _classify_case_quick(self, message: str, history: List) -> dict:
        """
        Clasifica rápidamente el tipo y gravedad del caso.
        
        Returns:
            {
                "type": "agresión_física" | "bullying" | "conflicto" | etc.,
                "severity": "leve" | "grave" | "gravísimo"
            }
        """
        try:
            from langchain_core.messages import HumanMessage, SystemMessage
            
            # Prompt rápido para clasificación
            classification_prompt = f"""Clasifica este caso escolar BREVEMENTE:

Caso: "{message}"

Responde SOLO con JSON:
{{
  "type": "tipo_de_caso",
  "severity": "leve" | "grave" | "gravísimo"
}}

Tipos válidos: agresión_física, bullying, acoso, conflicto, maltrato, discriminación, violencia_verbal, otro

Criterios de gravedad:
- leve: Conflictos menores, desacuerdos, falta de respeto ocasional
- grave: Agresiones leves, bullying sostenido, discriminación
- gravísimo: Agresiones físicas con lesiones, violencia sexual, amenazas graves"""
            
            messages = [
                SystemMessage(content="Eres un clasificador de casos escolares. Responde solo JSON."),
                HumanMessage(content=classification_prompt)
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
            classification = json.loads(content)
            
            # Validar y normalizar
            case_type = classification.get("type", "otro")
            severity = classification.get("severity", "leve")
            
            return {
                "type": case_type,
                "severity": severity
            }
            
        except Exception as e:
            logger.warning(f"⚠️ [CASE_CREATION] Error classifying case: {e}")
            # Fallback seguro
            return {
                "type": "otro",
                "severity": "leve"
            }
    
    async def _search_rice_rag(
        self,
        message: str,
        search_app_id: str,
        case_type: str = None,
        severity: str = None
    ) -> dict:
        """
        Busca en RICE y marco legal usando RAG.
        
        Returns:
            {
                "rice_formatted": str,  # Fragmentos del RICE formateados
                "legal_formatted": str, # Fragmentos del marco legal (si aplica)
                "total_tokens": int
            }
        """
        try:
            from app.services.chat.rice_search_service import rice_search_service
            
            # Fallback: usar app demo si no se provee ID
            if not search_app_id:
                search_app_id = "demostracion_1767713503741"
                logger.warning(f"⚠️ [CASE_CREATION] No search_app_id provided, using default: {search_app_id}")
            
            # E jecutar búsqueda RAG
            results = await rice_search_service.search_rice_for_case(
                query=message,
                school_search_app_id=search_app_id,
                case_type=case_type,
                severity=severity
            )
            
            # Formatear resultados
            rice_formatted = rice_search_service.format_results_for_prompt(
                rice_results=results.get("rice_results", []),
                legal_results=results.get("legal_results", [])
            )
            
            return {
                "rice_formatted": rice_formatted,
                "total_tokens": results.get("total_tokens", 0)
            }
            
        except Exception as e:
            logger.error(f"❌ [CASE_CREATION] Error in RAG search: {e}")
            return {
                "rice_formatted": "",
                "total_tokens": 0
            }
    
    async def _extract_known_data(self, history: List, current_message: str) -> dict:
        """
        Extrae datos ya proporcionados del historial usando un prompt rápido.
        
        IMPORTANTE: Esto evita que el LLM re-pregunte información que el usuario ya dio.
        
        Returns:
            {
                "estudiantes": ["Nombre Apellido (N° básico/medio)"],
                "fecha_incidente": "DD/MM/YYYY",
                "lugar": "Lugar del incidente",
                "tipo_caso": "Tipo de caso",
                "involucrados": ["Relación con el estudiante"],
                "descripcion_conducta": "Descripción breve",
                "tiene_tea_nee": "Sí/No/No especificado"
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
{{"estudiantes": ["lista de estudiantes con nombre y curso si se mencionan"],
"fecha_incidente": "fecha si se menciona",
"lugar": "lugar si se menciona",
"tipo_caso": "tipo de situación",
"involucrados": ["otras personas mencionadas y su relación"],
"descripcion_conducta": "breve descripción de lo ocurrido",
"tiene_tea_nee": "Sí/No/No especificado"}}"""
            
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
            "estudiantes": "👤 Estudiante(s)",
            "fecha_incidente": "📅 Fecha",
            "lugar": "📍 Lugar",
            "tipo_caso": "🏷️ Tipo de caso",
            "involucrados": "👥 Otros involucrados",
            "descripcion_conducta": "📝 Descripción",
            "tiene_tea_nee": "🧠 TEA/NEE"
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
