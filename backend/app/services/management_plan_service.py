import logging
import uuid
from datetime import datetime
from typing import List, Optional
from google.cloud import firestore
from google.cloud.firestore_v1.base_query import FieldFilter
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class ManagementPlanService:
    def __init__(self):
        self._db = None
        self.collection_name = "management_plans"

    @property
    def db(self):
        if self._db is None:
            self._db = firestore.Client(project=settings.PROJECT_ID, database=settings.FIRESTORE_DATABASE)
        return self._db

    def get_plans_by_school(self, school_id: str) -> List[dict]:
        """Obtiene todos los planes de gestión (historial) para una empresa"""
        try:
            logger.info(f"🔍 [PLAN] Fetching all management plans for school: {school_id}")
            plans_ref = self.db.collection(self.collection_name).where(
                filter=FieldFilter("school_id", "==", school_id)
            )
            plans_docs = list(plans_ref.stream())

            plans = []
            for doc in plans_docs:
                data = doc.to_dict()
                data["id"] = doc.id
                plans.append(data)

            def get_sort_date(p):
                d = p.get("updated_at")
                if not d:
                    return datetime.min.replace(tzinfo=None)
                if isinstance(d, datetime):
                    return d.replace(tzinfo=None) if d.tzinfo else d
                if isinstance(d, str):
                    try:
                        return datetime.fromisoformat(d.replace('Z', '+00:00')).replace(tzinfo=None)
                    except Exception:
                        pass
                return datetime.min.replace(tzinfo=None)

            plans.sort(key=get_sort_date, reverse=True)
            return plans
        except Exception as e:
            logger.error(f"❌ [PLAN] Error getting management plans: {e}")
            return []

    def get_plan_by_id(self, plan_id: str) -> Optional[dict]:
        """Obtiene un plan de gestión específico por su ID de documento"""
        try:
            logger.info(f"🔍 [PLAN] Fetching specific plan version: {plan_id}")
            doc_ref = self.db.collection(self.collection_name).document(plan_id)
            doc = doc_ref.get()

            if not doc.exists:
                logger.warning(f"⚠️ [PLAN] Plan version not found: {plan_id}")
                return None

            data = doc.to_dict()
            data["id"] = doc.id
            return data
        except Exception as e:
            logger.error(f"❌ [PLAN] Error getting plan by ID {plan_id}: {e}")
            return None

    def get_plan_by_school(self, school_id: str) -> Optional[dict]:
        """Obtiene el plan de gestión actual (más reciente) para una empresa"""
        plans = self.get_plans_by_school(school_id)
        if not plans:
            return None
        return plans[0]

    def save_plan(self, school_id: str, plan_data: dict, force_new: bool = False) -> str:
        """Guarda o actualiza el plan de gestión para una empresa"""
        try:
            tasks = plan_data.get("tasks", [])
            force_new = force_new or plan_data.get("force_new", False)

            logger.info(f"💾 [PLAN] Saving plan for school: {school_id}. Tasks: {len(tasks)}, force_new: {force_new}")

            data_to_save = plan_data.copy()
            data_to_save["school_id"] = school_id
            data_to_save["updated_at"] = datetime.now()

            if "force_new" in data_to_save:
                del data_to_save["force_new"]
            if "id" in data_to_save:
                del data_to_save["id"]

            if not force_new:
                existing_plan = self.get_plan_by_school(school_id)
                if existing_plan:
                    plan_id = existing_plan["id"]
                    logger.info(f"📝 [PLAN] Updating latest version {plan_id}")
                    self.db.collection(self.collection_name).document(plan_id).update(data_to_save)
                    return plan_id

            logger.info(f"🆕 [PLAN] Creating new plan version/snapshot")
            data_to_save["created_at"] = datetime.now()
            if "id" in data_to_save:
                del data_to_save["id"]

            doc_ref = self.db.collection(self.collection_name).document()
            doc_ref.set(data_to_save)
            logger.info(f"✅ [PLAN] New version created: {doc_ref.id}")
            return doc_ref.id

        except Exception as e:
            logger.error(f"❌ [PLAN] Error saving management plan: {e}")
            raise e


management_plan_service = ManagementPlanService()
