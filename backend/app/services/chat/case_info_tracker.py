"""
Service to track and save valuable information/documents from chat to cases.
Provides confirmation-based approach for adding case information.
"""

import logging
from typing import Optional, Dict, Any
from langchain_core.tools import tool
from app.services.case_service import case_service

logger = logging.getLogger(__name__)


@tool
async def save_info_to_case(
    case_id: str,
    information: str,
    info_type: str = "general_note"
) -> str:
    """
    Guarda información valiosa mencionada en la conversación al caso activo.
    
    Args:
        case_id: ID del caso
        information: Información a guardar
        info_type: Tipo de información ("person", "event", "document", "general_note")
    
    Returns:
        Mensaje de confirmación
    """
    logger.info(f"📝 [CASE_INFO] Saving info to case {case_id}: {information[:50]}...")
    
    try:
        # For now, we'll add this as a note/comment to the case
        # In the future, this could be expanded to structured data
        
        # Get current case
        case = case_service.get_case_by_id(case_id)
        if not case:
            return f"❌ Error: Caso {case_id} no encontrado."
        
        # Append information to case description or notes field
        # This is a simple implementation - can be enhanced later
        current_description = case.description or ""
        timestamp = f"\n\n**[Información agregada desde chat]**\n{information}"
        
        updated_description = current_description + timestamp
        
        # Update case (simplified - you may want to add a dedicated notes field)
        case_service.update_case(case_id, {"description": updated_description})
        
        logger.info(f"✅ [CASE_INFO] Information saved to case {case_id}")
        return f"✅ Información guardada exitosamente en el caso '{case.title}'"
        
    except Exception as e:
        logger.error(f"❌ [CASE_INFO] Error saving info: {e}")
        return f"❌ Error al guardar información: {str(e)}"


class CaseInfoTracker:
    """
    Service to detect valuable information in chat and prompt for confirmation
    before saving to active case.
    """
    
    def __init__(self):
        pass
    
    def should_suggest_save(self, message: str, has_case: bool) -> bool:
        """
        Quick heuristic to detect if message contains valuable case information.
        
        Args:
            message: User message
            has_case: Whether there's an active case
            
        Returns:
            True if should suggest saving to case
        """
        if not has_case:
            return False
        
        # Keywords that suggest valuable case information
        value_keywords = [
            "email", "correo", "recibí", "envió", "documento",
            "diagnóstico", "tea", "evaluación", "informe",
            "reunión", "conversación", "llamada", "apoderado",
            "testigo", "declaración", "evidencia"
        ]
        
        message_lower = message.lower()
        return any(keyword in message_lower for keyword in value_keywords)
    
    def detect_explicit_save_command(self, message: str) -> bool:
        """
        Detects if user explicitly requests to save information.
        
        Args:
            message: User message
            
        Returns:
            True if explicit save command detected
        """
        save_commands = [
            "añade esto al caso",
            "agrega esto al caso",
            "guarda esto al caso",
            "registra esto",
            "documenta esto"
        ]
        
        message_lower = message.lower()
        return any(cmd in message_lower for cmd in save_commands)


# Singleton instance
case_info_tracker = CaseInfoTracker()
