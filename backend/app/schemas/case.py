from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class InvolvedPerson(BaseModel):
    name: str
    role: Optional[str] = None # Estudiante, Apoderado, Docente, etc.

# ============ PERMISOS ============

class PermissionType(str, Enum):
    """Tipos de permisos para casos compartidos"""
    VIEW = "view"  # Solo lectura
    EDIT = "edit"  # Puede editar pero no compartir

class CasePermissionBase(BaseModel):
    user_id: str
    permission_type: PermissionType

class CasePermissionCreate(CasePermissionBase):
    """Schema para crear un permiso"""
    pass

class CasePermission(CasePermissionBase):
    """Permiso completo con metadata"""
    id: str
    case_id: str
    granted_by: str  # owner_id que otorgó el permiso
    user_name: Optional[str] = None  # Para mostrar en UI
    created_at: datetime

    class Config:
        from_attributes = True

class ShareCaseRequest(BaseModel):
    """Request para compartir un caso con usuarios"""
    user_ids: List[str] = Field(..., description="Lista de IDs de usuarios con quienes compartir")
    permission_type: PermissionType = Field(..., description="Tipo de permiso a otorgar")

class RevokeCasePermissionRequest(BaseModel):
    """Request para revocar permiso de un usuario"""
    user_id: str = Field(..., description="ID del usuario a quien revocar el permiso")

# ============ CASOS ============

class CaseBase(BaseModel):
    title: str
    description: str
    case_type: str = Field(..., description="Tipo de caso: Bullying, Conflicto, etc.")
    status: str = "active"
    involved: List[InvolvedPerson] = []
    protocol: Optional[str] = None
    owner_id: str = Field(..., description="Usuario propietario del caso")
    colegio_id: str = Field(..., description="Colegio al que pertenece el caso")
    student_id: Optional[str] = Field(None, description="Estudiante asociado al caso")
    related_sessions: List[str] = []

class CaseCreate(CaseBase):
    """Schema para crear un caso"""
    pass

class CaseUpdate(BaseModel):
    """Schema para actualizar campos de un caso"""
    title: Optional[str] = None
    status: Optional[str] = None  # pendiente, abierto, resuelto, no_resuelto
    description: Optional[str] = None
    case_type: Optional[str] = None  # Tipo de caso (editable)
    protocol: Optional[str] = None  # Protocolo adecuado (editable)
    involved: Optional[List[InvolvedPerson]] = None
    student_id: Optional[str] = None
    pasosProtocolo: Optional[List[dict]] = None # Para protocolos manuales/predefinidos

class Case(BaseModel):
    # Campos heredados de CaseBase
    title: str
    description: str
    case_type: str = Field(..., description="Tipo de caso: Bullying, Conflicto, etc.")
    status: str = "active"
    involved: List[InvolvedPerson] = []
    protocol: Optional[str] = None
    student_id: Optional[str] = None
    related_sessions: List[str] = []

    # Campos opcionales para compatibilidad con casos antiguos
    owner_id: Optional[str] = Field(None, description="Usuario propietario del caso")
    colegio_id: Optional[str] = Field(None, description="Colegio al que pertenece el caso")

    # Campos propios de Case
    id: str
    created_at: datetime
    updated_at: datetime
    is_active: bool = True
    is_shared: bool = False
    owner_name: Optional[str] = None  # Para mostrar en UI
    counter_case: Optional[str] = None # Case ID legible por humano (C-001)
    pasosProtocolo: Optional[List[dict]] = None # Pasos de protocolo persistidos
    ai_summary: Optional[dict] = None # Resumen inteligente persistido

    class Config:
        from_attributes = True

class CaseWithPermissions(Case):
    """Caso con información de permisos compartidos"""
    permissions: List[CasePermission] = []
    user_permission: Optional[PermissionType] = None  # Permiso del usuario actual
    chatHistory: Optional[List[dict]] = None # Historial de chats asociados
