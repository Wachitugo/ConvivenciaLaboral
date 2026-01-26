from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel
from typing import List, Optional
import uuid
import logging
import asyncio
from datetime import datetime
from app.services.chat.chat_service import vertex_agent
from google.cloud import storage
from app.core.config import get_settings
import mimetypes
import unicodedata
from urllib.parse import quote

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()

from app.services.chat.history_service import history_service
from app.services.case_service import case_service
from app.services.school_service import school_service

class ChatRequestModel(BaseModel):
    message: str
    session_id: str
    school_name: str
    files: Optional[List[str]] = None
    case_id: Optional[str] = None
    user_id: Optional[str] = None
    title: Optional[str] = None

class ChatResponseModel(BaseModel):
    text: str  # Sanitized response text
    metadata: dict = {}  # Contains IDs and references
    suggestions: List[str] = []  # Suggested follow-up questions
    session_id: str

class SignedURLRequest(BaseModel):
    filename: str
    content_type: str
    session_id: Optional[str] = None
    case_id: Optional[str] = None

class RegisterFileRequest(BaseModel):
    session_id: str
    filename: str
    gcs_uri: str
    content_type: str
    size: int
    case_id: Optional[str] = None



@router.get("/upload-limits")
async def get_upload_limits():
    """
    Return file upload limits for client-side validation.
    """
    from app.core.config import get_settings
    settings = get_settings()
    
    return {
        "max_files": settings.MAX_FILES_PER_UPLOAD,
        "max_file_size_mb": settings.MAX_FILE_SIZE_MB,
        "max_total_size_mb": settings.MAX_TOTAL_SIZE_MB
    }



@router.post("/stream")
async def stream_chat_endpoint(request: ChatRequestModel):
    """Endpoint para chat con streaming de respuesta"""
    try:
        logger.info(f"📨 [STREAM] Request received: session_id={request.session_id}, user_id={request.user_id}, case_id={request.case_id}, title={request.title}")
        
        # Guardar metadatos de la sesión si hay user_id
        if request.user_id:
            # Guardar con título si se proporciona (generalmente en el primer mensaje)
            logger.info(f"💾 [STREAM] Saving session metadata for user {request.user_id}")
            await history_service.save_session_metadata(
                request.session_id,
                request.user_id,
                request.title
            )
            logger.info(f"✅ [STREAM] Session metadata saved")

        # Vincular sesión al caso si se proporciona case_id
        if request.case_id:
            logger.info(f"🔗 [STREAM] Linking session {request.session_id} to case {request.case_id}")
            case_service.add_session_to_case(request.case_id, request.session_id)
            logger.info(f"✅ [STREAM] Session linked successfully to case {request.case_id}")
        else:
            logger.warning(f"⚠️ [STREAM] No case_id provided, session {request.session_id} will not be linked to any case")

        return StreamingResponse(
            vertex_agent.stream_chat(
                message=request.message,
                session_id=request.session_id,
                school_name=request.school_name,
                files=request.files,
                case_id=request.case_id,
                user_id=request.user_id
            ),
            media_type="text/plain"
        )
    except Exception as e:
        logger.exception("Error in stream chat endpoint")
        raise HTTPException(status_code=500, detail=str(e))


class CreateEventRequest(BaseModel):
    summary: str
    start_time: str
    end_time: str
    description: Optional[str] = ""
    attendees: Optional[List[str]] = []
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    message_id: Optional[int] = None  # Order of the message to replace

@router.post("/create-event")
async def create_event_endpoint(request: CreateEventRequest):
    """Endpoint para crear evento en calendario (confirmado desde UI)."""
    try:
        from app.services.tools.google_tools import google_tools
        from app.services.users.user_service_simple import user_service_simple

        delegate_email = None
        if request.user_id:
             user = user_service_simple.get_user_by_id(request.user_id)
             if user and user.correo:
                 delegate_email = user.correo
        
        result = google_tools.create_event(
            summary=request.summary,
            start_time=request.start_time,
            end_time=request.end_time,
            description=request.description,
            attendees=request.attendees,
            delegate_email=delegate_email
        )
        
        if "Error" in result:
             raise HTTPException(status_code=500, detail=result)
        
        # Replace the draft JSON in history with a success message structure
        if request.session_id:
            try:
                import json
                # Create a structured success message that frontend will render as a card
                success_data = {
                    "type": "calendar_success",
                    "summary": request.summary,
                    "start_time": request.start_time,
                    "end_time": request.end_time,
                    "description": request.description,
                    "attendees": request.attendees or []
                }
                success_message = json.dumps(success_data)
                
                await history_service.replace_last_ai_message(request.session_id, success_message, request.message_id)
                logger.info(f"✅ Replaced draft with success message for session {request.session_id}, message_id={request.message_id}")
            except Exception as e:
                logger.warning(f"⚠️ Failed to replace draft message: {e}")
             
        return {"status": "success", "message": "Evento creado exitosamente", "result": result}
        
    except Exception as e:
        logger.exception("Error creating event")
        raise HTTPException(status_code=500, detail=str(e))

class SendEmailRequest(BaseModel):
    to: str
    subject: str
    body: str
    user_id: str
    cc: Optional[List[str]] = None
    session_id: Optional[str] = None
    message_id: Optional[int] = None  # Order of the message to replace

