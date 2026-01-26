from fastapi import APIRouter, HTTPException, Depends, Query, File, UploadFile, Form
from typing import List, Dict, Any, Optional
from app.services.student_service import student_service
from app.services.bitacora_service import bitacora_service
from app.schemas.student import Student, StudentCreate
from app.schemas.bitacora import BitacoraEntry, BitacoraEntryCreate, BitacoraEntryList

router = APIRouter()

@router.post("/batch", response_model=Dict[str, Any])
async def batch_create_students(students: List[StudentCreate]):
    """
    Carga masiva de estudiantes.
    Si el estudiante (RUT) ya existe en el colegio, se actualiza.
    Si no existe, se crea.
    """
    try:
        if not students:
            raise HTTPException(status_code=400, detail="La lista de estudiantes no puede estar vacía")
            
        result = student_service.bulk_create_students(students)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/by-colegio/{colegio_id}", response_model=List[Student])
async def get_students_by_colegio(colegio_id: str):
    """Obtiene la lista de estudiantes de un colegio"""
    try:
        return student_service.get_students_by_colegio(colegio_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{student_id}", response_model=Student)
async def update_student(student_id: str, student_in: StudentCreate):
    """Actualiza un estudiante existente"""
    try:
        # Note: We reuse StudentCreate for simplicity, or create a specific StudentUpdate schema if partial updates are needed.
        # StudentCreate requires most fields, which is safer for now.
        from app.schemas.student import StudentUpdate
        # We need StudentUpdate for partial updates or just use StudentCreate as full update?
        # Service expects StudentUpdate. Let's use StudentCreate as input but handle strictness.
        # Actually proper way is StudentUpdate schema.
        
        updated_student = student_service.update_student(student_id, student_in)
        if not updated_student:
             raise HTTPException(status_code=404, detail="Estudiante no encontrado")
        return updated_student
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{student_id}")
async def delete_student(student_id: str):
    """Elimina un estudiante"""
    try:
        success = student_service.delete_student(student_id)
        if not success:
             raise HTTPException(status_code=404, detail="Estudiante no encontrado")
        return {"message": "Estudiante eliminado correctamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{student_id}/stats")
async def get_student_stats(student_id: str):
    """
    Get aggregated stats for a student
    """
    try:
        from app.services.case_service import CaseService
        case_service = CaseService()
        
        # Get base stats from cases
        stats = case_service.get_student_stats(student_id)
        
        # Get real commitment count
        from app.services.commitment_service import commitment_service
        commitments = commitment_service.get_commitments_by_student(student_id)
        active_commitments = sum(1 for c in commitments if c.status == "vigente" or c.status == "proximo_a_vencer")
        
        stats["compromisosActivos"] = active_commitments
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{student_id}/cases")
async def get_student_cases(student_id: str):
    try:
        from app.services.case_service import CaseService
        case_service = CaseService()
        return case_service.get_cases_by_student(student_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{student_id}/interviews")
async def get_student_interviews(student_id: str):
    try:
        # This assumes we have a method to get interviews by student in InterviewService
        from app.services.interview_service import InterviewService
        interview_service = InterviewService()
        return interview_service.get_interviews_by_student(student_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== BITACORA ENDPOINTS ====================

@router.get("/{student_id}/bitacora", response_model=List[BitacoraEntry])
async def get_student_bitacora(student_id: str, school_id: str = Query(...)):
    """
    Obtiene todas las entradas de bitácora de un estudiante
    """
    try:
        entries = bitacora_service.get_entries_by_student(student_id, school_id)
        return entries
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{student_id}/bitacora/text", response_model=BitacoraEntry)
async def create_bitacora_text_entry(
    student_id: str,
    school_id: str = Form(...),
    author_id: str = Form(...),
    author_name: str = Form(...),
    content: str = Form(...)
):
    """
    Crea una entrada de texto en la bitácora del estudiante
    """
    try:
        if not content.strip():
            raise HTTPException(status_code=400, detail="El contenido no puede estar vacío")

        entry = bitacora_service.create_text_entry(
            student_id=student_id,
            school_id=school_id,
            author_id=author_id,
            author_name=author_name,
            content=content.strip()
        )
        return entry
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{student_id}/bitacora/audio", response_model=BitacoraEntry)
async def create_bitacora_audio_entry(
    student_id: str,
    file: UploadFile = File(...),
    school_id: str = Form(...),
    author_id: str = Form(...),
    author_name: str = Form(...),
    duration: int = Form(0)
):
    """
    Crea una entrada de audio en la bitácora del estudiante.
    El audio se transcribe automáticamente en background.
    """
    try:
        # Validar tipo de archivo
        content_type = file.content_type or "audio/webm"
        if not content_type.startswith("audio/"):
            raise HTTPException(status_code=400, detail="El archivo debe ser de audio")

        # Leer contenido del archivo
        audio_data = await file.read()

        # Validar tamaño (max 50MB)
        if len(audio_data) > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="El archivo es demasiado grande (máx 50MB)")

        entry = await bitacora_service.create_audio_entry(
            student_id=student_id,
            school_id=school_id,
            author_id=author_id,
            author_name=author_name,
            audio_data=audio_data,
            content_type=content_type,
            duration=duration
        )
        return entry
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{student_id}/bitacora/{entry_id}", response_model=BitacoraEntry)
async def get_bitacora_entry(student_id: str, entry_id: str):
    """
    Obtiene una entrada específica de la bitácora
    """
    try:
        entry = bitacora_service.get_entry_by_id(entry_id)
        if not entry:
            raise HTTPException(status_code=404, detail="Entrada no encontrada")
        if entry.student_id != student_id:
            raise HTTPException(status_code=404, detail="Entrada no encontrada")
        return entry
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{student_id}/bitacora/{entry_id}")
async def delete_bitacora_entry(student_id: str, entry_id: str, school_id: str = Query(...)):
    """
    Elimina una entrada de la bitácora
    """
    try:
        entry = bitacora_service.get_entry_by_id(entry_id)
        if not entry:
            raise HTTPException(status_code=404, detail="Entrada no encontrada")
        if entry.student_id != student_id:
            raise HTTPException(status_code=404, detail="Entrada no encontrada")

        success = bitacora_service.delete_entry(entry_id, school_id)
        if not success:
            raise HTTPException(status_code=500, detail="Error al eliminar la entrada")

        return {"message": "Entrada eliminada correctamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
