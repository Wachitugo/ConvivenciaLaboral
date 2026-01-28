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
        user_context: Optional[dict] = None
    ) -> str:
        """
        Responde una pregunta simple de forma rápida.
        """
        logger.info(f"❓ [SIMPLE_QA] Processing question: {message[:50]}...")
        
        try:
            # 1. Construir prompt del sistema
            system_prompt = self._build_system_prompt(school_name, user_context)
            
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
    
    def _build_system_prompt(self, school_name: str, user_context: Optional[dict]) -> str:
        """
        Construye el prompt del sistema para Simple QA.
        """
        base_prompt = f"""Eres CONI, tu asistente de prevención y convivencia laboral para {school_name}.
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
- Protocolos de denuncia e investigación (generalidades)
- Gestión de conflictos laborales y clima organizacional
- Derechos fundamentales de los trabajadores

NO PUEDES:
- Analizar documentos adjuntos (para eso hay otro servicio)
- Enviar correos o agendar eventos (para eso hay herramientas)
- Dar dictámenes legales definitivos (siempre sugiere revisar el Reglamento Interno)

Si la pregunta requiere análisis de documentos, herramientas, o información de un caso específico,
indica que necesitas más información o que hay otra funcionalidad para eso."""

        # Agregar contexto del usuario si existe
        if user_context:
            user_info = f"""

INFORMACIÓN DEL USUARIO:
- Nombre: {user_context.get('nombre', 'No especificado')}
- Rol: {user_context.get('rol', 'No especificado')}

Puedes personalizar tu respuesta según el rol del usuario."""
            base_prompt += user_info
        
        return base_prompt


# Singleton instance
simple_qa_service = SimpleQAService()
