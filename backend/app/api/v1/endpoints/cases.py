from fastapi import APIRouter, HTTPException, Query
from typing import List
import logging
from app.services.case_service import case_service
from app.services.case_permission_service import case_permission_service
from app.services.users.user_service_simple import user_service_simple
from app.schemas.case import (
    Case, CaseWithPermissions, CasePermission,
    ShareCaseRequest, RevokeCasePermissionRequest, CaseUpdate
)

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/generate", response_model=Case)
async def generate_case(session_id: str, owner_id: str, colegio_id: str):
    """
    Genera un caso a partir de una sesión de chat existente.

    Args:
        session_id: ID de la sesión de chat
        owner_id: ID del usuario que crea el caso
        colegio_id: ID del colegio al que pertenece el caso
    """
    try:
        # Obtener usuario para el nombre
        user = user_service_simple.get_user_by_id(owner_id)
        owner_name = user.nombre if user else None

        case = await case_service.generate_case_from_session(
            session_id=session_id,
            owner_id=owner_id,
            colegio_id=colegio_id,
            owner_name=owner_name
        )
        return case
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("Error generating case")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/", response_model=List[Case])
async def get_cases(
    user_id: str = Query(..., description="ID del usuario que solicita los casos"),
    colegio_id: str = Query(..., description="ID del colegio")
):
    """
    Obtiene todos los casos accesibles para un usuario (propios + compartidos).
    """
    try:
        return case_service.get_cases_for_user(user_id, colegio_id)
    except Exception as e:
        logger.exception("Error fetching cases")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/school/{colegio_id}", response_model=List[Case])
async def get_all_cases_by_school(
    colegio_id: str
):
    """
    Obtiene TODOS los casos de un colegio sin filtrar por usuario.
    Endpoint para Directivos que necesitan ver estadísticas globales.
    """
    try:
        return case_service.get_all_cases_by_school(colegio_id)
    except Exception as e:
        logger.exception("Error fetching school cases")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/create", response_model=Case)
