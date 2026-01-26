from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class InterviewStatus(str, Enum):
    BORRADOR = "Borrador"
    FINALIZADA = "Finalizada"
    AUTORIZADA = "Autorizada"

class Attachment(BaseModel):
    id: str
    name: str
    url: str
    content_type: str
    size: Optional[int] = 0
    created_at: datetime
    transcription: Optional[str] = None
    transcription_status: Optional[str] = None  # pending, completed, error

class Signature(BaseModel):
    id: str
    type: str  # student, guardian, interviewer
    url: str
    created_at: datetime
    signer_name: Optional[str] = None
    path: Optional[str] = None  # ruta en el bucket para facilitar borrado

class InterviewBase(BaseModel):
    student_name: str
    course: str
    status: InterviewStatus = InterviewStatus.BORRADOR
    school_id: str
    case_id: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    interviewer_name: Optional[str] = None
    gender: Optional[str] = None
    student_id: Optional[str] = None

class InterviewCreate(InterviewBase):
    pass

class InterviewUpdate(BaseModel):
    student_name: Optional[str] = None
    course: Optional[str] = None
    status: Optional[InterviewStatus] = None
    case_id: Optional[str] = None
    description: Optional[str] = None
    transcription: Optional[str] = None
    summary: Optional[str] = None
    notes: Optional[str] = None
    interviewer_name: Optional[str] = None
    gender: Optional[str] = None
    student_id: Optional[str] = None

class Interview(InterviewBase):
    id: str
    created_at: datetime
    updated_at: datetime
    audio_uri: Optional[str] = None
    audio_size: Optional[int] = 0
    transcription: Optional[str] = None
    summary: Optional[str] = None
    notes: Optional[str] = None
    signatures: List[Signature] = []
    attachments: List[Attachment] = []
    owner_id: Optional[str] = None  # Opcional para compatibilidad con entrevistas antiguas

    class Config:
        from_attributes = True
