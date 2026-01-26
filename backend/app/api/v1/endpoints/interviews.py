from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from typing import List, Optional, Dict
import logging
from app.api.dependencies import get_current_user
from app.schemas.user import Usuario
from app.schemas.interview import Interview, InterviewCreate, InterviewUpdate
from app.services.interview_service import interview_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=Interview)
async def create_new_interview(
    interview: InterviewCreate,
    current_user: Usuario = Depends(get_current_user)
):
    if interview.school_id not in current_user.colegios:
        raise HTTPException(status_code=403, detail="User not authorized for this school")
    
    return interview_service.create_interview(interview, current_user.id)

@router.get("/", response_model=List[Interview])
async def list_interviews(
    school_id: str,
    course: Optional[str] = None,
    current_user: Usuario = Depends(get_current_user)
):
    if school_id not in current_user.colegios:
        raise HTTPException(status_code=403, detail="User not authorized for this school")

    logger.debug(f"Listing interviews for user_id={current_user.id}, school_id={school_id}")
    return interview_service.list_interviews(school_id, owner_id=current_user.id, course=course)

@router.get("/school/{school_id}", response_model=List[Interview])
async def list_all_interviews_by_school(
    school_id: str,
    course: Optional[str] = None,
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene TODAS las entrevistas de un colegio sin filtrar por usuario.
    Endpoint para Directivos que necesitan ver estadísticas globales.
    """
    if school_id not in current_user.colegios:
        raise HTTPException(status_code=403, detail="User not authorized for this school")

    logger.debug(f"Listing ALL interviews for school_id={school_id}")
    return interview_service.list_interviews(school_id, owner_id=None, course=course)

@router.get("/summary", response_model=dict)
async def get_summary(
    school_id: str,
    course: Optional[str] = None,
    current_user: Usuario = Depends(get_current_user)
):
    if school_id not in current_user.colegios:
        raise HTTPException(status_code=403, detail="User not authorized for this school")
    
    summary = await interview_service.generate_global_summary(school_id, course)
    return {"summary": summary}
    
@router.post("/{interview_id}/audio", response_model=Interview)
async def upload_interview_audio(
    interview_id: str,
    file: UploadFile = File(...),
    current_user: Usuario = Depends(get_current_user)
):
    iv = interview_service.get_interview(interview_id)
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    if iv.school_id not in current_user.colegios:
        raise HTTPException(status_code=403, detail="User not authorized for this school")

    # Determine content type (default to mp3 if not provided)
    content_type = file.content_type or "audio/mp3"
    content = await file.read()
    return await interview_service.upload_audio(interview_id, content, content_type)

@router.post("/{interview_id}/signature", response_model=Interview)
async def upload_interview_signature(
    interview_id: str,
    signer_type: str = Form(...), # student, guardian, interviewer
    file: UploadFile = File(...),
    signer_name: str = Form(None),
    current_user: Usuario = Depends(get_current_user)
):
    iv = interview_service.get_interview(interview_id)
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    if iv.school_id not in current_user.colegios:
        raise HTTPException(status_code=403, detail="User not authorized for this school")

    content = await file.read()
    return interview_service.upload_signature(interview_id, content, signer_type, signer_name)

@router.post("/{interview_id}/attachment", response_model=Interview)
async def upload_interview_attachment(
    interview_id: str,
    file: UploadFile = File(...),
    current_user: Usuario = Depends(get_current_user)
):
    iv = interview_service.get_interview(interview_id)
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    if iv.school_id not in current_user.colegios:
        raise HTTPException(status_code=403, detail="User not authorized for this school")

    content = await file.read()
    # Use file.filename or generate one
    filename = file.filename or "attachment"
    content_type = file.content_type or "application/octet-stream"
    return await interview_service.upload_attachment(interview_id, content, filename, content_type)
    
@router.get("/{interview_id}", response_model=Interview)
async def get_interview_detail(
    interview_id: str,
    current_user: Usuario = Depends(get_current_user)
):
    iv = interview_service.get_interview(interview_id)
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    if iv.school_id not in current_user.colegios:
        raise HTTPException(status_code=403, detail="User not authorized for this school")
        
    return iv

@router.patch("/{interview_id}", response_model=Interview)
async def update_interview(
    interview_id: str,
    interview_update: InterviewUpdate,
    current_user: Usuario = Depends(get_current_user)
):
    iv = interview_service.get_interview(interview_id)
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    if iv.school_id not in current_user.colegios:
        raise HTTPException(status_code=403, detail="User not authorized for this school")

    updated_interview = interview_service.update_interview(interview_id, interview_update)
    return updated_interview

@router.post("/{interview_id}/summary", response_model=Dict[str, str])
async def generate_interview_summary_endpoint(interview_id: str):
    """Genera un resumen AI de la entrevista especifica (audio + adjuntos)."""
    try:
        summary = await interview_service.generate_interview_summary(interview_id)
        return {"summary": summary}
    except ValueError as e:
         raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("Error generating interview summary")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.delete("/{interview_id}/audio", response_model=Interview)
async def delete_interview_audio(
    interview_id: str,
    current_user: Usuario = Depends(get_current_user)
):
    iv = interview_service.get_interview(interview_id)
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    if iv.school_id not in current_user.colegios:
        raise HTTPException(status_code=403, detail="User not authorized for this school")

    return await interview_service.delete_audio_file(interview_id)

@router.delete("/{interview_id}/attachment/{attachment_id}", response_model=Interview)
async def delete_interview_attachment(
    interview_id: str,
    attachment_id: str,
    current_user: Usuario = Depends(get_current_user)
):
    iv = interview_service.get_interview(interview_id)
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    if iv.school_id not in current_user.colegios:
        raise HTTPException(status_code=403, detail="User not authorized for this school")

    return await interview_service.delete_attachment(interview_id, attachment_id)

@router.delete("/{interview_id}/signature", response_model=Interview)
async def delete_interview_signature(
    interview_id: str,
    signer_type: Optional[str] = Query(None, description="student | guardian | interviewer"),
    signature_id: Optional[str] = Query(None),
    current_user: Usuario = Depends(get_current_user)
):
    iv = interview_service.get_interview(interview_id)
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found")

    if iv.school_id not in current_user.colegios:
        raise HTTPException(status_code=403, detail="User not authorized for this school")

    try:
        updated = interview_service.delete_signature(interview_id, signer_type, signature_id)
        return updated
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting signature: {e}")

@router.post("/{interview_id}/associate-case", response_model=Interview)
async def associate_interview_to_case(
    interview_id: str,
    case_id: str = Query(..., description="ID del caso a asociar"),
    current_user: Usuario = Depends(get_current_user)
):
    """Asocia una entrevista autorizada a un caso existente y transfiere todos sus archivos."""
    iv = interview_service.get_interview(interview_id)
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found")

    if iv.school_id not in current_user.colegios:
        raise HTTPException(status_code=403, detail="User not authorized for this school")

    # Validar que la entrevista esté autorizada
    if iv.status != "Autorizada":
        raise HTTPException(status_code=400, detail="Only authorized interviews can be associated with cases")

    # Transferir archivos de la entrevista al caso
    try:
        await interview_service.transfer_interview_files_to_case(interview_id, case_id)
        logger.info(f"Files transferred from interview {interview_id} to case {case_id}")
    except Exception as e:
        logger.exception(f"Error transferring files from interview to case")
        raise HTTPException(status_code=500, detail=f"Error transferring files: {str(e)}")

    # Actualizar la entrevista con el case_id
    update_data = InterviewUpdate(case_id=case_id)
    updated_interview = interview_service.update_interview(interview_id, update_data)

    return updated_interview

@router.delete("/{interview_id}", status_code=204)
async def delete_interview(
    interview_id: str,
    current_user: Usuario = Depends(get_current_user)
):
    """Elimina una entrevista y todos sus archivos asociados (audio, adjuntos, firmas)."""
    iv = interview_service.get_interview(interview_id)
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found")

    if iv.school_id not in current_user.colegios:
        raise HTTPException(status_code=403, detail="User not authorized for this school")

    try:
        await interview_service.delete_interview(interview_id)
        logger.info(f"Interview {interview_id} deleted by user {current_user.id}")
        return
    except Exception as e:
        logger.exception(f"Error deleting interview {interview_id}")
        raise HTTPException(status_code=500, detail=f"Error deleting interview: {str(e)}")
