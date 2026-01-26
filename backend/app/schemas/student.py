from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class StudentBase(BaseModel):
    rut: str
    nombres: str
    apellidos: str
    email: Optional[EmailStr] = None
    curso: Optional[str] = None
    genero: Optional[str] = None
    fecha_nacimiento: Optional[str] = None # Format DD/MM/YYYY
    tea: bool = False
    pie: bool = False
    paec: bool = False
    programa_integracion: Optional[bool] = False # Legacy/Alias support
    diagnostico: Optional[str] = None
    prioritario: Optional[bool] = False
    apoderado_nombre: Optional[str] = None
    apoderado_email: Optional[EmailStr] = None
    apoderado_telefono: Optional[str] = None
    
    # Salud y Emergencias
    grupo_sanguineo: Optional[str] = None
    prevision: Optional[str] = None
    alergias: List[str] = []
    condiciones_medicas: List[str] = []
    alergias_medicamentos: List[str] = []
    contactos_emergencia: List[dict] = [] # List of {nombre, parentesco, telefono, prioridad}
    paec_info: Optional[Dict[str, Any]] = None # Detailed PAEC profile data
    
    colegio_id: str

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    email: Optional[EmailStr] = None
    curso: Optional[str] = None
    genero: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    tea: Optional[bool] = None
    pie: Optional[bool] = None
    paec: Optional[bool] = None
    diagnostico: Optional[str] = None
    prioritario: Optional[bool] = None
    
    apoderado_nombre: Optional[str] = None
    apoderado_email: Optional[EmailStr] = None
    apoderado_telefono: Optional[str] = None

    # Salud y Emergencias
    grupo_sanguineo: Optional[str] = None
    prevision: Optional[str] = None
    alergias: Optional[List[str]] = None
    condiciones_medicas: Optional[List[str]] = None
    alergias_medicamentos: Optional[List[str]] = None
    contactos_emergencia: Optional[List[dict]] = None
    paec_info: Optional[Dict[str, Any]] = None

class Student(StudentBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
