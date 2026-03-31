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
        Classifies user intent using FAST-PATHS for obvious cases and LLM for ambiguous ones.
        
        Architecture:
        1. Fast-path heuristics (~20 lines) for 100% obvious cases
        2. LLM classification for everything else (robust, handles edge cases)
        
        Args:
            message: User message
            has_files: Whether files are attached
            case_id: Active case ID if applicable
            history: Conversation history
            user_id: User ID for token tracking
            
        Returns:
            {
                "intent": str,  # Intent type
                "confidence": float,  # 0.0 to 1.0
                "reasoning": str  # Why this intent was chosen
            }
        """
        try:
            import re
            message_lower = message.lower()
            
            # ════════════════════════════════════════════════════════════════════
            # FAST-PATH #1: Email address detected → TOOL_REQUIRED
            # ════════════════════════════════════════════════════════════════════
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            if re.search(email_pattern, message):
                logger.info(f"🎯 [INTENT] Fast-path: TOOL_REQUIRED (email address detected)")
                return {
                    "intent": self.TOOL_REQUIRED,
                    "confidence": 0.98,
                    "reasoning": "Email address detected in message"
                }
            
            # ════════════════════════════════════════════════════════════════════
            # FAST-PATH #2: Explicit tool requests (email/calendar phrases)
            # ════════════════════════════════════════════════════════════════════
            tool_phrases = [
                "enviar correo", "redactar correo", "enviar email", "redactar email",
                "enviar mail", "agendar reunión", "agendar reunion", "agenda cita",
                "programar cita", "preparar correo", "notificar por correo",
                "agendar citación", "citar a declarar", "enviar notificación"
            ]
            
            if any(phrase in message_lower for phrase in tool_phrases):
                logger.info(f"🎯 [INTENT] Fast-path: TOOL_REQUIRED (explicit tool phrase)")
                return {
                    "intent": self.TOOL_REQUIRED,
                    "confidence": 0.95,
                    "reasoning": "Explicit tool request phrase detected"
                }
            
            # ════════════════════════════════════════════════════════════════════
            # FAST-PATH #2.1: Case workflow requests → TOOL_REQUIRED
            # ════════════════════════════════════════════════════════════════════
            workflow_phrases = [
                "crear caso", "crear expediente", "registrar caso", "registrar expediente",
                "abrir caso", "abrir expediente", "nuevo expediente", "nuevo caso",
                "crear denuncia", "registrar denuncia", "ingresar denuncia",
                "iniciar expediente", "levantar expediente", "levantar caso",
                "crear caso ley karin", "crear caso de acoso", "registrar acoso",
                "tengo una denuncia y quiero", "quiero crear un caso",
                "quiero registrar un caso", "quiero abrir un expediente",
            ]
            if any(phrase in message_lower for phrase in workflow_phrases):
                logger.info("🎯 [INTENT] Fast-path: TOOL_REQUIRED (case workflow request)")
                return {
                    "intent": self.TOOL_REQUIRED,
                    "confidence": 0.96,
                    "reasoning": "Case workflow request detected"
                }

            # ════════════════════════════════════════════════════════════════════
            # FAST-PATH #2.2: Document drafting requests → TOOL_REQUIRED
            # ════════════════════════════════════════════════════════════════════
            document_phrases = [
                "redactar resolución", "redacta resolución", "generar resolución",
                "resolución de apertura", "resolución que activa",
                "redactar medida de resguardo", "generar medida de resguardo",
                "elaborar medida de resguardo", "crear medida de resguardo",
                "notificar al denunciado", "notificación al denunciado",
                "notificar al denunciante", "acuse de recibo",
                "carta de notificación", "carta al denunciado",
                "redactar documento", "generar documento",
                "resolución karin",
            ]
            if any(phrase in message_lower for phrase in document_phrases):
                logger.info("🎯 [INTENT] Fast-path: TOOL_REQUIRED (document drafting request)")
                return {
                    "intent": self.TOOL_REQUIRED,
                    "confidence": 0.96,
                    "reasoning": "Document drafting request detected"
                }

            # ════════════════════════════════════════════════════════════════════
            # FAST-PATH #2.3: Protocol guide queries → TOOL_REQUIRED
            # ════════════════════════════════════════════════════════════════════
            protocol_phrases = [
                "estado del protocolo", "paso del protocolo",
                "siguiente paso del protocolo", "siguiente paso del caso",
                "completar paso", "marcar paso", "avanzar protocolo", "avanzar paso",
                "protocolo ley karin", "plazos del protocolo", "plazos ley karin",
                "en qué paso del protocolo", "en que paso del protocolo",
                "qué paso sigue del protocolo", "que paso sigue del protocolo",
                "protocolo activo", "paso actual del protocolo",
                "activar protocolo", "iniciar protocolo", "activar ley karin",
                "aplicar protocolo", "apertura de protocolo", "iniciar investigación formal",
            ]
            if any(phrase in message_lower for phrase in protocol_phrases):
                logger.info("🎯 [INTENT] Fast-path: TOOL_REQUIRED (protocol guide request)")
                return {
                    "intent": self.TOOL_REQUIRED,
                    "confidence": 0.95,
                    "reasoning": "Protocol guide request detected"
                }

            # ════════════════════════════════════════════════════════════════════
            # FAST-PATH #2.5: Document listing queries → DOCUMENT_ANALYSIS
            # Must be before CASE_CREATION fast-path to avoid being swallowed
            # ════════════════════════════════════════════════════════════════════
            listing_phrases = [
                "que documentos tienes", "qué documentos tienes",
                "cuales documentos", "cuáles documentos",
                "lista documentos", "listar documentos",
                "lista de documentos", "lista completa de documentos",
                "lista completa", "documentos disponibles", "documentos tienes",
                "a que documentos", "a qué documentos",
                "que archivos tienes", "qué archivos tienes",
                "cuales son los documentos", "cuáles son los documentos",
                "mostrar documentos", "ver documentos",
                "cual es la lista", "cuál es la lista",
                "lista de archivos", "todos los documentos",
                "tu lista", "tus documentos", "tus archivos",
                "listado de documentos", "listado de archivos", "el listado",
                "cuál es el listado", "cual es el listado",
            ]
            if any(phrase in message_lower for phrase in listing_phrases):
                logger.info("🎯 [INTENT] Fast-path: DOCUMENT_ANALYSIS (document listing request)")
                return {
                    "intent": self.DOCUMENT_ANALYSIS,
                    "confidence": 0.95,
                    "reasoning": "Document listing request detected"
                }

            # ════════════════════════════════════════════════════════════════════
            # FAST-PATH #3: Active case conversation continuation
            # ════════════════════════════════════════════════════════════════════
            if history and len(history) >= 2 and not case_id:
                recent = history[-6:] if len(history) > 6 else history
                recent_text = " ".join([
                    m.content.lower() for m in recent 
                    if hasattr(m, 'content') and isinstance(m.content, str)
                ])
                
                # Indicadores de caso activo REAL (requieren persona concreta, no solo normativa)
                case_indicators = [
                    "tengo una denuncia", "denunciado", "denunciante",
                    "testigos", "fecha del incidente",
                    "agredió", "agredido",
                    "me acosaron", "me hostigaron", "fue despedido",
                    "ocurrió el incidente", "registrar el caso", "documentar el caso"
                ]

                if any(indicator in recent_text for indicator in case_indicators):
                    logger.info("🎯 [INTENT] Fast-path: CASE_CREATION (active conversation)")
                    return {
                        "intent": self.CASE_CREATION,
                        "confidence": 0.90,
                        "reasoning": "Active case documentation conversation in history"
                    }
            
            # ════════════════════════════════════════════════════════════════════
            # FAST-PATH #4: Files attached + analysis verbs → DOCUMENT_ANALYSIS
            # ════════════════════════════════════════════════════════════════════
            if has_files:
                analysis_verbs = ["analiz", "revis", "examin", "lee", "resum", "que dice", "que contiene"]
                file_refs = ["archivo", "documento", "adjunto", "pdf", "contrato", "carta"]
                
                has_analysis = any(verb in message_lower for verb in analysis_verbs)
                has_file_ref = any(ref in message_lower for ref in file_refs)
                is_short_question = "?" in message and len(message.split()) < 10
                
                if has_analysis or has_file_ref or is_short_question:
                    logger.info("🎯 [INTENT] Fast-path: DOCUMENT_ANALYSIS (files + query)")
                    return {
                        "intent": self.DOCUMENT_ANALYSIS,
                        "confidence": 0.95,
                        "reasoning": "Files attached with analysis request"
                    }
            
            # ════════════════════════════════════════════════════════════════════
            # LLM CLASSIFICATION: For all ambiguous cases
            # ════════════════════════════════════════════════════════════════════
            logger.info("🧠 [INTENT] Using LLM for classification (no fast-path matched)")
            return await self._llm_classify(message, has_files, case_id, user_id)
            
        except Exception as e:
            logger.warning(f"⚠️ [INTENT] Classification error: {e}")
            return {
                "intent": self.TOOL_REQUIRED,
                "confidence": 0.5,
                "reasoning": f"Error during classification: {e}"
            }
    
    def _is_case_query(self, message: str) -> bool:
        """Fast keyword detection for case queries (deprecated - now using LLM)"""
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
        
        class IntentClassification(BaseModel):
            intent: str = Field(description="DOCUMENT_ANALYSIS, SIMPLE_QA, TOOL_REQUIRED, CASE_CREATION, or CASE_QUERY")
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
        
        prompt = f"""Clasifica la intención del siguiente mensaje en UNA de estas categorías:

