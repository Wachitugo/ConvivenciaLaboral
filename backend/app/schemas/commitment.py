from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class CommitmentBase(BaseModel):
    description: str
    due_date: str # YYYY-MM-DD
    status: str = "vigente" # vigente, cumplido, incumplido, proximo_a_vencer
    case_id: Optional[str] = None
    case_title: Optional[str] = None # Denormalized for ease of display

class CommitmentCreate(CommitmentBase):
    student_id: str

class CommitmentUpdate(BaseModel):
    description: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[str] = None
    case_id: Optional[str] = None
    case_title: Optional[str] = None

class Commitment(CommitmentBase):
    id: str
    student_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
