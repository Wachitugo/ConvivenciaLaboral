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
        """
        try:
            # Fast-path heuristics (no LLM call needed)
            
            # DOCUMENT_ANALYSIS:
            analysis_verbs = ["analiz", "revis", "examin", "verific", "lee", "estudia", "resum", "contiene", "dice", "trata", "hay", "buscar", "busca"]
            # Keywords that imply a document search in the bucket (Contexto Laboral)
            doc_keywords = ["reglamento", "riohs", "contrato", "anexo", "carta", "amonestación", "despido", "finiquito", "ley", "código", "manual", "protocolo", "política", "denuncia"]
            
            message_lower = message.lower()
            
            # ════════════════════════════════════════════════════════════════════
            # ABSOLUTE PRIORITY #0: Tool requests (email/calendar)
            # ═══════════════════════════════════════════════════════════════════
            import re
            
            # Verbos fuertes que indican herramienta (email/calendar)
            strong_tool_verbs = [
                # Calendario (Laboral)
                "agendar reunión", "agendar citación", "citar a declarar", "citar al denunciado",
                "citar al denunciante", "programar entrevista", "agendar entrevista",
                # Email (Laboral)
                "redactar correo", "enviar notificación", "notificar al denunciado",
                "correo a la inspección", "email al gerente", "notificar recepción"
            ]
            
            # New structure for email-related keywords
            EMAIL_PATTERNS = {
                "keyword_phrases": [
                    "enviar correo", "mandar correo", "redactar mail", "enviar un correo",
                    "envía un correo", "escribe un mail", "redactar un email",
                    "escribir correo", "enviar email", "preparar correo", "elaborar correo",
                    "componer correo", "mandar email", "redactar mensaje", "elaborar email",
                    "preparar email", "notificar por correo", "notificar a", 
                    "enviar notificación", "escribe una notificación"
                ],
                "keywords": [
                    r"\bemail\b", r"\bcorreo\b", r"\bmail\b",
                    r"\benviar\b", r"\bredact", r"\bescrib", r"\bnotific"
                ]
            }
            
            # Add email keyword phrases to strong_tool_verbs
            strong_tool_verbs.extend(EMAIL_PATTERNS["keyword_phrases"])
            
            # Check for strong phrases first
            has_strong_tool = any(phrase in message_lower for phrase in strong_tool_verbs)
            
            if has_strong_tool:
                logger.info(f"🎯 [INTENT] ✅ TOOL REQUEST - routing to TOOL_REQUIRED (PRIORITY #0)")
                return {
                    "intent": self.TOOL_REQUIRED,
                    "confidence": 0.95,
                    "reasoning": "Email/calendar request detected"
                }
            
            # ════════════════════════════════════════════════════════════════════
            # PRIORITY #1: Active conversation continuation (Laboral Context)
            # ════════════════════════════════════════════════════════════════════
            if history and len(history) >= 2 and not case_id:
                # Look at last 6 messages
                recent = history[-6:] if len(history) > 6 else history
                recent_text = " ".join([m.content.lower() for m in recent if hasattr(m, 'content') and isinstance(m.content, str)])
                
                # Active case indicators (Laboral)
                case_indicators = [
                    "tengo una denuncia", "acoso laboral", "acoso sexual", "violencia",
                    "trabajador", "jefe", "gerente", "supervisor", "colaborador",
                    "testigos", "pruebas", "evidencias", "relato",
                    "¿cuándo ocurrió", "cargo del denunciado", "área de trabajo",
                    "relación jerárquica", "contrato", "plazos"
                ]
                
                if any(indicator in recent_text for indicator in case_indicators):
                    logger.info("🎯 [INTENT] ✅ ACTIVE CASE CONVERSATION - continuing CASE_CREATION (PRIORITY #1)")
                    return {
                        "intent": self.CASE_CREATION,
                        "confidence": 0.90,
                        "reasoning": "Active case documentation conversation detected"
                    }
            
            # ════════════════════════════════════════════════════════════════════
            # PRIORITY #2: NEW case description (Laboral)
            # ════════════════════════════════════════════════════════════════════
            new_case_phrases = [
                "tengo una denuncia", "recibí una denuncia", "se presentó una denuncia",
                "tengo un caso", "ocurrió un incidente", "problema con un trabajador",
                "conflicto laboral", "situación de acoso", "denuncia por ley karin",
                "maltrato laboral", "violencia en el trabajo"
            ]
            
            # Incident keywords (Laboral)
            incident_keywords = [
                # Ley Karin
                "acoso laboral", "acoso sexual", "violencia", "maltrato",
                "mobbing", "hostigamiento", "menoscabo", "humillación",
                "gritos", "insultos", "agresión", "discriminación",
                "jefe", "supervisor", "gerente", "compañero", "subordinado"
            ]
            
            if not case_id:
                # Verificar si hay descripción de caso
                has_case_phrase = any(phrase in message_lower for phrase in new_case_phrases)
                has_incident = any(keyword in message_lower for keyword in incident_keywords)
                
                if has_case_phrase or (has_incident and len(message_lower.split()) > 6):
                    logger.info("🎯 [INTENT] ✅ NEW CASE DESCRIPTION - routing to CASE_CREATION (PRIORITY #2)")
                    return {
                        "intent": self.CASE_CREATION,
                        "confidence": 0.85,
                        "reasoning": "User describing new labor case/incident"
                    }
            
            # PRIORITY 2: Check for case queries
            if case_id and self._is_case_query(message):
                logger.info("🎯 [INTENT] Fast-path: CASE_QUERY")
                return {
                    "intent": self.CASE_QUERY,
                    "confidence": 0.85,
                    "reasoning": "Query about active case data"
                }
            
            # PRIORITY 3: Check for document analysis
            if has_files:
                file_refs = ["archivo", "documento", "adjunto", "esto", "pdf", "imagen", "foto", "carta", "contrato"]
                has_analysis_verb = any(verb in message_lower for verb in analysis_verbs)
                has_file_ref = any(ref in message_lower for ref in file_refs)
                is_question = "?" in message
                
                if has_analysis_verb or has_file_ref or (is_question and len(message.split()) < 10):
                    logger.info("🎯 [INTENT] Fast-path: DOCUMENT_ANALYSIS (files attached)")
                    return {
                        "intent": self.DOCUMENT_ANALYSIS,
                        "confidence": 0.95,
                        "reasoning": "Files attached and user requested analysis"
                    }
            else:
                # No files attached - check if user is asking for specific document type
                has_doc_keyword = any(k in message_lower for k in doc_keywords)
                has_analysis_request = any(verb in message_lower for verb in analysis_verbs) or "que dice" in message_lower
                
                if has_doc_keyword and has_analysis_request:
                    logger.info("🎯 [INTENT] Fast-path: DOCUMENT_ANALYSIS (Remote Document Search)")
                    return {
                        "intent": self.DOCUMENT_ANALYSIS,
                        "confidence": 0.9,
                        "reasoning": "User requested analysis of specific document type"
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
            "quien esta involucrado", "archivos del caso", "detalles del caso",
            "datos del caso", "información del caso"
        ]
        message_lower = message.lower()
        return any(k in message_lower for k in query_keywords)
    
    async def _llm_classify(self, message: str, has_files: bool, case_id: Optional[str], user_id: Optional[str] = None) -> Dict:
        """Use LLM to classify when heuristics are insufficient"""
        from pydantic import BaseModel, Field
        from datetime import datetime
        from app.services.users.user_service import user_service
        
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
        
        prompt = f"""Clasifica la intención del mensaje del usuario (CONTEXTO: Prevención de Riesgos y Ley Karin) en UNA categoría:

