from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from firebase_admin import firestore

from app.services.users.user_service import user_service
from app.services.school_service import school_service
from app.api import dependencies # Assuming dependencies module handles auth
from app.schemas.user import Usuario, Colegio, UsuarioUpdate, ColegioUpdate

router = APIRouter()

class LimitUpdateRequest(BaseModel):
    id: str # user_id or school_id
    type: str # "user" or "school"
    token_limit: Optional[int] = None
    input_token_limit: Optional[int] = None
    output_token_limit: Optional[int] = None
    warning_thresholds: Optional[List[int]] = None

@router.get("/stats/global")
async def get_global_stats(
    current_user: Usuario = Depends(dependencies.require_active_user)
):
    """
    Obtiene estadísticas globales de tokens.
    Solo administradores (si se implementara rol de admin global, por ahora abierto a roles con permiso dashboard).
    """
    # TODO: Validar permisos de admin si es necesario.
    
    # Calcular sumando todos los usuarios (fuente de verdad más granular), incluyendo inactivos
    users = user_service.get_all_users(include_inactive=True)
    colegios = school_service.get_all_colegios()
    
    total_input = 0
    total_output = 0
    total_tokens = 0
    
    for user in users:
        if user.token_usage:
            total_input += user.token_usage.input_tokens
            total_output += user.token_usage.output_tokens
            total_tokens += user.token_usage.total_tokens
            
    return {
        "total_input_tokens": total_input,
        "total_output_tokens": total_output,
        "total_tokens": total_tokens,
        "school_count": len(colegios),
        "user_count": len(users)
    }

@router.get("/stats/schools")
async def get_schools_stats(
    current_user: Usuario = Depends(dependencies.require_active_user)
):
    """Listado de colegios con su consumo y límites."""
    colegios = school_service.get_all_colegios()
    # Retornar lista directa, el frontend procesará la tabla
    return colegios

@router.get("/stats/users")
async def get_users_stats(
    current_user: Usuario = Depends(dependencies.require_active_user)
):
    """Listado de usuarios con su consumo y límites."""
    users = user_service.get_all_users()
    return users

@router.post("/limits")
async def update_limits(
    request: LimitUpdateRequest,
    current_user: Usuario = Depends(dependencies.require_active_user)
):
    """Actualiza límites de tokens y alertas."""
    
    # Simulación de verificación de rol admin
    # if current_user.rol != "admin": ...
    
    if request.type == "user":
        update_data = UsuarioUpdate(
            token_limit=request.token_limit,
            input_token_limit=request.input_token_limit,
            output_token_limit=request.output_token_limit,
            warning_thresholds=request.warning_thresholds
        )
        updated = user_service.update_user(request.id, update_data)
        if not updated:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return updated
        
    elif request.type == "school":
        update_data = ColegioUpdate(
            token_limit=request.token_limit,
            input_token_limit=request.input_token_limit,
            output_token_limit=request.output_token_limit,
            warning_thresholds=request.warning_thresholds
        )
        updated = school_service.update_colegio(request.id, update_data)
        if not updated:
            raise HTTPException(status_code=404, detail="Colegio no encontrado")
        return updated
        
    else:
        raise HTTPException(status_code=400, detail="Tipo inválido (user/school)")

