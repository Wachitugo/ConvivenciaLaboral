"""
Ambiguity Handler

Servicio especializado en manejar situaciones ambiguas donde el IntentRouter
tiene baja confianza. En lugar de adivinar, pide aclaraciones al usuario.

Casos de uso:
- Confianza < 0.6 en clasificación de intent
- Preguntas vagas o poco claras
- Múltiples interpretaciones posibles
"""

import logging
from typing import Dict, List
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class AmbiguityHandler:
    """
    Maneja situaciones ambiguas pidiendo aclaraciones al usuario.
    
    Características:
    - Detecta intents con baja confianza
    - Genera preguntas de aclaración
    - Ofrece opciones específicas al usuario
    - Mejora la experiencia evitando respuestas incorrectas
    """
    
    # Umbral de confianza para considerar ambigüedad
    CONFIDENCE_THRESHOLD = 0.5  # Stricter - CASE_CREATION has ~0.75
    
    def should_handle(self, intent_result: Dict) -> bool:
        """
        Determina si una clasificación de intent necesita aclaración.
        
        Args:
            intent_result: Resultado del IntentRouter con intent, confidence, reasoning
            
        Returns:
            True si la confianza es baja y requiere aclaración
        """
        confidence = intent_result.get('confidence', 0.0)
        
        should_clarify = confidence < self.CONFIDENCE_THRESHOLD
        
        if should_clarify:
            logger.info(f"🤔 [AMBIGUITY] Low confidence ({confidence:.2f}) - asking for clarification")
        
        return should_clarify
    
    def generate_clarification(
        self,
        message: str,
        intent_result: Dict,
        has_files: bool = False,
        case_id: str = None
    ) -> str:
        """
        Genera mensaje de aclaración con opciones específicas.
        
        Args:
            message: Mensaje original del usuario
            intent_result: Resultado del IntentRouter
            has_files: Si hay archivos adjuntos
            case_id: ID del caso activo si existe
            
        Returns:
            Mensaje de aclaración con opciones
        """
        logger.info(f"💬 [AMBIGUITY] Generating clarification for: {message[:50]}...")
        
        # Mensaje base de aclaración
        clarification = "No estoy completamente seguro de cómo puedo ayudarte mejor. "
        
        # Generar opciones basadas en contexto
        options = self._generate_options(message, has_files, case_id, intent_result)
        
        if options:
            clarification += "¿Podrías especificar qué necesitas?\n\n"
            for i, option in enumerate(options, 1):
                clarification += f"{i}. {option}\n"
        else:
            # Fallback genérico
            clarification += "¿Podrías reformular tu pregunta de forma más específica?"
        
        return clarification
    
    def _generate_options(
        self,
        message: str,
        has_files: bool,
        case_id: str,
        intent_result: Dict
    ) -> List[str]:
        """
        Genera opciones contextuales para el usuario.
        
        Args:
            message: Mensaje del usuario
            has_files: Si hay archivos
            case_id: ID del caso
            intent_result: Resultado del intent clasificado
            
        Returns:
            Lista de opciones para el usuario
        """
        options = []
        message_lower = message.lower()
        
        # Opción 1: Si hay archivos, ofrecer análisis
        if has_files:
            options.append("Analizar los documentos adjuntos")
        
        # Opción 2: Si hay caso activo, ofrecer consulta de caso
        if case_id:
            options.append("Consultar información sobre el caso activo")
        
        # Opción 3: Si menciona protocolo/normativa, ofrecer QA
        protocol_keywords = ["protocolo", "rice", "normativa", "reglamento", "ley", "procedimiento"]
        if any(kw in message_lower for kw in protocol_keywords):
            options.append("Obtener información general sobre protocolos o normativas")
        
        # Opción 4: Si menciona email/correo, ofrecer redacción
        email_keywords = ["correo", "email", "enviar", "redactar", "escribir", "escribe", "notificación", "notificar"]
        if any(kw in message_lower for kw in email_keywords):
            options.append("Redactar un correo electrónico")
        
        # Opción 5: Si menciona calendario/agenda, ofrecer evento
        calendar_keywords = ["calendario", "agenda", "cita", "reunión", "evento"]
        if any(kw in message_lower for kw in calendar_keywords):
            options.append("Agendar un evento en el calendario")
        
        # Si no hay opciones específicas, ofrecer opciones genéricas
        if not options:
            options = [
                "Hacer una pregunta general sobre convivencia escolar",
                "Analizar documentos o buscar información en archivos",
                "Redactar un correo o agendar un evento"
            ]
        
        # Limitar a máximo 4 opciones para no abrumar
        return options[:4]


# Singleton instance
ambiguity_handler = AmbiguityHandler()
