from fastapi import APIRouter, Depends, Query, HTTPException
import logging
from typing import List, Optional
from datetime import datetime, timedelta
import calendar
from google.cloud import firestore

from app.core.config import get_settings
from app.api.dependencies import get_current_user
from app.services.case_service import case_service
from app.services.chat.history_service import history_service


logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()

@router.get("/daily-stats")
async def get_daily_activity_stats(
    user_id: str = Query(..., description="ID del usuario para filtrar consultas"),
    colegio_id: str = Query(..., description="ID del colegio para filtrar casos"),
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000, le=2100)
):
    """
    Obtiene estadísticas diarias de consultas y casos creados.
    Si no se especifica mes/año, usa el mes actual.
    """
    now = datetime.now()
    target_month = month or now.month
    target_year = year or now.year
    
    # Rango de fechas para el mes
    _, last_day = calendar.monthrange(target_year, target_month)
    start_date = datetime(target_year, target_month, 1)
    end_date = datetime(target_year, target_month, last_day, 23, 59, 59)
    
    # Inicializar contadores para todos los días del mes
    daily_stats = {}
    for day in range(1, last_day + 1):
        date_key = f"{target_year}-{target_month:02d}-{day:02d}"
        daily_stats[date_key] = {
            "date": date_key,
            "day": day,
            "consultations": 0,
            "cases": 0
        }

    try:
        # 1. Obtener CASOS creados en el rango
        # Nota: Firestore no soporta bien filtros de rango + igualdad en campos diferentes sin índice compuesto.
        # Por simplicidad y volumen esperado, traemos casos del colegio y filtramos en memoria por fecha si es necesario
        # o intentamos filtro directo si existe índice.
        
        # Opción segura: Traer casos del colegio recientes (optimización posible: limitar o usar fetch por fecha)
        # Como case_service.get_cases_for_user es complejo, usaremos query directa por colegio_id aquí
        # asumiendo que el usuario tiene permiso (validar si es necesario)
        
        # Vamos a usar una query directa a la colección de cases
        cases_ref = case_service.db.collection(case_service.collection_name)
        # Filtrar por colegio es crítico
        query = cases_ref.where(filter=firestore.FieldFilter("colegio_id", "==", colegio_id))
        
        # Intento de filtrar por fecha en query (puede requerir índice)
        # query = query.where(filter=firestore.FieldFilter("created_at", ">=", start_date))\
        #              .where(filter=firestore.FieldFilter("created_at", "<=", end_date))
        
        docs = query.stream()
        
        for doc in docs:
            data = doc.to_dict()
            created_at = data.get("created_at")
            
            # created_at puede ser string o datetime
            if isinstance(created_at, str):
                try:
                    created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                except:
                    continue
            
            if created_at:
                # Asegurar timezone naive para comparación simple o convertir todo
                # Simplificación: comparar año y mes
                if created_at.year == target_year and created_at.month == target_month:
                    date_key = f"{target_year}-{target_month:02d}-{created_at.day:02d}"
                    if date_key in daily_stats:
                        daily_stats[date_key]["cases"] += 1

        # 2. Obtener CONSULTAS (Sesiones de chat)
        # Usamos history_service.list_sessions filtrando por usuario
        sessions = await history_service.list_sessions(user_id=user_id)
        
        for session in sessions:
            # session['timestamp'] o session['date']
            # list_sessions devuelve 'date' formateada y a veces 'timestamp'
            # Si no viene timestamp, tratar de parsear date o usar 'updated_at' si estuviera disponible raw
            
            # En history_service.list_sessions_firestore (que se usa si hay user_id):
            # devuelve "timestamp": data.get("updated_at")
            
            ts = session.get("timestamp")
            
            if ts:
                # ts es datetime (con timezone posiblemente)
                if ts.year == target_year and ts.month == target_month:
                    date_key = f"{target_year}-{target_month:02d}-{ts.day:02d}"
                    if date_key in daily_stats:
                        daily_stats[date_key]["consultations"] += 1
            else:
                # Fallback parseando string fecha "DD/MM/YYYY" si es 'Reciente' se ignora o cuenta hoy
                date_str = session.get("date")
                if date_str and date_str != "Reciente":
                    try:
                        d_obj = datetime.strptime(date_str, "%d/%m/%Y")
                        if d_obj.year == target_year and d_obj.month == target_month:
                            date_key = f"{target_year}-{target_month:02d}-{d_obj.day:02d}"
                            if date_key in daily_stats:
                                daily_stats[date_key]["consultations"] += 1
                    except:
                        pass
                elif date_str == "Reciente":
                     # Asumimos hoy para "Reciente" (o ignoramos)
                     pass

        # Convertir a lista ordenada
        result = list(daily_stats.values())
        result.sort(key=lambda x: x["date"])
        
        return result

    except Exception as e:
        logger.info(f"Error generating daily stats: {e}")
        # En caso de error, devolver lista vacía o error 500
        # return []
        raise HTTPException(status_code=500, detail=str(e))
