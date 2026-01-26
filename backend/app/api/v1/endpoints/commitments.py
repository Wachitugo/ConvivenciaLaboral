from typing import List
from fastapi import APIRouter, HTTPException, Depends
from app.schemas.commitment import Commitment, CommitmentCreate, CommitmentUpdate
from app.services.commitment_service import commitment_service

router = APIRouter()

@router.post("/", response_model=Commitment)
async def create_commitment(commitment: CommitmentCreate):
    try:
        return commitment_service.create_commitment(commitment)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/student/{student_id}", response_model=List[Commitment])
async def get_student_commitments(student_id: str):
    return commitment_service.get_commitments_by_student(student_id)

@router.patch("/{commitment_id}", response_model=Commitment)
async def update_commitment(commitment_id: str, commitment: CommitmentUpdate):
    updated = commitment_service.update_commitment(commitment_id, commitment)
    if not updated:
        raise HTTPException(status_code=404, detail="Commitment not found")
    return updated

@router.delete("/{commitment_id}")
async def delete_commitment(commitment_id: str):
    success = commitment_service.delete_commitment(commitment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Commitment not found or could not be deleted")
    return {"status": "success"}
