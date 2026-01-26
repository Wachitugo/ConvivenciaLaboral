import uuid
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from google.cloud import firestore
from app.core.config import get_settings
from app.schemas.student import Student, StudentCreate, StudentUpdate

logger = logging.getLogger(__name__)
settings = get_settings()

class StudentService:
    """Servicio para gestión de estudiantes en Firestore"""
    
    def __init__(self):
        self.project_id = settings.PROJECT_ID
        self._db = None
        self.collection_name = "students"

    @property
    def db(self):
        if self._db is None:
            self._db = firestore.Client(
                project=self.project_id,
                database=settings.FIRESTORE_DATABASE
            )
        return self._db

    def create_student(self, student_data: StudentCreate) -> Student:
        """Crea un nuevo estudiante"""
        try:
            # Check if student exists (by RUT and School ID)
            # This prevents duplicates within the same school
            existing = self.get_student_by_rut(student_data.rut, student_data.colegio_id)
            if existing:
                # Update existing instead of erroring? Or throw error?
                # For bulk uploads, we might want to update.
                # For now, let's update if exists
                logger.info(f"Student {student_data.rut} exists, updating...")
                return self.update_student(existing.id, StudentUpdate(**student_data.model_dump()))

            student_id = str(uuid.uuid4())
            now = datetime.utcnow()
            
            student_dict = student_data.model_dump()
            student_dict["id"] = student_id
            student_dict["created_at"] = now
            student_dict["updated_at"] = now
            
            self.db.collection(self.collection_name).document(student_id).set(student_dict)
            
            logger.info(f"Student created: {student_id} - {student_data.nombres} {student_data.apellidos}")
            return Student(**student_dict)
            
        except Exception as e:
            logger.exception("Error creating student")
            raise

    def get_students_by_colegio(self, colegio_id: str) -> List[Student]:
        """Obtiene todos los estudiantes de un colegio"""
        try:
            query = self.db.collection(self.collection_name).where("colegio_id", "==", colegio_id)
            docs = query.stream()
            
            students = []
            for doc in docs:
                try:
                    students.append(Student(**doc.to_dict()))
                except Exception as e:
                    logger.warning(f"Error validating student {doc.id}: {e}")
            
            # Sort by name
            students.sort(key=lambda s: f"{s.apellidos} {s.nombres}")
            return students
            
        except Exception as e:
            logger.exception(f"Error getting students for school {colegio_id}")
            return []

    def get_student_by_rut(self, rut: str, colegio_id: str) -> Optional[Student]:
        """Busca estudiante por RUT y Colegio ID"""
        try:
            query = self.db.collection(self.collection_name)\
                .where("colegio_id", "==", colegio_id)\
                .where("rut", "==", rut)\
                .limit(1)
            
            docs = list(query.stream())
            if docs:
                return Student(**docs[0].to_dict())
            return None
        except Exception as e:
            logger.error(f"Error searching student by RUT: {e}")
            return None

    def update_student(self, student_id: str, update_data: StudentUpdate) -> Optional[Student]:
        """Actualiza un estudiante"""
        try:
            doc_ref = self.db.collection(self.collection_name).document(student_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                return None
            
            update_dict = update_data.model_dump(exclude_unset=True)
            if not update_dict:
                return Student(**doc.to_dict())
                
            update_dict["updated_at"] = datetime.utcnow()
            doc_ref.update(update_dict)
            
            updated_doc = doc_ref.get()
            return Student(**updated_doc.to_dict())
            
        except Exception as e:
            logger.exception(f"Error updating student {student_id}")
            raise

    def delete_student(self, student_id: str) -> bool:
        """Elimina un estudiante"""
        try:
            doc_ref = self.db.collection(self.collection_name).document(student_id)
            doc_ref.delete()
            logger.info(f"Student deleted: {student_id}")
            return True
        except Exception as e:
            logger.exception(f"Error deleting student {student_id}")
            raise

    def bulk_create_students(self, students_data: List[StudentCreate]) -> Dict[str, Any]:
        """Carga masiva de estudiantes (optimizada para batchs grandes)"""
        try:
            batch = self.db.batch()
            created_count = 0
            updated_count = 0
            errors = []
            
            # Limite de Firestore batch es 500 operaciones
            # Implementamos particionado simple si es necesario, pero asumimos <500 por ahora
            # O mejor, procesamos uno a uno o en chunks pequeños si son muchos
            
            # Para simplificar y manejar duplicados correctamente (RUT check), 
            # hacemos check + write secuencial o usamos transaction si fuera critico.
            # Dado que es carga masiva, checkeo uno a uno es lento.
            # Mejor estrategia: iterar y upsert.
            
            results = {
                "total": len(students_data),
                "created": 0,
                "updated": 0,
                "failed": 0,
                "errors": []
            }
            
            for student_data in students_data:
                try:
                    # Check existing locally to avoid N reads? No, need to read DB.
                    # Optimization: create ID from RUT deterministic hash? 
                    # No, better stick to query for safety.
                    
                    existing = self.get_student_by_rut(student_data.rut, student_data.colegio_id)
                    
                    now = datetime.utcnow()
                    
                    if existing:
                        # Update
                        update_dict = student_data.model_dump()
                        update_dict["updated_at"] = now
                        # Don't change created_at or ID
                        del update_dict["colegio_id"] # Don't allow moving schools implicitly?
                        
                        self.update_student(existing.id, StudentUpdate(**student_data.model_dump()))
                        results["updated"] += 1
                    else:
                        # Create
                        self.create_student(student_data)
                        results["created"] += 1
                        
                except Exception as e:
                    results["failed"] += 1
                    results["errors"].append(f"RUT {student_data.rut}: {str(e)}")
            
            return results

        except Exception as e:
            logger.exception("Error in bulk create students")
            raise

student_service = StudentService()
