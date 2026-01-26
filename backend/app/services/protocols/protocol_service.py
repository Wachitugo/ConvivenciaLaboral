from typing import List, Dict, Optional, Any
from pydantic import BaseModel
from enum import Enum

class StepStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"

class ProtocolStep(BaseModel):
    id: int
    title: str
    description: str
    status: StepStatus = StepStatus.PENDING
    completed_at: Optional[str] = None
    notes: Optional[str] = None
    evidence_files: List[str] = []
    is_mandatory: bool = True
    estimated_time: Optional[str] = None
    responsible_roles: List[str] = []  # Ej: ["Director", "Psicólogo", "Inspector"]

class ProtocolTemplate(BaseModel):
    name: str
    description: str
    category: str  # "maltrato", "bullying", "conflicto", "disciplinario", etc.
    applicable_keywords: List[str]  # Palabras clave que activan este protocolo
    steps: List[ProtocolStep]
    severity_levels: List[str] = ["leve", "grave", "gravísima"]  # Niveles aplicables

class ProtocolCase(BaseModel):
    case_id: str
    protocol_name: str
    protocol_category: str
    current_step: int = 1
    steps: List[ProtocolStep] = []
    is_completed: bool = False
    custom_notes: Optional[str] = None
    severity_level: Optional[str] = None
    
class ProtocolManager:
    def __init__(self):
        self.protocol_templates = [] # No hardcoded templates
    
    def list_school_protocols(self, bucket_name: str) -> List[str]:
        """
        Lista los documentos de protocolos disponibles en el bucket del colegio
        """
        try:
            from app.services.storage_service import storage_service
            docs = storage_service.list_school_documents(bucket_name)
            # Retornar solo nombres de archivo
            return [d['filename'] for d in docs]
        except Exception:
            return []

    def get_all_templates(self) -> List[ProtocolTemplate]:
        """
        Retorna lista vacía ya que ahora los protocolos son dinámicos por colegio
        """
        return []
    
    def get_template_by_category(self, category: str) -> Optional[ProtocolTemplate]:
        return None

    def create_protocol_case(self, case_id: str, case_description: str, case_type: str = None, case_context: dict = None) -> ProtocolCase:
        """
        DEPRECATED: Ahora se usa ProtocolAgent para generar protocolos dinámicos
        """
        return ProtocolCase(
            case_id=case_id,
            protocol_name="Protocolo Dinámico",
            protocol_category="dynamic",
            steps=[],
            current_step=1
        )
    
    def suggest_multiple_protocols(self, case_description: str, case_type: str = None, limit: int = 3) -> List[tuple]:
        """
        DEPRECATED: Retorna lista vacía.
        """
        return []
    
    def get_next_step(self, protocol_case: ProtocolCase) -> Optional[ProtocolStep]:
        """
        Obtiene el siguiente paso a realizar en el protocolo.
        """
        for step in protocol_case.steps:
            if step.status == StepStatus.PENDING:
                return step
        return None
    
    def complete_step(self, protocol_case: ProtocolCase, step_id: int, notes: str = None, evidence_files: List[str] = None) -> ProtocolCase:
        """
        Marca un paso como completado y actualiza el protocolo.
        """
        from datetime import datetime
        
        for step in protocol_case.steps:
            if step.id == step_id:
                step.status = StepStatus.COMPLETED
                step.completed_at = datetime.utcnow().isoformat()
                step.notes = notes
                if evidence_files:
                    step.evidence_files.extend(evidence_files)
                break
        
        # Actualizar paso actual
        next_step = self.get_next_step(protocol_case)
        if next_step:
            protocol_case.current_step = next_step.id
        else:
            protocol_case.is_completed = True
        
        return protocol_case

protocol_manager = ProtocolManager()