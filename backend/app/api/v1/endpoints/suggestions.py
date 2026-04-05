import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.schemas.suggestion import Sugerencia, SugerenciaCreate, SugerenciaUpdate, SugerenciaVote
from app.services.suggestion_service import sugerencia_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=List[Sugerencia])
async def get_sugerencias(
    colegio_id: Optional[str] = Query(None),
    estado: Optional[str] = Query(None),
):
    try:
        return sugerencia_service.get_sugerencias(colegio_id=colegio_id, estado=estado)
    except Exception as e:
        logger.exception("Error getting sugerencias")
        raise HTTPException(status_code=500, detail="Error interno")


@router.post("/", response_model=Sugerencia)
async def create_sugerencia(sugerencia: SugerenciaCreate):
    try:
        return sugerencia_service.create_sugerencia(sugerencia)
    except Exception as e:
        logger.exception("Error creating sugerencia")
        raise HTTPException(status_code=500, detail="Error interno")


@router.patch("/{sugerencia_id}/vote", response_model=Sugerencia)
async def vote_sugerencia(sugerencia_id: str, body: SugerenciaVote):
    result = sugerencia_service.toggle_vote(sugerencia_id, body.user_id)
    if not result:
        raise HTTPException(status_code=404, detail="Sugerencia no encontrada")
    return result


@router.patch("/{sugerencia_id}", response_model=Sugerencia)
async def update_sugerencia(sugerencia_id: str, body: SugerenciaUpdate):
    result = sugerencia_service.update_sugerencia(sugerencia_id, body)
    if not result:
        raise HTTPException(status_code=404, detail="Sugerencia no encontrada")
    return result


@router.delete("/{sugerencia_id}")
async def delete_sugerencia(sugerencia_id: str):
    success = sugerencia_service.delete_sugerencia(sugerencia_id)
    if not success:
        raise HTTPException(status_code=404, detail="Sugerencia no encontrada")
    return {"status": "success"}
