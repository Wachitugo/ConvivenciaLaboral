"""
Tool Orchestrator Service

Servicio especializado en ejecutar herramientas (email, calendario) de forma determinística.
Garantiza que las solicitudes de email/calendario siempre generen JSONs válidos.

NO usa ReAct Agent - extrae parámetros directamente con structured output.
"""

import asyncio
import logging
from typing import Dict, List, Optional
from langchain_google_vertexai import ChatVertexAI
from langchain_core.messages import HumanMessage
from pydantic import BaseModel, Field
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class ToolOrchestrator:
    """
    Orquestador de herramientas que garantiza ejecución determinística.
    
    Responsabilidades:
    1. Clasificar tipo de herramienta (email vs calendar)
    2. Extraer parámetros usando LLM con structured output
    3. Llamar directamente a las funciones de herramientas
    4. Formatear respuesta con JSON embebido garantizado
    """
    
    def __init__(self):
        self._llm = None
        self.model_location = settings.VERTEX_LOCATION or "us-central1"
    
    @property
    def llm(self):
        """LLM Flash para extracción rápida de parámetros"""
        if self._llm is None:
            model_name = settings.VERTEX_MODEL_FLASH or "gemini-2.5-flash-lite"
            logger.info(f"🤖 [TOOL_ORCH] Initializing LLM: {model_name}")
            
            self._llm = ChatVertexAI(
                model_name=model_name,
                temperature=0.3,  # Baja para consistencia
                max_output_tokens=1024,
                project=settings.PROJECT_ID,
                location=self.model_location
            )
        return self._llm
    
    async def execute_tool_request(
        self,
        message: str,
        user_id: str,
        case_id: Optional[str],
        history: List,
        school_name: str
    ) -> str:
        """
        Ejecuta una solicitud de herramienta (email/calendar).
        
        Args:
            message: Mensaje del usuario
            user_id: ID del usuario (para obtener contexto)
            case_id: ID del caso activo (opcional)
            history: Historial de conversación
            school_name: Nombre del colegio
            
        Returns:
            String con JSON embebido garantizado
        """
        logger.info(f"🔧 [TOOL_ORCH] Executing tool request: {message[:50]}...")
        
        try:
            # 1. Clasificar tipo de herramienta
            tool_type = await self._classify_tool_type(message)
            logger.info(f"🎯 [TOOL_ORCH] Tool type detected: {tool_type}")
            
            # 2. Obtener contexto del usuario y caso
            user_context = await self._get_user_context(user_id)
            case_context = await self._get_case_context(case_id) if case_id else None
            
            # 3. Ejecutar según tipo
            if tool_type == "email":
                return await self._execute_email(message, user_context, case_context, school_name, history)
            elif tool_type == "calendar":
                return await self._execute_calendar(message, user_context, case_context, school_name, history)
            else:
                logger.warning(f"⚠️ [TOOL_ORCH] Unknown tool type: {tool_type}")
                return "Lo siento, no reconocí la herramienta que solicitas. ¿Quieres que redacte un correo o agende una reunión?"
                
        except Exception as e:
            logger.error(f"❌ [TOOL_ORCH] Error executing tool: {e}")
            return f"Lo siento, tuve un error al procesar tu solicitud: {str(e)}"
    
    # ========== CLASIFICACIÓN ==========
    
    async def _classify_tool_type(self, message: str) -> str:
        """
        Clasifica si la solicitud es para email o calendar.
        
        Args:
            message: Mensaje del usuario
            
        Returns:
            "email", "calendar", o "unknown"
        """
        class ToolType(BaseModel):
            tool: str = Field(description="email, calendar, or unknown")
            confidence: float = Field(description="0.0 to 1.0")
        
        prompt = f"""Clasifica la siguiente solicitud del usuario:

Mensaje: "{message}"

¿Qué herramienta necesita el usuario?

OPCIONES:
- "email": Si pide redactar, enviar, escribir, elaborar, componer correo/email/mensaje
- "calendar": Si pide agendar, citar, crear evento, programar reunión, calendarizar
- "unknown": Si no está claro o es otra cosa

Responde SOLO con: email, calendar, o unknown"""
        
        try:
            structured_llm = self.llm.with_structured_output(ToolType)
            result = await structured_llm.ainvoke([HumanMessage(content=prompt)])
            
            if result and result.confidence > 0.7:
                return result.tool
            else:
                logger.warning(f"⚠️ [TOOL_ORCH] Low confidence classification: {result.confidence if result else 0}")
                return "unknown"
                
        except Exception as e:
            logger.error(f"❌ [TOOL_ORCH] Error classifying tool: {e}")
            return "unknown"
    
    # ========== CONTEXT HELPERS ==========
    
    async def _get_user_context(self, user_id: str) -> Dict:
        """Obtiene contexto del usuario desde Firestore"""
        try:
            from app.services.users.user_service_simple import user_service_simple
            user = user_service_simple.get_user_by_id(user_id)
            
            if user:
                return {
                    "nombre": user.nombre,
                    "rol": user.rol,
                    "correo": user.correo
                }
            else:
                return {}
        except Exception as e:
            logger.warning(f"⚠️ [TOOL_ORCH] Error getting user context: {e}")
            return {}
    
    async def _get_case_context(self, case_id: str) -> Optional[Dict]:
        """Obtiene contexto expandido del caso desde Firestore"""
        try:
            from app.services.case_service import case_service
            case = case_service.get_case_by_id(case_id)
            
            if case:
                # Información básica
                context = {
                    "titulo": case.title,
                    "descripcion": case.description or "",
                    "involucrados": [p.name for p in case.involved] if case.involved else []
                }
                
                # Información adicional para contexto rico
                if hasattr(case, 'status') and case.status:
                    context["estado"] = case.status
                
                if hasattr(case, 'created_at') and case.created_at:
                    from datetime import datetime
                    created_date = case.created_at
                    if isinstance(created_date, str):
                        context["fecha_creacion"] = created_date
                    else:
                        context["fecha_creacion"] = created_date.strftime("%Y-%m-%d")
                
                # Contar archivos adjuntos (si existen)
                if hasattr(case, 'files') and case.files:
                    context["archivos_count"] = len(case.files)
                
                # Timeline/eventos si existe
                if hasattr(case, 'timeline') and case.timeline:
                    # Limitar a los últimos 5 eventos
                    recent_events = case.timeline[-5:] if len(case.timeline) > 5 else case.timeline
                    context["ultimos_eventos"] = [
                        {"fecha": e.get("date", ""), "accion": e.get("action", "")} 
                        for e in recent_events
                    ]
                
                # Incluir ai_summary si existe para mejor redacción
                if hasattr(case, 'ai_summary') and case.ai_summary:
                    ai_sum = case.ai_summary
                    if isinstance(ai_sum, dict):
                        # Priorizar resumen narrativo y puntos clave
                        context["resumen_ia"] = ai_sum.get("summary", "")
                        context["puntos_clave"] = ai_sum.get("mainPoints", [])
                        context["riesgo"] = ai_sum.get("riskLevel", "")
                        
                        # Extraer datos estructurados útiles
                        extracted = ai_sum.get("extractedData", {})
                        if extracted:
                            context["protocolo_sugerido"] = extracted.get("protocolo_aplicable", "")
                            context["tipo_caso_sugerido"] = extracted.get("tipo_caso", "")

                logger.info(f"✅ [TOOL_ORCH] Loaded expanded case context: {context.get('titulo', '')}")
                return context
            else:
                return None
        except Exception as e:
            logger.warning(f"⚠️ [TOOL_ORCH] Error getting case context: {e}")
            return None
    
    # ========== EMAIL EXECUTION ==========
    
    async def _execute_email(
        self,
        message: str,
        user_context: Dict,
        case_context: Optional[Dict],
        school_name: str,
        history: List
    ) -> str:
        """
        Ejecuta solicitud de email de forma determinística.
        
        1. Extrae parámetros (to, subject, body, cc)
        2. Valida parámetros críticos
        3. Llama a prepare_email_content()
        4. Formatea respuesta con JSON embebido
        """
        logger.info(f"📧 [TOOL_ORCH] Executing email request")
        
        try:
            # 1. Extraer parámetros usando LLM (con historial para contexto)
            params = await self._extract_email_params(
                message, user_context, case_context, school_name, history
            )
            
            # 2. Validar parámetros críticos
            if not params.get("to"):
                return ("No pude identificar el destinatario del correo. "
                       "¿Podrías indicarme a quién quieres enviarlo? "
                       "(ejemplo: 'al apoderado de Juan Pérez' o 'a contacto@colegio.cl')")
            
            if not params.get("subject") or not params.get("body"):
                return ("No pude generar el contenido del correo. "
                       "¿Podrías darme más detalles sobre qué debe contener?")
            
            # 3. Crear JSON de email_draft directamente (sin llamar a @tool)
            import json
            
            draft_data = {
                "type": "email_draft",
                "to": params["to"],
                "subject": params["subject"],
                "body": params["body"],
                "cc": params.get("cc", [])
            }
            draft_json = json.dumps(draft_data, ensure_ascii=False)
            
            logger.info(f"✅ [TOOL_ORCH] Email draft created: to={params['to']}, subject={params['subject'][:30]}...")
            
            # 4. Formatear respuesta con JSON embebido
            return self._format_tool_response(
                intro="He preparado el borrador del correo para que lo revises:",
                tool_json=draft_json
            )
            
        except Exception as e:
            logger.error(f"❌ [TOOL_ORCH] Error executing email: {e}")
            return f"Lo siento, tuve un error al preparar el correo: {str(e)}"
    
    async def _execute_calendar(
        self,
        message: str,
        user_context: Dict,
        case_context: Optional[Dict],
        school_name: str,
        history: List
    ) -> str:
        """
        Ejecuta solicitud de calendario - extrae parámetros y crea JSON de calendar_event.
        NUNCA pregunta al usuario - siempre genera valores por defecto que se pueden editar.
        """
        logger.info(f"📅 [CALENDAR] Extracting event parameters from message")
        
        try:
            from datetime import datetime, timedelta
            import json
            import re
            
            # 1. Extraer parámetros del evento usando LLM
            params = await self._extract_calendar_params(
                message, user_context, case_context, school_name, history
            )
            
            # 2. AUTO-GENERAR TÍTULO si no se pudo extraer
            if not params.get("title"):
                # Intentar generar un título más inteligente usando Regex
                message_lower = message.lower()
                
                # Intentar extraer "apoderado de X"
                apoderado_match = re.search(r"apoderado de\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+?)(?:\s+mañana|\s+hoy|\s+para|\s+a las|$)", message, re.IGNORECASE)
                nombre_match = re.search(r"(?:con|de)\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)(?:\s+mañana|\s+hoy|\s+para|\s+a las|$)", message, re.IGNORECASE)
                
                if apoderado_match:
                    nombre = apoderado_match.group(1).strip()
                    params["title"] = f"Citación Apoderado de {nombre.title()}"
                elif "apoderado" in message_lower:
                    params["title"] = "Citación con Apoderado"
                elif "cita" in message_lower and nombre_match:
                    nombre = nombre_match.group(1).strip()
                    # Evitar que capture palabras comunes como "mañana", "el", "la"
                    if nombre.lower() not in ["mañana", "el", "la", "un", "una", "hoy"]:
                        params["title"] = f"Cita con {nombre.title()}"
                    else:
                        params["title"] = "Cita Programada"
                elif "cita" in message_lower:
                    params["title"] = "Cita Programada"
                elif "reunión" in message_lower or "reunion" in message_lower:
                    params["title"] = "Reunión Programada"
                else:
                    params["title"] = "Evento Programado"
                
                logger.info(f"📅 [CALENDAR] Generated smart fallback title: {params['title']}")
            
            # --- FALLBACK DE FECHA Y HORA (Python-side) ---
            # Si el LLM falló en calcular "mañana" o extraer la hora, lo hacemos aquí con reglas simples
            
            message_lower = message.lower()
            now = datetime.now()
            
            # Fallback FECHA
            if not params.get("date"):
                if "mañana" in message_lower:
                    params["date"] = (now + timedelta(days=1)).strftime("%Y-%m-%d")
                    logger.info(f"📅 [CALENDAR] Fallback date 'mañana': {params['date']}")
                elif "hoy" in message_lower:
                    params["date"] = now.strftime("%Y-%m-%d")
                    logger.info(f"📅 [CALENDAR] Fallback date 'hoy': {params['date']}")
                elif "pasado mañana" in message_lower:
                    params["date"] = (now + timedelta(days=2)).strftime("%Y-%m-%d")
                    logger.info(f"📅 [CALENDAR] Fallback date 'pasado mañana': {params['date']}")
                else:
                    # DEFAULT: Mañana si no se especifica fecha
                    params["date"] = (now + timedelta(days=1)).strftime("%Y-%m-%d")
                    logger.info(f"📅 [CALENDAR] Default date (tomorrow): {params['date']}")
            
            # Fallback HORA (Regex simple para HH:MM)
            if not params.get("time"):
                # Buscar patrones como 20:00, 8:30, 09:00
                time_match = re.search(r'(\d{1,2}:\d{2})', message)
                if time_match:
                    params["time"] = time_match.group(1)
                    # Formatear a HH:MM asegurando 2 dígitos
                    h, m = params["time"].split(":")
                    params["time"] = f"{int(h):02d}:{m}"
                    logger.info(f"📅 [CALENDAR] Fallback time regex: {params['time']}")
                else:
                    # DEFAULT: 10:00 AM si no se especifica hora
                    params["time"] = "10:00"
                    logger.info(f"📅 [CALENDAR] Default time: {params['time']}")
            
            # Fallback DESCRIPCIÓN
            if not params.get("description"):
                # Buscar "para X", "sobre Y", "con el fin de Z"
                # Captura todo hasta el final o hasta que encuentre un patrón de correo/hora
                desc_match = re.search(r"(?:para|sobre|con el fin de|con el objetivo de)\s+(.+?)(?:\s+a las|\s+con el correo|$)", message, re.IGNORECASE)
                if desc_match:
                    motivo = desc_match.group(1).strip()
                    # Limpieza básica
                    if motivo:
                        params["description"] = f"He agendado esta cita {motivo}."
                        logger.info(f"📅 [CALENDAR] Fallback description regex: {params['description']}")
                else:
                    # Generar descripción genérica basada en el contexto del caso
                    if case_context and case_context.get("involucrados") and len(case_context.get("involucrados", [])) > 0:
                        estudiante = case_context["involucrados"][0]
                        params["description"] = f"He agendado esta cita para hablar con usted al respecto de una situación de convivencia que involucra a {estudiante}. Agradezco su asistencia."
                    else:
                        params["description"] = "He agendado esta cita para hablar con usted al respecto de una situación de convivencia escolar. Agradezco su asistencia."
                    logger.info(f"📅 [CALENDAR] Default description: {params['description']}")
            
            # 3. Crear JSON de calendar_event directamente
            
            # Combinar fecha y hora
            date_str = params["date"]
            time_str = params["time"]
            
            try:
                start_dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
            except ValueError:
                # Fallback por si el formato no es exacto
                start_dt = datetime.now() + timedelta(days=1)
                start_dt = start_dt.replace(hour=10, minute=0, second=0, microsecond=0)
                
            duration_minutes = int(params.get("duration", 60))
            end_dt = start_dt + timedelta(minutes=duration_minutes)
            
            event_data = {
                "type": "calendar_draft",
                "summary": params["title"],
                "start_time": start_dt.isoformat(),
                "end_time": end_dt.isoformat(),
                "description": params.get("description", ""),
                "attendees": params.get("attendees", [])
            }
            event_json = json.dumps(event_data, ensure_ascii=False)
            
            logger.info(f"✅ [CALENDAR] Event JSON created: {event_json[:100]}...")
            
            # 6. Formatear respuesta - indicar que puede editar antes de confirmar
            return self._format_tool_response(
                intro="He preparado el evento con los datos disponibles. Puedes modificar cualquier campo antes de confirmarlo:",
                tool_json=event_json
            )
            
        except Exception as e:
            logger.error(f"❌ [CALENDAR] Error creating event: {e}")
            return f"Lo siento, tuve un error al preparar el evento: {str(e)}"

    
    def _generate_event_title(self, message: str, case_context: Optional[Dict]) -> str:
        """
        Genera un título automático para el evento basándose en el mensaje y contexto.
        SIEMPRE genera algo - nunca retorna vacío.
        """
        import re
        message_lower = message.lower()
        
        # 1. Intentar extraer "reunión/cita/entrevista con [persona]" del mensaje
        patterns = [
            r'(?:reunión|reunion|cita|entrevista|encuentro)\s+(?:con\s+)?(?:el|la|los|las)?\s*(?:apoderado|apoderada|apoderados)?\s*(?:de\s+)?([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+?)(?:\s*$|\s*(?:para|el|la|mañana|hoy|próximo))',
            r'(?:agendar?|programar?|citar?|coordinar?)\s+(?:una?\s+)?(?:reunión|reunion|cita|entrevista|encuentro)\s+(?:con\s+)?(.+?)(?:\s*$|\s*(?:para|el|la|mañana|hoy|próximo))',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                person = match.group(1).strip()
                if person and len(person) > 2:
                    # Capitalizar nombre
                    person = ' '.join(word.capitalize() for word in person.split())
                    return f"Reunión con {person}"
        
        # 2. Detectar tipo de evento genérico del mensaje
        if "apoderado" in message_lower:
            if case_context and case_context.get("involucrados"):
                # Usar nombre del primer involucrado
                person = case_context["involucrados"][0] if case_context["involucrados"] else "Apoderado"
                return f"Reunión con apoderado de {person}"
            return "Reunión con apoderado"
        
        if "profesor" in message_lower or "docente" in message_lower:
            return "Reunión con docente"
        
        if "inspector" in message_lower:
            return "Reunión con inspector/a"
        
        if "director" in message_lower:
            return "Reunión con dirección"
        
        if "seguimiento" in message_lower:
            return "Seguimiento de caso"
        
        if "protocolo" in message_lower:
            return "Seguimiento de protocolo"
        
        # 3. Fallback genérico basado en palabras clave
        # NOTA: No usamos título del caso ni nombres de involucrados por privacidad
        if "reunión" in message_lower or "reunion" in message_lower:
            return "Reunión de convivencia escolar"
        
        if "cita" in message_lower:
            return "Cita de convivencia escolar"
        
        if "entrevista" in message_lower:
            return "Entrevista de convivencia escolar"
        
        # 5. Fallback final
        return "Evento de convivencia escolar"

    async def _extract_email_params(
        self,
        message: str,
        user_context: Dict,
        case_context: Optional[Dict],
        school_name: str,
        history: List
    ) -> Dict:
        """Extrae parámetros del email usando LLM con structured output"""
        
        class EmailParams(BaseModel):
            to: str = Field(description="Email del destinatario")
            subject: str = Field(description="Asunto del correo")
            body: str = Field(description="Cuerpo completo del correo con saludo, contenido y despedida")
            cc: List[str] = Field(default=[], description="Lista de correos en copia")
        
        # Construir contexto
        context_parts = []
        
        if user_context:
            context_parts.append(f"""INFORMACIÓN DEL REMITENTE:
- Nombre: {user_context.get('nombre', 'No especificado')}
- Rol: {user_context.get('rol', 'No especificado')}
- Email: {user_context.get('correo', 'No especificado')}""")
        
        if case_context:
            involucrados_str = ", ".join(case_context.get('involucrados', []))
            
            # Construir bloque de información del caso enriquecido
            case_info_lines = [
                f"INFORMACIÓN DEL CASO:",
                f"- Título: {case_context.get('titulo', '')}",
                f"- Descripción: {case_context.get('descripcion', '')[:300]}",
                f"- Involucrados: {involucrados_str}"
            ]
            
            # Agregar información adicional si existe
            if case_context.get('estado'):
                case_info_lines.append(f"- Estado: {case_context['estado']}")
            
            # NUEVO: Contexto rico del AI Summary
            if case_context.get('resumen_ia'):
                case_info_lines.append(f"- RESUMEN INTELIGENTE: {case_context.get('resumen_ia')}")
            if case_context.get('puntos_clave'): # Lista
                pts = "; ".join(case_context.get('puntos_clave', []))
                case_info_lines.append(f"- PUNTOS CLAVE: {pts}")
            if case_context.get('protocolo_sugerido'):
                case_info_lines.append(f"- PROTOCOLO SUGERIDO: {case_context.get('protocolo_sugerido')}")
            if case_context.get('riesgo'):
                case_info_lines.append(f"- NIVEL DE RIESGO: {case_context.get('riesgo')}")
            
            if case_context.get('fecha_creacion'):
                case_info_lines.append(f"- Fecha de creación: {case_context['fecha_creacion']}")
            if case_context.get('archivos_count'):
                case_info_lines.append(f"- Archivos adjuntos: {case_context['archivos_count']}")
            if case_context.get('ultimos_eventos'):
                eventos_str = "; ".join([f"{e['fecha']}: {e['accion']}" for e in case_context['ultimos_eventos']])
                case_info_lines.append(f"- Últimos eventos: {eventos_str}")
            
            context_parts.append("\n".join(case_info_lines))
        
        # Agregar historial reciente para contexto completo
        if history and len(history) > 0:
            recent_history = history[-20:]  # Últimos 10 intercambios (20 mensajes)
            history_text = []
            for msg in recent_history:
                role = "Usuario" if hasattr(msg, 'type') and msg.type == "human" else "Asistente"
                content = msg.content if hasattr(msg, 'content') else str(msg)
                # NO limitar - queremos el análisis completo disponible
                history_text.append(f"{role}: {content}")
            
            context_parts.append(f"""CONVERSACIÓN PREVIA:
{chr(10).join(history_text)}

⚠️ IMPORTANTE: 
- Si el usuario dice "sobre X" o "relacionado con Y", busca esa información en la conversación previa
- Si hay un análisis de documento previo, ÚSALO para dar contexto específico en el cuerpo del correo
- NO uses frases genéricas como "adjunto encontrará" si no hay adjunto
- Incluye detalles relevantes del análisis en el cuerpo del correo""")
        
        context_str = "\n\n".join(context_parts) if context_parts else "No hay contexto adicional"
        
        prompt = f"""Extrae los parámetros para redactar un correo electrónico FORMAL INSTITUCIONAL.

EMPRESA: {school_name}

⚠️ RESTRICCIONES DE PRIVACIDAD (CRÍTICO):
1. NUNCA incluyas el título del caso en el asunto ni en el cuerpo del correo
2. NUNCA menciones nombres de trabajadores involucrados en el asunto del correo
3. En el cuerpo, usa referencias genéricas como "el caso en seguimiento" o "la situación que nos convoca"
4. Los nombres de involucrados SOLO pueden mencionarse si el usuario los incluye explícitamente en su mensaje
5. Si necesitas referirte al caso, usa "el caso que estamos tratando" o "la situación informada"

INSTRUCCIONES DE REDACCIÓN:
1. El correo debe ser FORMAL en todos sus aspectos (Saludo, Cuerpo, Despedida).
2. El tono debe ser institucional y serio, no coloquial.
3. NO uses saludos como "Estimado [Nombre]" si no tienes el nombre exacto. Usa "Estimado/a" o similar.
4. La estructura debe ser clara y profesional.
5. PROTOCOLO: Si hay un 'PROTOCOLO SUGERIDO', puedes mencionar genéricamente que se está siguiendo un protocolo.

⚠️ FORMATO DE TEXTO (CRÍTICO):
- USA NEGRITAS MARKDOWN para etiquetas o campos importantes: **Etiqueta:** valor
- Ejemplos de uso de negritas:
  • **Denunciante:** nombre de la persona
  • **Fecha de los hechos:** fecha
  • **Descripción:** descripción del caso
- Las negritas se escriben con doble asterisco: **texto en negrita**

⚠️ FORMATO DE LISTAS (CRÍTICO):
- USA VIÑETAS (•, -) para cualquier lista o enumeración en el cuerpo del correo
- **NUNCA uses números (1., 2., 3.)** - causan problemas de renderizado
- Para sub-items, usa viñetas con 3 espacios de indentación: "   •"
- Ejemplo correcto:
  • **Campo:** valor
  • **Otro campo:** otro valor
     • Sub-punto con indentación

CONTEXTO (SOLO REFERENCIA INTERNA - NO INCLUIR LITERALMENTE EN EL CORREO):
{context_str}

MENSAJE DEL USUARIO:
"{message}"

Extrae los parámetros en formato JSON estructurado:"""
        
        try:
            structured_llm = self.llm.with_structured_output(EmailParams)
            result = await structured_llm.ainvoke([HumanMessage(content=prompt)])
            
            return {
                "to": result.to,
                "subject": result.subject,
                "body": result.body,
                "cc": result.cc
            }
        except Exception as e:
            logger.error(f"❌ [TOOL_ORCH] Error extracting email params: {e}")
            return {"to": "", "subject": "", "body": "", "cc": []}
    
    def _format_tool_response(self, intro: str, tool_json: str) -> str:
        """Formatea la respuesta con JSON embebido en bloque markdown"""
        return f"""{intro}

```json
{tool_json}
```

Puedes revisarlo y enviarlo cuando estés listo."""
    
    async def _extract_calendar_params(
        self,
        message: str,
        user_context: Dict,
        case_context: Optional[Dict],
        school_name: str,
        history: List
    ) -> Dict:
        """Extrae parámetros del evento de calendario usando LLM"""
        
        class CalendarParams(BaseModel):
            title: str = Field(description="Título del evento")
            date: str = Field(description="Fecha (YYYY-MM-DD)")
            time: str = Field(description="Hora (HH:MM)")
            duration: int = Field(description="Duración en minutos", default=60)
            attendees: List[str] = Field(default=[], description="Emails de asistentes")
            description: str = Field(description="Descripción", default="")
        
        from datetime import datetime, timedelta
        now = datetime.now()
        current_date = now.strftime("%Y-%m-%d")
        current_time = now.strftime("%H:%M")
        tomorrow_date = (now + timedelta(days=1)).strftime("%Y-%m-%d")
        
        # Información de fechas para el LLM
        fecha_info = f"""REFERENCIA DE FECHAS:
- HOY: {current_date} (hora actual: {current_time})
- MAÑANA: {tomorrow_date}
- PASADO MAÑANA: {(now + timedelta(days=2)).strftime("%Y-%m-%d")}"""
        
        # Construir contexto con historial (como en _extract_email_params)
        context_parts = []
        
        if user_context:
            context_parts.append(f"""INFORMACIÓN DEL USUARIO:
- Nombre: {user_context.get('nombre', 'No especificado')}
- Email: {user_context.get('correo', 'No especificado')}""")
        
        if case_context:
            involucrados_str = ", ".join(case_context.get('involucrados', []))
            context_parts.append(f"""INFORMACIÓN DEL CASO:
- Título: {case_context.get('titulo', '')}
- Involucrados: {involucrados_str}""")
        
        # CRÍTICO: Agregar historial reciente para capturar parámetros de mensajes anteriores
        if history and len(history) > 0:
            recent_history = history[-20:]  # Últimos 10 intercambios
            history_text = []
            for msg in recent_history:
                role = "Usuario" if hasattr(msg, 'type') and msg.type == "human" else "Asistente"
                content = msg.content if hasattr(msg, 'content') else str(msg)
                history_text.append(f"{role}: {content}")
            
            context_parts.append(f"""CONVERSACIÓN PREVIA:
{chr(10).join(history_text)}

⚠️ IMPORTANTE: 
- BUSCA la información del evento en TODOS los mensajes anteriores
- Si el usuario mencionó fecha, hora, asistentes, o título ANTES, ÚSALOS
- Combina la información de TODA la conversación para extraer parámetros completos""")
        
        context_str = "\n\n".join(context_parts) if context_parts else "No hay contexto adicional"
        
        prompt = f"""{fecha_info}

{context_str}

MENSAJE ACTUAL DEL USUARIO: "{message}"

TU TAREA: GENERAR los parámetros para crear un evento de calendario.

REGLA CRÍTICA PARA EL TÍTULO:
- El título debe incluir el MOTIVO de la reunión si es posible.
- Formato preferido: "Citación para [motivo] de [Nombre Estudiante]"
- Ejemplo: "Citación para hablar sobre el comportamiento de su hijo"
- Si no hay motivo claro: "Citación Apoderado de [Nombre Estudiante]"

REGLA CRÍTICA PARA LA DESCRIPCIÓN:
- Redacta la descripción en PRIMERA PERSONA, dirigida al apoderado o invitado.
- Debe ser amable, profesional y enfocada en CONVIVENCIA ESCOLAR (NO académica).
- Formato: "He agendado esta cita para hablar con usted al respecto de una situación de convivencia que involucra a [Nombre Estudiante]. Agradezco su asistencia."
- Si no hay nombre de estudiante: "He agendado esta cita para hablar con usted al respecto de una situación de convivencia escolar. Agradezco su asistencia."
- NUNCA menciones "situación académica", esta plataforma es SOLO de convivencia escolar.

OTRAS INSTRUCCIONES:
- Calcula fechas relativas ("mañana", "próximo lunes") desde la fecha actual
- Si el usuario especifica un rango horario (ej: "20:00 a 20:30"), calcula la duración en minutos
- Captura emails si se mencionan en el campo attendees

FORMATO DE SALIDA:
- title: Título descriptivo del evento (INFERIR del mensaje si no es explícito)
- date: YYYY-MM-DD
- time: HH:MM (formato 24h)
- duration: minutos (calcula si hay rango horario, default 60)
- attendees: lista de emails si se mencionan
- description: Mensaje redactado dirigido al invitado (OBLIGATORIO)"""

        try:
            structured_llm = self.llm.with_structured_output(CalendarParams)
            result = await structured_llm.ainvoke([HumanMessage(content=prompt)])
            
            # Verificar que el LLM retornó un resultado válido
            if result is None:
                logger.warning("⚠️ [CALENDAR] LLM returned None, using fallback")
                return {}
            
            return {
                "title": result.title if hasattr(result, 'title') else "",
                "date": result.date if hasattr(result, 'date') else "",
                "time": result.time if hasattr(result, 'time') else "",
                "duration": result.duration if hasattr(result, 'duration') else 60,
                "attendees": result.attendees if hasattr(result, 'attendees') else [],
                "description": result.description if hasattr(result, 'description') else ""
            }
        except Exception as e:
            logger.error(f"❌ [CALENDAR] Error: {e}")
            return {}



# Singleton instance
tool_orchestrator = ToolOrchestrator()
