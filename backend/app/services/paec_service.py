import uuid
import logging
from datetime import datetime
from typing import List, Optional
from google.cloud import firestore
from google.cloud.firestore import FieldFilter

from app.core.config import get_settings
from app.schemas.paec_record import PaecRecord, PaecRecordCreate, PaecRecordUpdate

logger = logging.getLogger(__name__)
settings = get_settings()

class PaecService:
    def __init__(self):
        self._db = None
        self.collection_name = "paec_records"

    @property
    def db(self):
        if self._db is None:
            self._db = firestore.Client(project=settings.PROJECT_ID, database=settings.FIRESTORE_DATABASE)
        return self._db

    def create_paec_record(self, record_in: PaecRecordCreate) -> PaecRecord:
        """Crea un nuevo registro PAEC."""
        record_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        data = record_in.model_dump()
        data.update({
            "id": record_id,
            "created_at": now,
            "updated_at": now
        })
        
        self.db.collection(self.collection_name).document(record_id).set(data)
        return PaecRecord(**data)

    def get_paec_records_by_student(self, student_id: str) -> List[PaecRecord]:
        """Obtiene todos los registros PAEC de un estudiante."""
        try:
            query = self.db.collection(self.collection_name)\
                .where(filter=FieldFilter("student_id", "==", student_id))\
                .order_by("entry_date", direction=firestore.Query.DESCENDING)
            
            docs = query.stream()
            return [PaecRecord(**doc.to_dict()) for doc in docs]
        except Exception as e:
            logger.error(f"Error getting PAEC records for student {student_id}: {e}")
            return []

    def update_paec_record(self, record_id: str, updates: PaecRecordUpdate) -> Optional[PaecRecord]:
        """Actualiza un registro PAEC."""
        ref = self.db.collection(self.collection_name).document(record_id)
        doc = ref.get()
        if not doc.exists:
            return None
            
        update_data = updates.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        ref.update(update_data)
        
        updated_doc = ref.get()
        return PaecRecord(**updated_doc.to_dict())

    def delete_paec_record(self, record_id: str) -> bool:
        """Elimina un registro PAEC."""
        try:
            self.db.collection(self.collection_name).document(record_id).delete()
            return True
        except Exception as e:
            logger.error(f"Error deleting PAEC record {record_id}: {e}")
            return False

paec_service = PaecService()
