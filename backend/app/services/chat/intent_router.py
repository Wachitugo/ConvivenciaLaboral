import asyncio
import logging
from typing import Dict, List, Optional
from langchain_google_vertexai import ChatVertexAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class IntentRouter:
    """
    Routes user requests to optimal execution paths based on intent classification.
    Reduces unnecessary tool calls and ReAct loops for common query types.
    """
    
    # Intent types
    DOCUMENT_ANALYSIS = "DOCUMENT_ANALYSIS"
    SIMPLE_QA = "SIMPLE_QA"
    TOOL_REQUIRED = "TOOL_REQUIRED"
    CASE_QUERY = "CASE_QUERY"
    CASE_CREATION = "CASE_CREATION"
    
    def __init__(self):
        self._llm = None
        self.model_location = settings.VERTEX_LOCATION or "us-central1"
        self._cache = {}  # Simple cache for intent classification
    
    @property
    def llm(self):
        """Lazy-loaded LLM for intent classification"""
        if self._llm is None:
            model_name = settings.VERTEX_MODEL_FLASH or settings.VERTEX_MODEL or "gemini-2.0-flash-exp"
            logger.info(f"🤖 [INTENT] Initializing LLM with model: {model_name}")
            self._llm = ChatVertexAI(
                model_name=model_name,
                temperature=0.1,  # Low temperature for consistent classification
                max_output_tokens=512,  # Enough for structured output
                project=settings.PROJECT_ID,
                location=self.model_location,
            )
        return self._llm
    
    async def classify_intent(
        self,
        message: str,
        has_files: bool = False,
        case_id: Optional[str] = None,
        history: List = None,
        user_id: Optional[str] = None
    ) -> Dict[str, any]:
        """
        Classifies user intent to route to optimal execution path.
        
        Args:
            message: User message
            has_files: Whether files are attached
            case_id: Active case ID if applicable
            history_length: Number of messages in conversation history
            
        Returns:
            {
                "intent": str,  # Intent type
                "confidence": float,  # 0.0 to 1.0
                "reasoning": str  # Why this intent was chosen
            }
        """
        try:
            # Fast-path heuristics (no LLM call needed)
            
            # DOCUMENT_ANALYSIS:
            # 1. If has files AND explicitly asks to analyze/review
            # 2. If NO files but explicitly asks for specific document types (REX, Circular, etc.)
            
            analysis_verbs = ["analiz", "revis", "examin", "verific", "lee", "estudia", "resum", "contiene", "dice", "trata", "hay", "buscar"]
            # Keywords that imply a document search in the bucket
            doc_keywords = ["rex", "circular", "decreto", "reglamento", "manual", "protocolo", "ley", "oficio", "resolucion"]
            
            message_lower = message.lower()
            
            # ════════════════════════════════════════════════════════════════════
            # ABSOLUTE PRIORITY #0: Tool requests (email/calendar)
            # Checked FIRST even in active case conversations
            # This allows using tools during case documentation
            # ═══════════════════════════════════════════════════════════════════
            import re
            
            # Verbos fuertes que indican herramienta (email/calendar)
            strong_tool_verbs = [
                # Calendario - frases explícitas
                "agendar reunión", "agendar reunion", "agenda reunión", "agenda reunion",
                "programar cita", "programa cita", "agendar cita", "agenda cita",
                "cita con apoderado", "cita apoderado", "reunion con apoderado", "reunión con apoderado",
                "cita para mañana", "reunion para mañana", "reunión para mañana",
                "cita mañana", "reunion mañana", "reunión mañana",
                # Email
                "enviar notificación", "mail al director", "correo al director", 
                "correo a los apoderados", "mail a los padres",
            ]
            
            # New structure for email-related keywords
            EMAIL_PATTERNS = {
                "keyword_phrases": [
                    "enviar correo", "mandar correo", "redactar mail", "enviar un correo",
                    "envía un correo", "escribe un mail", "redactar un email",
                    "escribir correo", "enviar email", "preparar correo", "elaborar correo",
                    "componer correo", "mandar email", "redactar mensaje", "elaborar email",
                    "preparar email", "notificar por correo", "notificar al apoderado",
                    "notificar a", "enviar notificación", "escribe una notificación",
                    "escribe un correo", "notificación a", "notifica a", "contactar por correo"
                ],
                "keywords": [
                    r"\bemail\b",
                    r"\bcorreo\b",
                    r"\bmail\b",
                    r"\benviar\b",    # enviar, envía, sending, etc.
                    r"\bredact",      # redactar, redacta, etc.
                    r"\bescrib",      # escribir, escribe, escriba, etc.
                    r"\bnotific",     # notificación, notificar, notifica, etc.
                ]
            }
            
            # Add email keyword phrases to strong_tool_verbs
            strong_tool_verbs.extend(EMAIL_PATTERNS["keyword_phrases"])
            
            # Verbos simples (requieren contexto) - usando patrones regex para evitar falsos positivos
            # Por ejemplo, "citar" no debe matchear "cita" (reunión)
            simple_tool_patterns = [
                r"\bredact",      # redactar, redacta, etc.
                r"\bescrib",      # escribir, escribe, etc.
                r"\benvi",        # enviar, envia, envía, etc.
                r"\bmand",        # manda, mandar, mandes, etc. (más flexible)
                r"\bremit",       # remitir, remite, etc.
                r"\bagend",       # agendar, agenda (como verbo)
                r"\bprograma",    # programar, programa (como verbo)
                r"\bcalendariz",  # calendarizar
                r"\bnotific",     # notificar, notifica, etc.
            ]
            
            # Objetos de herramientas - también con word boundaries
            tool_object_patterns = [
                r"\bcorreo\b",
                r"\bmail\b",
                r"\bemail\b",
                r"\bmensaje\b",
                r"\breuni[oó]n",   # reunión o reunion
                r"\bcita\b",       # cita como sustantivo (no "citar")
                r"\binvitaci[oó]n" # invitación o invitacion
            ]
            
            # Check for strong phrases first
            has_strong_tool = any(phrase in message_lower for phrase in strong_tool_verbs)
            
            # Log para debug
            if any(tool_word in message_lower for tool_word in ["mail", "correo", "email"]):
                logger.info(f"🔍 [INTENT DEBUG] Message contains email keyword. Checking patterns...")
                logger.info(f"🔍 [INTENT DEBUG] has_strong_tool: {has_strong_tool}")
            
            # Check for verb + object combination using regex
            has_verb_object = False
            if not has_strong_tool:
                has_verb = any(re.search(pattern, message_lower) for pattern in simple_tool_patterns)
                has_obj = any(re.search(pattern, message_lower) for pattern in tool_object_patterns)
                has_verb_object = has_verb and has_obj
                
                # Log adicional
                if any(tool_word in message_lower for tool_word in ["mail", "correo", "email"]):
                    logger.info(f"🔍 [INTENT DEBUG] has_verb: {has_verb}, has_obj: {has_obj}")
                
            if has_strong_tool or has_verb_object:
                logger.info(f"🎯 [INTENT] ✅ TOOL REQUEST - routing to TOOL_REQUIRED (PRIORITY #0)")
                return {
                    "intent": self.TOOL_REQUIRED,
                    "confidence": 0.95,
                    "reasoning": "Email/calendar request (works in any context)"
                }
            
            # ════════════════════════════════════════════════════════════════════
            # PRIORITY #1: Active conversation continuation
            # Check with immediate return - no additional checks needed
            # ════════════════════════════════════════════════════════════════════
            if history and len(history) >= 2 and not case_id:
                # Look at last 6 messages to detect ongoing case conversation
                recent = history[-6:] if len(history) > 6 else history
                recent_text = " ".join([m.content.lower() for m in recent if hasattr(m, 'content') and isinstance(m.content, str)])
                
                # Strong indicators of active case documentation
                case_indicators = [
                    # User-initiated case descriptions
                    "tengo un caso", "se reportó", "ocurrió un incidente", "caso de",
                    "nombres completos", "involucrados", "estudiantes", "cursos", "grados",
                    "fecha del incidente", "testigos", "apoderados",
                    # CONI's follow-up questions (indicates active case documentation)
                    "¿este incidente", "¿tienes información sobre", "diagnóstico tea",
                    "necesidad educativa especial", "nee", "¿sabes dónde ocurrió",
                    "¿cuándo ocurrió", "para documentar esto", "para orientarte",
                    "protocolo rice", "pasos a seguir", "¿ocurrió hoy",
                    # User's follow-up responses (dates, info about students)
                    "comenzó el día", "desde el", "hasta el", "ninguna tiene tea",
                    "no tiene tea", "sí tiene tea", "tiene diagnóstico", "no tiene diagnóstico",
                    "fuera del horario", "en el recreo", "en la sala"
                ]
                
                if any(indicator in recent_text for indicator in case_indicators):
                    logger.info("🎯 [INTENT] ✅ ACTIVE CASE CONVERSATION - continuing CASE_CREATION (PRIORITY #1)")
                    return {
                        "intent": self.CASE_CREATION,
                        "confidence": 0.90,  # Very high - we're certain
                        "reasoning": "Active case documentation conversation detected in history"
                    }
            
            # ════════════════════════════════════════════════════════════════════
            # PRIORITY #2: NEW case description (first message only)
            # Only checked if NOT in active conversation
            # ════════════════════════════════════════════════════════════════════
            new_case_phrases = [
                "tengo un caso", "se reportó", "se reporta", "ocurrió un incidente",
                "hay un problema", "sucedió", "necesito ayuda con una situación",
                "necesito ayuda con un caso", "ayuda con una situación donde",
                "un estudiante", "dos estudiantes", "unos estudiantes"  # ← Más flexibles
            ]
            
            # Expanded incident keywords para mejor detección
            incident_keywords = [
                # Violencia física
                "pelea", "golpe", "golpeó", "golpear", "empujó", "empujar", "empujón",
                "pegar", "pegó", "lesión", "lesionó", "herida", "agresión física",
                
                # Violencia verbal
                "insulto", "insultó", "insultar", "grito", "gritó", "amenaza", "amenazó",
                "violencia verbal", "ofensa",
                
                # Acoso y maltrato
                "agresión", "maltrato", "acoso", "bullying", "hostigamiento",
                "intimidación", "discriminación",
                
                # Conflictos generales
                "conflicto", "discusión", "pelear", "discutir", "problema de convivencia",
                "situación de convivencia", "incidente"
            ]
            
            if not case_id:
                # Verificar si hay descripción de caso (frases + keywords)
                has_case_phrase = any(phrase in message_lower for phrase in new_case_phrases)
                has_incident = any(keyword in message_lower for keyword in incident_keywords)
                
                # Si tiene AMBOS (frase + keyword) o solo keyword fuerte
                if has_case_phrase and has_incident:
                    logger.info("🎯 [INTENT] ✅ NEW CASE DESCRIPTION - routing to CASE_CREATION (PRIORITY #2)")
                    return {
                        "intent": self.CASE_CREATION,
                        "confidence": 0.85,
                        "reasoning": "User describing new case incident with explicit phrase"
                    }
                elif has_incident and len(message_lower.split()) > 8:
                    # Si es un mensaje largo con keywords de incidente (pero sin frase explícita)
                    # probablemente es una descripción de caso
                    logger.info("🎯 [INTENT] ✅ CASE DESCRIPTION (implicit) - routing to CASE_CREATION")
                    return {
                        "intent": self.CASE_CREATION,
                        "confidence": 0.75,
                        "reasoning": "Long message with incident keywords (likely case description)"
                    }
            
            
            
            # PRIORITY 2: Check for case queries (only if no tool request)
            if case_id and self._is_case_query(message):
                logger.info("🎯 [INTENT] Fast-path: CASE_QUERY (case context question)")
                return {
                    "intent": self.CASE_QUERY,
                    "confidence": 0.85,
                    "reasoning": "Query about active case data"
                }
            
            # PRIORITY 3: Check for document analysis
            if has_files:
                # If files are attached, almost any query about content or "it" is document analysis
                file_refs = ["archivo", "documento", "adjunto", "esto", "pdf", "imagen", "foto"]
                
                has_analysis_verb = any(verb in message_lower for verb in analysis_verbs)
                has_file_ref = any(ref in message_lower for ref in file_refs)
                is_question = "?" in message
                
                # Fast-path to DOCUMENT_ANALYSIS if:
                # 1. Has analysis verb ("analiza", "lee", "que contiene")
                # 2. Has file reference ("que es este archivo", "resumen del documento")
                # 3. Is a short question while having files ("que es?", "resumen?")
                
                if has_analysis_verb or has_file_ref or (is_question and len(message.split()) < 10):
                    logger.info("🎯 [INTENT] Fast-path: DOCUMENT_ANALYSIS (files attached + content query)")
                    return {
                        "intent": self.DOCUMENT_ANALYSIS,
                        "confidence": 0.95,
                        "reasoning": "Files attached and user requested analysis or queried content"
                    }
            else:
                # No files attached - check if user is asking for a specific document type
                # e.g. "Resumen del REX 781", "Analiza el reglamento"
                has_doc_keyword = any(k in message_lower for k in doc_keywords)
                has_analysis_request = any(verb in message_lower for verb in analysis_verbs) or "que dice" in message_lower
                
                if has_doc_keyword and has_analysis_request:
                    logger.info("🎯 [INTENT] Fast-path: DOCUMENT_ANALYSIS (Remote Document Search)")
                    return {
                        "intent": self.DOCUMENT_ANALYSIS,
                        "confidence": 0.9,
                        "reasoning": "User requested analysis of specific document type (Remote Search)"
                    }
            
            # LLM classification for ambiguous cases
            logger.info("🧠 [INTENT] Using LLM for intent classification")
            classification = await self._llm_classify(message, has_files, case_id, user_id)
            return classification
            
        except Exception as e:
            logger.warning(f"⚠️ [INTENT] Classification error, defaulting to TOOL_REQUIRED: {e}")
            return {
                "intent": self.TOOL_REQUIRED,
                "confidence": 0.5,
                "reasoning": f"Error during classification: {e}"
            }
    
    def _is_case_query(self, message: str) -> bool:
        """Fast keyword detection for case queries"""
        query_keywords = [
            "de que trata", "que caso", "cual es el caso", "resumen del caso",
            "quien esta involucrado", "archivos del caso", "detalles del caso"
        ]
        message_lower = message.lower()
        return any(k in message_lower for k in query_keywords)
    
    async def _llm_classify(self, message: str, has_files: bool, case_id: Optional[str], user_id: Optional[str] = None) -> Dict:
        """Use LLM to classify when heuristics are insufficient"""
        from pydantic import BaseModel, Field
        from datetime import datetime
        from app.services.users.user_service import user_service
        
        # Define schema for structured output
        class IntentClassification(BaseModel):
            intent: str = Field(description="DOCUMENT_ANALYSIS, SIMPLE_QA, TOOL_REQUIRED, or CASE_QUERY")
            confidence: float = Field(description="0.0 to 1.0")
            reasoning: str = Field(description="Brief explanation")
        
        current_date_str = datetime.now().strftime("%A %d de %B de %Y")
        
        # Build context
        context_parts = []
        if has_files:
            context_parts.append("Usuario adjuntó archivos/documentos")
        if case_id:
            context_parts.append("Hay un caso activo en contexto")
        context_str = " | ".join(context_parts) if context_parts else "Sin contexto especial"
        
        prompt = f"""Clasifica la intención del siguiente mensaje de usuario en UNA de estas categorías:

FECHA ACTUAL DEL SISTEMA: {current_date_str}

CATEGORÍAS:

1. **CASE_CREATION**: El usuario describe un caso o incidente escolar para documentar.
   Ejemplos:
   - "Tengo un caso de bullying en N° básico"
   - "Dos alumnos se pelearon en el recreo"
   - "Necesito registrar una situación de agresión"
   - "Ocurrió un incidente grave entre dos estudiantes"

2. **SIMPLE_QA**: Preguntas GENÉRICAS sobre convivencia escolar.
   Ejemplos:
   - "¿Qué es el protocolo RICE?"
   - "¿Cuáles son los pasos de mediación escolar?"
   - "¿Qué significa NEE?"
   - "Diferencia entre medida formativa y sanción"
   - "¿Qué tipos de protocolos existen?"
   
   Características:
   - NO hace referencia a documentos ESPECÍFICOS ("el reglamento", "esta circular", "el REX 781")
   - NO necesita buscar en archivos
   - Puede responderse con información general sobre convivencia/educación

2. **DOCUMENT_ANALYSIS**: Usuario quiere buscar/analizar documentos ESPECÍFICOS. PUEDE SER:
   a) Documentos adjuntos actualmente
   b) Búsqueda de documentos ESPECÍFICOS almacenados ("Busca el REX 781", "Qué dice EL reglamento", "Analiza LA circular 1627")
   c) Preguntas sobre contexto CONCRETO previo ("esta situación", "ESTE caso", "según el análisis anterior", "los estudiantes mencionados", "el caso")
   
   Características clave - USA DOCUMENT_ANALYSIS SOLO si:
   - Menciona UN documento específico por nombre/número ("el REX 781", "la circular 1627", "el decreto 170")
   - Hace referencia a información CONCRETA previa con demostrativos ("ESTE/EL caso", "ESTA/LA situación", "ESE/EL estudiante")
   - Pide buscar/revisar/analizar archivos almacenados
   
   NO usar DOCUMENT_ANALYSIS si:
   - Usa términos genéricos/hipotéticos ("un caso", "un ejemplo", "una situación similar")
   - Pregunta sobre cómo aplicar algo en general ("¿cómo aplico X en un caso?")


5. **TOOL_REQUIRED**: Petición EXPLÍCITA de herramientas externas.
   - "Redacta un correo", "Agenda una reunión", "Envía una notificación"
   - EXCEPCIÓN: Si pregunta "¿Cómo redacto...?" o "¿Cómo envío...?", es **SIMPLE_QA** (quiere instrucciones), NO herramienta.

IMPORTANTE: 
- Si la pregunta es GENÉRICA sobre un tema (sin referencia a documentos específicos), usa SIMPLE_QA
- Si pide UN documento específico o hace referencia a contexto previo, usa DOCUMENT_ANALYSIS

Contexto: {context_str}
Mensaje: "{message}"

Responde SOLO con el nombre de la categoría (ej: DOCUMENT_ANALYSIS)"""


        try:
            structured_llm = self.llm.with_structured_output(IntentClassification)
            messages = [HumanMessage(content=prompt)]
            
            # NOTE: structured_output might hide raw response, preventing easy usage access.
            # However, ChatVertexAI generally returns usage in AIMessage. 
            # with_structured_output returns the Pydantic object directly.
            # To get usage, we might need to invoke the base LLM first or trust LangChain updates.
            # For now, let's use the base invoke to get usage, then parse.
            
            # Alternative: Use standard invoke and parse manually to guarantee usage access
            raw_response = await self.llm.ainvoke(messages)
            
            # Track usage
            if user_id and hasattr(raw_response, 'usage_metadata'):
                usage = raw_response.usage_metadata
                if usage:
                    user_service.update_token_usage(
                        user_id=user_id,
                        input_tokens=usage.get('input_tokens', 0),
                        output_tokens=usage.get('output_tokens', 0),
                        model_name=self.llm.model_name
                    )
            
            # Now retry structured parsing or simple parsing
            structured_llm = self.llm.with_structured_output(IntentClassification)
            # This second call adds double cost... avoid if possible.
            # Optimization: Just return the classification from the raw text if possible, OR accept the small double cost for now to ensure robustness + tracking.
            # Better optimization: Use the raw_response content to parse.
            
            # Let's try to parse raw_response first if it's simple text. 
            # If complex/failed, fallback to specific structured call (but that misses usage tracking of the first call, or doubles it).
            # Ideally, with_structured_output should attach usage. 
            
            # Use the structured call as primary since it's cleaner, accept we might miss usage OR 
            # use a callback. But callbacks are complex here.
            # Let's stick to the double-call approach for safety for now, or just use the raw response if it looks like JSON.
            # Actually, `ChatVertexAI` `ainvoke` with structured output wrapper *consumes* the response.
            
            # Let's invoke structured directly. Is there a way to get usage?
            # LangGraph/LangChain usually attaches it to the AIMessage. `with_structured_output` returns the OBJECT.
            
            # REVISION: Let's do a single raw invoke and parse it manually. It's safer for resource tracking.
            # But the existing code was using structured output.
            
            # Let's proceed with `with_structured_output` and ignore usage for INTENT classification for now? 
            # NO, user said "count tokens".
            
            # Strategy: Use `ainvoke` (standard), then use `structured_llm` only if needed or just parse result.
            # Intent classification is usually short.
            
            # Let's revert to using `structured_llm.ainvoke` but realize we can't easily get usage from the resulting Pydantic model.
            # Workaround: Use the raw llm invoke, and try to parse.
            
            # Actually, let's look at `raw_response.content` if we use `self.llm.ainvoke(messages)`.
            # If we used `with_structured_output`, we lose the `AIMessage`.
            
            # Let's try to get usage from the raw response of a standard invoke.
            # And then manually parse or use a parser.
            
            if raw_response and raw_response.content:
                 # Check if content is valid JSON for the schema
                 pass
            
            # To be safe and fast:
            # 1. `raw_response = await self.llm.ainvoke(...)`
            # 2. Track usage.
            # 3. Parse `raw_response.content`. If it fails, fallback.
            
            result = None
            try:
                # Try to parse raw content as JSON if model followed instructions implies by structured output (which we didn't use yet).
                # But our prompt above doesn't enforce JSON strictly without `with_structured_output`.
                
                # Let's just use `with_structured_output` but assume we might miss usage for THIS specific call 
                # UNLESS we can access the raw response.
                # WAIT! `ChatVertexAI.ainvoke` returns an AIMessage which HAS `usage_metadata`.
                # `with_structured_output` returns the Pydantic model.
                
                # OK, let's use the standard `ainvoke` and ask for JSON in the prompt to avoid 2 calls.
                parser_prompt = prompt + "\n\nResponde con un JSON válido que cumpla con el esquema: {intent, confidence, reasoning}."
                messages_json = [HumanMessage(content=parser_prompt)]
                raw_response = await self.llm.ainvoke(messages_json)
                
                # Track usage
                if user_id and hasattr(raw_response, 'usage_metadata'):
                    usage = raw_response.usage_metadata
                    if usage:
                        user_service.update_token_usage(
                            user_id=user_id,
                            input_tokens=usage.get('input_tokens', 0),
                            output_tokens=usage.get('output_tokens', 0),
                            model_name=self.llm.model_name
                        )

                # Parse JSON
                import json
                import re
                content = raw_response.content
                if "```json" in content:
                    content = re.search(r'```json\s*([\s\S]*?)\s*```', content).group(1)
                elif "```" in content:
                    content = content.split("```")[1]
                
                data = json.loads(content)
                result = IntentClassification(**data)
                
            except Exception:
                 # Fallback to structured output (might not track usage easily but ensures functionality)
                 result = await structured_llm.ainvoke(messages)

            if result is None:
                logger.warning(f"⚠️ [INTENT] Null response from structured output, retrying with text parsing...")
                return {"intent": self.SIMPLE_QA, "confidence": 0.5, "reasoning": "Null response"}
            
            logger.info(f"🎯 [INTENT] {result.intent} (conf: {result.confidence})")
            
            return {
                "intent": result.intent,
                "confidence": result.confidence,
                "reasoning": result.reasoning
            }
        except Exception as e:
            logger.warning(f"⚠️ [INTENT] Error: {e}, using TOOL_REQUIRED")
            return {"intent": self.TOOL_REQUIRED, "confidence": 0.5, "reasoning": f"Error: {str(e)[:30]}"}


# Singleton instance
intent_router = IntentRouter()
