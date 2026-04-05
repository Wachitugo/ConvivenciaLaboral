from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class SugerenciaBase(BaseModel):
    contenido: str


class SugerenciaCreate(SugerenciaBase):
    user_id: str
    autor_nombre: str
    colegio_id: str
    colegio_nombre: str


class SugerenciaUpdate(BaseModel):
    estado: Optional[str] = None
    contenido: Optional[str] = None


class SugerenciaVote(BaseModel):
    user_id: str


class Sugerencia(SugerenciaBase):
    id: str
    user_id: str
    autor_nombre: str
    colegio_id: str
    colegio_nombre: str
    estado: str = "pendiente"
    votos: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True
