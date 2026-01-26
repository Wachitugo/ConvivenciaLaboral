from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class BitacoraEntryType(str, Enum):
    TEXT = "text"
    AUDIO = "audio"

class TranscriptionStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    ERROR = "error"

class BitacoraEntryBase(BaseModel):
    type: BitacoraEntryType
    content: Optional[str] = None  # Para notas de texto

class BitacoraEntryCreate(BitacoraEntryBase):
    pass

class BitacoraEntry(BitacoraEntryBase):
    id: str
    student_id: str
    school_id: str
    author_id: str
    author_name: str

    # Audio fields
    audio_uri: Optional[str] = None
    audio_url: Optional[str] = None  # URL pública
    audio_size: Optional[int] = None
    duration: Optional[int] = None  # Duración en segundos

    # Transcripción
    transcription: Optional[str] = None
    transcription_status: Optional[TranscriptionStatus] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BitacoraEntryList(BaseModel):
    entries: List[BitacoraEntry]
    total: int
