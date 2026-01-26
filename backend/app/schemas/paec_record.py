from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class PaecRecordBase(BaseModel):
    description: str
    entry_date: datetime
    type: str # 'observacion', 'entrevista', 'reunion', 'derivacion', 'acuerdo'
    status: Optional[str] = "pendiente" # pendiente, realizado, en_progreso

class PaecRecordCreate(PaecRecordBase):
    student_id: str
    created_by: Optional[str] = None

class PaecRecordUpdate(BaseModel):
    description: Optional[str] = None
    entry_date: Optional[datetime] = None
    type: Optional[str] = None
    status: Optional[str] = None

class PaecRecord(PaecRecordBase):
    id: str
    student_id: str
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
