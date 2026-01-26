from typing import List, Optional
from enum import Enum
from pydantic import BaseModel

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
    deadline: Optional[str] = None
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

class StepUpdateRequest(BaseModel):
    notes: Optional[str] = None
    evidence_files: Optional[List[str]] = None

class ProtocolResponse(BaseModel):
    case_id: str
    protocol_name: str
    current_step: int
    steps: List[ProtocolStep]
    is_completed: bool
    
class StepResponse(BaseModel):
    step: ProtocolStep
    is_current: bool
    can_complete: bool

class ProtocolStepChat(BaseModel):
    """
    Respuesta del chat que incluye información del paso actual del protocolo
    """
    message: str
    has_protocol: bool = False
    protocol_info: Optional[dict] = None

class ExtractedProtocol(BaseModel):
    protocol_name: str
    case_id: Optional[str] = None
    session_id: str
    steps: List[ProtocolStep]
    current_step: int = 1
    extracted_from_response: str
    is_completed: bool = False
    source_document: Optional[str] = None