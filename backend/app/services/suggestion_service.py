import uuid
import logging
from datetime import datetime
from typing import List, Optional
from google.cloud import firestore
from google.cloud.firestore import FieldFilter
from app.core.config import get_settings
from app.schemas.suggestion import Sugerencia, SugerenciaCreate, SugerenciaUpdate

logger = logging.getLogger(__name__)
settings = get_settings()


class SugerenciaService:
    def __init__(self):
        self._db = None
        self.collection_name = "sugerencias"

    @property
    def db(self):
        if self._db is None:
            self._db = firestore.Client(project=settings.PROJECT_ID, database=settings.FIRESTORE_DATABASE)
        return self._db

    def get_sugerencias(self, colegio_id: Optional[str] = None, estado: Optional[str] = None) -> List[Sugerencia]:
        try:
            query = self.db.collection(self.collection_name)
            if colegio_id:
                query = query.where(filter=FieldFilter("colegio_id", "==", colegio_id))
            if estado:
                query = query.where(filter=FieldFilter("estado", "==", estado))
            docs = query.stream()
            sugerencias = []
            for doc in docs:
                data = doc.to_dict()
                data.setdefault("votos", [])
                sugerencias.append(Sugerencia(**data))
            sugerencias.sort(key=lambda x: x.created_at, reverse=True)
            return sugerencias
        except Exception as e:
            logger.error(f"Error getting sugerencias: {e}")
            return []

    def create_sugerencia(self, sugerencia_in: SugerenciaCreate) -> Sugerencia:
        try:
            doc_id = str(uuid.uuid4())
            now = datetime.utcnow()
            data = sugerencia_in.model_dump()
            data.update({
                "id": doc_id,
                "estado": "pendiente",
                "votos": [],
                "created_at": now,
            })
            self.db.collection(self.collection_name).document(doc_id).set(data)
            logger.info(f"Sugerencia created: {doc_id}")
            return Sugerencia(**data)
        except Exception as e:
            logger.error(f"Error creating sugerencia: {e}")
            raise e

    def toggle_vote(self, sugerencia_id: str, user_id: str) -> Optional[Sugerencia]:
        try:
            doc_ref = self.db.collection(self.collection_name).document(sugerencia_id)
            doc = doc_ref.get()
            if not doc.exists:
                return None
            data = doc.to_dict()
            votos = data.get("votos", [])
            if user_id in votos:
                votos.remove(user_id)
            else:
                votos.append(user_id)
            doc_ref.update({"votos": votos})
            data["votos"] = votos
            return Sugerencia(**data)
        except Exception as e:
            logger.error(f"Error toggling vote: {e}")
            raise e

    def update_sugerencia(self, sugerencia_id: str, sugerencia_in: SugerenciaUpdate) -> Optional[Sugerencia]:
        try:
            doc_ref = self.db.collection(self.collection_name).document(sugerencia_id)
            doc = doc_ref.get()
            if not doc.exists:
                return None
            update_data = sugerencia_in.model_dump(exclude_unset=True)
            doc_ref.update(update_data)
            updated = doc_ref.get()
            data = updated.to_dict()
            data.setdefault("votos", [])
            return Sugerencia(**data)
        except Exception as e:
            logger.error(f"Error updating sugerencia: {e}")
            raise e

    def delete_sugerencia(self, sugerencia_id: str) -> bool:
        try:
            self.db.collection(self.collection_name).document(sugerencia_id).delete()
            return True
        except Exception as e:
            logger.error(f"Error deleting sugerencia: {e}")
            return False


sugerencia_service = SugerenciaService()
