from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class RoleName(str, Enum):
    """Roles fijos del sistema"""
    ENCARGADO_CONVIVENCIA = "Encargado de Convivencia"
    ESTUDIANTE = "Estudiante"
    TRABAJADOR = "Trabajador"
    APODERADO = "Apoderado"
    DIRECTIVO = "Directivo"

# ============ COLEGIO ============

class ColegioBase(BaseModel):
    nombre: str
    slug: Optional[str] = None
    direccion: Optional[str] = None
    logo_url: Optional[str] = None
    data_store_id: Optional[str] = None  # ID del Data Store de Discovery Engine
    search_app_id: Optional[str] = None  # ID de la Search App/Engine para RAG
    search_app_id: Optional[str] = None  # ID de la Search App/Engine para RAG
    token_limit: Optional[int] = None # Deprecated
    input_token_limit: Optional[int] = None
    output_token_limit: Optional[int] = None
    warning_thresholds: List[int] = Field(default_factory=list, description="Lista de porcentajes para advertencias (ej: [80, 90])")

class ColegioCreate(ColegioBase):
    pass

class ColegioUpdate(BaseModel):
    nombre: Optional[str] = None
    slug: Optional[str] = None
    direccion: Optional[str] = None
    logo_url: Optional[str] = None
    data_store_id: Optional[str] = None
    search_app_id: Optional[str] = None
    search_app_id: Optional[str] = None
    token_limit: Optional[int] = None # Deprecated
    input_token_limit: Optional[int] = None
    output_token_limit: Optional[int] = None
    warning_thresholds: Optional[List[int]] = None

class Colegio(ColegioBase):
    id: str
    bucket_name: Optional[str] = None  # Nombre del bucket de GCS para este colegio
    data_store_id: Optional[str] = None # Explicitly ensuring it's here too for read model consistency if needed, though Base has it.
    created_at: datetime
    updated_at: datetime
    token_usage: Optional['TokenUsage'] = None # Forward ref because TokenUsage is defined below
    
    # Wait, TokenUsage is defined at line 67. Colegio is at line 33.
    # I need to move TokenUsage before Colegio or use a string forward ref.
    # Given the constraints of replace_file_content, I'll stick to string forward ref.

    class Config:
        from_attributes = True

# ============ USUARIO ============

class UsuarioBase(BaseModel):
    nombre: str
    correo: EmailStr
    rol: str  # Cambiado de RoleName a str para permitir roles antiguos temporalmente
    activo: bool = True
    colegios: List[str] = Field(default_factory=list, description="Lista de IDs de colegios")
    colegios: List[str] = Field(default_factory=list, description="Lista de IDs de colegios")
    token_limit: Optional[int] = None # Deprecated
    input_token_limit: Optional[int] = None
    output_token_limit: Optional[int] = None
    warning_thresholds: List[int] = Field(default_factory=list, description="Lista de porcentajes para advertencias")

class UsuarioCreate(BaseModel):
    """Schema para crear usuario con Firebase Authentication"""
    nombre: str
    correo: EmailStr
    password: str = Field(..., min_length=6, description="Contraseña (mínimo 6 caracteres)")
    rol: RoleName
    activo: bool = True
    colegios: List[str] = Field(default_factory=list)
    colegios: List[str] = Field(default_factory=list)
    token_limit: Optional[int] = None # Deprecated
    input_token_limit: Optional[int] = None
    output_token_limit: Optional[int] = None
    warning_thresholds: List[int] = Field(default_factory=list)

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    rol: Optional[str] = None  # Cambiado de RoleName a str para permitir roles antiguos temporalmente
    activo: Optional[bool] = None
    colegios: Optional[List[str]] = None
    colegios: Optional[List[str]] = None
    token_limit: Optional[int] = None # Deprecated
    input_token_limit: Optional[int] = None
    output_token_limit: Optional[int] = None
    warning_thresholds: Optional[List[int]] = None

class TokenUsage(BaseModel):
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    last_updated: Optional[datetime] = None

class Usuario(UsuarioBase):
    id: str  # UID de Firebase Authentication
    created_at: datetime
    updated_at: datetime
    token_usage: Optional[TokenUsage] = Field(default_factory=TokenUsage)


    class Config:
        from_attributes = True

class UsuarioWithColegios(Usuario):
    """Usuario con información completa de colegios"""
    colegios_info: List[Colegio] = []

# ============ AUTENTICACIÓN ============

class LoginRequest(BaseModel):
    correo: EmailStr
    password: str

class GoogleLoginRequest(BaseModel):
    access_token: str
    email: EmailStr

class LoginResponse(BaseModel):
    token: str  # ID Token de Firebase
    usuario: Usuario
    colegios_info: List[Colegio] = []

class RegisterRequest(UsuarioCreate):
    pass

class RegisterResponse(BaseModel):
    mensaje: str
    usuario: Usuario

# ============ ASOCIAR USUARIO A COLEGIO ============

class AsociarColegioRequest(BaseModel):
    usuario_id: str
    colegio_id: str

class DesasociarColegioRequest(BaseModel):
    usuario_id: str
    colegio_id: str