@router.post("/send-email")
async def send_email_endpoint(request: SendEmailRequest):
    """Endpoint para enviar correos usando la cuenta del usuario (delegación)."""
    try:
        from app.services.users.user_service_simple import user_service_simple
        from app.services.tools.google_tools import google_tools
        
        # 1. Obtener email del usuario para delegación
        user = user_service_simple.get_user_by_id(request.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
            
        if not user.correo:
            raise HTTPException(status_code=400, detail="El usuario no tiene un correo configurado")
        
        # 2. Obtener nombre del colegio para el remitente
        sender_name = None
        if user.colegios:
            from app.services.school_service import school_service
            school = school_service.get_colegio_by_id(user.colegios[0])
            if school and school.nombre:
                sender_name = f"{school.nombre} - Convivencia Escolar"
                logger.info(f"📧 Using sender name: {sender_name}")
            
        logger.info(f"Sending email as {user.correo} (Delegated)")
        
        # 3. Enviar correo usando delegación
        result = google_tools.send_email(
            to=request.to, 
            subject=request.subject, 
            body=request.body,
            delegate_email=user.correo,
            cc=request.cc,
            sender_name=sender_name
        )
        
        if "Error" in result:
             raise HTTPException(status_code=500, detail=result)
        
        # Replace the draft JSON in history with a success message structure
        if request.session_id:
            try:
                import json
                # Create a structured success message that frontend will render as a card
                success_data = {
                    "type": "email_success",
                    "to": request.to,
                    "subject": request.subject,
                    "body": request.body,
                    "cc": request.cc or [],
                    "sender": user.correo,
                    "sender_name": sender_name
                }
                success_message = json.dumps(success_data)
                
                await history_service.replace_last_ai_message(request.session_id, success_message, request.message_id)
                logger.info(f"✅ Replaced draft with success message for session {request.session_id}, message_id={request.message_id}")
            except Exception as e:
                logger.warning(f"⚠️ Failed to replace draft message: {e}")
             
        return {"status": "success", "message": "Correo enviado exitosamente", "result": result}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error sending email")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/session")
async def create_session():
    return {"session_id": str(uuid.uuid4())}

class LinkSessionToCaseRequest(BaseModel):
    session_id: str
    case_id: str

@router.post("/link-session-to-case")
async def link_session_to_case_endpoint(request: LinkSessionToCaseRequest):
    """
    Vincula una sesión de chat a un caso INMEDIATAMENTE al abrir el chat.
    Esto permite que el LLM tenga contexto del caso desde el primer mensaje.
    """
    try:
        logger.info(f"🔗 [LINK] Linking session {request.session_id} to case {request.case_id}")
        
        # Verificar que el caso existe
        case = case_service.get_case_by_id(request.case_id)
        if not case:
            logger.error(f"❌ [LINK] Case {request.case_id} not found")
            raise HTTPException(status_code=404, detail="Caso no encontrado")
        
        # Vincular sesión al caso
        case_service.add_session_to_case(request.case_id, request.session_id)
        logger.info(f"✅ [LINK] Session {request.session_id} successfully linked to case {request.case_id}")
        
        return {
            "status": "success",
            "message": "Sesión vinculada exitosamente al caso",
            "session_id": request.session_id,
            "case_id": request.case_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"❌ [LINK] Error linking session to case")
        raise HTTPException(status_code=500, detail=str(e))

class UpdateTitleRequest(BaseModel):
    session_id: str
    user_id: str
    title: str

@router.post("/update-title")
async def update_session_title(request: UpdateTitleRequest):
    """Actualiza el título de una sesión"""
    try:
        await history_service.save_session_metadata(
            request.session_id,
            request.user_id,
            request.title
        )
        return {"status": "success", "message": "Título actualizado exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions")