@router.get("/stats/history")
async def get_token_history(
    period: str = "7d",
    user_id: Optional[str] = None,
    school_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: Usuario = Depends(dependencies.require_active_user)
):
    """
    Obtiene historial de consumo agrupado por día.
    period: "7d" o "30d"
    Filtros opcionales: user_id, school_id
    """
    from datetime import datetime, timedelta, timezone
    from app.services.users.user_service import user_service
    
    # Determinacion de fechas
    now = datetime.now(timezone.utc)
    query_start_date = None
    query_end_date = now

    if start_date:
        try:
             query_start_date = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except ValueError:
             # Fallback or error (assuming ISO)
             query_start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
             if not query_start_date.tzinfo:
                 query_start_date = query_start_date.replace(tzinfo=timezone.utc)

    if end_date:
        try:
             # Set to end of day if only date provided
             dt = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
             query_end_date = dt.replace(hour=23, minute=59, second=59)
        except ValueError:
             query_end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
             if not query_end_date.tzinfo:
                 query_end_date = query_end_date.replace(tzinfo=timezone.utc)

    if not query_start_date:
        days_back = 30 if period == "30d" else 7
        query_start_date = now - timedelta(days=days_back)
    
    # Calculate days for initialization
    delta = query_end_date - query_start_date
    total_days = delta.days + 1
    
    try:
        daily_stats = {}
        
        # Initialize dictionary
        for i in range(total_days):
            date_key = (query_start_date + timedelta(days=i)).strftime("%Y-%m-%d")
            daily_stats[date_key] = {
                "date": date_key,
                "input_tokens": 0,
                "output_tokens": 0,
                "total_tokens": 0,
                "count": 0
            }

        if user_id:
            # Case 1: Filter by specific User
            logs_stream = user_service.db.collection("usuarios").document(user_id)\
                .collection("usage_logs")\
                .where("timestamp", ">=", query_start_date)\
                .where("timestamp", "<=", query_end_date)\
                .order_by("timestamp")\
                .stream()

        elif school_id:
            # Case 2: Filter by School
            # Query the school-specific logs (renamed to avoid collection_group collision)
            logs_stream = user_service.db.collection("colegios").document(school_id)\
                .collection("school_usage_logs")\
                .where("timestamp", ">=", query_start_date)\
                .where("timestamp", "<=", query_end_date)\
                .order_by("timestamp")\
                .stream()
        
        else:
            # Case 3: Global
            # Query ONLY "usage_logs" from collection group (which are User logs)
            # This avoids double counting if we had used same name for school logs
            # Case 3: Global
            logs_stream = user_service.db.collection_group("usage_logs")\
                .where("timestamp", ">=", query_start_date)\
                .where("timestamp", "<=", query_end_date)\
                .order_by("timestamp")\
                .stream()
            
        for doc in logs_stream:
            data = doc.to_dict()
            ts = data.get("timestamp")
            if ts:
                # Handle Firestore datetime or standard datetime
                date_str = ts.strftime("%Y-%m-%d")
                if date_str in daily_stats:
                    daily_stats[date_str]["input_tokens"] += data.get("input_tokens", 0)
                    daily_stats[date_str]["output_tokens"] += data.get("output_tokens", 0)
                    daily_stats[date_str]["total_tokens"] += data.get("total_tokens", 0)
                    daily_stats[date_str]["count"] += 1
                    
        return sorted(daily_stats.values(), key=lambda x: x["date"])
        
    except Exception as e:
        print(f"Error fetching history: {e}")
        # Return empty list on error to not break UI
        return []
@router.get("/stats/logs")
async def get_token_logs(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: Optional[str] = None,
    school_id: Optional[str] = None,
    limit: int = 50,
    current_user: Usuario = Depends(dependencies.require_active_user)
):
    """
    Obtiene logs detallados de consumo.
    """
    from datetime import datetime, timedelta, timezone
    from app.services.users.user_service import user_service
    
    # Determinacion de fechas
    now = datetime.now(timezone.utc)
    query_start_date = None
    query_end_date = now

    if start_date:
        try:
             query_start_date = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except ValueError:
             query_start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
             if not query_start_date.tzinfo:
                 query_start_date = query_start_date.replace(tzinfo=timezone.utc)

    if end_date:
        try:
             dt = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
             query_end_date = dt.replace(hour=23, minute=59, second=59)
        except ValueError:
             query_end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
             if not query_end_date.tzinfo:
                 query_end_date = query_end_date.replace(tzinfo=timezone.utc)

    if not query_start_date:
        query_start_date = now - timedelta(days=7) # Default 7 days
    
    try:
        if user_id:
            query = user_service.db.collection("usuarios").document(user_id)\
                .collection("usage_logs")
        elif school_id:
            query = user_service.db.collection("colegios").document(school_id)\
                .collection("school_usage_logs")
        else:
            # Global view: usage_logs from collection group
            query = user_service.db.collection_group("usage_logs")

        # Apply common date filters
        query = query.where("timestamp", ">=", query_start_date)\
                     .where("timestamp", "<=", query_end_date)\
                     .order_by("timestamp", direction=firestore.Query.DESCENDING)\
                     .limit(limit)

        docs = query.stream()
        logs = []
        for doc in docs:
            data = doc.to_dict()
            if "timestamp" in data and data["timestamp"]:
                # Convert Firestore datetime to ISO string for JSON response
                data["timestamp"] = data["timestamp"].isoformat()
            logs.append(data)
            
        return logs

    except Exception as e:
        print(f"Error fetching logs: {e}")
        return []
