"""
Servicio para gestión de Bitácora de estudiantes
"""
import logging
import uuid
import asyncio
from datetime import datetime, timedelta
from typing import List, Optional
from google.cloud import firestore
from app.core.config import get_settings
from app.schemas.bitacora import BitacoraEntry, BitacoraEntryCreate, BitacoraEntryType, TranscriptionStatus

logger = logging.getLogger(__name__)
settings = get_settings()


class BitacoraService:
    def __init__(self):
        self._db = None
        self._storage_service = None
        self._transcription_service = None

    @property
    def db(self):
        if self._db is None:
            self._db = firestore.Client(
                project=settings.PROJECT_ID,
                database=settings.FIRESTORE_DATABASE or "(default)"
            )
        return self._db

    @property
    def storage_service(self):
        if self._storage_service is None:
            from app.services.storage_service import StorageService
            self._storage_service = StorageService()
        return self._storage_service

    @property
    def transcription_service(self):
        if self._transcription_service is None:
            from app.services.transcription_service import transcription_service
            self._transcription_service = transcription_service
        return self._transcription_service

    def _get_school_bucket_name(self, school_id: str) -> str:
        """Genera el nombre del bucket del colegio"""
        short_id = school_id[:8].lower()
        return f"{settings.PROJECT_ID}-colegio-{short_id}"

    def get_entries_by_student(self, student_id: str, school_id: str) -> List[BitacoraEntry]:
        """
        Obtiene todas las entradas de bitácora de un estudiante
        """
        try:
            # Consulta simple para evitar problemas de índice
            entries_ref = (
                self.db.collection("bitacora_entries")
                .where("student_id", "==", student_id)
            )

            entries = []
            for doc in entries_ref.stream():
                data = doc.to_dict()
                # Filtrar por school_id en memoria
                if data.get("school_id") != school_id:
                    continue
                data["id"] = doc.id
                try:
                    entries.append(BitacoraEntry(**data))
                except Exception as parse_error:
                    logger.warning(f"Error parsing entry {doc.id}: {parse_error}")
                    continue

            # Ordenar por created_at en memoria (más reciente primero)
            entries.sort(key=lambda x: x.created_at, reverse=True)

            return entries

        except Exception as e:
            logger.error(f"Error getting bitacora entries: {e}")
            # Retornar lista vacía en lugar de fallar
            return []

    def create_text_entry(
        self,
        student_id: str,
        school_id: str,
        author_id: str,
        author_name: str,
        content: str
    ) -> BitacoraEntry:
        """
        Crea una entrada de texto en la bitácora
        """
        try:
            entry_id = str(uuid.uuid4())
            now = datetime.utcnow()

            entry_data = {
                "id": entry_id,
                "student_id": student_id,
                "school_id": school_id,
                "author_id": author_id,
                "author_name": author_name,
                "type": BitacoraEntryType.TEXT.value,
                "content": content,
                "created_at": now,
                "updated_at": now
            }

            self.db.collection("bitacora_entries").document(entry_id).set(entry_data)

            return BitacoraEntry(**entry_data)

        except Exception as e:
            logger.error(f"Error creating text entry: {e}")
            raise

    async def create_audio_entry(
        self,
        student_id: str,
        school_id: str,
        author_id: str,
        author_name: str,
        audio_data: bytes,
        content_type: str,
        duration: int = 0
    ) -> BitacoraEntry:
        """
        Crea una entrada de audio en la bitácora con transcripción automática
        """
        try:
            entry_id = str(uuid.uuid4())
            now = datetime.utcnow()

            # Determinar extensión del archivo
            ext_map = {
                "audio/webm": "webm",
                "audio/mp3": "mp3",
                "audio/mpeg": "mp3",
                "audio/mp4": "m4a",
                "audio/m4a": "m4a",
                "audio/wav": "wav",
                "audio/ogg": "ogg"
            }
            ext = ext_map.get(content_type, "webm")

            # Subir audio a GCS
            bucket_name = self._get_school_bucket_name(school_id)
            blob_path = f"bitacora/{student_id}/{entry_id}/audio.{ext}"

            from google.cloud import storage
            client = storage.Client(project=settings.PROJECT_ID)

            # Verificar si el bucket existe
            bucket = client.bucket(bucket_name)
            if not bucket.exists():
                logger.error(f"Bucket {bucket_name} does not exist for school {school_id}")
                raise Exception(f"El bucket del colegio no existe: {bucket_name}")

            blob = bucket.blob(blob_path)
            blob.upload_from_string(audio_data, content_type=content_type)

            # Intentar hacer público, pero no fallar si no se puede
            try:
                blob.make_public()
                audio_url = blob.public_url
            except Exception as public_error:
                logger.warning(f"Could not make blob public: {public_error}")
                # Generar URL firmada como alternativa
                audio_url = blob.generate_signed_url(expiration=timedelta(days=7))

            gcs_uri = f"gs://{bucket_name}/{blob_path}"

            entry_data = {
                "id": entry_id,
                "student_id": student_id,
                "school_id": school_id,
                "author_id": author_id,
                "author_name": author_name,
                "type": BitacoraEntryType.AUDIO.value,
                "audio_uri": gcs_uri,
                "audio_url": audio_url,
                "audio_size": len(audio_data),
                "duration": duration,
                "transcription": None,
                "transcription_status": TranscriptionStatus.PENDING.value,
                "created_at": now,
                "updated_at": now
            }

            self.db.collection("bitacora_entries").document(entry_id).set(entry_data)

            # Iniciar transcripción en background
            asyncio.create_task(
                self._transcribe_audio_background(
                    entry_id=entry_id,
                    gcs_uri=gcs_uri,
                    content_type=content_type,
                    user_id=author_id
                )
            )

            return BitacoraEntry(**entry_data)

        except Exception as e:
            logger.error(f"Error creating audio entry: {e}")
            raise

    async def _transcribe_audio_background(
        self,
        entry_id: str,
        gcs_uri: str,
        content_type: str,
        user_id: str
    ):
        """
        Transcribe el audio en background y actualiza la entrada
        """
        try:
            logger.info(f"Starting background transcription for entry {entry_id}")

            transcription = await self.transcription_service.transcribe_audio(
                audio_uri=gcs_uri,
                mime_type=content_type,
                user_id=user_id
            )

            # Actualizar entrada con la transcripción
            self.db.collection("bitacora_entries").document(entry_id).update({
                "transcription": transcription,
                "transcription_status": TranscriptionStatus.COMPLETED.value,
                "updated_at": datetime.utcnow()
            })

            logger.info(f"Transcription completed for entry {entry_id}")

        except Exception as e:
            logger.error(f"Error transcribing audio for entry {entry_id}: {e}")
            self.db.collection("bitacora_entries").document(entry_id).update({
                "transcription_status": TranscriptionStatus.ERROR.value,
                "updated_at": datetime.utcnow()
            })

    def get_entry_by_id(self, entry_id: str) -> Optional[BitacoraEntry]:
        """
        Obtiene una entrada específica por ID
        """
        try:
            doc = self.db.collection("bitacora_entries").document(entry_id).get()
            if not doc.exists:
                return None

            data = doc.to_dict()
            data["id"] = doc.id
            return BitacoraEntry(**data)

        except Exception as e:
            logger.error(f"Error getting entry {entry_id}: {e}")
            raise

    def delete_entry(self, entry_id: str, school_id: str) -> bool:
        """
        Elimina una entrada de bitácora
        """
        try:
            entry = self.get_entry_by_id(entry_id)
            if not entry:
                return False

            # Si es audio, eliminar archivo de GCS
            if entry.type == BitacoraEntryType.AUDIO and entry.audio_uri:
                try:
                    # Parsear GCS URI
                    gcs_path = entry.audio_uri.replace("gs://", "")
                    bucket_name = gcs_path.split("/")[0]
                    blob_path = "/".join(gcs_path.split("/")[1:])

                    from google.cloud import storage
                    client = storage.Client(project=settings.PROJECT_ID)
                    bucket = client.bucket(bucket_name)
                    blob = bucket.blob(blob_path)
                    blob.delete()
                    logger.info(f"Deleted audio file: {entry.audio_uri}")
                except Exception as storage_error:
                    logger.warning(f"Could not delete audio file: {storage_error}")

            # Eliminar documento de Firestore
            self.db.collection("bitacora_entries").document(entry_id).delete()
            return True

        except Exception as e:
            logger.error(f"Error deleting entry {entry_id}: {e}")
            raise

    def update_entry_content(self, entry_id: str, content: str) -> Optional[BitacoraEntry]:
        """
        Actualiza el contenido de una entrada de texto
        """
        try:
            entry = self.get_entry_by_id(entry_id)
            if not entry or entry.type != BitacoraEntryType.TEXT:
                return None

            self.db.collection("bitacora_entries").document(entry_id).update({
                "content": content,
                "updated_at": datetime.utcnow()
            })

            return self.get_entry_by_id(entry_id)

        except Exception as e:
            logger.error(f"Error updating entry {entry_id}: {e}")
            raise


bitacora_service = BitacoraService()