async def get_sessions(user_id: Optional[str] = None):
    """Obtiene la lista de sesiones de chat recientes"""
    try:
        return await history_service.list_sessions(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/session/{session_id}/metadata")
async def get_session_metadata(session_id: str):
    """Obtiene los metadatos de una sesión específica (título, fecha, etc.)"""
    try:
        logger.info(f"🔍 [ENDPOINT] get_session_metadata called for {session_id}")
        metadata = await history_service.get_session_metadata(session_id)
        if not metadata:
            # Si no hay metadatos, intentar cargar del historial para generar metadatos básicos
            logger.info(f"⚠️ [ENDPOINT] No metadata found, checking if session has history")
            history = await history_service.load_history(session_id)
            if history and len(history) > 0:
                # Generar metadatos básicos desde el historial
                first_message = history[0].content if isinstance(history[0].content, str) else "Conversación"
                title = first_message[:50] + "..." if len(first_message) > 50 else first_message
                logger.info(f"📝 [ENDPOINT] Generated title from history: {title}")
                return {
                    "id": session_id,
                    "title": title,
                    "user_id": None,
                    "date": "Reciente"
                }
            logger.warning(f"❌ [ENDPOINT] Session {session_id} not found")
            raise HTTPException(status_code=404, detail="Session not found")
        return metadata
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting session metadata for {session_id}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{session_id}")
async def get_session_history(session_id: str, user_id: Optional[str] = None):
    """Obtiene el historial de una sesión específica con timestamps"""
    try:
        logger.info(f"🔍 [ENDPOINT] get_session_history called for {session_id} with user_id: {user_id}")
        
        # Resolver bucket
        project_id = settings.PROJECT_ID
        bucket_name = None # Default to standard bucket
        
        if user_id:
            try:
                from app.services.users.user_service_simple import user_service_simple
                user = user_service_simple.get_user_by_id(user_id)
                if user and user.colegios:
                     from app.services.storage_service import storage_service
                     bucket_name = storage_service.get_school_bucket_name(user.colegios[0])
                     logger.info(f"🪣 [ENDPOINT] Resolved bucket for user {user_id}: {bucket_name}")
            except Exception as e:
                logger.warning(f"⚠️ [ENDPOINT] Error resolving school bucket for history retrieval {user_id}: {e}")

        # Cargar historial usando el nuevo método con timestamps
        logger.info(f"📖 [ENDPOINT] Loading history with timestamps from bucket: {bucket_name or 'default'}")
        history = await history_service.load_history_with_timestamps(session_id, bucket_name)
        logger.info(f"📊 [ENDPOINT] Loaded {len(history)} messages for session {session_id}")
        
        # El nuevo método ya devuelve el formato correcto con timestamps
        return history
    except Exception as e:
        logger.exception("❌ [ENDPOINT] Error getting session history")
        raise HTTPException(status_code=500, detail=str(e))

from app.services.protocols.protocol_execution_service import protocol_execution_service

@router.post("/complete-step")
async def complete_dynamic_protocol_step(
    session_id: str,
    case_id: str,
    step_id: int,
    notes: str = None
):
    """Completa un paso del protocolo dinámico extraído del RAG"""
    try:
        # Cargar protocolo dinámico
        protocol = await protocol_execution_service.load_dynamic_protocol(case_id, session_id)
        if not protocol:
            raise HTTPException(status_code=404, detail="No se encontró protocolo activo para este caso")
        
        # Marcar paso como completado
        step_found = False
        for step in protocol.steps:
            if step.id == step_id:
                step.status = "completed"
                step.completed_at = datetime.now().isoformat()
                step.notes = notes
                step_found = True
                break
        
        if not step_found:
            raise HTTPException(status_code=404, detail=f"Paso {step_id} no encontrado en el protocolo")
        
        # Activar siguiente paso
        next_step = None
        for step in protocol.steps:
            if step.status == "pending":
                step.status = "in_progress" 
                next_step = step
                break
        
        # Guardar protocolo actualizado
        await protocol_execution_service.save_dynamic_protocol(protocol)
        
        # SYNC: Actualizar también el documento del caso para que persista al recargar
        case_steps = []
        for step in protocol.steps:
            case_steps.append({
                "id": step.id,
                "titulo": step.title,
                "title": step.title,
                "descripcion": step.description,
                "description": step.description,
                "estado": "completado" if step.status == "completed" else ("en_progreso" if step.status == "in_progress" else "pendiente"),
                "status": step.status,
                "fecha": step.completed_at,
                "completed_at": step.completed_at,
                "notas": step.notes,
                "notes": step.notes,
                "estimated_time": step.estimated_time
            })
        
        case_service.update_case_system(case_id, {
            "pasosProtocolo": case_steps,
            "protocolSteps": case_steps
        })
        logger.info(f"✅ [COMPLETE-STEP] Synced protocol steps to case document: {case_id}")
        
        # Preparar respuesta
        response_message = f"✅ **Paso {step_id} completado exitosamente.**"
        
        if next_step:
            response_message += f"\n\n**Siguiente paso ({next_step.id}): {next_step.title}**\n\n{next_step.description}\n\n¿Has completado este paso? Cuando lo hayas hecho, confirmámelo para continuar con el siguiente."
        else:
            response_message += "\n\n🎉 **¡Protocolo completado!** Todos los pasos han sido realizados exitosamente."
            protocol.is_completed = True
            await protocol_execution_service.save_dynamic_protocol(protocol)
        
        return {
            "message": response_message,
            "protocol_completed": protocol.is_completed,
            "next_step": next_step.model_dump() if next_step else None,
            "protocol_name": protocol.protocol_name
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error completing protocol step")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/protocol/{session_id}/{case_id}")
async def get_dynamic_protocol(session_id: str, case_id: str):
    """Obtiene el protocolo dinámico extraído del RAG"""
    try:
        logger.info(f"🔍 [PROTOCOL] Loading protocol for session={session_id}, case={case_id}")
        protocol = await protocol_execution_service.load_dynamic_protocol(case_id, session_id)
        if not protocol:
            logger.warning(f"⚠️ [PROTOCOL] Protocol not found for case={case_id}")
            raise HTTPException(status_code=404, detail="No se encontró protocolo para este caso")
        
        # Obtener paso actual
        current_step = protocol_execution_service.get_current_dynamic_step(protocol)
        logger.info(f"✅ [PROTOCOL] Protocol loaded: {protocol.protocol_name}, steps={len(protocol.steps)}")
        
        return {
            "protocol": protocol.model_dump(),
            "current_step": current_step.model_dump() if current_step else None,
            "progress": {
                "completed_steps": len([s for s in protocol.steps if s.status == "completed"]),
                "total_steps": len(protocol.steps),
                "percentage": round((len([s for s in protocol.steps if s.status == "completed"]) / len(protocol.steps)) * 100, 1)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/protocol/generate")
async def generate_protocol_endpoint(
    case_id: str = Form(...),
    session_id: str = Form(...),
    user_id: str = Form(None)
):
    """
    Genera un protocolo adecuado para el caso analizando sus documentos adjuntos.
    1. Obtiene documentos del caso.
    2. Invoca ProtocolAgent para analizar y seleccionar/generar el protocolo.
    3. Guarda el resultado en el caso (Firestore).
    """
    try:
        logger.info(f"🚀 [PROTOCOL GEN] Starting protocol generation for case_id={case_id}, user_id={user_id}")
        
        # 1. Obtener documentos del caso (PDFs, TXTs) para contexto
        documents = case_service.get_case_documents(case_id)
        files_content = []
        
        # Filtrar documentos relevantes y preparar lista de URIs para el agente
        valid_extensions = ('.pdf', '.txt', '.png', '.jpg', '.jpeg')
        doc_uris = []
        
        for doc in documents:
            gcs_uri = doc.get('gcs_uri')
            if gcs_uri and gcs_uri.lower().endswith(valid_extensions):
                doc_uris.append(gcs_uri)
                logger.info(f"📄 [PROTOCOL GEN] Including document: {doc.get('name')}")

        if not doc_uris:
            logger.warning("⚠️ [PROTOCOL GEN] No documents found for analysis")
            # Podríamos lanzar error o dejar que el agente intente sin docs (probablemente fallará o alucinará)
        
        # 2. Invocar al ProtocolAgent
        from app.services.protocols.protocol_agent import protocol_agent
        from app.services.users.user_service_simple import user_service_simple
        from app.services.storage_service import storage_service
        
        # Resolver bucket del colegio
        # Necesitamos el ID del colegio del usuario dueño del caso
        case_data = case_service.get_case_by_id(case_id)
        school_name = "Colegio"
        bucket_name = None
        
        if case_data and case_data.owner_id:
            user = user_service_simple.get_user_by_id(case_data.owner_id)
            if user and user.colegios:
                school_id = user.colegios[0]
                
                # Obtener detalles del colegio para el nombre y bucket
                school = school_service.get_colegio_by_id(school_id)
                if school:
                    school_name = school.nombre
                    # Usar bucket del objeto colegio si existe, sino intentar resolverlo
                    bucket_name = school.bucket_name or storage_service.get_school_bucket_name(school_id)
                    logger.info(f"🏫 [PROTOCOL GEN] Resolved bucket: {bucket_name} for school {school_name}")
                else:
                    logger.warning(f"⚠️ [PROTOCOL GEN] School {school_id} not found for user {case_data.owner_id}")
                    bucket_name = storage_service.get_school_bucket_name(school_id)

        # 2.5 Construir contexto del caso para el agente
        case_context = ""
        if case_data:
            # Obtener información de involucrados
            involved_info = ""
            if case_data.involved and len(case_data.involved) > 0:
                involved_list = [f"- {p.name} ({p.role or 'Sin rol'})" for p in case_data.involved]
                involved_info = "\n".join(involved_list)
            else:
                involved_info = "No especificados"
            
            case_context = f"""
═══════════════════════════════════════════════════════════
CONTEXTO DEL CASO A PROCESAR
═══════════════════════════════════════════════════════════

**Título del Caso:** {case_data.title or 'Sin título'}
**Tipo de Caso:** {case_data.case_type or 'No especificado'}
**Estado:** {case_data.status or 'Abierto'}

**Descripción del Incidente:**
{case_data.description or 'Sin descripción disponible'}

**Personas Involucradas:**
{involved_info}

═══════════════════════════════════════════════════════════
"""
            logger.info(f"📋 [PROTOCOL GEN] Case context built: {case_data.title}")

        # Prompt específico con contexto del caso
        prompt = f"""{case_context}

INSTRUCCIÓN: Basándote en el CONTEXTO DEL CASO arriba y los documentos disponibles, DETERMINA y GENERA el protocolo oficial de convivencia escolar que debe aplicarse.

PASOS A SEGUIR:
1. Usa 'list_protocol_documents' para ver qué documentos hay disponibles
2. Identifica el documento más relevante (RICE, protocolo específico, etc.)
3. Usa 'read_protocol_document' para leer el contenido relevante
4. Usa la herramienta 'render_protocol' para generar la estructura del protocolo

REGLAS CRÍTICAS:
- SIEMPRE debes usar 'render_protocol' al final para generar los pasos
- Si no encuentras un protocolo específico, genera un "Protocolo General de Convivencia Escolar"
- NO pidas más información. Tu tarea es generar el protocolo AHORA con lo disponible.
- Basa tus pasos en el tipo de caso y la descripción proporcionada.
"""
        
        # Ejecutar agente - pasamos el contexto como parte del prompt
        response_text, _ = await protocol_agent.process_request(
            message=prompt,
            history=[],  # El contexto ya está en el prompt
            school_name=school_name,
            files=doc_uris,
            bucket_name=bucket_name,
            case_id=case_id,
            session_id=session_id,
            user_id=user_id
        )
        
        # 3. El ProtocolAgent y ProtocolExecutionService ya deberían haber interceptado y guardado
        # el protocolo dinámico si se usó 'render_protocol' correctamente.
        # Pero verificar si realmente se guardó un protocolo para este caso.
        
        protocol = await protocol_execution_service.load_dynamic_protocol(case_id, session_id)
        
        if not protocol:
            logger.error(f"❌ [PROTOCOL GEN] Agent failed to generate protocol. Agent said: {response_text}")
            raise HTTPException(status_code=422, detail=f"No se pudo generar un protocolo automático. Razón del agente: {response_text}")
            
        logger.info(f"✅ [PROTOCOL GEN] Protocol generated: {protocol.protocol_name}")
        
        # 4. Actualizar el caso con el protocolo generado para que el frontend lo vea reflejado
        # en los campos 'protocol' y 'pasosProtocolo' (para compatibilidad)
        
        # Convertir pasos a formato simple para el frontend/caso
        simple_steps = []
        for step in protocol.steps:
            simple_steps.append({
                "id": step.id,
                "titulo": step.title,
                "descripcion": step.description,
                "estado": step.status if step.status else "pending",
                "status": step.status if step.status else "pending", 
                "estimated_time": step.estimated_time
            })
            
        update_data = {
            "protocol": protocol.protocol_name,
            "protocolo": protocol.protocol_name, # Legacy support
            "pasosProtocolo": simple_steps,
            "protocolSteps": simple_steps # Redundancy for robust frontend handling
        }
        
        case_service.update_case_system(case_id, update_data)
        logger.info(f"💾 [PROTOCOL GEN] Case updated with new protocol data")

        return {
            "status": "success",
            "protocol_name": protocol.protocol_name,
            "steps_count": len(simple_steps)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error generating protocol")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_file(request: Request):
    """
    Upload multiple files concurrently to GCS for chat attachments.
    Handles both single and multiple files in one request.
    
    Limit: Maximum 50MB per file
    
    session_id and case_id are optional - a session_id will be generated if not provided.
    """
    import asyncio
    import time
    import uuid
    from starlette.datastructures import UploadFile as StarletteUploadFile
    
    # Parse the multipart form data manually
    form = await request.form()
    
    # Extract files - check for both 'file' and 'files' keys
    files = []
    
    # Method 1: Try to get from 'files' key (multiple)
    if 'files' in form:
        files_data = form.getlist('files')
        for f in files_data:
            if hasattr(f, 'filename'):  # It's a file
                files.append(f)
    
    # Method 2: Try to get from 'file' key (single)
    if 'file' in form and not files:
        file_data = form.get('file')
        if hasattr(file_data, 'filename'):  # It's a file
            files.append(file_data)
    
    # Method 3: If still no files, scan all form values for file objects
    if not files:
        for key, value in form.items():
            if hasattr(value, 'filename'):  # It's a file
                files.append(value)
    
    session_id = form.get('session_id')
    case_id = form.get('case_id')
    
    # Debug logging
    logger.info(f"🔍 [UPLOAD DEBUG] Endpoint called successfully!")
    logger.info(f"🔍 [UPLOAD DEBUG] Form keys: {list(form.keys())}")
    logger.info(f"🔍 [UPLOAD DEBUG] Received files: {len(files)}")
    if files:
        logger.info(f"🔍 [UPLOAD DEBUG] File names: {[f.filename for f in files]}")
    logger.info(f"🔍 [UPLOAD DEBUG] session_id: {session_id}")
    logger.info(f"🔍 [UPLOAD DEBUG] case_id: {case_id}")
    
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    # Generate session_id if not provided
    if not session_id:
        session_id = str(uuid.uuid4())
        logger.info(f"📝 [UPLOAD] Generated new session_id: {session_id}")
    
    start_time = time.time()
    logger.info(f"📤 [BATCH_UPLOAD] Receiving {len(files)} file(s) for session_id={session_id}, case_id={case_id}")
    
    # Initialize storage client and bucket ONCE for all files (major optimization)
    settings = get_settings()
    project_id = settings.PROJECT_ID
    bucket_name = f"{project_id}-chat-sessions"
    
    # Create storage client once (reused for all uploads)
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    
    # Ensure bucket exists (only check once for batch)
    if not bucket.exists():
        await asyncio.to_thread(
            storage_client.create_bucket,
            bucket_name,
            location=settings.VERTEX_LOCATION or "us-central1"
        )
    
    async def upload_single_file(file: UploadFile) -> dict:
        """Upload one file to GCS asynchronously"""
        file_start = time.time()
        try:
            logger.info(f"📦 [UPLOAD] Processing: {file.filename}")
            
            # Read file content
            content = await file.read()
            size_mb = len(content) / (1024 * 1024)
            
            logger.info(f"📊 [UPLOAD] File size: {size_mb:.2f}MB, Limit: {settings.MAX_FILE_SIZE_MB}MB")
            
            # Validate file size
            if size_mb > settings.MAX_FILE_SIZE_MB:
                logger.warning(f"❌ [UPLOAD] File too large: {file.filename} ({size_mb:.1f}MB)")
                return {
                    "filename": file.filename,
                    "status": "error",
                    "error": f"File exceeds {settings.MAX_FILE_SIZE_MB}MB limit"
                }
            
            # Normalize filename
            safe_filename = unicodedata.normalize('NFC', file.filename)
            blob_name = f"{session_id}/{safe_filename}"
            blob = bucket.blob(blob_name)  # Reuse bucket from outer scope
            
            # Upload to GCS in thread pool (non-blocking)
            upload_start = time.time()
            await asyncio.to_thread(
                blob.upload_from_string,
                content,
                content_type=file.content_type
            )
            upload_time = time.time() - upload_start
            
            gcs_uri = f"gs://{bucket_name}/{blob_name}"
            logger.info(f"✅ [UPLOAD] GCS upload complete in {upload_time:.2f}s: {file.filename}")
            
            # Save to Firestore if case_id provided (also non-blocking)
            if case_id:
                from app.services.case_service import case_service
                file_data = {
                    "name": file.filename,
                    "gcs_uri": gcs_uri,
                    "size": len(content),
                    "content_type": file.content_type,
                    "session_id": session_id
                }
                
                # Run Firestore save in thread pool
                await asyncio.to_thread(
                    case_service.save_single_document,
                    case_id,
                    file_data,
                    source="chat"
                )
                logger.info(f"💾 [UPLOAD] Metadata saved to Firestore: {file.filename}")
            
            total_time = time.time() - file_start
            logger.info(f"⏱️ [UPLOAD] Total time for {file.filename}: {total_time:.2f}s")
            
            return {
                "filename": file.filename,
                "status": "uploaded",
                "gcs_uri": gcs_uri,
                "session_id": session_id
            }
            
        except Exception as e:
            logger.error(f"❌ [UPLOAD] Error uploading {file.filename}: {e}")
            return {
                "filename": file.filename,
                "status": "error",
                "error": str(e)
            }
    
    try:
        # Upload all files concurrently
        upload_tasks = [upload_single_file(file) for file in files]
        results = await asyncio.gather(*upload_tasks)
        
        total_time = time.time() - start_time
        
        # Separate successful and failed uploads
        successful = [r for r in results if r["status"] == "uploaded"]
        failed = [r for r in results if r["status"] == "error"]
        
        logger.info(f"📊 [BATCH_UPLOAD] Complete: {len(successful)}/{len(files)} successful in {total_time:.2f}s")
        
        if failed:
            logger.warning(f"⚠️ [BATCH_UPLOAD] {len(failed)} file(s) failed: {[f['filename'] for f in failed]}")
        
        # If single file upload, return old format for backward compatibility
        if len(files) == 1:
            return results[0]
        
        # Multiple files: return batch format
        return {
            "total": len(files),
            "successful": len(successful),
            "failed": len(failed),
            "results": results,
            "total_time": round(total_time, 2)
        }
        
        raise
    except Exception as e:
        logger.error(f"❌ [BATCH_UPLOAD] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Batch upload failed: {str(e)}")


@router.post("/upload/chunk")
async def upload_chunk(
    file: UploadFile = File(...),
    chunk_index: int = Form(...),
    upload_id: str = Form(...),
    session_id: str = Form(...)
):
    """Sube un chunk de un archivo grande"""
    try:
        import asyncio
        logger.info(f"💾 [CHUNK] Received chunk {chunk_index} for {upload_id}")
        
        try:
            from app.services.storage_service import storage_service
        except ImportError as ie:
            logger.error(f"❌ [CHUNK] Import Error: {ie}")
            raise HTTPException(status_code=500, detail=f"Storage service import failed: {ie}")

        settings = get_settings()
        bucket_name = f"{settings.PROJECT_ID}-chat-sessions"
        logger.info(f"ℹ️ [CHUNK] Target bucket: {bucket_name}")
        
        # Leer contenido
        content = await file.read()
        logger.info(f"📦 [CHUNK] Read content size: {len(content)} bytes")
        
        # Subir a GCS usando el servicio
        result = await asyncio.to_thread(
            storage_service.upload_chunk_to_gcs,
            bucket_name,
            upload_id,
            chunk_index,
            content
        )
        logger.info(f"✅ [CHUNK] Upload result: {result}")
        
        return {"status": "success", "chunk_index": chunk_index}
    except Exception as e:
        logger.error(f"❌ Error uploading chunk {chunk_index}: {e}")
        # Print stack trace in logs
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")

@router.post("/upload/complete")
async def complete_chunked_upload(
    upload_id: str = Form(...),
    filename: str = Form(...),
    total_chunks: int = Form(...),
    session_id: str = Form(...),
    case_id: Optional[str] = Form(None),
    content_type: str = Form("application/pdf")
):
    """Finaliza carga por chunks y crea archivo final"""
    try:
        import asyncio
        from app.services.storage_service import storage_service
        settings = get_settings()
        bucket_name = f"{settings.PROJECT_ID}-chat-sessions"
        
        # Ruta destino
        safe_filename = unicodedata.normalize('NFC', filename)
        target_path = f"{session_id}/{safe_filename}"
        
        # Componer chunks
        logger.info(f"🔄 Completing upload {upload_id} -> {target_path} ({total_chunks} chunks)")
        
        gcs_uri = await asyncio.to_thread(
            storage_service.compose_chunks,
            bucket_name,
            upload_id,
            total_chunks,
            target_path,
            content_type
        )
        
        # Obtener tamaño real
        file_size = await asyncio.to_thread(
            storage_service.get_file_size,
            bucket_name,
            target_path
        )
        
        # Save to Firestore if case_id provided
        if case_id:
            from app.services.case_service import case_service
            
            file_data = {
                "name": filename,
                "gcs_uri": gcs_uri,
                "content_type": content_type,
                "session_id": session_id,
                "upload_method": "chunked",
                "size": file_size
            }
            
            await asyncio.to_thread(
                case_service.save_single_document,
                case_id,
                file_data,
                source="chat"
            )
        
        return {
            "status": "uploaded",
            "filename": filename,
            "gcs_uri": gcs_uri,
            "session_id": session_id,
            "size": file_size
        }
    except Exception as e:
        logger.error(f"❌ Error completing upload {upload_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload/signed-url")
async def get_upload_signed_url(request: SignedURLRequest):
    """
    Generates a Signed URL for direct upload to GCS.
    Used for large files (>30MB) to bypass Cloud Run limits.
    """
    try:
        from app.services.storage_service import storage_service
        import unicodedata
        import uuid
        
        # Ensure session_id
        session_id = request.session_id or str(uuid.uuid4())
        
        # Normalize filename
        safe_filename = unicodedata.normalize('NFC', request.filename)
        blob_name = f"{session_id}/{safe_filename}"
        
        # Generate signed URL
        upload_url = storage_service.generate_upload_signed_url(
            blob_name=blob_name,
            content_type=request.content_type
        )
        
        # Construct the final GCS URI that the frontend will get upon successful upload
        # We need the bucket name here. Storage service encapsulates it, but we know it follows a pattern.
        # Ideally storage_service should expose it or return it.
        # For now, we reconstruct it using same logic as storage_service or ask it.
        # Re-using logic from chat_service/storage_service default:
        project_id = settings.PROJECT_ID
        bucket_name = f"{project_id}-chat-sessions" # Default session bucket
        gcs_uri = f"gs://{bucket_name}/{blob_name}"
        
        return {
            "upload_url": upload_url,
            "gcs_uri": gcs_uri,
            "session_id": session_id,
            "filename": request.filename
        }
        
    except Exception as e:
        logger.error(f"❌ [SIGNED_URL] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload/register")
async def register_file(request: RegisterFileRequest):
    """
    Registers a file uploaded directly to GCS via Signed URL.
    Saves metadata to Firestore (case_documents).
    """
    try:
        from app.services.case_service import case_service

        logger.info(f"📝 [REGISTER] Registering file: {request.filename} ({request.size} bytes)")
        
        file_data = {
            "name": request.filename,
            "gcs_uri": request.gcs_uri,
            "content_type": request.content_type,
            "session_id": request.session_id,
            "size": request.size
        }
        
        # Save document (case_id can be None for session-only files)
        # We use a wrapper or ensure save_single_document handles None case_id
        # (It was updated in previous step to allow Optional[str])
        doc_id = await asyncio.to_thread(
            case_service.save_single_document,
            request.case_id,
            file_data,
            source="chat"
        )
        
        if not doc_id:
             raise HTTPException(status_code=500, detail="Failed to register document in Firestore")

        return {
            "status": "registered",
            "doc_id": doc_id,
            "filename": request.filename,
            "gcs_uri": request.gcs_uri
        }

    except Exception as e:
        logger.error(f"❌ [REGISTER] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/files/{identifier}/{filename}")
async def get_file(identifier: str, filename: str):
    """
    Servicio de archivos optimizado desde GCS con caché y llamadas API reducidas.
    Soporta búsqueda automática por session_id o case_id con fallback inteligente.
    
    Args:
        identifier: session_id o case_id (detectado automáticamente)
        filename: nombre del archivo
    """
    try:
        from urllib.parse import unquote
        from google.cloud import firestore
        import io
        
        # Decodificar URL del nombre de archivo (maneja %20 para espacios, etc.)
        decoded_filename = unquote(filename)
        
        logger.info(f"📂 [FILE SERVE] identifier={identifier}, filename={decoded_filename}")
        
        # Inicializar cliente de Storage
        storage_client = storage.Client()
        
        bucket_name = None
        blob_path = None
        blob = None
        
        # ESTRATEGIA 1: Intentar bucket por defecto (ruta rápida para archivos de chat)
        project_id = settings.PROJECT_ID
        default_bucket_name = f"{project_id}-chat-sessions"
        default_blob_path = f"{identifier}/{decoded_filename}"
        
        bucket = storage_client.bucket(default_bucket_name)
        blob = bucket.blob(default_blob_path)
        
        try:
            blob.reload()
            bucket_name = default_bucket_name
            blob_path = default_blob_path
            logger.info(f"✅ [FILE SERVE] Found in default bucket: {bucket_name}/{blob_path}")
        except Exception:
            # ESTRATEGIA 2: Buscar en Firestore por session_id
            logger.info(f"🔍 [FILE SERVE] Not in default bucket, searching Firestore by session_id")
            db = firestore.Client(project=settings.PROJECT_ID, database=settings.FIRESTORE_DATABASE)
            docs_ref = db.collection("case_documents")
            query = docs_ref.where("session_id", "==", identifier).where("name", "==", decoded_filename)
            documents = list(query.stream())
            
            if documents:
                # Encontrado por session_id
                data = documents[0].to_dict()
                gcs_uri = data.get("gcs_uri", "")
                
                if gcs_uri.startswith("gs://"):
                    parts = gcs_uri.replace("gs://", "").split("/", 1)
                    bucket_name = parts[0]
                    blob_path = parts[1] if len(parts) > 1 else f"{identifier}/{decoded_filename}"
                    
                    bucket = storage_client.bucket(bucket_name)
                    blob = bucket.blob(blob_path)
                    blob.reload()
                    logger.info(f"✅ [FILE SERVE] Found via Firestore (session_id): {bucket_name}/{blob_path}")
                else:
                    raise HTTPException(status_code=404, detail="Invalid GCS URI in metadata")
            else:
                # ESTRATEGIA 3: Fallback - buscar en Firestore por case_id
                logger.info(f"🔍 [FILE SERVE] Not found by session_id, trying case_id fallback")
                query = docs_ref.where("case_id", "==", identifier).where("name", "==", decoded_filename)
                documents = list(query.stream())
                
                if documents:
                    # Encontrado por case_id
                    data = documents[0].to_dict()
                    gcs_uri = data.get("gcs_uri", "")
                    
                    if gcs_uri.startswith("gs://"):
                        parts = gcs_uri.replace("gs://", "").split("/", 1)
                        bucket_name = parts[0]
                        blob_path = parts[1] if len(parts) > 1 else decoded_filename
                        
                        bucket = storage_client.bucket(bucket_name)
                        blob = bucket.blob(blob_path)
                        blob.reload()
                        logger.info(f"✅ [FILE SERVE] Found via Firestore (case_id): {bucket_name}/{blob_path}")
                    else:
                        raise HTTPException(status_code=404, detail="Invalid GCS URI in metadata")
                else:
                    # No encontrado en ninguna estrategia
                    raise HTTPException(status_code=404, detail=f"File not found: {decoded_filename}")
        
        # Determinar tipo de contenido desde metadatos del blob (ya cargados)
        content_type = blob.content_type
        if not content_type or content_type == "application/octet-stream":
            content_type, _ = mimetypes.guess_type(decoded_filename)
            if not content_type:
                content_type = "application/octet-stream"
        
        # Descargar archivo directamente en memoria (más rápido para archivos pequeños como resultados OCR)
        file_data = blob.download_as_bytes()
        logger.info(f"📦 [FILE SERVE] Downloaded {len(file_data)} bytes")
        
        # RFC 5987 encoding para headers (Safe for Latin-1 fallback + UTF-8 modern browsers)
        filename_ascii = unicodedata.normalize('NFKD', decoded_filename).encode('ascii', 'ignore').decode('ascii')
        
        headers = {
            "Content-Disposition": f"inline; filename=\"{filename_ascii}\"; filename*=UTF-8''{quote(decoded_filename)}",
            "Cache-Control": "public, max-age=31536000, immutable",  # Caché por 1 año (archivos nunca cambian)
            "Content-Length": str(len(file_data)),  # Especificar tamaño exacto
        }
        
        # Retornar datos del archivo directamente en una sola respuesta (sin chunking)
        return Response(
            content=file_data,
            media_type=content_type,
            headers=headers
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error serving file {identifier}/{filename}")
        raise HTTPException(status_code=500, detail=str(e))




@router.get("/sessions/{session_id}/files")
async def get_session_files(session_id: str):
    """
    Returns all files uploaded in a session from Firestore case_documents collection.
    Falls back to searching by case_id if no files found for session_id.
    Also checks if session belongs to a case and includes case files.
    """
    try:
        from google.cloud import firestore
        
        db = firestore.Client(project=settings.PROJECT_ID, database=settings.FIRESTORE_DATABASE)
        docs_ref = db.collection("case_documents")
        
        # ESTRATEGIA 1: Query files by session_id
        query = docs_ref.where("session_id", "==", session_id)
        documents = list(query.stream())
        logger.info(f"📂 [SESSION_FILES] Found {len(documents)} files for session_id={session_id}")
        
        # ESTRATEGIA 2: Si no hay archivos por session_id, tal vez el identifier ES un case_id
        if len(documents) == 0:
            logger.info(f"🔍 [SESSION_FILES] No files for session_id, trying case_id fallback")
            query = docs_ref.where("case_id", "==", session_id)
            documents = list(query.stream())
            logger.info(f"📂 [SESSION_FILES] Found {len(documents)} files for case_id={session_id}")
        else:
            # ESTRATEGIA 3: Si encontramos archivos por session_id, verificar si la sesión pertenece a un caso
            # y agregar también los archivos del caso
            logger.info(f"🔍 [SESSION_FILES] Checking if session belongs to a case")
            
            # Verificar si hay un case_id en alguno de los documentos encontrados
            case_ids = set()
            for doc in documents:
                data = doc.to_dict()
                if data.get("case_id"):
                    case_ids.add(data.get("case_id"))
            
            # Si la sesión está asociada a algún caso, agregar TODOS los archivos del caso
            for case_id in case_ids:
                logger.info(f"📦 [SESSION_FILES] Session associated with case {case_id}, fetching all case files")
                case_query = docs_ref.where("case_id", "==", case_id)
                case_docs = list(case_query.stream())
                
                # Agregar documentos del caso que no estén ya en la lista
                existing_ids = {doc.id for doc in documents}
                for case_doc in case_docs:
                    if case_doc.id not in existing_ids:
                        documents.append(case_doc)
                        logger.info(f"  + Added case file: {case_doc.to_dict().get('name')}")
        
        files = []
        for doc in documents:
            data = doc.to_dict()
            
            # Extract session_id and filename from gcs_uri
            gcs_uri = data.get("gcs_uri", "")
            filename = data.get("name", "file")
            
            # Extract the actual session_id from gcs_uri for URL construction
            actual_session_id = session_id
            if gcs_uri.startswith("gs://"):
                parts = gcs_uri.split("/")
                if len(parts) >= 4:
                    actual_session_id = parts[-2]  # Second to last part is session_id from GCS path
            
            # Construct the URL for serving the file
            # The get_file endpoint will handle fallback to case_id automatically
            file_url = f"/chat/files/{actual_session_id}/{quote(filename)}"
            
            files.append({
                "id": data.get("id", doc.id),
                "name": filename,
                "size": data.get("size_bytes", 0),  # Use size_bytes (number) not size (string)
                "type": data.get("content_type", "application/octet-stream"),
                "url": file_url,
                "gcs_uri": gcs_uri,
                "uploaded_at": data.get("uploaded_at").isoformat() if data.get("uploaded_at") else None
            })
        
        logger.info(f"✅ [SESSION_FILES] Returning {len(files)} files")
        return {"files": files}
    except Exception as e:
        logger.exception("Error listing session files from Firestore")
        raise HTTPException(status_code=500, detail=str(e))

