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
