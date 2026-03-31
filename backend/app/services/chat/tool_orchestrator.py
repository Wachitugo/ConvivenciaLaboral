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
        school_name: str,
        session_id: Optional[str] = None
    ) -> str:
        """
        Ejecuta una solicitud de herramienta (email/calendar/protocolo).

        Args:
            message: Mensaje del usuario
            user_id: ID del usuario (para obtener contexto)
            case_id: ID del caso activo (opcional)
            history: Historial de conversación
            school_name: Nombre del colegio
            session_id: ID de sesión de chat (para protocolo)

        Returns:
            String con JSON embebido garantizado
        """
        logger.info(f"🔧 [TOOL_ORCH] Executing tool request: {message[:50]}...")

        try:
            # 1. Clasificar tipo de herramienta
            # Pre-clasificación por keywords para evitar que el LLM confunda workflow con documento
            msg_lower = message.lower()
            workflow_keywords = [
                "crear caso", "crear expediente", "registrar caso", "registrar expediente",
                "abrir caso", "abrir expediente", "nuevo expediente", "nuevo caso",
                "crear denuncia", "registrar denuncia", "ingresar denuncia",
                "iniciar expediente", "levantar expediente", "levantar caso",
                "quiero crear un caso", "quiero registrar un caso", "quiero abrir un expediente",
                "quiero crear un expediente",
            ]
            if any(kw in msg_lower for kw in workflow_keywords):
                tool_type = "workflow"
                logger.info("🎯 [TOOL_ORCH] Pre-classified as workflow (keyword match)")
            else:
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
            elif tool_type == "protocolo":
                return await self._execute_protocol_guide(message, case_id, session_id)
            elif tool_type == "documento":
                return await self._execute_document_draft(message, user_context, case_context, school_name, history)
            elif tool_type == "workflow":
                return await self._execute_case_workflow(
                    message, user_id, user_context, case_id, session_id, school_name, history
                )
            else:
                logger.warning(f"⚠️ [TOOL_ORCH] Unknown tool type: {tool_type}")
                return "Lo siento, no reconocí la herramienta que solicitas. ¿Quieres que redacte un correo, agende una reunión o consultes el protocolo del caso?"
                
        except Exception as e:
            logger.error(f"❌ [TOOL_ORCH] Error executing tool: {e}")
            return f"Lo siento, tuve un error al procesar tu solicitud: {str(e)}"
    
    # ========== CLASIFICACIÓN ==========
    
    async def _classify_tool_type(self, message: str) -> str:
        """
        Clasifica el tipo de herramienta requerida.

        Returns:
            "email", "calendar", "protocolo", "documento", o "unknown"
        """
        class ToolType(BaseModel):
            tool: str = Field(description="email, calendar, protocolo, documento, or unknown")
            confidence: float = Field(description="0.0 to 1.0")
        
        prompt = f"""Clasifica la siguiente solicitud del usuario:

Mensaje: "{message}"

¿Qué herramienta necesita el usuario?

OPCIONES:
- "email": Si pide redactar, enviar, escribir, elaborar, componer correo/email/mensaje
- "calendar": Si pide agendar, citar, crear evento, programar reunión, calendarizar
- "protocolo": Si pide el estado del protocolo, siguiente paso, completar un paso, plazos Ley Karin, avanzar protocolo
- "documento": Si pide redactar/generar un documento legal (resolución de apertura, medida de resguardo, notificación al denunciado/denunciante, acuse de recibo)
- "workflow": Si pide crear un caso nuevo, registrar una denuncia, iniciar un expediente, o una combinación de crear caso Y activar protocolo Ley Karin
- "unknown": Si no está claro o es otra cosa

Responde SOLO con: email, calendar, protocolo, documento, workflow, o unknown"""
        
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
                colegio_id = None
                if user.colegios and len(user.colegios) > 0:
                    raw = user.colegios[0]
                    colegio_id = raw.get("id") if isinstance(raw, dict) else raw
                return {
                    "nombre": user.nombre,
                    "rol": user.rol,
                    "correo": user.correo,
                    "colegio_id": colegio_id,
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
                       "(ejemplo: 'al trabajador Juan Pérez' o 'a contacto@empresa.cl')")
            
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
                
                # Intentar extraer nombre del trabajador/involucrado
                nombre_match = re.search(r"(?:con|de)\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)(?:\s+mañana|\s+hoy|\s+para|\s+a las|$)", message, re.IGNORECASE)

                if "cita" in message_lower and nombre_match:
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
                        trabajador = case_context["involucrados"][0]
                        params["description"] = f"He agendado esta cita para hablar con usted al respecto de una situación de convivencia laboral que involucra a {trabajador}. Agradezco su asistencia."
                    else:
                        params["description"] = "He agendado esta cita para hablar con usted al respecto de una situación de convivencia laboral. Agradezco su asistencia."
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

    
    async def _execute_document_draft(
        self,
        message: str,
        user_context: Dict,
        case_context: Optional[Dict],
        school_name: str,
        history: List
    ) -> str:
        """
        Genera un documento legal formal (resolución, medida de resguardo, notificación).
        Detecta el tipo de documento desde el mensaje y lo redacta usando el contexto del caso.
        """
        logger.info(f"📄 [TOOL_ORCH] Executing document draft request")

        try:
            import json
            from datetime import datetime

            # 1. Detectar tipo de documento desde el mensaje
            msg_lower = message.lower()
            doc_type = self._detect_document_type(msg_lower)

            # 2. Generar el contenido del documento con LLM
            content = await self._generate_document_content(
                doc_type, message, user_context, case_context, school_name, history
            )

            # 3. Construir JSON document_draft
            doc_titles = {
                "resolucion_apertura":      "Resolución de Apertura de Investigación Ley Karin",
                "medida_resguardo":         "Resolución de Medida de Resguardo",
                "notificacion_denunciado":  "Notificación al Denunciado",
                "notificacion_denunciante": "Notificación al Denunciante",
                "acuse_recibo":             "Acuse de Recibo de Denuncia",
                "otro":                     "Documento Legal",
            }

            draft_data = {
                "type": "document_draft",
                "document_type": doc_type,
                "title": doc_titles.get(doc_type, "Documento Legal"),
                "content": content,
                "date": datetime.now().strftime("%d de %B de %Y"),
                "school_name": school_name,
            }

            draft_json = json.dumps(draft_data, ensure_ascii=False)
            logger.info(f"✅ [TOOL_ORCH] Document draft created: type={doc_type}")

            return f"He redactado el siguiente documento. Revísalo antes de usarlo:\n\n```json\n{draft_json}\n```"

        except Exception as e:
            logger.error(f"❌ [TOOL_ORCH] Error generating document: {e}")
            return f"Lo siento, tuve un error al redactar el documento: {str(e)}"

    def _detect_document_type(self, msg_lower: str) -> str:
        """Detecta el tipo de documento a generar desde el mensaje del usuario."""
        if any(w in msg_lower for w in ["medida de resguardo", "medidas de resguardo"]):
            return "medida_resguardo"
        if any(w in msg_lower for w in ["notif", "carta"]) and any(w in msg_lower for w in ["denunciado", "imputado", "investigado"]):
            return "notificacion_denunciado"
        if any(w in msg_lower for w in ["notif", "carta"]) and "denunciante" in msg_lower:
            return "notificacion_denunciante"
        if any(w in msg_lower for w in ["acuse de recibo", "recepción de denuncia", "recepcion de denuncia"]):
            return "acuse_recibo"
        if any(w in msg_lower for w in ["resolución", "resolucion", "apertura", "activar protocolo", "abrir investigación", "abrir investigacion"]):
            return "resolucion_apertura"
        return "otro"

    async def _generate_document_content(
        self,
        doc_type: str,
        message: str,
        user_context: Dict,
        case_context: Optional[Dict],
        school_name: str,
        history: List
    ) -> str:
        """Genera el texto completo del documento legal usando LLM."""

        class DocumentContent(BaseModel):
            document_text: str = Field(description="Texto completo del documento legal, formateado con saltos de línea")

        from datetime import datetime
        today = datetime.now().strftime("%d de %B de %Y")

        doc_instructions = {
            "resolucion_apertura": """Redacta una RESOLUCIÓN DE APERTURA DE INVESTIGACIÓN bajo Ley Karin (Ley 21.643).
Debe incluir:
- Encabezado formal con nombre de empresa, ciudad y fecha
- Sección VISTOS: hechos que motivan la resolución (denuncia recibida, fecha)
- Sección CONSIDERANDO: fundamentos legales (Art. 211-A y ss. Código del Trabajo, Ley 21.643)
- Sección RESUELVO: 1) Apertura formal de investigación 2) Designación de investigador/a 3) Plazo de investigación (30 días corridos) 4) Medidas de resguardo inmediatas
- Firma y cargo del representante legal
IMPORTANTE: Usar lenguaje NEUTRO. NO afirmar culpabilidad. Referirse a "la persona denunciada" y "los hechos denunciados".""",

            "medida_resguardo": """Redacta una RESOLUCIÓN DE MEDIDA DE RESGUARDO bajo Ley Karin (Ley 21.643).
Debe incluir:
- Encabezado formal con nombre de empresa, ciudad y fecha
- Sección VISTOS: recepción de denuncia y necesidad de medidas inmediatas
- Sección CONSIDERANDO: Art. 211-B del Código del Trabajo — obligación inmediata de medidas de resguardo
- Sección RESUELVO: medidas concretas (separación de espacios físicos, redistribución de jornada, cambio de turno u otras según el caso)
- Indicar que las medidas son cautelares y no implican prejuzgamiento
- Firma del empleador o representante legal
IMPORTANTE: Enfatizar que son medidas CAUTELARES, no sancionatorias. NO asumir culpabilidad.""",

            "notificacion_denunciado": """Redacta una CARTA DE NOTIFICACIÓN AL DENUNCIADO bajo Ley Karin (Ley 21.643).
Debe incluir:
- Encabezado formal con nombre de empresa, ciudad y fecha
- Comunicación formal de que se ha recibido una denuncia en su contra
- Información sobre el proceso de investigación y sus derechos (derecho a defensa, a ser escuchado)
- Indicación del investigador asignado y plazo del proceso
- Solicitud de colaboración con la investigación
- Información sobre confidencialidad del proceso
IMPORTANTE: Lenguaje NEUTRO y RESPETUOSO. La persona es "denunciada", NO "culpable". Énfasis en el derecho a defensa y presunción de inocencia.""",

            "notificacion_denunciante": """Redacta una CARTA DE NOTIFICACIÓN AL DENUNCIANTE / ACUSE DE RECIBO bajo Ley Karin (Ley 21.643).
Debe incluir:
- Encabezado formal
- Confirmación de recepción de la denuncia con fecha
- Información sobre el proceso a seguir y plazos
- Medidas de resguardo adoptadas en su favor
- Datos de contacto del investigador asignado
- Garantía de confidencialidad y no represalia""",

            "acuse_recibo": """Redacta un ACUSE DE RECIBO DE DENUNCIA bajo Ley Karin (Ley 21.643).
Debe incluir:
- Encabezado formal
- Confirmación oficial de recepción de denuncia con fecha y hora
- Número de referencia o folio del caso
- Próximos pasos y plazos legales que aplicarán
- Información de contacto para seguimiento""",

            "otro": """Redacta un documento legal formal relacionado con el caso descrito.
Usa el contexto del caso para determinar el tipo de documento más apropiado.
Mantén lenguaje formal e institucional.""",
        }

        # Construir contexto del caso
        context_parts = [f"EMPRESA: {school_name}", f"FECHA: {today}"]

        if user_context:
            context_parts.append(
                f"FIRMANTE: {user_context.get('nombre', '')} — {user_context.get('rol', '')}"
            )

        if case_context:
            involucrados = ", ".join(case_context.get("involucrados", []))
            context_parts.append(f"""DATOS DEL CASO:
- Título: {case_context.get('titulo', '')}
- Descripción: {case_context.get('descripcion', '')[:400]}
- Involucrados: {involucrados}
- Estado: {case_context.get('estado', '')}
- Resumen IA: {case_context.get('resumen_ia', '')}""")

        # Historial reciente para capturar datos adicionales mencionados en conversación
        if history:
            recent = history[-10:]
            history_lines = []
            for msg in recent:
                role = "Usuario" if hasattr(msg, 'type') and msg.type == "human" else "Asistente"
                history_lines.append(f"{role}: {msg.content if hasattr(msg, 'content') else str(msg)}")
            context_parts.append("CONVERSACIÓN PREVIA:\n" + "\n".join(history_lines))

        context_str = "\n\n".join(context_parts)
        instructions = doc_instructions.get(doc_type, doc_instructions["otro"])

        prompt = f"""{instructions}

CONTEXTO DISPONIBLE:
{context_str}

SOLICITUD DEL USUARIO: "{message}"

REGLAS GENERALES:
- Lenguaje formal e institucional chileno
- NUNCA afirmar culpabilidad de ninguna parte
- Usar "persona denunciada" / "persona denunciante" en lugar de nombres propios donde sea posible
- Incluir referencias a la Ley 21.643 (Ley Karin) y el Código del Trabajo
- El documento debe ser completo y listo para usar (solo faltaría firmar)

FORMATO OBLIGATORIO — TEXTO PLANO (MUY IMPORTANTE):
- NO uses asteriscos (**), guiones bajos (__), ni ningún símbolo de markdown
- Los títulos y secciones van en MAYÚSCULAS seguidos de dos puntos y salto de línea
- Para listas usa números (1., 2., 3.) o guiones simples (-)
- Separa las secciones con una línea en blanco
- Ejemplo correcto:   VISTOS:
                      Con fecha...
- Ejemplo INCORRECTO: **VISTOS:**

Genera el texto completo del documento:"""

        try:
            structured_llm = self.llm.with_structured_output(DocumentContent)
            result = await structured_llm.ainvoke([HumanMessage(content=prompt)])
            logger.info(f"📄 [TOOL_ORCH] Document content result: {result}")
            if result and result.document_text:
                return result.document_text
            logger.warning(f"⚠️ [TOOL_ORCH] Empty document result: {result}")
            return "No se pudo generar el documento."
        except Exception as e:
            logger.error(f"❌ [TOOL_ORCH] Error generating document content: {e}", exc_info=True)
            return "Error al generar el contenido del documento."

    async def _execute_protocol_guide(self, message: str, case_id: Optional[str], session_id: Optional[str] = None) -> str:
        """
        Ejecuta una consulta de guía de protocolo Ley Karin.
        Determina la acción (estado/completar/plazos) desde el mensaje y llama al tool.
        """
        logger.info(f"📋 [TOOL_ORCH] Executing protocol guide request")

        if not case_id:
            return (
                "Para consultar el protocolo necesito que tengas un expediente activo. "
                "Abre un caso desde la sección **Expedientes** y luego pregúntame nuevamente."
            )

        try:
            from app.services.chat.protocol_guide_tool import create_protocol_guide_tool
            import re

            tool = create_protocol_guide_tool(case_id, session_id)

            if tool is None:
                return "No hay un caso activo para consultar el protocolo."

            # Determinar acción desde el mensaje
            msg_lower = message.lower()

            if any(w in msg_lower for w in ["activar", "iniciar", "apertura de protocolo", "aplicar protocolo", "investigación formal"]):
                action = "activar"
                step_id = None
                notes = None

            elif any(w in msg_lower for w in ["plazos", "plazo", "días hábiles", "dias habiles", "ley karin plazos"]):
                action = "plazos"
                step_id = None
                notes = None

            elif any(w in msg_lower for w in ["completar", "completado", "marcar", "hecho", "terminé", "termine", "listo", "finalizar", "avanzar paso"]):
                action = "completar"
                step_match = re.search(r"paso\s+(\d+)", msg_lower)
                step_id = int(step_match.group(1)) if step_match else None
                notes_match = re.search(r"(?:nota[s]?|observación|obs)[:\s]+(.+)", message, re.IGNORECASE)
                notes = notes_match.group(1).strip() if notes_match else None

            else:
                # Default: mostrar estado actual
                action = "estado"
                step_id = None
                notes = None

            logger.info(f"📋 [TOOL_ORCH] Protocol action={action}, step_id={step_id}")

            # Invocar el tool en un executor para no bloquear el event loop
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: tool.invoke({"action": action, "step_id": step_id, "notes": notes})
            )
            return result

        except Exception as e:
            logger.error(f"❌ [TOOL_ORCH] Error executing protocol guide: {e}")
            return f"Lo siento, tuve un error al consultar el protocolo: {str(e)}"

    # ========== CASE WORKFLOW ==========

    async def _execute_case_workflow(
        self,
        message: str,
        user_id: str,
        user_context: Dict,
        case_id: Optional[str],
        session_id: Optional[str],
        school_name: str,
        history: List,
    ) -> str:
        """
        Workflow completo Ley Karin:
        1. Si no hay caso → extrae datos del mensaje y crea el caso en Firestore
        2. Si hay caso pero sin protocolo → activa el protocolo
        3. Si hay caso con protocolo → muestra el paso actual con guía y acciones sugeridas
        """
        logger.info(f"🔄 [WORKFLOW] Executing case workflow (case_id={case_id})")

        try:
            from app.services.protocols.protocol_execution_service import protocol_execution_service
            from app.services.chat.protocol_guide_tool import create_protocol_guide_tool

            # ─── Caso 3: caso + protocolo ya existen → mostrar estado con guía ───
            if case_id:
                protocol = await protocol_execution_service.load_dynamic_protocol(
                    case_id, session_id or ""
                )
                if protocol:
                    return await self._execute_protocol_guide(message, case_id, session_id)

                # ─── Caso 2: caso existe pero sin protocolo → activar protocolo ───
                tool = create_protocol_guide_tool(case_id, session_id)
                if tool is None:
                    return "No se pudo crear la herramienta de protocolo."
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(
                    None, lambda: tool.invoke({"action": "activar"})
                )
                return result

            # ─── Caso 1: no hay caso → extraer datos y crear caso + protocolo ───
            colegio_id = user_context.get("colegio_id")
            if not colegio_id:
                return (
                    "No pude identificar la organización del usuario. "
                    "Por favor crea el expediente desde la sección **Expedientes** y luego activa el protocolo desde el chat."
                )

            # Extraer datos del caso con LLM
            case_data = await self._extract_case_data(message, history, user_context, school_name)

            # Intentar vincular involucrados a estudiantes existentes en Firestore
            await self._match_involved_to_students(case_data.get("involved", []), colegio_id)

            # Crear caso en Firestore
            from app.services.case_service import case_service
            from app.schemas.case import CaseCreate, InvolvedPerson

            involved_list = [
                InvolvedPerson(
                    name=p.get("name", ""),
                    role=p.get("role"),
                    cargo=p.get("cargo"),
                    grade=p.get("area"),
                    rut=p.get("rut"),
                    gender=p.get("gender"),
                    studentId=p.get("studentId"),
                )
                for p in case_data.get("involved", [])
                if p.get("name")
            ]

            case_create = CaseCreate(
                title=case_data["title"],
                description=case_data["description"],
                case_type=case_data["case_type"],
                status="abierto",
                involved=involved_list,
                protocol="Ley Karin",
                owner_id=user_id,
                colegio_id=colegio_id,
            )

            new_case = case_service.create_case(case_create, owner_name=user_context.get("nombre", ""))
            logger.info(f"✅ [WORKFLOW] Case created: {new_case.id} — {new_case.title}")

            # Activar protocolo para el nuevo caso
            tool = create_protocol_guide_tool(new_case.id, session_id or "")
            loop = asyncio.get_event_loop()
            activate_result = await loop.run_in_executor(
                None, lambda: tool.invoke({"action": "activar"})
            )

            # Vincular sesión al caso
            if session_id:
                case_service.add_session_to_case(new_case.id, session_id)

            # Generar resolución de apertura como document_draft
            import json as _json
            from datetime import datetime as _dt
            doc_content = await self._generate_document_content(
                "resolucion_apertura", message, user_context,
                {
                    "titulo": new_case.title,
                    "descripcion": new_case.description,
                    "involucrados": [p.name for p in involved_list],
                    "estado": "abierto",
                    "fecha_creacion": _dt.now().strftime("%Y-%m-%d"),
                },
                school_name, history
            )
            doc_draft = _json.dumps({
                "type": "document_draft",
                "document_type": "resolucion_apertura",
                "title": "Resolución de Apertura de Investigación Ley Karin",
                "content": doc_content,
                "date": _dt.now().strftime("%d de %B de %Y"),
                "school_name": school_name,
            }, ensure_ascii=False)

            header = (
                f"**Expediente creado exitosamente**\n"
                f"**Título:** {new_case.title}\n"
                f"**Tipo:** {new_case.case_type}\n"
                f"**Folio:** {new_case.counter_case or new_case.id[:8]}\n\n"
                f"---\n\n"
                f"{activate_result}\n\n"
                f"---\n\n"
                f"He redactado la Resolución de Apertura. Revísala antes de usarla:\n\n"
                f"```json\n{doc_draft}\n```"
            )
            return {
                "type": "workflow",
                "content": header,
                "case_id": new_case.id,
                "case_title": new_case.title,
                "case_type": new_case.case_type,
            }

        except Exception as e:
            logger.error(f"❌ [WORKFLOW] Error in case workflow: {e}", exc_info=True)
            return f"Lo siento, tuve un error al procesar el workflow: {str(e)}"

    async def _extract_case_data(
        self,
        message: str,
        history: List,
        user_context: Dict,
        school_name: str,
    ) -> Dict:
        """Extrae datos estructurados del caso desde el lenguaje natural."""

        class InvolvedExtracted(BaseModel):
            name: str = Field(description="Nombre completo de la persona")
            role: str = Field(description="'denunciante' si es quien denuncia, 'denunciado' si es quien es denunciado")
            cargo: Optional[str] = Field(default=None, description="Cargo o puesto de trabajo si se menciona")
            area: Optional[str] = Field(default=None, description="Área o departamento si se menciona")

        class CaseExtracted(BaseModel):
            title: str = Field(description="Título conciso del caso, ej: 'Denuncia de Acoso Laboral - Área de Ventas'")
            description: str = Field(description="Descripción completa de los hechos tal como los describió el usuario")
            case_type: str = Field(description="Tipo de caso: 'Acoso Laboral', 'Acoso Sexual', 'Violencia en el Trabajo', 'Conflicto Interpersonal', u otro")
            involved: List[InvolvedExtracted] = Field(
                description="Lista de personas involucradas extraídas del texto"
            )

        # Historial reciente para contexto
        history_text = ""
        if history:
            recent = history[-10:]
            lines = []
            for m in recent:
                role = "Usuario" if hasattr(m, "type") and m.type == "human" else "Asistente"
                lines.append(f"{role}: {m.content if hasattr(m, 'content') else str(m)}")
            history_text = "\n".join(lines)

        prompt = f"""Extrae los datos estructurados del siguiente caso laboral para crear un expediente.

EMPRESA: {school_name}
FECHA: {__import__('datetime').datetime.now().strftime('%d/%m/%Y')}

CONVERSACIÓN:
{history_text}

MENSAJE ACTUAL: {message}

INSTRUCCIONES:
- title: Título descriptivo sin nombres propios si es posible (ej: "Denuncia de Acoso Laboral — Área de Operaciones")
- description: Los hechos tal como se describieron, en tercera persona, con lenguaje neutro
- case_type: Usa siempre uno de: Acoso Laboral, Acoso Sexual, Violencia en el Trabajo, Conflicto Interpersonal
- involved: Extrae las personas mencionadas. role debe ser "denunciante" o "denunciado"
- Si no hay suficiente información para un campo, usa un valor genérico apropiado
- NUNCA afirmes culpabilidad. Usa "persona denunciada", "según lo relatado", etc.

Responde con JSON válido."""

        try:
            structured_llm = self.llm.with_structured_output(CaseExtracted)
            result = await structured_llm.ainvoke([HumanMessage(content=prompt)])
            if result:
                involved_dicts = [
                    {
                        "name": p.name,
                        "role": p.role,
                        "cargo": p.cargo,
                        "area": p.area,
                    }
                    for p in (result.involved or [])
                ]
                logger.info(f"✅ [WORKFLOW] Extracted {len(involved_dicts)} involucrados: {[p['name'] for p in involved_dicts]}")
                return {
                    "title": result.title,
                    "description": result.description,
                    "case_type": result.case_type,
                    "involved": involved_dicts,
                }
        except Exception as e:
            logger.error(f"❌ [WORKFLOW] Error extracting case data: {e}", exc_info=True)

        # Fallback: datos mínimos — extraer nombres manualmente con regex
        import re
        involved_fallback = []
        # Intentar extraer nombres con patrones comunes
        patterns = [
            r'denunciante\s+es\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)',
            r'denunciado\s+es\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)',
        ]
        full_text = message
        for m in re.finditer(patterns[0], full_text, re.IGNORECASE):
            involved_fallback.append({"name": m.group(1).strip(), "role": "denunciante", "cargo": None, "area": None})
        for m in re.finditer(patterns[1], full_text, re.IGNORECASE):
            involved_fallback.append({"name": m.group(1).strip(), "role": "denunciado", "cargo": None, "area": None})

        logger.info(f"ℹ️ [WORKFLOW] Fallback extracted {len(involved_fallback)} involucrados")
        return {
            "title": f"Denuncia Ley Karin — {school_name}",
            "description": message,
            "case_type": "Acoso Laboral",
            "involved": involved_fallback,
        }

    async def _match_involved_to_students(self, involved: list, colegio_id: str) -> None:
        """Intenta vincular cada involucrado a un colaborador existente en Firestore por nombre completo."""
        if not involved or not colegio_id:
            return
        try:
            import unicodedata

            def normalize(text: str) -> str:
                """Minúsculas + sin tildes para comparación robusta."""
                nfkd = unicodedata.normalize("NFKD", text or "")
                return "".join(c for c in nfkd if not unicodedata.combining(c)).lower().strip()

            from app.services.student_service import student_service
            students = student_service.get_students_by_colegio(colegio_id)
            logger.info(f"🔍 [WORKFLOW] Matching against {len(students)} students in colegio {colegio_id}")
            if not students:
                logger.warning(f"⚠️ [WORKFLOW] No students found for colegio_id={colegio_id}")
                return

            # Índice por nombre completo normalizado (nombres + apellidos)
            students_index: Dict[str, any] = {}
            for s in students:
                full_name = normalize(f"{s.nombres or ''} {s.apellidos or ''}".strip())
                if full_name:
                    students_index[full_name] = s
                # También indexar solo nombres y solo apellidos para match parcial
                if s.nombres:
                    students_index.setdefault(normalize(s.nombres), s)
                if s.apellidos:
                    students_index.setdefault(normalize(s.apellidos), s)

            for inv in involved:
                raw_name = inv.get("name") or ""
                name = normalize(raw_name)
                if not name:
                    continue

                # 1. Búsqueda exacta por nombre completo
                match = students_index.get(name)

                # 2. Búsqueda por tokens: todos los tokens del input están en el nombre del estudiante
                if not match:
                    input_tokens = set(name.split())
                    for sname, student in students_index.items():
                        student_tokens = set(sname.split())
                        # Todos los tokens del input deben estar en el nombre del estudiante
                        if input_tokens and input_tokens.issubset(student_tokens):
                            match = student
                            break

                # 3. Búsqueda parcial: al menos apellido coincide
                if not match:
                    for sname, student in students_index.items():
                        if name in sname or sname in name:
                            match = student
                            break

                if match:
                    inv["studentId"] = match.id
                    if not inv.get("cargo"):
                        inv["cargo"] = match.cargo or ""
                    if not inv.get("area"):
                        inv["area"] = match.curso or ""
                    if not inv.get("rut"):
                        inv["rut"] = match.rut or ""
                    if not inv.get("gender"):
                        inv["gender"] = match.genero or ""
                    logger.info(f"✅ [WORKFLOW] Linked '{raw_name}' → student {match.id} ({match.nombres} {match.apellidos})")
                else:
                    logger.info(f"ℹ️ [WORKFLOW] No student match found for '{raw_name}'")

        except Exception as e:
            logger.warning(f"⚠️ [WORKFLOW] Could not match students: {e}", exc_info=True)

    def _generate_event_title(self, message: str, case_context: Optional[Dict]) -> str:
        """
        Genera un título automático para el evento basándose en el mensaje y contexto.
        SIEMPRE genera algo - nunca retorna vacío.
        """
        import re
        message_lower = message.lower()
        
        # 1. Intentar extraer "reunión/cita/entrevista con [persona]" del mensaje
        patterns = [
            r'(?:reunión|reunion|cita|entrevista|encuentro)\s+(?:con\s+)?(?:el|la|los|las)?\s*(?:de\s+)?([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+?)(?:\s*$|\s*(?:para|el|la|mañana|hoy|próximo))',
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
        if case_context and case_context.get("involucrados"):
            person = case_context["involucrados"][0]
            if "entrevista" in message_lower:
                return f"Entrevista con {person}"
            return f"Citación — {person}"
        
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
            return "Reunión de convivencia laboral"
        
        if "cita" in message_lower:
            return "Cita de convivencia laboral"
        
        if "entrevista" in message_lower:
            return "Entrevista de convivencia laboral"
        
        # 5. Fallback final
        return "Evento de convivencia laboral"

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
- Formato preferido: "Citación para [motivo] — [Nombre Trabajador]"
- Ejemplo: "Citación en el marco de investigación Ley Karin"
- Si no hay motivo claro: "Citación — [Nombre Trabajador]"

REGLA CRÍTICA PARA LA DESCRIPCIÓN:
- Redacta la descripción en PRIMERA PERSONA, dirigida al trabajador o invitado.
- Debe ser amable, profesional y enfocada en CONVIVENCIA LABORAL.
- Usa lenguaje NEUTRO: no asumas culpabilidad de ninguna parte.
- Formato: "He agendado esta cita para hablar con usted al respecto de una situación de convivencia laboral. Su participación es importante para el proceso. Agradezco su asistencia."
- NUNCA menciones "situación académica" ni términos escolares; esta plataforma es de convivencia LABORAL.

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
