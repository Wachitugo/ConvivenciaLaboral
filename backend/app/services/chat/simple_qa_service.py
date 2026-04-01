"""
Simple QA Service

Servicio especializado en responder preguntas simples e informativas de forma rápida.
Usa el modelo Flash (más rápido y económico) para respuestas directas.

Casos de uso:
- "¿Qué es la Ley Karin?"
- "¿Cuál es el plazo para investigar una denuncia?"
- "¿Qué se entiende por acoso laboral?"
- Preguntas generales sobre normativa laboral y prevención
"""

import logging
from typing import List, Optional
from langchain_google_vertexai import ChatVertexAI
from langchain_core.messages import HumanMessage, SystemMessage
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class SimpleQAService:
    """
    Servicio para responder preguntas simples de forma rápida y eficiente.
    
    Características:
    - Usa modelo Flash (rápido, económico)
    - Sin herramientas (pure LLM)
    - Respuestas directas y concisas
    - Ideal para preguntas informativas sobre Ley Karin y prevención
    """
    
    def __init__(self):
        self._llm = None
        self.model_location = settings.VERTEX_LOCATION or "us-central1"
    
    @property
    def llm(self):
        """LLM Flash para respuestas rápidas"""
        if self._llm is None:
            model_name = settings.VERTEX_MODEL_FLASH or "gemini-2.5-flash-lite"
            logger.info(f"🤖 [SIMPLE_QA] Initializing Flash LLM: {model_name}")
            
            self._llm = ChatVertexAI(
                model_name=model_name,
                temperature=0.5,  # Moderada - respuestas consistentes pero naturales
                project=settings.PROJECT_ID,
                location=self.model_location
            )
        return self._llm
    
    async def answer_question(
        self,
        message: str,
        school_name: str, # Mantenemos nombre variable por compatibilidad (es Company Name)
        history: List,
        user_context: Optional[dict] = None,
        search_app_id: Optional[str] = None,  # ← ID de app de búsqueda para RAG lite (Discovery Engine)
        riohs_summary: Optional[str] = None,  # ← Resumen RIOHS de la empresa
        rag_corpus_id: Optional[str] = None   # ← Corpus Vertex RAG (prioridad sobre Discovery Engine)
    ) -> str:
        """
        Responde una pregunta simple de forma rápida.
        
        NUEVO: Si se proporciona search_app_id, busca contexto relevante antes de responder (RAG Lite).
        """
        logger.info(f"❓ [SIMPLE_QA] Processing question: {message[:50]}...")
        
        try:
            # === RAG LITE: Búsqueda de contexto (Discovery Engine o Vertex RAG) ===
            rag_context = ""
            if search_app_id or rag_corpus_id:
                try:
                    from app.services.chat.reglamento_search_service import reglamento_search_service

                    search_results = await reglamento_search_service.search_general_info(
                        query=message,
                        company_search_app_id=search_app_id or "",
                        rag_corpus_id=rag_corpus_id
                    )
                    
                    # Formatear resultados para el prompt
                    if search_results.get("reglamento_results") or search_results.get("ley_karin_results"):
                        rag_context = reglamento_search_service.format_results_for_prompt(
                            reglamento_results=search_results.get("reglamento_results", []),
                            ley_karin_results=search_results.get("ley_karin_results", []),
                            max_tokens=1500  # Límite más bajo para SIMPLE_QA (respuestas rápidas)
                        )
                        logger.info(f"📚 [SIMPLE_QA] RAG context loaded: {len(rag_context)} chars")
                    else:
                        logger.info(f"📚 [SIMPLE_QA] No RAG results found for query")
                except Exception as rag_error:
                    logger.warning(f"⚠️ [SIMPLE_QA] RAG search failed: {rag_error}")
                    # Continuar sin contexto RAG
            
            # 1. Construir prompt del sistema (con contexto RAG y RIOHS si existen)
            system_prompt = self._build_system_prompt(school_name, user_context, rag_context, riohs_summary)
            
            # 2. Preparar mensajes (historial reciente + pregunta actual)
            messages = [SystemMessage(content=system_prompt)]
            
            # Incluir últimos 10 intercambios para contexto completo
            if history and len(history) > 0:
                recent_history = history[-20:]  # Últimos 10 intercambios (20 mensajes)
                messages.extend(recent_history)
            
            messages.append(HumanMessage(content=message))
            
            # 3. Obtener respuesta del LLM
            response = await self.llm.ainvoke(messages)
            
            answer = response.content if hasattr(response, 'content') else str(response)
            
            logger.info(f"✅ [SIMPLE_QA] Answer generated ({len(answer)} chars)")
            
            return answer
            
        except Exception as e:
            logger.error(f"❌ [SIMPLE_QA] Error answering question: {e}")
            return ("Lo siento, tuve un problema al procesar tu pregunta. "
                   "¿Podrías reformularla o ser más específico?")
    
    def _build_system_prompt(self, school_name: str, user_context: Optional[dict], rag_context: str = "", riohs_summary: Optional[str] = None) -> str:
        """
        Construye el prompt del sistema para Simple QA.
        
        Args:
            school_name: Nombre de la empresa (variable mantiene nombre por compatibilidad)
            user_context: Diccionario con información del usuario
            rag_context: Contexto RAG formateado (opcional)
        """
        base_prompt = f"""Eres LÍA, tu asistente de prevención y convivencia laboral para {school_name}.
Estás aquí para responder preguntas y ayudar de forma práctica y cercana.
Hablas con el Encargado de Prevención / RRHH - trátalo como un colega de confianza.

TU ESTILO:
- Responde de forma clara, directa y al grano
- Usa lenguaje natural y cercano, no corporativo excesivo
- Evita frases como "cabe destacar", "es importante mencionar", "procedemos a"
- Sé eficiente pero no frío - un toque de calidez está bien

SALUDOS:
- Si es el PRIMER mensaje, saluda brevemente ("¡Hola!" o "Buenas!" está bien)
- Si ya hay conversación, NO repitas el saludo - ve directo al punto
- Tono: como un colega que te cae bien, no como un bot

PAUTAS DE RESPUESTA:
1. **Brevedad:** Respuestas de 2-4 párrafos máximo
2. **Claridad:** Lenguaje simple y directo
3. **Estructura:** Usa listas o viñetas cuando sea apropiado
4. **Precisión:** Si no sabes algo, dilo honestamente

TEMAS QUE PUEDES RESPONDER:
- Ley Karin (21.643) y sus implicancias
- Prevención del Acoso Laboral, Sexual y Violencia (M3: Maltrato, Acoso, Violencia)
- Protocolos de denuncia e investigación
- Gestión de conflictos laborales y clima organizacional
- Derechos fundamentales de los trabajadores
- Procedimientos internos de la empresa (medidas de resguardo, plazos, investigación)

USO DE DOCUMENTOS:
- Si tienes REGLAMENTO INTERNO o contexto de documentos en este prompt, ÚSALOS DIRECTAMENTE para responder.
- NUNCA pidas al usuario que te diga qué dice su RIOHS o protocolo interno — tú ya tienes esa información.
- Si el documento tiene la respuesta, cítalo: "Según el Reglamento Interno de {school_name}..."
- Si genuinamente no tienes el dato (no está en ningún documento de este prompt), dilo con honestidad.

NO PUEDES:
- Analizar documentos adjuntos que el usuario sube (para eso hay otro servicio)
- Enviar correos o agendar eventos (para eso hay herramientas)

Si la pregunta requiere adjuntar archivos o usar herramientas (correo/calendario), indica la funcionalidad correcta."""

        # Agregar contexto del usuario si existe
        if user_context:
            user_info = f"""

INFORMACIÓN DEL USUARIO:
- Nombre: {user_context.get('nombre', 'No especificado')}
- Rol: {user_context.get('rol', 'No especificado')}

Puedes personalizar tu respuesta según el rol del usuario."""
            base_prompt += user_info
        
        # Agregar resumen RIOHS de la empresa si existe
        if riohs_summary:
            riohs_section = f"""

REGLAMENTO INTERNO DE LA EMPRESA ({school_name}):
{riohs_summary}

Cuando respondas preguntas sobre procedimientos, normas o políticas internas, prioriza la información del REGLAMENTO INTERNO de esta empresa sobre el conocimiento general."""
            base_prompt += riohs_section

        # Agregar contexto RAG si existe
        if rag_context:
            rag_section = f"""

═════════════════════════════════════════════════════════════════
DOCUMENTOS DE REFERENCIA (RIOHS, LEY KARIN Y NORMATIVA)
═════════════════════════════════════════════════════════════════

{rag_context}

INSTRUCCIÓN CRÍTICA: Responde DIRECTAMENTE usando la información de estos documentos.
No pidas al usuario que consulte su RIOHS — ya lo tienes aquí. Cita la fuente cuando corresponda."""
            base_prompt += rag_section

        return base_prompt


# Singleton instance
simple_qa_service = SimpleQAService()
