from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import logging
from app.services.users.user_service_simple import user_service_simple
from app.services.school_service import school_service
from app.schemas.user import (
    Usuario, UsuarioUpdate, UsuarioWithColegios,
    AsociarColegioRequest, DesasociarColegioRequest,
    RoleName
)

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=List[UsuarioWithColegios])
async def get_all_users(include_inactive: bool = Query(False)):
    """Obtiene todos los usuarios con información de sus colegios"""
    try:
        users = user_service_simple.get_all_users(include_inactive=include_inactive)

        # Para cada usuario, obtener la información de sus colegios
        users_with_colegios = []
        for user in users:
            colegios_info = school_service.get_colegios_by_ids(user.colegios)
            users_with_colegios.append(
                UsuarioWithColegios(
                    **user.model_dump(),
                    colegios_info=colegios_info
                )
            )

        return users_with_colegios
    except Exception as e:
        logger.exception("Error getting users")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/{user_id}", response_model=UsuarioWithColegios)
async def get_user(user_id: str):
    """Obtiene un usuario por ID con información de sus colegios"""
    try:
        user = user_service_simple.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Obtener información de los colegios
        colegios_info = school_service.get_colegios_by_ids(user.colegios)

        return UsuarioWithColegios(
            **user.model_dump(),
            colegios_info=colegios_info
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error getting user")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.patch("/{user_id}", response_model=Usuario)
async def update_user(user_id: str, update_data: UsuarioUpdate):
    """Actualiza un usuario"""
    try:
        updated_user = user_service_simple.update_user(user_id, update_data)
        if not updated_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return updated_user
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error updating user")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.delete("/{user_id}")
async def delete_user(user_id: str):
    """Elimina un usuario"""
    try:
        success = user_service_simple.delete_user(user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return {"mensaje": "Usuario eliminado exitosamente"}
    except Exception as e:
        logger.exception("Error deleting user")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/asociar-colegio")
async def asociar_colegio(request: AsociarColegioRequest):
    """Asocia un usuario a un colegio"""
    try:
        success = user_service_simple.asociar_colegio(
            request.usuario_id,
            request.colegio_id
        )
        if not success:
            raise HTTPException(
                status_code=400,
                detail="No se pudo asociar el colegio al usuario"
            )
        return {"mensaje": "Colegio asociado exitosamente"}
    except Exception as e:
        logger.exception("Error associating school")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/desasociar-colegio")
async def desasociar_colegio(request: DesasociarColegioRequest):
    """Desasocia un usuario de un colegio"""
    try:
        success = user_service_simple.desasociar_colegio(
            request.usuario_id,
            request.colegio_id
        )
        if not success:
            raise HTTPException(
                status_code=400,
                detail="No se pudo desasociar el colegio del usuario"
            )
        return {"mensaje": "Colegio desasociado exitosamente"}
    except Exception as e:
        logger.exception("Error disassociating school")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/by-colegio/{colegio_id}", response_model=List[Usuario])
async def get_users_by_colegio(colegio_id: str):
    """Obtiene todos los usuarios de un colegio"""
    try:
        users = user_service_simple.get_users_by_colegio(colegio_id)
        return users
    except Exception as e:
        logger.exception("Error getting users by school")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/by-rol/{rol}", response_model=List[Usuario])
async def get_users_by_rol(
    rol: RoleName,
    colegio_id: Optional[str] = Query(None)
):
    """Obtiene usuarios por rol, opcionalmente filtrados por colegio"""
    try:
        users = user_service_simple.get_users_by_rol(rol.value, colegio_id)
        return users
    except Exception as e:
        logger.exception("Error getting users by role")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