FECHA ACTUAL: {current_date_str}
CONTEXTO: {context_str}

═══════════════════════════════════════════════════════════════
CATEGORÍAS (ordenadas por prioridad)
═══════════════════════════════════════════════════════════════

1. **CASE_CREATION**: Usuario describe un incidente/denuncia laboral para documentar
   Señales:
   - Describe una situación que ocurrió con trabajadores específicos
   - Menciona conductas problemáticas reales (acoso, violencia, conflicto, etc.)
   - Da detalles sobre involucrados, fechas, lugares
   
   ✅ Ejemplos SÍ CASE_CREATION:
   - "Tengo una denuncia por acoso laboral del jefe de bodega"
   - "Un trabajador agredió verbalmente a su supervisor"
   - "Necesito registrar un caso de hostigamiento"
   
   ❌ NO es CASE_CREATION:
   - "¿Qué es acoso laboral?" (pregunta genérica → SIMPLE_QA)
   - "¿Qué hacer si hay violencia?" (pregunta hipotética → SIMPLE_QA)

2. **DOCUMENT_ANALYSIS**: Usuario quiere buscar/analizar documentos ESPECÍFICOS
   Señales:
   - Menciona un documento por nombre/número ("Ley Karin", "Reglamento Interno", "contrato")
   - Pide buscar en archivos almacenados
   - Hace referencia a archivos adjuntos actualmente
   - Pregunta sobre contenido de documentos concretos
   
   ✅ Ejemplos SÍ DOCUMENT_ANALYSIS:
   - "¿Qué dice el Reglamento Interno sobre sanciones?"
   - "Busca el protocolo de investigación"
   - "¿Qué contiene la ley 21.643?"
   
   ❌ NO es DOCUMENT_ANALYSIS:
   - "¿Qué es un protocolo de acoso?" (pregunta genérica → SIMPLE_QA)
   - "¿Cómo funciona la investigación?" (conocimiento general → SIMPLE_QA)

