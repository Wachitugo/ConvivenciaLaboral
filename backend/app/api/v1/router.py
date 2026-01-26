from fastapi import APIRouter
from app.api.v1.endpoints import health, chat, cases, protocols, auth, users, schools, dashboard, interviews, students, commitments, paec, token_dashboard


api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(schools.router, prefix="/schools", tags=["schools"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(cases.router, prefix="/cases", tags=["cases"])
api_router.include_router(protocols.router, prefix="/protocols", tags=["protocols"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(interviews.router, prefix="/interviews", tags=["interviews"])
api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(commitments.router, prefix="/commitments", tags=["commitments"])
api_router.include_router(paec.router, prefix="/paec", tags=["paec"])
api_router.include_router(token_dashboard.router, prefix="/tokens", tags=["tokens"])
