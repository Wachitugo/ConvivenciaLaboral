from fastapi import APIRouter
from app.core.config import get_settings

router = APIRouter()

@router.get("/health")
async def health():
    s = get_settings()
    return {"status": "ok", "app": s.APP_NAME}

@router.get("/")
async def health_root():
    return {"status": "ok", "message": "Health endpoint is working"}