3. **SIMPLE_QA**: Preguntas GENERALES sobre prevención y Ley Karin
   Señales:
   - Pregunta conceptual o de conocimiento general
   - NO menciona documentos específicos ni casos concretos
   - Busca entender procesos, definiciones, mejores prácticas
   
   ✅ Ejemplos SÍ SIMPLE_QA:
   - "¿Qué es acoso laboral?"
   - "¿Cuáles son los plazos de investigación?"
   - "Diferencia entre conflicto y acoso"
   - "¿Qué tipos de denuncias existen?"
   - "¿Cómo se documenta un caso?" (pregunta de proceso)
   
   ❌ NO es SIMPLE_QA:
   - "¿Qué dice MI reglamento sobre sanciones?" (pide documento específico → DOCUMENT_ANALYSIS)

4. **TOOL_REQUIRED**: Petición de herramientas externas (calendario/email)
   Señales:
   - Quiere EJECUTAR una acción (enviar, agendar, programar)
   - Menciona correo, email, reunión, cita, citación
   
   ✅ Ejemplos SÍ TOOL_REQUIRED:
   - "Envía una notificación al denunciado"
   - "Agenda una citación para declarar"
   
   ❌ NO es TOOL_REQUIRED:
   - "¿Cómo redacto una notificación?" (pide instrucciones → SIMPLE_QA)
   - "¿Cuándo debo citar a declarar?" (pregunta → SIMPLE_QA)

