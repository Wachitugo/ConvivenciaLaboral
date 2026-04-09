from fastapi import APIRouter, HTTPException
import logging
from app.services.management_plan_service import management_plan_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/{school_id}")
async def get_management_plan(school_id: str):
    """Obtiene el plan de gestión de convivencia laboral de una empresa."""
    try:
        plan = management_plan_service.get_plan_by_school(school_id)
        if not plan:
            return {"status": "not_found", "plan": None}
        return {"status": "success", "plan": plan}
    except Exception as e:
        logger.exception(f"Error fetching plan for school {school_id}")
        raise HTTPException(status_code=500, detail="Error interno")


@router.get("/{school_id}/history")
async def get_plan_history(school_id: str):
    """Obtiene el historial de versiones del plan de gestión."""
    try:
        plans = management_plan_service.get_plans_by_school(school_id)
        history = []
        for p in plans:
            history.append({
                "id": p.get("id"),
                "title": p.get("title", "Sin título"),
                "year": p.get("year"),
                "updated_at": p.get("updated_at"),
                "created_at": p.get("created_at"),
                "isPublished": p.get("isPublished", False),
                "task_count": len(p.get("tasks", []))
            })
        return {"status": "success", "history": history}
    except Exception as e:
        logger.exception(f"Error fetching history for school {school_id}")
        raise HTTPException(status_code=500, detail="Error interno")


@router.get("/version/{plan_id}")
async def get_plan_version(plan_id: str):
    """Obtiene una versión específica del plan por su ID."""
    try:
        plan = management_plan_service.get_plan_by_id(plan_id)
        if not plan:
            raise HTTPException(status_code=404, detail="Plan version not found")
        return {"status": "success", "plan": plan}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.exception(f"Error fetching plan version {plan_id}")
        raise HTTPException(status_code=500, detail="Error interno")


@router.post("")
async def save_management_plan(payload: dict):
    """Guarda o actualiza el plan de gestión de convivencia laboral."""
    logger.info(f"📥 [PLANS_API] POST save plan. Keys: {list(payload.keys())}")
    try:
        school_id = payload.get("school_id")
        plan_data = payload.get("plan_data")
        force_new = payload.get("force_new", False)

        if not school_id or not plan_data:
            raise HTTPException(status_code=400, detail="school_id y plan_data son requeridos")

        plan_id = management_plan_service.save_plan(school_id, plan_data, force_new=force_new)
        return {"status": "success", "plan_id": plan_id}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.exception("Error saving management plan")
        raise HTTPException(status_code=500, detail="Error interno")
