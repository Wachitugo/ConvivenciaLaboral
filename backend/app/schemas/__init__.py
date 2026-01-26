# schemas/__init__.py
from .user import (
    RoleName,
    Colegio, ColegioCreate, ColegioUpdate,
    Usuario, UsuarioCreate, UsuarioUpdate, UsuarioWithColegios,
    LoginRequest, LoginResponse, RegisterRequest, RegisterResponse,
    AsociarColegioRequest, DesasociarColegioRequest
)
from .case import Case, CaseCreate, InvolvedPerson
from .protocol import (
    ProtocolStep, ProtocolTemplate, ProtocolCase,
    StepStatus, ExtractedProtocol
)