5. **CASE_QUERY**: Pregunta sobre un caso activo (SOLO si hay case_id activo)
   - "¿De qué trata este caso?"
   - "¿Quién está involucrado?"

═══════════════════════════════════════════════════════════════
REGLAS DE DESAMBIGUACIÓN
═══════════════════════════════════════════════════════════════

🔑 CLAVE #1: Pregunta genérica vs documento específico
- "¿Qué es acoso laboral?" → SIMPLE_QA (genérico)
- "¿Qué dice MI REGLAMENTO sobre acoso?" → DOCUMENT_ANALYSIS (específico)

🔑 CLAVE #2: Caso real vs pregunta hipotética
- "El gerente de área hostigó a un trabajador ayer" → CASE_CREATION (real)
- "¿Qué hago si hay hostigamiento?" → SIMPLE_QA (hipotético)

🔑 CLAVE #3: Ejecutar acción vs pedir instrucciones
- "Redacta una citación al denunciado" → TOOL_REQUIRED (ejecutar)
- "¿Cómo redacto una citación formal?" → SIMPLE_QA (instrucciones)

═══════════════════════════════════════════════════════════════
MENSAJE A CLASIFICAR
═══════════════════════════════════════════════════════════════

"{message}"

Responde con JSON válido: {{"intent": "CATEGORIA", "confidence": 0.0-1.0, "reasoning": "explicación breve"}}"""

        try:
            # Single LLM call with JSON response
            messages = [HumanMessage(content=prompt)]
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
            
            # Parse JSON response
            import json
            import re
            content = raw_response.content
            
            # Extract JSON from markdown if present
            if "```json" in content:
                content = re.search(r'```json\s*([\s\S]*?)\s*```', content).group(1)
            elif "```" in content:
                content = content.split("```")[1]
            
            data = json.loads(content)
            result = IntentClassification(**data)
            
            logger.info(f"🎯 [INTENT] {result.intent} (conf: {result.confidence:.2f})")
            
            return {
                "intent": result.intent,
                "confidence": result.confidence,
                "reasoning": result.reasoning
            }
            
        except Exception as e:
            logger.warning(f"⚠️ [INTENT] Classification error: {e}")
            return {
                "intent": self.SIMPLE_QA,
                "confidence": 0.5,
                "reasoning": f"Error: {str(e)[:30]}"
            }


# Singleton instance
intent_router = IntentRouter()
