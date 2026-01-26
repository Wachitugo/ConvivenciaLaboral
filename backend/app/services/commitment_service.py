import uuid
import logging
from datetime import datetime
from typing import List, Optional
from google.cloud import firestore
from google.cloud.firestore import FieldFilter
from app.core.config import get_settings
from app.schemas.commitment import Commitment, CommitmentCreate, CommitmentUpdate

logger = logging.getLogger(__name__)
settings = get_settings()

class CommitmentService:
    def __init__(self):
        self._db = None
        self.collection_name = "commitments"

    @property
    def db(self):
        if self._db is None:
            self._db = firestore.Client(project=settings.PROJECT_ID, database=settings.FIRESTORE_DATABASE)
        return self._db

    def create_commitment(self, commitment_in: CommitmentCreate) -> Commitment:
        try:
            doc_id = str(uuid.uuid4())
            now = datetime.utcnow()
            
            commitment_data = commitment_in.model_dump()
            commitment_data.update({
                "id": doc_id,
                "created_at": now,
                "updated_at": now
            })
            
            self.db.collection(self.collection_name).document(doc_id).set(commitment_data)
            logger.info(f"Commitment created: {doc_id}")
            
            return Commitment(**commitment_data)
        except Exception as e:
            logger.error(f"Error creating commitment: {e}")
            raise e

    def get_commitments_by_student(self, student_id: str) -> List[Commitment]:
        try:
            docs = (
                self.db.collection(self.collection_name)
                .where(filter=FieldFilter("student_id", "==", student_id))
                .stream()
            )
            
            commitments = []
            for doc in docs:
                commitments.append(Commitment(**doc.to_dict()))
                
            # Sort by due_date descending (could be done in query with index)
            # For now sorting in memory
            commitments.sort(key=lambda x: x.due_date, reverse=True)
            
            return commitments
        except Exception as e:
            logger.error(f"Error getting commitments: {e}")
            return []

    def update_commitment(self, commitment_id: str, commitment_in: CommitmentUpdate) -> Optional[Commitment]:
        try:
            doc_ref = self.db.collection(self.collection_name).document(commitment_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                return None
                
            update_data = commitment_in.model_dump(exclude_unset=True)
            update_data["updated_at"] = datetime.utcnow()
            
            doc_ref.update(update_data)
            
            updated_doc = doc_ref.get()
            return Commitment(**updated_doc.to_dict())
        except Exception as e:
            logger.error(f"Error updating commitment: {e}")
            raise e

    def delete_commitment(self, commitment_id: str) -> bool:
        try:
            self.db.collection(self.collection_name).document(commitment_id).delete()
            return True
        except Exception as e:
            logger.error(f"Error deleting commitment: {e}")
            return False

commitment_service = CommitmentService()
