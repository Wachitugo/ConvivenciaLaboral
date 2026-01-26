from fastapi import APIRouter, HTTPException, Header
import logging
from typing import Optional
from app.services.users.auth_service import auth_service
from app.services.users.user_service_simple import user_service_simple
from app.services.school_service import school_service
from app.schemas.user import (
    RegisterRequest, RegisterResponse,
    LoginRequest, LoginResponse,
    GoogleLoginRequest,
    Usuario
)

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/register", response_model=RegisterResponse)
async def register(request: RegisterRequest):
    """
    Registra un nuevo usuario directamente en Firestore (sin Firebase Authentication por ahora).
    """
    try:
        # Verificar que los colegios existan
        for colegio_id in request.colegios:
            colegio = school_service.get_colegio_by_id(colegio_id)
            if not colegio:
                raise HTTPException(
                    status_code=404,
                    detail=f"Colegio {colegio_id} no encontrado"
                )

        # Crear usuario directamente en Firestore (sin Firebase Auth)
        nuevo_usuario = user_service_simple.create_user(request)

        return RegisterResponse(
            mensaje="Usuario registrado exitosamente.",
            usuario=nuevo_usuario
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        error_details = f"Error en registro: {str(e)}\n{traceback.format_exc()}"
        logger.error(f" {error_details}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Inicia sesión con correo y contraseña.
    """
    try:
        # Verificar credenciales
        usuario = user_service_simple.login(request.correo, request.password)

        if not usuario:
            raise HTTPException(
                status_code=401,
                detail="Correo o contraseña incorrectos"
            )

        # Obtener información de los colegios del usuario
        colegios_info = school_service.get_colegios_by_ids(usuario.colegios)

        # Generar token firmado (JWT-lite)
        from app.core.security import create_access_token
        token = create_access_token({"uid": usuario.id, "sub": usuario.id})

        return LoginResponse(
            token=token,
            usuario=usuario,
            colegios_info=colegios_info
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_details = f"Error en login: {str(e)}\n{traceback.format_exc()}"
        logger.error(f" {error_details}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.post("/google-login", response_model=LoginResponse)
async def google_login(request: GoogleLoginRequest):
    """
    Inicia sesión con Google OAuth.
    Verifica que el usuario esté registrado en el sistema antes de permitir el acceso.
    """
    try:
        import httpx

        # Verificar el access_token llamando a la API de Google
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    'https://www.googleapis.com/oauth2/v3/userinfo',
                    headers={'Authorization': f'Bearer {request.access_token}'}
                )

                if response.status_code != 200:
                    raise HTTPException(
                        status_code=401,
                        detail="Access token de Google inválido"
                    )

                user_info = response.json()
                token_email = user_info.get('email')

                # Verificar que el email del token coincida con el email proporcionado
                if token_email != request.email:
                    raise HTTPException(
                        status_code=401,
                        detail="El email del token no coincide"
                    )

        except httpx.RequestError as e:
            raise HTTPException(
                status_code=401,
                detail=f"Error verificando token de Google: {str(e)}"
            )

        # Buscar usuario por correo en Firestore
        usuario = user_service_simple.get_user_by_email(request.email)

        if not usuario:
            raise HTTPException(
                status_code=404,
                detail="Este correo no está registrado en el sistema. Por favor, contacta al administrador."
            )

        # Verificar que el usuario esté activo
        if not usuario.activo:
            raise HTTPException(
                status_code=403,
                detail="Tu cuenta está inactiva. Por favor, contacta al administrador."
            )

        # Obtener información de los colegios del usuario
        colegios_info = school_service.get_colegios_by_ids(usuario.colegios)

        # Generar token de sesión firmado
        from app.core.security import create_access_token
        token = create_access_token({"uid": usuario.id, "sub": usuario.id})

        return LoginResponse(
            token=token,
            usuario=usuario,
            colegios_info=colegios_info
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_details = f"Error en Google login: {str(e)}\n{traceback.format_exc()}"
        logger.error(f" {error_details}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.post("/verify-token", response_model=Usuario)
async def verify_token(authorization: Optional[str] = Header(None)):
    """
    Verifica un ID token de Firebase y retorna información del usuario.

    El token debe enviarse en el header: Authorization: Bearer <token>
    """
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Token no proporcionado")

        # Extraer token del header "Bearer <token>"
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Formato de token inválido")

        id_token = authorization.replace("Bearer ", "")

        # Verificar token
        token_data = await auth_service.verify_token(id_token)

        # Retornar información del usuario
        user_data = token_data["user_data"]
        return Usuario(**user_data)

    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        logger.error(f"Error verificando token: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.get("/me", response_model=Usuario)
async def get_current_user(authorization: Optional[str] = Header(None)):
    """
    Obtiene la información del usuario actual autenticado.

    El token debe enviarse en el header: Authorization: Bearer <token>
    """
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Token no proporcionado")

        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Formato de token inválido")

        id_token = authorization.replace("Bearer ", "")

        # Verificar token y obtener usuario
        token_data = await auth_service.verify_token(id_token)
        user_data = token_data["user_data"]

        return Usuario(**user_data)

    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        logger.error(f"Error obteniendo usuario actual: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.post("/logout")
async def logout():
    """
    Endpoint de logout (el frontend debe eliminar el token localmente).

    Firebase Authentication es stateless, así que el logout se maneja en el cliente.
    """
    return {
        "mensaje": "Sesión cerrada. El token debe ser eliminado del cliente."
    }


@router.get("/test-custom-token/{user_id}")
async def create_custom_token_for_testing(user_id: str):
    """
    Endpoint de testing: Crea un custom token para un usuario existente.

    IMPORTANTE: Este endpoint debería ser deshabilitado en producción.
    """
    try:
        # Verificar que el usuario existe
        user = user_service.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Crear custom token
        custom_token = await auth_service.create_custom_token(user_id)

        return {
            "custom_token": custom_token,
            "mensaje": "Usa este token en Firebase Auth para hacer login en el frontend",
            "instrucciones": "firebase.auth().signInWithCustomToken(customToken)"
        }

    except Exception as e:
        logger.error(f"Error creando custom token: {e}")
        raise HTTPException(status_code=500, detail=str(e))