async def create_case(case_data: dict):
    """
    Crea un nuevo caso manualmente con análisis inteligente (LLM + RAG).

    Body debe incluir:
    - owner_id: ID del usuario propietario
    - colegio_id: ID del colegio
    - title, description, case_type, etc.
    """
    try:
        from app.schemas.case import CaseCreate, InvolvedPerson
        from app.services.school_service import school_service

        # Validar campos requeridos
        if "owner_id" not in case_data:
            raise HTTPException(status_code=400, detail="owner_id es requerido")
        if "colegio_id" not in case_data:
            raise HTTPException(status_code=400, detail="colegio_id es requerido")

        # Obtener usuario para el nombre
        user = user_service_simple.get_user_by_id(case_data["owner_id"])
        owner_name = user.nombre if user else None
        
        # Obtener search_app_id del colegio para RAG
        search_app_id = None
        try:
            colegio = school_service.get_colegio_by_id(case_data["colegio_id"])
            if colegio and colegio.search_app_id:
                search_app_id = colegio.search_app_id
                logger.info(f"🏫 [CREATE_CASE] Using search_app_id: {search_app_id}")
            else:
                # Fallback to demo app
                search_app_id = "demostracion_1767713503741"
                logger.warning(f"⚠️ [CREATE_CASE] No search_app_id in colegio, using demo")
        except Exception as e:
            logger.warning(f"⚠️ [CREATE_CASE] Error getting search_app_id: {e}")

        # Convertir el dict a CaseCreate
        involved_persons = []
        if case_data.get("involved"):
            for person in case_data["involved"]:
                involved_persons.append(InvolvedPerson(**person))

        case_create = CaseCreate(
            title=case_data.get("title", ""),
            description=case_data.get("description", ""),
            case_type=case_data.get("case_type", ""),
            involved=involved_persons,
            protocol=case_data.get("protocol", "No especificado"),
            owner_id=case_data["owner_id"],
            colegio_id=case_data["colegio_id"]
        )

        # Usar versión async con LLM + RAG
        return await case_service.create_case_async(case_create, owner_name, search_app_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error creating case")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.get("/by-session/{session_id}", response_model=Case)
async def get_case_by_session(session_id: str):
    """
    Obtiene el caso asociado a una sesión de chat.
    """
    try:
        case = case_service.get_case_by_session_id(session_id)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found for this session")
        return case
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error fetching case by session {session_id}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/analyze-file")
async def analyze_file_for_new_case(
    file_uri: str = Query(..., description="URI del archivo en GCS"),
    session_id: str = Query(..., description="ID de la sesión de chat")
):
    """
    Analiza un archivo subido para extraer información y crear un nuevo caso.
    No requiere un caso existente.
    """
    try:
        # Analizar archivo sin caso existente
        result = await case_service.analyze_file_for_create(file_uri)
        return result
    except ValueError as e:
        logger.error(f"ValueError analyzing file for new case: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Error analyzing file for new case")
        raise HTTPException(status_code=500, detail=f"Error interno al analizar archivo: {str(e)}")

@router.post("/analyze-files")
async def analyze_files_for_new_case(
    payload: dict,
    session_id: str = Query(..., description="ID de la sesión de chat")
):
    """
    Analiza MÚLTIPLES archivos subidos para extraer información combinada y crear un nuevo caso.
    Payload: {"file_uris": ["gs://...", "gs://..."]}
    """
    try:
        file_uris = payload.get("file_uris", [])
        if not file_uris:
             raise HTTPException(status_code=400, detail="file_uris list is required")

        # Analizar múltiples archivos
        result = await case_service.analyze_files_for_create(file_uris)
        return result
    except ValueError as e:
        logger.error(f"ValueError analyzing files for new case: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Error analyzing multiple files for new case")
        raise HTTPException(status_code=500, detail=f"Error interno al analizar archivos: {str(e)}")

@router.post("/{case_id}/documents")
async def save_document(
    case_id: str,
    file_name: str = Query(..., description="Nombre del archivo"),
    gcs_uri: str = Query(..., description="URI del archivo en GCS"),
    size: int = Query(..., description="Tamaño del archivo en bytes"),
    content_type: str = Query(..., description="Tipo de contenido del archivo"),
    session_id: str = Query(None, description="ID de la sesión de chat"),
    source: str = Query("antecedente", description="Fuente del documento")
):
    """
    Guarda un documento asociado a un caso.
    """
    try:
        # Verificar que el caso existe
        case = case_service.get_case_by_id(case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Caso no encontrado")

        # Preparar datos del archivo
        file_data = {
            "name": file_name,
            "gcs_uri": gcs_uri,
            "size": size,
            "content_type": content_type,
            "session_id": session_id
        }

        # Guardar documento
        doc_id = case_service.save_single_document(case_id, file_data, source)

        if not doc_id:
            raise HTTPException(status_code=500, detail="Error al guardar documento")

        return {"id": doc_id, "message": "Documento guardado exitosamente"}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Error saving document")
        raise HTTPException(status_code=500, detail="Error interno al guardar documento")

@router.post("/{case_id}/documents/batch")
async def save_documents_batch(
    case_id: str,
    payload: dict
):
    """
    Guarda múltiples documentos asociados a un caso en una sola petición.
    
    Body debe incluir:
    - documents: Lista de objetos con {name, gcs_uri, size, content_type, session_id, source}
    """
    try:
        # Verificar que el caso existe
        case = case_service.get_case_by_id(case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Caso no encontrado")

        # Extraer lista de documentos del payload
        documents = payload.get("documents", [])
        
        if not documents or len(documents) == 0:
            raise HTTPException(status_code=400, detail="No se proporcionaron documentos")

        # Guardar todos los documentos
        saved_ids = []
        errors = []

        for i, doc in enumerate(documents):
            try:
                # Validar campos requeridos
                if not doc.get("name") or not doc.get("gcs_uri"):
                    errors.append({"index": i, "error": "Faltan campos requeridos (name, gcs_uri)"})
                    continue

                file_data = {
                    "name": doc["name"],
                    "gcs_uri": doc["gcs_uri"],
                    "size": doc.get("size", 0),
                    "content_type": doc.get("content_type", "application/octet-stream"),
                    "session_id": doc.get("session_id")
                }

                doc_id = case_service.save_single_document(
                    case_id, 
                    file_data, 
                    doc.get("source", "antecedente")
                )

                if doc_id:
                    saved_ids.append({"index": i, "id": doc_id, "name": doc["name"]})
                else:
                    errors.append({"index": i, "error": "Error al guardar documento"})

            except Exception as e:
                logger.error(f"Error saving document {i}: {e}")
                errors.append({"index": i, "error": str(e)})

        # Retornar resultado
        result = {
            "saved": len(saved_ids),
            "total": len(documents),
            "documents": saved_ids
        }

        if errors:
            result["errors"] = errors

        logger.info(f"Batch save: {len(saved_ids)}/{len(documents)} documents saved to case {case_id}")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error in batch document save")
        raise HTTPException(status_code=500, detail="Error interno al guardar documentos")


@router.post("/{case_id}/analyze-file")
async def analyze_file(
    case_id: str,
    file_uri: str = Query(..., description="URI del archivo en GCS"),
    session_id: str = Query(..., description="ID de la sesión de chat")
):
    """
    Analiza un archivo subido y sugiere actualizaciones para el caso.
    """
    try:
        # 1. Verificar existencia del caso
        case = case_service.get_case_by_id(case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Caso no encontrado")

        # 2. Verificar permisos (opcional: solo edits)
        # Por ahora permitimos si puede ver, se supone que es una "sugerencia" que luego el usuario guarda

        # 3. Analizar archivo
        result = await case_service.analyze_file_for_update(case_id, file_uri)
        return result
        
    except ValueError as e:
         raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("Error analyzing file")
        raise HTTPException(status_code=500, detail="Internal Server Error")



@router.post("/{case_id}/summary")
async def generate_case_summary_endpoint(
    case_id: str,
    user_id: str = Query(..., description="ID del usuario que solicita el resumen")
):
    """
    Genera un resumen inteligente del caso.
    """
    try:
        # Verificar permisos (lectura suficiente)
        if not case_service.check_user_can_view(case_id, user_id):
            raise HTTPException(status_code=403, detail="No tienes permiso para ver este caso")

        result = await case_service.generate_case_summary(case_id, user_id=user_id)
        return result

    except ValueError as e:
         raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("Error generating summary")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/{case_id}", response_model=CaseWithPermissions)
async def get_case(
    case_id: str,
    user_id: str = Query(..., description="ID del usuario que solicita el caso")
):
    """
    Obtiene un caso específico por su ID.
    Incluye información de permisos si el usuario es el owner.
    """
    try:
        case = case_service.get_case_by_id(case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        # Verificar que el usuario tenga permiso para ver el caso
        if not case_service.check_user_can_view(case_id, user_id):
            raise HTTPException(status_code=403, detail="No tienes permiso para ver este caso")

        # Si es el owner, incluir información de permisos
        permissions = []
        user_permission = None

        if case.owner_id == user_id:
            permissions = case_permission_service.get_case_permissions(case_id)
        else:
            # Si no es owner, solo mostrar su propio permiso
            user_perm = case_permission_service.get_user_permission(case_id, user_id)
            if user_perm:
                user_permission = user_perm.permission_type

        # Obtener historial de chats asociados
        chat_history = []
        if case.related_sessions:
            from app.services.chat.history_service import history_service
            from app.services.storage_service import storage_service
            
            bucket_name = None
            if case.colegio_id:
                bucket_name = storage_service.get_school_bucket_name(case.colegio_id)

            for session_id in case.related_sessions:
                summary = history_service.get_session_summary(session_id, bucket_name)
                if summary:
                    chat_history.append(summary)
        # TODO: Descomentar y arreglar cuando se implemente la vista de historial de chat
        # # Obtener historial de chats asociados
        # chat_history = []
        # if case.related_sessions:
        #     from app.services.chat.history_service import history_service
        #     for session_id in case.related_sessions:
        #         summary = history_service.get_session_summary(session_id)
        #         if summary:
        #             chat_history.append(summary)

        return CaseWithPermissions(
            **case.model_dump(),
            permissions=permissions,
            user_permission=user_permission,
            chatHistory=chat_history
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error fetching case {case_id}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.patch("/{case_id}", response_model=Case)
async def update_case(
    case_id: str,
    update_data: CaseUpdate,
    user_id: str = Query(..., description="ID del usuario que intenta actualizar")
):
    """
    Actualiza el título y/o status de un caso.
    Solo el owner o usuarios con permiso EDIT pueden actualizar.
    """
    try:
        updated_case = case_service.update_case(
            case_id=case_id,
            user_id=user_id,
            update_data=update_data.model_dump(exclude_none=True)
        )

        if not updated_case:
            raise HTTPException(status_code=404, detail="Caso no encontrado")

        return updated_case

    except ValueError as e:
        # Errores de permisos o validación
        if "permiso" in str(e).lower():
            raise HTTPException(status_code=403, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error updating case {case_id}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.delete("/{case_id}")
async def delete_case(
    case_id: str,
    user_id: str = Query(..., description="ID del usuario que intenta eliminar")
):
    """
    Elimina un caso y todos sus documentos asociados.
    Solo el propietario puede eliminar el caso.
    """
    try:
        success = case_service.delete_case(case_id, user_id)
        if success:
            return {"message": "Caso eliminado exitosamente", "case_id": case_id}
        else:
            raise HTTPException(status_code=500, detail="Error al eliminar el caso")
    except ValueError as e:
        # Errores de permisos o validación
        if "propietario" in str(e).lower() or "permiso" in str(e).lower():
            raise HTTPException(status_code=403, detail=str(e))
        if "no encontrado" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error deleting case {case_id}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# ============ ENDPOINTS DE PERMISOS ============

@router.post("/{case_id}/share")
async def share_case(
    case_id: str,
    share_request: ShareCaseRequest,
    owner_id: str = Query(..., description="ID del propietario del caso")
):
    """
    Comparte un caso con otros usuarios.
    Solo el owner puede compartir.
    """
    try:
        # Verificar que el caso existe
        case = case_service.get_case_by_id(case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Caso no encontrado")

        # Para casos legacy sin owner, permitir compartir
        # Para casos nuevos, verificar que quien comparte es el owner
        if case.owner_id and case.owner_id != owner_id:
            raise HTTPException(status_code=403, detail="Solo el propietario puede compartir el caso")

        # Si el caso no tiene colegio_id (legacy), obtener el colegio del usuario
        colegio_id = case.colegio_id
        if not colegio_id:
            user = user_service_simple.get_user_by_id(owner_id)
            if not user or not user.colegios:
                raise HTTPException(status_code=400, detail="Usuario no tiene colegio asociado")
            colegio_id = user.colegios[0]

        # Verificar que todos los usuarios pertenezcan al mismo colegio
        for user_id in share_request.user_ids:
            user = user_service_simple.get_user_by_id(user_id)
            if not user:
                raise HTTPException(status_code=404, detail=f"Usuario {user_id} no encontrado")
            if colegio_id not in user.colegios:
                raise HTTPException(
                    status_code=400,
                    detail=f"Usuario {user.nombre} no pertenece al mismo colegio"
                )

        # Otorgar permisos
        granted_permissions = []
        for user_id in share_request.user_ids:
            user = user_service_simple.get_user_by_id(user_id)
            permission = case_permission_service.grant_permission(
                case_id=case_id,
                owner_id=owner_id,
                user_id=user_id,
                permission_type=share_request.permission_type,
                user_name=user.nombre if user else None
            )
            granted_permissions.append(permission)

        # Actualizar is_shared del caso
        case_service.update_case_shared_status(case_id, True)

        logger.info(f"Case {case_id} shared with {len(granted_permissions)} user(s)")

        return {
            "mensaje": f"Caso compartido con {len(granted_permissions)} usuario(s)",
            "permissions": granted_permissions
        }

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Error sharing case")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.delete("/{case_id}/permissions/{target_user_id}")
async def revoke_case_permission(
    case_id: str,
    target_user_id: str,
    owner_id: str = Query(..., description="ID del propietario del caso")
):
    """
    Revoca el permiso de un usuario para acceder a un caso.
    Solo el owner puede revocar permisos.
    """
    try:
        # Verificar que el caso existe
        case = case_service.get_case_by_id(case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Caso no encontrado")

        # Verificar que quien revoca es el owner
        if case.owner_id != owner_id:
            raise HTTPException(status_code=403, detail="Solo el propietario puede revocar permisos")

        # Revocar permiso
        success = case_permission_service.revoke_permission(case_id, owner_id, target_user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Permiso no encontrado")

        # Verificar si quedan permisos compartidos
        remaining_permissions = case_permission_service.get_case_permissions(case_id)
        if not remaining_permissions:
            # Si no quedan permisos, actualizar is_shared a False
            case_service.update_case_shared_status(case_id, False)

        return {"mensaje": "Permiso revocado exitosamente"}

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Error revoking permission")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/{case_id}/permissions", response_model=List[CasePermission])
async def get_case_permissions(
    case_id: str,
    user_id: str = Query(..., description="ID del usuario que solicita los permisos")
):
    """
    Obtiene la lista de permisos de un caso.
    Solo el owner puede ver todos los permisos.
    """
    try:
        # Verificar que el caso existe
        case = case_service.get_case_by_id(case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Caso no encontrado")

        # Para casos legacy sin owner, permitir a cualquiera ver los permisos
        # Para casos nuevos, verificar que quien solicita es el owner
        if case.owner_id and case.owner_id != user_id:
            raise HTTPException(status_code=403, detail="Solo el propietario puede ver los permisos")

        return case_permission_service.get_case_permissions(case_id)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error fetching permissions")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/{case_id}/available-users")
async def get_available_users_to_share(
    case_id: str,
    user_id: str = Query(..., description="ID del usuario que solicita la lista")
):
    """
    Obtiene la lista de usuarios disponibles para compartir el caso.
    Solo usuarios del mismo colegio que aún no tienen acceso.
    """
    try:
        # Verificar que el caso existe
        case = case_service.get_case_by_id(case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Caso no encontrado")

        # Para casos legacy sin owner, permitir a cualquiera obtener la lista
        # Para casos nuevos, verificar que quien solicita es el owner
        if case.owner_id and case.owner_id != user_id:
            raise HTTPException(status_code=403, detail="Solo el propietario puede compartir el caso")

        # Si el caso no tiene colegio_id (legacy), obtener el colegio del usuario
        colegio_id = case.colegio_id
        if not colegio_id:
            # Obtener colegio del usuario actual
            user = user_service_simple.get_user_by_id(user_id)
            if not user or not user.colegios:
                raise HTTPException(status_code=400, detail="Usuario no tiene colegio asociado")
            colegio_id = user.colegios[0]

        # Obtener todos los usuarios del colegio
        all_users = user_service_simple.get_users_by_colegio(colegio_id)

        # Obtener usuarios que ya tienen acceso
        shared_user_ids = case_permission_service.get_shared_users(case_id)

        # Filtrar: excluir owner (si existe) y usuarios que ya tienen permiso
        available_users = [
            {"id": u.id, "nombre": u.nombre, "correo": u.correo, "rol": u.rol}
            for u in all_users
            if (not case.owner_id or u.id != case.owner_id) and u.id not in shared_user_ids
        ]

        logger.debug(f"Case {case_id}: school={colegio_id}, total_users={len(all_users)}, available={len(available_users)}")

        return available_users

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error fetching available users")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/{case_id}/timeline")
async def get_case_timeline(
    case_id: str,
    user_id: str = Query(..., description="ID del usuario que solicita la cronología")
):
    """
    Obtiene la cronología de actividades del caso.
    Incluye: documentos subidos, correos enviados, eventos de calendario.
    """
    try:
        import json
        from datetime import datetime
        from app.services.chat.history_service import history_service
        from app.services.storage_service import storage_service

        logger.info(f"📅 GET /cases/{case_id}/timeline - user_id: {user_id}")

        # Helper para convertir timestamps a ISO string
        def to_iso_string(ts):
            if ts is None:
                return None
            if isinstance(ts, str):
                return ts
            if hasattr(ts, 'isoformat'):
                return ts.isoformat()
            if hasattr(ts, 'timestamp'):
                # Firestore timestamp
                return ts.isoformat() if hasattr(ts, 'isoformat') else str(ts)
            return str(ts)

        # Verificar que el caso existe
        case = case_service.get_case_by_id(case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Caso no encontrado")

        # Verificar permisos
        if not case_service.check_user_can_view(case_id, user_id):
            raise HTTPException(status_code=403, detail="No tienes permiso para ver este caso")

        timeline_events = []

        # 0. Agregar evento de creación del caso
        if case.created_at:
            timeline_events.append({
                "type": "case_created",
                "title": "Caso creado",
                "description": f"Se creó el caso: {case.title}",
                "timestamp": to_iso_string(case.created_at),
                "metadata": {
                    "case_id": case_id,
                    "case_title": case.title,
                    "owner_id": case.owner_id
                }
            })

        # 1. Obtener documentos del caso
        documents = case_service.get_case_documents(case_id)
        for doc in documents:
            # Filtrar archivos de sistema
            name = (doc.get('name') or '').lower()
            if name.endswith('.json') or 'protocol_' in name:
                continue

            timeline_events.append({
                "type": "document",
                "title": doc.get('name', 'Documento'),
                "description": f"Archivo subido ({doc.get('source', 'antecedente')})",
                "timestamp": to_iso_string(doc.get('created_at')),
                "metadata": {
                    "id": doc.get('id'),
                    "size": doc.get('size_bytes'),
                    "content_type": doc.get('content_type'),
                    "source": doc.get('source')
                }
            })

        # 2. Obtener eventos de las sesiones relacionadas
        if case.related_sessions:
            bucket_name = None
            if case.colegio_id:
                bucket_name = storage_service.get_school_bucket_name(case.colegio_id)

            for session_id in case.related_sessions:
                try:
                    # Cargar historial con timestamps
                    messages = await history_service.load_history_with_timestamps(session_id, bucket_name)

                    for msg in messages:
                        if msg.get('role') != 'bot':
                            continue

                        content = msg.get('content', '')
                        timestamp = msg.get('timestamp')

                        # Intentar parsear JSON para detectar eventos especiales
                        try:
                            if isinstance(content, str) and content.strip().startswith('{'):
                                data = json.loads(content)
                                event_type = data.get('type')

                                # Correo enviado
                                if event_type == 'email_success':
                                    timeline_events.append({
                                        "type": "email",
                                        "title": data.get('subject', 'Correo enviado'),
                                        "description": f"Enviado a: {data.get('to', 'destinatario')}",
                                        "timestamp": to_iso_string(timestamp),
                                        "metadata": {
                                            "to": data.get('to'),
                                            "subject": data.get('subject'),
                                            "body": data.get('body', ''),
                                            "cc": data.get('cc', []),
                                            "sender": data.get('sender', ''),
                                            "sender_name": data.get('sender_name', '')
                                        }
                                    })

                                # Evento de calendario (calendar_success o calendar_event_success)
                                elif event_type in ['calendar_event_success', 'calendar_success']:
                                    timeline_events.append({
                                        "type": "calendar",
                                        "title": data.get('summary', 'Evento agendado'),
                                        "description": f"Reunión programada",
                                        "timestamp": to_iso_string(timestamp),
                                        "metadata": {
                                            "summary": data.get('summary'),
                                            "description": data.get('description', ''),
                                            "start_time": data.get('start_time'),
                                            "end_time": data.get('end_time'),
                                            "attendees": data.get('attendees', [])
                                        }
                                    })
                        except json.JSONDecodeError:
                            pass

                except Exception as e:
                    logger.warning(f"⚠️ Error loading session {session_id} for timeline: {e}")
                    continue

        # 3. Ordenar por timestamp (más reciente primero)
        def get_timestamp(event):
            ts = event.get('timestamp')
            if not ts:
                return ''
            return ts

        timeline_events.sort(key=get_timestamp, reverse=True)

        logger.info(f"✅ Timeline loaded: {len(timeline_events)} events for case {case_id}")
        return {"events": timeline_events, "total": len(timeline_events)}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error fetching case timeline")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/{case_id}/documents")
async def get_case_documents(
    case_id: str,
    user_id: str = Query(..., description="ID del usuario que solicita los documentos")
):
    """
    Obtiene todos los documentos asociados a un caso.
    Solo usuarios con acceso al caso pueden ver los documentos.
    """
    try:
        logger.debug(f"GET /cases/{case_id}/documents - user_id: {user_id}")

        # Verificar que el caso existe
        case = case_service.get_case_by_id(case_id)
        if not case:
            logger.warning(f"Case {case_id} not found")
            raise HTTPException(status_code=404, detail="Caso no encontrado")

        logger.debug(f"Case found: {case.title}")

        # Verificar que el usuario tenga permiso para ver el caso
        if not case_service.check_user_can_view(case_id, user_id):
            logger.warning(f"User {user_id} does not have permission to view case {case_id}")
            raise HTTPException(status_code=403, detail="No tienes permiso para ver este caso")

        logger.debug("User has permission to view case")

        # Obtener documentos del caso
        documents = case_service.get_case_documents(case_id)

        logger.debug(f"Returning {len(documents)} documents")
        return documents

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error fetching case documents")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.delete("/{case_id}/documents/{document_id}")
async def delete_case_document(
    case_id: str,
    document_id: str,
    user_id: str = Query(..., description="ID del usuario que intenta eliminar")
):
    """
    Elimina un documento asociado a un caso.
    Solo usuarios con permiso EDIT pueden eliminar documentos.
    """
    try:
        logger.info(f"🗑️ DELETE /cases/{case_id}/documents/{document_id} - user_id: {user_id}")

        # Verificar que el caso existe
        case = case_service.get_case_by_id(case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Caso no encontrado")

        # Verificar que el usuario tenga permiso para editar el caso
        if not case_service.check_user_can_edit(case_id, user_id):
            raise HTTPException(status_code=403, detail="No tienes permiso para editar este caso")

        # Eliminar documento
        success = case_service.delete_case_document(case_id, document_id)

        if success:
            logger.info(f" Document {document_id} deleted successfully")
            return {"message": "Documento eliminado exitosamente", "document_id": document_id}
        else:
            raise HTTPException(status_code=404, detail="Documento no encontrado")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.put("/{case_id}/documents/{document_id}/rename")
async def rename_case_document(
    case_id: str,
    document_id: str,
    payload: dict,
    user_id: str = Query(..., description="ID del usuario que intenta renombrar")
):
    """
    Renombra un documento asociado a un caso.
    Solo usuarios con permiso EDIT pueden renombrar documentos.
    Payload debe incluir: {"new_name": "nuevo_nombre.ext"}
    """
    try:
        new_name = payload.get("new_name")
        if not new_name:
            raise HTTPException(status_code=400, detail="Nuevo nombre es requerido")

        logger.info(f"✏️ PUT /cases/{case_id}/documents/{document_id}/rename - user_id: {user_id} - new_name: {new_name}")

        # Verificar que el caso existe
        case = case_service.get_case_by_id(case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Caso no encontrado")

        # Verificar que el usuario tenga permiso para editar el caso
        if not case_service.check_user_can_edit(case_id, user_id):
            raise HTTPException(status_code=403, detail="No tienes permiso para editar este caso")

        # Renombrar documento
        success = case_service.rename_case_document(case_id, document_id, new_name)

        if success:
            return {"message": "Documento renombrado exitosamente", "document_id": document_id, "new_name": new_name}
        
        # Si devuelve True pero algo raro pasó (no debería llegar aquí sin excepción)
        return {"message": "Documento renombrado exitosamente"}

    except ValueError as e:
        # Errores de validación (ej: nombre duplicado)
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error renaming document: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/{case_id}/documents/{document_id}/download")
async def download_case_document(
    case_id: str,
    document_id: str,
    inline: bool = Query(False, description="Si es True, devuelve una URL con Content-Disposition: inline"),
    user_id: str = Query(..., description="ID del usuario que intenta descargar")
):
    """
    Obtiene una URL de descarga para un documento.
    Solo usuarios con permiso VIEW pueden descargar.
    """
    try:
        logger.info(f"🔗 GET /cases/{case_id}/documents/{document_id}/download - user_id: {user_id} - inline: {inline}")

        # Verificar que el caso existe
        case = case_service.get_case_by_id(case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Caso no encontrado")

        # Verificar que el usuario tenga permiso para ver el caso
        if not case_service.check_user_can_view(case_id, user_id):
            raise HTTPException(status_code=403, detail="No tienes permiso para ver este caso")

        # Generar URL de descarga
        download_url = case_service.get_document_download_url(case_id, document_id, inline=inline)

        return {"download_url": download_url}

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating download URL: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
