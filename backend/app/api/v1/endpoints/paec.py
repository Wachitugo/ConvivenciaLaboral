from fastapi import APIRouter, HTTPException, Depends
from typing import List

from app.schemas.paec_record import PaecRecord, PaecRecordCreate, PaecRecordUpdate
from app.services.paec_service import paec_service

router = APIRouter()

@router.post("/", response_model=PaecRecord)
async def create_paec_record(record_in: PaecRecordCreate):
    """Crea un nuevo registro en la ficha PAEC."""
    try:
        return paec_service.create_paec_record(record_in)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/by-student/{student_id}", response_model=List[PaecRecord])
async def get_student_paec_records(student_id: str):
    """Obtiene el historial PAEC de un estudiante."""
    try:
        return paec_service.get_paec_records_by_student(student_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{record_id}", response_model=PaecRecord)
async def update_paec_record(record_id: str, updates: PaecRecordUpdate):
    """Actualiza un registro PAEC."""
    try:
        updated = paec_service.update_paec_record(record_id, updates)
        if not updated:
            raise HTTPException(status_code=404, detail="Registro no encontrado")
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{record_id}")
async def delete_paec_record(record_id: str):
    """Elimina un registro PAEC."""
    try:
        success = paec_service.delete_paec_record(record_id)
        if not success:
            raise HTTPException(status_code=404, detail="Registro no encontrado")
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
