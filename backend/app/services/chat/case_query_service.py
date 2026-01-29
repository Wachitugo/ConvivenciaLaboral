"""
Case Query Service

Servicio especializado en responder preguntas sobre casos activos de forma rápida.
Usa información estructurada del caso desde Firestore sin necesidad de ReAct loops.

Casos de uso:
- "¿De qué trata el caso?"
- "¿Quiénes están involucrados?"
- "¿Qué archivos tiene el caso?"
- "¿Cuál es el estado del caso?"
"""

import logging
from typing import Optional, Dict
from langchain_google_vertexai import ChatVertexAI
from langchain_core.messages import HumanMessage, SystemMessage
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class CaseQueryService:
    """
    Servicio para responder preguntas sobre casos activos de forma rápida.
    
    Características:
    - Carga datos del caso desde Firestore
    - Usa modelo Flash para respuestas rápidas
    - Respuestas directas basadas en datos estructurados
    - No requiere herramientas ni ReAct
    """
    
    def __init__(self):
        self._llm = None
        self.model_location = settings.VERTEX_LOCATION or "us-central1"
    
    @property
    def llm(self):
        """LLM Flash para respuestas rápidas"""
        if self._llm is None:
            model_name = settings.VERTEX_MODEL_FLASH or "gemini-2.5-flash-lite"
            logger.info(f"🤖 [CASE_QUERY] Initializing Flash LLM: {model_name}")
            
            self._llm = ChatVertexAI(
                model_name=model_name,
                temperature=0.3,  # Baja - respuestas factuales consistentes
                project=settings.PROJECT_ID,
                location=self.model_location
            )
        return self._llm
    
    async def answer_case_question(
        self,
        message: str,
        case_id: str,
        school_name: str
    ) -> str:
        """
        Responde una pregunta sobre el caso activo.
        
        Args:
            message: Pregunta del usuario sobre el caso
            case_id: ID del caso activo
            school_name: Nombre del colegio
            
        Returns:
            Respuesta directa basada en datos del caso
        """
        logger.info(f"🔍 [CASE_QUERY] Processing question about case {case_id}")
        
        try:
            # 1. Cargar datos del caso desde Firestore
            case_data = await self._load_case_data(case_id)
            
            if not case_data:
                return ("No pude encontrar información sobre este caso. "
                       "Por favor verifica que el caso esté activo y correctamente configurado.")
            
            # 2. Construir prompt con información del caso
            system_prompt = self._build_system_prompt(school_name, case_data)
            
            # 3. Obtener respuesta del LLM
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=message)
            ]
            
            response = await self.llm.ainvoke(messages)
            answer = response.content if hasattr(response, 'content') else str(response)
            
            logger.info(f"✅ [CASE_QUERY] Answer generated ({len(answer)} chars)")
            
            return answer
            
        except Exception as e:
            logger.error(f"❌ [CASE_QUERY] Error answering case question: {e}")
            return ("Lo siento, tuve un problema al consultar la información del caso. "
                   "¿Podrías ser más específico sobre qué información necesitas?")
    
    async def _load_case_data(self, case_id: str) -> Optional[Dict]:
        """
        Carga datos del caso desde Firestore.
        
        Args:
            case_id: ID del caso
            
        Returns:
            Diccionario con datos del caso o None si no existe
        """
        try:
            from app.services.case_service import case_service
            
            case = case_service.get_case_by_id(case_id)
            
            if not case:
                logger.warning(f"⚠️ [CASE_QUERY] Case {case_id} not found")
                return None
            
            # Extraer información relevante
            case_data = {
                "id": case_id,
                "titulo": case.title,
                "descripcion": case.description or "Sin descripción",
                "estado": getattr(case, 'status', 'No especificado'),
                "involucrados": [p.name for p in case.involved] if case.involved else [],
                "tipo_caso": getattr(case, 'case_type', 'No especificado'),
                "archivos_count": len(case.files) if hasattr(case, 'files') and case.files else 0
            }
            
            # Agregar información de timeline si existe
            if hasattr(case, 'timeline') and case.timeline:
                recent_events = case.timeline[-3:] if len(case.timeline) > 3 else case.timeline
                case_data["ultimos_eventos"] = [
                    {"fecha": e.get("date", ""), "accion": e.get("action", "")} 
                    for e in recent_events
                ]
            
            # Agregar fecha de creación si existe
            if hasattr(case, 'created_at') and case.created_at:
                from datetime import datetime
                created_date = case.created_at
                if isinstance(created_date, str):
                    case_data["fecha_creacion"] = created_date
                else:
                    case_data["fecha_creacion"] = created_date.strftime("%Y-%m-%d")
            
            logger.info(f"✅ [CASE_QUERY] Loaded case data: {case_data.get('titulo', '')}")
            return case_data
            
        except Exception as e:
            logger.error(f"❌ [CASE_QUERY] Error loading case data: {e}")
            return None
    
    def _build_system_prompt(self, school_name: str, case_data: Dict) -> str:
        """
        Construye el prompt del sistema con información del caso.
        
        Args:
            school_name: Nombre del colegio
            case_data: Datos del caso
            
        Returns:
            Prompt del sistema con contexto del caso
        """
        # Construir información de involucrados
        involucrados_str = ", ".join(case_data.get('involucrados', [])) or "No especificados"
        
        # Construir información de eventos recientes
        eventos_str = ""
        if case_data.get('ultimos_eventos'):
            eventos_list = [f"- {e['fecha']}: {e['accion']}" for e in case_data['ultimos_eventos']]
            eventos_str = f"\n\nÚltimos eventos registrados:\n" + "\n".join(eventos_list)
        
        prompt = f"""NO ERES GEMINI, eres CONI, un asistente de IA especializado en Prevención y Cumplimiento Normativo (Ley Karin) para la empresa {school_name}.
Tu rol es apoyar en la gestión de denuncias, investigación y análisis de situaciones laborales según Ley 21.643, basándote en la normativa vigente y los reglamentos internos.
Asume que el usuario con el que interactúas es el Encargado de Prevención de la empresa.

Estás respondiendo preguntas sobre un CASO ACTIVO con la siguiente información:

INFORMACIÓN DEL CASO:
- ID: {case_data.get('id', 'No disponible')}
- Título: {case_data.get('titulo', 'Sin título')}
- Descripción: {case_data.get('descripcion', 'Sin descripción')}
- Estado: {case_data.get('estado', 'No especificado')}
- Tipo de caso: {case_data.get('tipo_caso', 'No especificado')}
- Involucrados: {involucrados_str}
- Archivos adjuntos: {case_data.get('archivos_count', 0)}
- Fecha de creación: {case_data.get('fecha_creacion', 'No disponible')}{eventos_str}

TU TAREA:
- Responder preguntas sobre ESTE caso específico usando la información proporcionada
- Ser claro, conciso y factual
- Si te preguntan algo que NO está en la información proporcionada, indícalo honestamente

PAUTAS:
1. Usa la información del caso para responder de forma directa
2. Si una pregunta no puede responderse con los datos disponibles, dilo claramente
3. Mantén respuestas de 2-3 párrafos máximo
4. Usa listas cuando sea apropiado para claridad

NO INVENTES información que no esté en los datos del caso."""

        return prompt


# Singleton instance
case_query_service = CaseQueryService()
