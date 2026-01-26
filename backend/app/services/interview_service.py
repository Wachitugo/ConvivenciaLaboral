import uuid
import logging
from datetime import datetime
from typing import List, Optional, Dict
from google.cloud import firestore
from google.cloud.firestore import FieldFilter
from google.cloud import storage

from app.core.config import get_settings
from app.schemas.interview import InterviewCreate, InterviewUpdate, Interview, InterviewStatus, Signature, Attachment
from app.services.storage_service import storage_service
from app.services.transcription_service import transcription_service
from langchain_google_vertexai import ChatVertexAI
from langchain_core.messages import HumanMessage

logger = logging.getLogger(__name__)
settings = get_settings()

class InterviewService:
    def __init__(self):
        self._db = None
        self.collection_name = "interviews"
        self._llm = None

    @property
    def db(self):
        if self._db is None:
            self._db = firestore.Client(project=settings.PROJECT_ID, database=settings.FIRESTORE_DATABASE)
        return self._db

    @property
    def llm(self):
        if self._llm is None:
            model_name = settings.VERTEX_MODEL_FLASH or settings.VERTEX_MODEL_REASON or settings.VERTEX_MODEL
            
            self._llm = ChatVertexAI(
                model_name=model_name,
                temperature=0.1,
                project=settings.PROJECT_ID,
                location=settings.VERTEX_LOCATION or "us-central1",
            )
        return self._llm

    def create_interview(self, interview_data: InterviewCreate, owner_id: str) -> Interview:
        """Crea una nueva entrevista en estado borrador."""
        interview_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        data = interview_data.model_dump()
        data.update({
            "id": interview_id,
            "created_at": now,
            "updated_at": now,
            "owner_id": owner_id,
            "status": InterviewStatus.BORRADOR.value,
            "signatures": [],
            "attachments": []
        })
        
        self.db.collection(self.collection_name).document(interview_id).set(data)
        return Interview(**data)

    def update_interview(self, interview_id: str, updates: InterviewUpdate) -> Interview:
        """Actualiza campos de una entrevista."""
        interview_ref = self.db.collection(self.collection_name).document(interview_id)
        doc = interview_ref.get()
        if not doc.exists:
            return None
            
        update_data = updates.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        interview_ref.update(update_data)
        
        # Retornar actualizado
        updated_doc = interview_ref.get()
        return Interview(**updated_doc.to_dict())

    def get_interview(self, interview_id: str) -> Optional[Interview]:
        doc = self.db.collection(self.collection_name).document(interview_id).get()
        if doc.exists:
            return Interview(**doc.to_dict())
        return None

    def list_interviews(self, school_id: str, owner_id: Optional[str] = None, course: Optional[str] = None) -> List[Interview]:
        """Lista entrevistas por colegio y opcionalmente por usuario creador y curso."""
        logger.debug(f"list_interviews: school_id={school_id}, owner_id={owner_id}, course={course}")

        query = self.db.collection(self.collection_name).where(filter=FieldFilter("school_id", "==", school_id))

        if owner_id:
            query = query.where(filter=FieldFilter("owner_id", "==", owner_id))

        if course:
            query = query.where(filter=FieldFilter("course", "==", course))

        docs = query.stream()
        results = [Interview(**doc.to_dict()) for doc in docs]
        logger.debug(f"Found {len(results)} interviews for owner_id={owner_id}")
        return results

    def get_interviews_by_student(self, student_id: str) -> List[Interview]:
        """Obtiene todas las entrevistas asociadas a un estudiante."""
        try:
            # Filtrar por student_id
            query = self.db.collection(self.collection_name).where(filter=FieldFilter("student_id", "==", student_id))
            docs = query.stream()
            
            results = []
            for doc in docs:
                try:
                    results.append(Interview(**doc.to_dict()))
                except Exception as e:
                    logger.warning(f"Error parsing interview {doc.id}: {e}")
                    
            logger.info(f"Found {len(results)} interviews for student {student_id}")
            return results
        except Exception as e:
            logger.error(f"Error getting interviews for student {student_id}: {e}")
            return []

    async def upload_audio(self, interview_id: str, file_content: bytes, content_type: str) -> Interview:
        """Sube audio al bucket del colegio y genera transcripción."""
        interview = self.get_interview(interview_id)
        if not interview:
            raise ValueError("Entrevista no encontrada")

        bucket_name = storage_service.get_school_bucket_name(interview.school_id)
        storage_client = storage.Client(project=settings.PROJECT_ID)
        bucket = storage_client.bucket(bucket_name)

        # 1. Subir audio a carpeta 'entrevistas'
        filename = f"entrevistas/{interview_id}/audio.{content_type.split('/')[-1] if '/' in content_type else 'mp3'}"
        blob = bucket.blob(filename)
        blob.upload_from_string(file_content, content_type=content_type)
        
        gcs_uri = f"gs://{bucket_name}/{filename}"
        public_url = blob.public_url # Ojo: public_url requiere bucket público, si no usar signed_url

        # 2. Generar transcripción
        try:
            transcription = await transcription_service.transcribe_audio(gcs_uri, content_type, user_id=interview.owner_id)
        except Exception as e:
            logger.error(f"Error transcribiendo audio: {e}")
            transcription = ""

        # 3. Actualizar entrevista
        update_data = {
            "audio_uri": public_url, # Guardamos URL accesible o GCS URI si es privado
            "audio_size": len(file_content),
            "transcription": transcription,
            "updated_at": datetime.utcnow()
        }
        self.db.collection(self.collection_name).document(interview_id).update(update_data)
        
        # Retornar objeto actualizado
        return self.get_interview(interview_id)

    def upload_signature(self, interview_id: str, file_content: bytes, signer_type: str, signer_name: str = None) -> Interview:
        """Sube firma al bucket."""
        interview = self.get_interview(interview_id)
        if not interview:
            raise ValueError("Entrevista no encontrada")

        bucket_name = storage_service.get_school_bucket_name(interview.school_id)
        storage_client = storage.Client(project=settings.PROJECT_ID)
        bucket = storage_client.bucket(bucket_name)

        sig_id = str(uuid.uuid4())
        filename = f"entrevistas/{interview_id}/firmas/{signer_type}_{sig_id}.png" # Asumimos PNG
        blob = bucket.blob(filename)
        blob.upload_from_string(file_content, content_type="image/png")
        
        signature = {
            "id": sig_id,
            "type": signer_type,
            "url": blob.public_url,
            "created_at": datetime.utcnow(),
            "signer_name": signer_name,
            "path": filename
        }

        update_data = {
            "signatures": firestore.ArrayUnion([signature]),
            "updated_at": datetime.utcnow()
        }

        # Si firma el estudiante, pasamos a AUTORIZADA
        if signer_type == "student":
            update_data["status"] = InterviewStatus.AUTORIZADA.value

        self.db.collection(self.collection_name).document(interview_id).update(update_data)
        
        return self.get_interview(interview_id)

    def delete_signature(self, interview_id: str, signer_type: Optional[str] = None, signature_id: Optional[str] = None) -> Interview:
        """Elimina una firma del bucket y de la entrevista. Si se indica signer_type sin signature_id, borra la última de ese tipo."""
        interview = self.get_interview(interview_id)
        if not interview:
            raise ValueError("Entrevista no encontrada")

        if not interview.signatures:
            return interview

        # Seleccionar la firma objetivo
        target_sig = None
        if signature_id:
            target_sig = next((s for s in interview.signatures if s.id == signature_id), None)
        elif signer_type:
            # Tomar la más reciente de ese tipo
            candidates = [s for s in interview.signatures if s.type == signer_type]
            if candidates:
                candidates.sort(key=lambda s: s.created_at, reverse=True)
                target_sig = candidates[0]

        if not target_sig:
            raise ValueError("Firma no encontrada")

        bucket_name = storage_service.get_school_bucket_name(interview.school_id)
        storage_client = storage.Client(project=settings.PROJECT_ID)
        bucket = storage_client.bucket(bucket_name)

        # Determinar ruta del blob a borrar
        path = getattr(target_sig, 'path', None)
        if not path:
            # Fallback: intentar derivar desde URL o patrón conocido
            try:
                from urllib.parse import urlparse
                parsed = urlparse(target_sig.url)
                if parsed.path:
                    # /<bucket>/<path>
                    parts = parsed.path.strip('/').split('/', 1)
                    if len(parts) == 2:
                        path = parts[1]
            except Exception:
                pass
        if not path:
            # Último intento usando convención
            path = f"entrevistas/{interview_id}/firmas/{target_sig.type}_{target_sig.id}.png"

        # Borrar en GCS si existe
        try:
            blob = bucket.blob(path)
            if blob.exists():
                blob.delete()
        except Exception as e:
            logger.warning(f"Error deleting signature blob: {e}")

        # Borrar del documento - Usamos filtrado manual para evitar problemas con ArrayRemove y objetos complejos
        doc = self.db.collection(self.collection_name).document(interview_id).get()
        if doc.exists:
            current_data = doc.to_dict()
            current_sigs = current_data.get("signatures", [])
            # Filtrar fuera la firma objetivo
            # Comparamos por ID que es único
            updated_sigs = [s for s in current_sigs if s.get("id") != target_sig.id]
            
            self.db.collection(self.collection_name).document(interview_id).update({
                "signatures": updated_sigs,
                "updated_at": datetime.utcnow()
            })

        return self.get_interview(interview_id)

    async def upload_attachment(self, interview_id: str, file_content: bytes, filename: str, content_type: str) -> Interview:
        """Sube archivo adjunto extra y transcribe en background si es audio."""
        import asyncio
        
        interview = self.get_interview(interview_id)
        if not interview:
            raise ValueError("Entrevista no encontrada")

        bucket_name = storage_service.get_school_bucket_name(interview.school_id)
        storage_client = storage.Client(project=settings.PROJECT_ID)
        bucket = storage_client.bucket(bucket_name)

        att_id = str(uuid.uuid4())
        path = f"entrevistas/{interview_id}/{filename}"
        blob = bucket.blob(path)
        blob.upload_from_string(file_content, content_type=content_type)

        # Crear attachment sin transcripción inicialmente
        attachment = {
            "id": att_id,
            "name": filename,
            "url": blob.public_url,
            "content_type": content_type,
            "size": len(file_content),
            "created_at": datetime.utcnow(),
            "transcription": None,  # Se actualizará en background
            "transcription_status": "pending" if content_type.startswith("audio/") else None
        }

        self.db.collection(self.collection_name).document(interview_id).update({
            "attachments": firestore.ArrayUnion([attachment]),
            "updated_at": datetime.utcnow()
        })

        # Si es audio, transcribir en background (no bloqueamos la respuesta)
        if content_type.startswith("audio/"):
            gcs_uri = f"gs://{bucket_name}/{path}"
            # Crear task de background para transcripción
            asyncio.create_task(
                self._transcribe_attachment_background(
                    interview_id=interview_id,
                    attachment_id=att_id,
                    gcs_uri=gcs_uri,
                    content_type=content_type,
                    owner_id=interview.owner_id
                )
            )
            logger.info(f"Background transcription started for attachment {att_id}")

        return self.get_interview(interview_id)

    async def _transcribe_attachment_background(
        self, 
        interview_id: str, 
        attachment_id: str, 
        gcs_uri: str, 
        content_type: str,
        owner_id: str
    ):
        """Transcribe audio en background y actualiza Firestore cuando termine."""
        try:
            logger.info(f"Starting background transcription for {attachment_id}")
            transcription = await transcription_service.transcribe_audio(
                gcs_uri, 
                mime_type=content_type, 
                user_id=owner_id
            )
            
            # Actualizar el attachment específico con la transcripción
            interview = self.get_interview(interview_id)
            if interview and interview.attachments:
                # Reconstruir lista de attachments con la transcripción actualizada
                updated_attachments = []
                for att in interview.attachments:
                    att_dict = att.model_dump() if hasattr(att, 'model_dump') else dict(att)
                    if att_dict.get("id") == attachment_id:
                        att_dict["transcription"] = transcription
                        att_dict["transcription_status"] = "completed"
                    updated_attachments.append(att_dict)
                
                self.db.collection(self.collection_name).document(interview_id).update({
                    "attachments": updated_attachments,
                    "updated_at": datetime.utcnow()
                })
                logger.info(f"Background transcription completed for {attachment_id}")
                
        except Exception as e:
            logger.error(f"Error in background transcription for {attachment_id}: {e}")
            # Marcar como error
            try:
                interview = self.get_interview(interview_id)
                if interview and interview.attachments:
                    updated_attachments = []
                    for att in interview.attachments:
                        att_dict = att.model_dump() if hasattr(att, 'model_dump') else dict(att)
                        if att_dict.get("id") == attachment_id:
                            att_dict["transcription_status"] = "error"
                        updated_attachments.append(att_dict)
                    
                    self.db.collection(self.collection_name).document(interview_id).update({
                        "attachments": updated_attachments,
                        "updated_at": datetime.utcnow()
                    })
            except Exception as update_error:
                logger.error(f"Error updating transcription status: {update_error}")

    async def generate_interview_summary(self, interview_id: str) -> str:
        """
        Genera un resumen de la entrevista usando la transcripción y los adjuntos.
        Soporta multimodalidad (PDFs e Imágenes se pasan directo a Gemini).
        """
        interview = self.get_interview(interview_id)
        if not interview:
            raise ValueError("Entrevista no encontrada")

        bucket_name = storage_service.get_school_bucket_name(interview.school_id)
        
        # Guard clause: Check if there is any content to analyze
        has_transcription = bool(interview.transcription and interview.transcription.strip())
        has_attachments = bool(interview.attachments and len(interview.attachments) > 0)
        
        if not has_transcription and not has_attachments:
            no_info_msg = "No se dispone de la información requerida para generar el resumen del caso de convivencia escolar. La transcripción de la entrevista se encuentra vacía y no se han adjuntado documentos adicionales (imágenes, PDFs, textos) para su análisis."
            
            # Save standard message
            self.update_interview(interview_id, InterviewUpdate(summary=no_info_msg))
            return no_info_msg
        
        # Construir el mensaje multimodal
        # Parte 1: Instrucciones y Transcripción
        instructions = """Eres un experto en Convivencia Escolar.
Tu tarea es generar un RESUMEN del caso basado en la información provista.
NO ACTÚES como una persona conversando. NO digas "He recibido..." o "Soy un agente".
Genera DIRECTAMENTE el contenido del resumen en formato Markdown.

Analiza:
1. La transcripción del audio de la entrevista.
2. Los documentos adjuntos (imágenes, PDFs, textos).

IMPORTANTE: El resumen debe ser una narración natural y fluida de los hechos.
NO comiences con frases como "El presente resumen aborda..." o "En este resumen...".
Comienza DIRECTAMENTE narrando lo sucedido.
Ejemplo de inicio deseado: "Se originó un conflicto durante el recreo cuando..." o "Según el testimonio de [Nombre]..."
"""
        
        transcription_text = f"TRANSCRIPCIÓN DE LA ENTREVISTA:\n{interview.transcription or '(Sin transcripción audio)'}\n\n"
        
        # Lista de contenidos para el mensaje
        message_content = [
            {"type": "text", "text": instructions},
            {"type": "text", "text": transcription_text}
        ]

        # Parte 2: Adjuntos
        if interview.attachments:
            message_content.append({"type": "text", "text": "DOCUMENTOS ADJUNTOS:\n"})
            
            for att in interview.attachments:
                # Reconstruir ruta en GCS: entrevistas/{id}/{name}
                blob_path = f"entrevistas/{interview_id}/{att.name}"
                gcs_uri = f"gs://{bucket_name}/{blob_path}"
                mime_type = att.content_type or "application/octet-stream"
                
                # A. Audios: Usamos la transcripción ya generada (mejor que pasar el audio raw de nuevo)
                if att.transcription:
                     message_content.append({
                         "type": "text", 
                         "text": f"--- Archivo Audio: {att.name} ---\nTRANSCRIPCIÓN:\n{att.transcription}\n\n"
                     })
                     continue

                # B. PDFs e Imágenes: Pasamos como MEDIA a Gemini (Multimodal)
                # Gemini 1.5 soporta visualización de PDFs e imágenes nativamente
                if mime_type == "application/pdf" or mime_type.startswith("image/"):
                    logger.info(f"Adding multimodal attachment: {att.name} ({mime_type})")
                    message_content.append({
                        "type": "text",
                        "text": f"--- Archivo Visual: {att.name} ({mime_type}) ---\n(Analiza el contenido visual/texto de este archivo adjunto)"
                    })
                    message_content.append({
                        "type": "media",
                        "mime_type": mime_type,
                        "file_uri": gcs_uri
                    })
                    continue

                # C. Otros Textos o Fallback: Intentamos leer como texto
                try:
                    att_content = storage_service.read_blob_content(bucket_name, blob_path)
                    if att_content.startswith("Error"):
                         message_content.append({"type": "text", "text": f"--- Archivo: {att.name} ---\n(No se pudo leer contenido: {att_content})\n\n"})
                    else:
                        header_text = f"--- Archivo Texto: {att.name} ---\n"
                        # Truncar si es enorme, aunque Gemini 1.5 tiene ventana grande (1M+)
                        body_text = att_content[:30000] 
                        message_content.append({"type": "text", "text": header_text + body_text + "\n\n"})

                except Exception as e:
                    logger.warning(f"Error reading attachment {att.name}: {e}")

        # Parte 3: Estructura de salida solicitada
        # Parte 3: Estructura de salida solicitada
        structure_instruction = """
Output must be a valid JSON object. Do not include markdown formatting like ```json ... ```.
The JSON structure must be exactly as follows:
{
  "resumen_ejecutivo": "El presente resumen ejecutivo aborda... (contenido completo del resumen)"
}
"""
        message_content.append({"type": "text", "text": structure_instruction})

        try:
           # Invocar modelo Multimodal
           response = await self.llm.ainvoke([HumanMessage(content=message_content)])
           summary_content = response.content
           
           # Track Usage
           if interview.owner_id and hasattr(response, 'usage_metadata'):
                from app.services.users.user_service import user_service
                user_service.update_token_usage(
                    user_id=interview.owner_id,
                    input_tokens=response.usage_metadata.get('input_tokens', 0),
                    output_tokens=response.usage_metadata.get('output_tokens', 0),
                    model_name=self.llm.model_name
                )
           
           # Clean potential markdown block
           if "```json" in summary_content:
               summary_content = summary_content.split("```json")[1].split("```")[0].strip()
           elif "```" in summary_content:
               summary_content = summary_content.split("```")[1].strip()

           # Validate JSON (though we store as string for now)
           import json
           try:
               # Ensure it's valid JSON
               json_obj = json.loads(summary_content)
               # Extract just the executive summary text
               final_summary = json_obj.get("resumen_ejecutivo", summary_content)
               if isinstance(final_summary, list):
                   final_summary = "\n\n".join(final_summary)
           except json.JSONDecodeError:
               logger.warning("LLM did not return valid JSON, falling back to raw text")
               final_summary = summary_content
           
           # Guardar resumen en la entrevista (COMO TEXTO PLANO)
           self.update_interview(interview_id, InterviewUpdate(summary=final_summary))
           
           return final_summary
        except Exception as e:
           logger.error(f"Error generating AI summary: {e}")
           raise e

    async def generate_global_summary(self, school_id: str, course: Optional[str] = None, user_id: str = None) -> str:
        """
        Genera un resumen de TODAS las entrevistas de un curso o colegio.
        Toma todas las transcripciones y genera insights.
        """
        # No filtrar por owner_id para ver todas las entrevistas del colegio/curso
        interviews = self.list_interviews(school_id, owner_id=None, course=course)
        if not interviews:
            return "No hay entrevistas para generar un resumen."

        # Filtrar solo las que tienen transcripción
        valid_interviews = [i for i in interviews if i.transcription]
        
        if not valid_interviews:
            return "No hay transcripciones disponibles para analizar."

        # Compilar texto
        compiled_text = ""
        for i, interview in enumerate(valid_interviews):
            compiled_text += f"--- Entrevista {i+1} (Estudiante: {interview.student_name}, Curso: {interview.course}) ---\n"
            compiled_text += f"{interview.transcription}\n\n"

        # Prompt para Gemini
        prompt = f"""Eres un Agente experto en Convivencia Escolar.
Analiza las siguientes transcripciones de entrevistas realizadas a estudiantes.
Genera un Resumen Ejecutivo que identifique:
1. Patrones comunes o problemas recurrentes.
2. Casos críticos que requieren atención inmediata.
3. Clima general del curso/colegio basado en estos relatos.
4. Sugerencias de intervención.

TRANSCRIPCIONES:
{compiled_text}
"""
        response = await self.llm.ainvoke([HumanMessage(content=prompt)])
        
        # Track Usage
        if user_id and hasattr(response, 'usage_metadata'):
             from app.services.users.user_service import user_service
             user_service.update_token_usage(
                user_id=user_id,
                input_tokens=response.usage_metadata.get('input_tokens', 0),
                output_tokens=response.usage_metadata.get('output_tokens', 0),
                model_name=self.llm.model_name
            )
            
        return response.content

    async def delete_audio_file(self, interview_id: str) -> Interview:
        """Elimina el audio principal y su transcripción."""
        interview = self.get_interview(interview_id)
        if not interview:
            raise ValueError("Entrevista no encontrada")

        bucket_name = storage_service.get_school_bucket_name(interview.school_id)
        storage_client = storage.Client(project=settings.PROJECT_ID)
        bucket = storage_client.bucket(bucket_name)

        # Intentar borrar con varias extensiones comunes ya que no guardamos el filename exacto
        # O podríamos parsear la URL, pero es público.
        # Mejor intento: iterar extensiones.
        for ext in ["mp3", "webm", "mp4", "m4a", "wav"]:
            blob = bucket.blob(f"entrevistas/{interview_id}/audio.{ext}")
            if blob.exists():
                try:
                    blob.delete()
                    logger.info(f"Deleted audio: interviews/{interview_id}/audio.{ext}")
                except Exception as e:
                    logger.warning(f"Error deleting blob: {e}")

        # Actualizar DB
        update_data = {
            "audio_uri": firestore.DELETE_FIELD,
            "transcription": firestore.DELETE_FIELD,
            "updated_at": datetime.utcnow()
        }
        self.db.collection(self.collection_name).document(interview_id).update(update_data)
        
        return self.get_interview(interview_id)

    async def delete_attachment(self, interview_id: str, attachment_id: str) -> Interview:
        """Elimina un attachment por ID."""
        interview = self.get_interview(interview_id)
        if not interview:
            raise ValueError("Entrevista no encontrada")
        
        # Buscar el attachment
        target_att = next((a for a in interview.attachments if a.id == attachment_id), None)
        if not target_att:
             raise ValueError("Archivo adjunto no encontrado")

        bucket_name = storage_service.get_school_bucket_name(interview.school_id)
        storage_client = storage.Client(project=settings.PROJECT_ID)
        bucket = storage_client.bucket(bucket_name)

        # Borrar de GCS
        path = f"entrevistas/{interview_id}/adjuntos/{target_att.name}"
        blob = bucket.blob(path)
        if blob.exists():
            try:
                blob.delete()
            except Exception as e:
                logger.warning(f"Error deleting attachment blob: {e}")

        # Borrar de DB
        self.db.collection(self.collection_name).document(interview_id).update({
            "attachments": firestore.ArrayRemove([target_att.model_dump()]),
            "updated_at": datetime.utcnow()
        })
        
        return self.get_interview(interview_id)

    async def transfer_interview_files_to_case(self, interview_id: str, case_id: str):
        """
        Transfiere todos los archivos de una entrevista (audio + attachments + resumen) a un caso.

        Args:
            interview_id: ID de la entrevista
            case_id: ID del caso destino
        """
        from app.services.case_service import case_service

        interview = self.get_interview(interview_id)
        if not interview:
            raise ValueError("Entrevista no encontrada")

        logger.info(f"Transferring files from interview {interview_id} to case {case_id}")

        # 1. Transferir audio principal si existe
        if interview.audio_uri:
            try:
                # Extraer el filename del GCS path
                # El audio_uri puede ser una URL pública o un gs:// URI
                # Necesitamos reconstruir el GCS path: entrevistas/{id}/audio.{ext}
                bucket_name = storage_service.get_school_bucket_name(interview.school_id)

                # Determinar extensión del audio
                ext = "mp3"  # Default
                if interview.audio_uri:
                    # Intentar extraer de la URL
                    if "." in interview.audio_uri:
                        ext = interview.audio_uri.split(".")[-1].split("?")[0]  # Remover query params si existen

                gcs_uri = f"gs://{bucket_name}/entrevistas/{interview_id}/audio.{ext}"

                file_data = {
                    "name": f"Audio_Entrevista_{interview.student_name}.{ext}",
                    "gcs_uri": gcs_uri,
                    "size": interview.audio_size or 0,
                    "content_type": f"audio/{ext}",
                    "session_id": None
                }

                case_service.save_single_document(case_id, file_data, source="entrevista")
                logger.info(f"Audio transferred: {file_data['name']}")
            except Exception as e:
                logger.error(f"Error transferring audio: {e}")

        # 2. Transferir attachments
        if interview.attachments:
            for att in interview.attachments:
                try:
                    # Reconstruir GCS URI del attachment
                    bucket_name = storage_service.get_school_bucket_name(interview.school_id)
                    blob_path = f"entrevistas/{interview_id}/{att.name}"
                    gcs_uri = f"gs://{bucket_name}/{blob_path}"

                    file_data = {
                        "name": att.name,
                        "gcs_uri": gcs_uri,
                        "size": att.size or 0,
                        "content_type": att.content_type or "application/octet-stream",
                        "session_id": None
                    }

                    case_service.save_single_document(case_id, file_data, source="entrevista")
                    logger.info(f"Attachment transferred: {att.name}")
                except Exception as e:
                    logger.error(f"Error transferring attachment {att.name}: {e}")

        # 3. Generar y transferir resumen AI como archivo PDF
        if interview.summary:
            try:
                # Generar PDF del resumen
                pdf_content = self._generate_summary_pdf(interview)

                # Subir el resumen como archivo PDF al bucket del colegio
                bucket_name = storage_service.get_school_bucket_name(interview.school_id)
                storage_client = storage.Client(project=settings.PROJECT_ID)
                bucket = storage_client.bucket(bucket_name)

                # Crear path para el resumen PDF
                summary_filename = f"casos/{case_id}/Resumen_Entrevista_{interview.student_name}.pdf"
                blob = bucket.blob(summary_filename)
                blob.upload_from_string(pdf_content, content_type="application/pdf")

                gcs_uri = f"gs://{bucket_name}/{summary_filename}"

                file_data = {
                    "name": f"Resumen_Entrevista_{interview.student_name}.pdf",
                    "gcs_uri": gcs_uri,
                    "size": len(pdf_content),
                    "content_type": "application/pdf",
                    "session_id": None
                }

                case_service.save_single_document(case_id, file_data, source="entrevista")
                logger.info(f"Summary transferred as PDF file")
            except Exception as e:
                logger.error(f"Error transferring summary: {e}")

        # 4. Compilar y transferir transcripciones como archivo PDF
        transcriptions = []
        
        # Agregar transcripción principal si existe
        if interview.transcription and interview.transcription.strip():
            transcriptions.append(("Transcripción Principal", interview.transcription))
        
        # Agregar transcripciones de attachments de audio
        if interview.attachments:
            for att in interview.attachments:
                if hasattr(att, 'transcription') and att.transcription and att.transcription.strip():
                    transcriptions.append((f"Transcripción: {att.name}", att.transcription))
        
        if transcriptions:
            try:
                # Generar resumen AI de las transcripciones
                ai_summary = await self._generate_transcription_summary(
                    interview=interview,
                    transcriptions=transcriptions
                )
                
                # Generar PDF de transcripciones con el resumen
                pdf_content = self._generate_transcriptions_pdf(interview, transcriptions, ai_summary)
                
                # Subir como archivo PDF
                bucket_name = storage_service.get_school_bucket_name(interview.school_id)
                storage_client = storage.Client(project=settings.PROJECT_ID)
                bucket = storage_client.bucket(bucket_name)
                
                transcript_filename = f"casos/{case_id}/Transcripciones_Entrevista_{interview.student_name}.pdf"
                blob = bucket.blob(transcript_filename)
                blob.upload_from_string(pdf_content, content_type="application/pdf")
                
                gcs_uri = f"gs://{bucket_name}/{transcript_filename}"
                
                file_data = {
                    "name": f"Transcripciones_Entrevista_{interview.student_name}.pdf",
                    "gcs_uri": gcs_uri,
                    "size": len(pdf_content),
                    "content_type": "application/pdf",
                    "session_id": None
                }
                
                case_service.save_single_document(case_id, file_data, source="entrevista")
                logger.info(f"Transcriptions compiled and transferred as PDF file")
            except Exception as e:
                logger.error(f"Error transferring transcriptions: {e}")

        logger.info(f"File transfer completed from interview {interview_id} to case {case_id}")

    async def _generate_transcription_summary(self, interview: Interview, transcriptions: list) -> str:
        """
        Genera un resumen AI de los principales hallazgos de las transcripciones.
        
        Args:
            interview: Objeto Interview
            transcriptions: Lista de tuplas (título, contenido)
            
        Returns:
            Resumen de texto generado por el LLM
        """
        try:
            # Compilar todas las transcripciones en un solo texto
            compiled_text = ""
            for title, content in transcriptions:
                compiled_text += f"--- {title} ---\n{content}\n\n"
            
            # Prompt para generar resumen
            prompt = f"""Eres un experto en análisis de entrevistas de convivencia escolar.

Analiza las siguientes transcripciones de una entrevista con {interview.student_name} del curso {interview.course}.

TRANSCRIPCIONES:
{compiled_text}

Genera un RESUMEN CONCISO de los principales hallazgos. El resumen debe:
1. Identificar los hechos clave mencionados
2. Destacar las personas involucradas
3. Señalar cualquier problema o conflicto identificado
4. Mencionar fechas o lugares relevantes si se mencionan

IMPORTANTE: 
- Sé objetivo y basado en los hechos narrados
- No hagas suposiciones
- Máximo 200 palabras
- No uses markdown, solo texto plano

RESUMEN:"""

            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            
            # Track Usage
            if interview.owner_id and hasattr(response, 'usage_metadata'):
                from app.services.users.user_service import user_service
                user_service.update_token_usage(
                    user_id=interview.owner_id,
                    input_tokens=response.usage_metadata.get('input_tokens', 0),
                    output_tokens=response.usage_metadata.get('output_tokens', 0),
                    model_name=self.llm.model_name
                )
            
            return response.content.strip()
            
        except Exception as e:
            logger.error(f"Error generating transcription summary: {e}")
            return None

    def _generate_transcriptions_pdf(self, interview: Interview, transcriptions: list, ai_summary: str = None) -> bytes:
        """
        Genera un PDF con las transcripciones de la entrevista.
        
        Args:
            interview: Objeto Interview
            transcriptions: Lista de tuplas (título, contenido)
            ai_summary: Resumen AI de las transcripciones (opcional)
            
        Returns:
            Contenido del PDF como bytes
        """
        from io import BytesIO
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
        from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch
        )
        
        styles = getSampleStyleSheet()
        
        # Estilos personalizados
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=6,
            textColor=colors.HexColor('#1e293b'),
            fontName='Helvetica-Bold'
        )
        
        subtitle_style = ParagraphStyle(
            'SubtitleStyle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#64748b'),
            spaceAfter=20
        )
        
        summary_title_style = ParagraphStyle(
            'SummaryTitleStyle',
            parent=styles['Heading2'],
            fontSize=13,
            spaceBefore=10,
            spaceAfter=8,
            textColor=colors.HexColor('#1e40af'),
            fontName='Helvetica-Bold'
        )
        
        summary_body_style = ParagraphStyle(
            'SummaryBodyStyle',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#1e3a8a'),
            alignment=TA_JUSTIFY,
            backColor=colors.HexColor('#eff6ff'),
            borderPadding=10
        )
        
        section_style = ParagraphStyle(
            'SectionStyle',
            parent=styles['Heading2'],
            fontSize=12,
            spaceBefore=15,
            spaceAfter=8,
            textColor=colors.HexColor('#334155'),
            fontName='Helvetica-Bold'
        )
        
        body_style = ParagraphStyle(
            'BodyStyle',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#475569'),
            alignment=TA_JUSTIFY
        )
        
        story = []
        
        # Header
        story.append(Paragraph("Transcripciones de Entrevista", title_style))
        story.append(Paragraph(
            f"Estudiante: {interview.student_name} | Curso: {interview.course} | Fecha: {interview.created_at.strftime('%d/%m/%Y')}",
            subtitle_style
        ))
        
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e2e8f0'), spaceAfter=15))
        
        # Agregar resumen AI si existe
        if ai_summary:
            story.append(Paragraph("📋 Resumen de Principales Hallazgos", summary_title_style))
            # Escapar caracteres especiales
            safe_summary = ai_summary.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            for para in safe_summary.split('\n'):
                if para.strip():
                    story.append(Paragraph(para, summary_body_style))
            story.append(Spacer(1, 20))
            story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e2e8f0'), spaceAfter=15))
        
        # Agregar cada transcripción
        for title, content in transcriptions:
            story.append(Paragraph(title, section_style))
            
            # Dividir contenido en párrafos para mejor manejo
            paragraphs = content.split('\n')
            for para in paragraphs:
                if para.strip():
                    # Escapar caracteres especiales para reportlab
                    safe_para = para.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                    story.append(Paragraph(safe_para, body_style))
            
            story.append(Spacer(1, 15))
        
        doc.build(story)
        return buffer.getvalue()

    def _generate_summary_pdf(self, interview: Interview) -> bytes:
        """
        Genera un PDF profesional del resumen de la entrevista.
        
        Args:
            interview: Objeto Interview con el resumen
            
        Returns:
            Contenido del PDF como bytes
        """
        import json
        from io import BytesIO
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch
        )
        
        # Estilos
        styles = getSampleStyleSheet()
        
        # Estilo del título
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=6,
            textColor=colors.HexColor('#1e293b'),
            fontName='Helvetica-Bold'
        )
        
        # Estilo del subtítulo
        subtitle_style = ParagraphStyle(
            'SubtitleStyle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#64748b'),
            spaceAfter=20
        )
        
        # Estilo de sección
        section_style = ParagraphStyle(
            'SectionStyle',
            parent=styles['Heading2'],
            fontSize=11,
            spaceBefore=15,
            spaceAfter=8,
            textColor=colors.HexColor('#334155'),
            fontName='Helvetica-Bold'
        )
        
        # Estilo de párrafo
        body_style = ParagraphStyle(
            'BodyStyle',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#475569'),
            alignment=TA_JUSTIFY
        )
        
        # Estilo de bullet
        bullet_style = ParagraphStyle(
            'BulletStyle',
            parent=body_style,
            leftIndent=20,
            bulletIndent=10
        )
        
        # Estilo de conclusión (destacado)
        conclusion_style = ParagraphStyle(
            'ConclusionStyle',
            parent=body_style,
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#1e40af'),
            backColor=colors.HexColor('#eff6ff'),
            borderPadding=10
        )
        
        # Estilo del footer
        footer_style = ParagraphStyle(
            'FooterStyle',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#94a3b8'),
            alignment=TA_CENTER
        )
        
        story = []
        
        # === HEADER ===
        story.append(Paragraph("Resumen de Entrevista de Convivencia Escolar", title_style))
        story.append(Paragraph(
            f"Generado el {interview.created_at.strftime('%d de %B de %Y')} - Sistema de Convivencia Inteligente",
            subtitle_style
        ))
        
        # Línea separadora
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e2e8f0'), spaceAfter=15))
        
        # === INFO GENERAL ===
        # Obtener el valor del estado (sin el prefijo del enum)
        status_value = interview.status.value if hasattr(interview.status, 'value') else str(interview.status)
        
        # Obtener el nombre del entrevistador
        interviewer_name = interview.interviewer_name or 'No especificado'
        
        info_data = [
            ['Estudiante:', interview.student_name or 'No especificado', 'Curso:', interview.course or 'No especificado'],
            ['Entrevistador:', interviewer_name, 'Fecha:', interview.created_at.strftime('%d/%m/%Y')],
            ['Estado:', status_value, '', '']
        ]
        
        info_table = Table(info_data, colWidths=[1.2*inch, 2.3*inch, 1.2*inch, 2.3*inch])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#64748b')),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#64748b')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1e293b')),
            ('TEXTCOLOR', (3, 0), (3, -1), colors.HexColor('#1e293b')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 20))
        
        # Línea separadora
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#f1f5f9'), spaceAfter=10))
        
        # === CONTENIDO DEL RESUMEN ===
        try:
            summary_data = json.loads(interview.summary)
            
            # Resumen Ejecutivo
            if summary_data.get("resumen_ejecutivo"):
                story.append(Paragraph("Resumen Ejecutivo", section_style))
                content = summary_data["resumen_ejecutivo"]
                if isinstance(content, list):
                    for paragraph in content:
                        story.append(Paragraph(paragraph, body_style))
                        story.append(Spacer(1, 8))
                else:
                    story.append(Paragraph(content, body_style))
                story.append(Spacer(1, 10))
                
        except json.JSONDecodeError:
            # Si no es JSON, usar el texto tal cual
            story.append(Paragraph("Resumen Ejecutivo", section_style))
            story.append(Paragraph(interview.summary, body_style))
        
        # === FOOTER ===
        story.append(Spacer(1, 30))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#e2e8f0'), spaceAfter=10))
        story.append(Paragraph(
            "Documento Confidencial - Sistema de Convivencia Inteligente",
            footer_style
        ))
        
        # Construir PDF
        doc.build(story)
        
        pdf_content = buffer.getvalue()
        buffer.close()
        
        return pdf_content

    async def delete_interview(self, interview_id: str):
        """
        Elimina una entrevista completa y todos sus archivos asociados.

        Args:
            interview_id: ID de la entrevista a eliminar
        """
        interview = self.get_interview(interview_id)
        if not interview:
            raise ValueError("Entrevista no encontrada")

        bucket_name = storage_service.get_school_bucket_name(interview.school_id)
        storage_client = storage.Client(project=settings.PROJECT_ID)
        bucket = storage_client.bucket(bucket_name)

        # 1. Eliminar audio principal si existe
        if interview.audio_uri:
            for ext in ["mp3", "webm", "mp4", "m4a", "wav"]:
                blob = bucket.blob(f"entrevistas/{interview_id}/audio.{ext}")
                if blob.exists():
                    try:
                        blob.delete()
                        logger.info(f"Deleted audio: entrevistas/{interview_id}/audio.{ext}")
                    except Exception as e:
                        logger.warning(f"Error deleting audio blob: {e}")

        # 2. Eliminar todos los attachments
        if interview.attachments:
            for attachment in interview.attachments:
                path = f"entrevistas/{interview_id}/adjuntos/{attachment.name}"
                blob = bucket.blob(path)
                if blob.exists():
                    try:
                        blob.delete()
                        logger.info(f"Deleted attachment: {path}")
                    except Exception as e:
                        logger.warning(f"Error deleting attachment blob: {e}")

        # 3. Eliminar todas las firmas
        if interview.signatures:
            for signature in interview.signatures:
                if signature.path:
                    blob = bucket.blob(signature.path)
                    if blob.exists():
                        try:
                            blob.delete()
                            logger.info(f"Deleted signature: {signature.path}")
                        except Exception as e:
                            logger.warning(f"Error deleting signature blob: {e}")

        # 4. Eliminar el documento de Firestore
        try:
            self.db.collection(self.collection_name).document(interview_id).delete()
            logger.info(f"Deleted interview document from Firestore: {interview_id}")
        except Exception as e:
            logger.error(f"Error deleting interview document: {e}")
            raise

interview_service = InterviewService()
