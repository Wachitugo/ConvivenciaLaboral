from fastapi import Depends, HTTPException, Header
import logging
from typing import Optional
from app.services.users.auth_service import auth_service
from app.schemas.user import Usuario, RoleName


logger = logging.getLogger(__name__)
async def get_current_user(authorization: Optional[str] = Header(None)) -> Usuario:
    """
    Dependencia para obtener el usuario actual autenticado.

    Uso en endpoints:
    @router.get("/protected")
    async def protected_route(current_user: Usuario = Depends(get_current_user)):
        return {"user": current_user.nombre}
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Token de autenticación no proporcionado"
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Formato de token inválido. Use: Bearer <token>"
        )

    id_token = authorization.replace("Bearer ", "")

    try:
        token_data = await auth_service.verify_token(id_token)
        user_data = token_data["user_data"]
        return Usuario(**user_data)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        logger.error(f"Error en autenticación: {e}")
        raise HTTPException(
            status_code=401,
            detail="Token inválido o expirado"
        )


class RoleChecker:
    """
    Clase para verificar roles de usuario.

    Uso en endpoints:
    @router.get("/admin-only")
    async def admin_route(
        current_user: Usuario = Depends(get_current_user),
        _: bool = Depends(RoleChecker([RoleName.ADMIN]))
    ):
        return {"mensaje": "Solo admins pueden ver esto"}
    """
    def __init__(self, allowed_roles: list[RoleName]):
        self.allowed_roles = allowed_roles

    async def __call__(self, current_user: Usuario = Depends(get_current_user)) -> bool:
        if current_user.rol not in [role.value for role in self.allowed_roles]:
            raise HTTPException(
                status_code=403,
                detail=f"Acceso denegado. Se requiere uno de estos roles: {[r.value for r in self.allowed_roles]}"
            )
        return True


# Dependencias pre-configuradas para roles específicos
async def require_admin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    """Requiere rol de Admin"""
    if current_user.rol != RoleName.ADMIN.value:
        raise HTTPException(
            status_code=403,
            detail="Acceso denegado. Se requiere rol de Admin."
        )
    return current_user


async def require_director(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    """Requiere rol de Director o superior"""
    if current_user.rol not in [RoleName.ADMIN.value, RoleName.DIRECTOR.value]:
        raise HTTPException(
            status_code=403,
            detail="Acceso denegado. Se requiere rol de Director o Admin."
        )
    return current_user


async def require_active_user(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    """Verifica que el usuario esté activo"""
    if not current_user.activo:
        raise HTTPException(
            status_code=403,
            detail="Usuario desactivado. Contacte al administrador."
        )
    return current_user
