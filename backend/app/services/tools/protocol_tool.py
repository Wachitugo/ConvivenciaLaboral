from typing import List, Optional
from langchain_core.tools import tool
from pydantic import BaseModel, Field

class ProtocolStep(BaseModel):
    id: int = Field(..., description="Número del paso")
    title: str = Field(..., description="Título del paso")
    description: str = Field(..., description="Descripción detallada del paso")
    estimated_time: Optional[str] = Field(None, description="Tiempo estimado para completar el paso (ej: '24 horas', 'inmediato', '3 días')")

@tool
def render_protocol(
    protocol_name: str = Field(..., description="Nombre exacto del protocolo"),
    steps: List[ProtocolStep] = Field(..., description="Lista de pasos del protocolo"),
    current_step: int = Field(1, description="Número del paso actual"),
    next_step_instruction: str = Field(..., description="Instrucción para el usuario sobre cómo proceder"),
    source_document: str = Field(..., description="Nombre del documento oficial del cual se extrajo este protocolo")
) -> str:
    """
    Muestra un protocolo interactivo al usuario.
    Utiliza esta herramienta cuando identifiques que se debe aplicar un protocolo específico.
    Proporciona todos los pasos y detalles necesarios.
    """
    return f"Protocolo '{protocol_name}' generado con {len(steps)} pasos. Visualización activada."