FECHA ACTUAL: {current_date_str}

CATEGORÍAS:

1. **CASE_CREATION**: Usuario describe una situación de ACOSO, VIOLENCIA o CONFLICTO LABORAL para documentar.
   Ejemplos:
   - "Tengo una denuncia por acoso sexual"
   - "Un trabajador agredió a su jefe"
   - "Conflicto entre pares en el área de bodega"
   - "Necesito registrar un caso de maltrato"

2. **SIMPLE_QA**: Preguntas TEÓRICAS o GENERALES sobre Ley Karin o normativa.
   Ejemplos:
   - "¿Qué es acoso laboral?"
   - "¿Cuáles son los plazos de investigación?"
   - "¿Qué dice la ley 21.643?"
   - "Diferencia entre conflicto y acoso"
   
   Características: NO pide buscar en documentos específicos ni adjunta archivos.

3. **DOCUMENT_ANALYSIS**: Usuario quiere buscar/analizar documentos ESPECÍFICOS.
   - Adjuntó archivos.
   - O pide buscar: "Revisa el Reglamento Interno", "Busca el contrato de Juan", "Qué dice la carta de amonestación".

4. **TOOL_REQUIRED**: Petición EXPLÍCITA de herramientas.
   - "Redacta un correo", "Agenda una citación", "Envía notificación".

Contexto: {context_str}
Mensaje: "{message}"

Responde SOLO con un JSON válido: {{intent, confidence, reasoning}}"""

        try:
            # Standard invoke to parse JSON manually
            parser_prompt = prompt + "\n\nResponde con un JSON válido."
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
            
            logger.info(f"🎯 [INTENT] {result.intent} (conf: {result.confidence})")
            
            return {
                "intent": result.intent,
                "confidence": result.confidence,
                "reasoning": result.reasoning
            }
            
        except Exception as e:
            logger.warning(f"⚠️ [INTENT] Error in LLM classification: {e}, using SIMPLE_QA fallback")
            return {"intent": self.SIMPLE_QA, "confidence": 0.5, "reasoning": "Fallback on error"}


# Singleton instance
intent_router = IntentRouter()
