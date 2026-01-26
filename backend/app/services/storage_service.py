"""
Servicio para gestión de archivos en Google Cloud Storage
"""
from google.cloud import storage
import logging
from datetime import timedelta
from app.core.config import get_settings
import uuid
from typing import Optional


logger = logging.getLogger(__name__)
settings = get_settings()

class StorageService:
    """Servicio para subir archivos a Google Cloud Storage"""

    def __init__(self):
        self.project_id = settings.PROJECT_ID
        self._client = None
        self.bucket_name = settings.GCS_BUCKET_SCHOOLS or f"{self.project_id}-schools"
        self.session_bucket_name = f"{self.project_id}-chat-sessions"
        self._bucket_initialized = False
        
        # Ensure session bucket has CORS enabled for direct uploads
        self._ensure_session_bucket()

    @property
    def client(self):
        if self._client is None:
            self._client = storage.Client(project=self.project_id)
        return self._client

    def _ensure_bucket_exists(self):
        """Crea el bucket si no existe y lo configura como público"""
        if self._bucket_initialized:
            return

        try:
            bucket = self.client.bucket(self.bucket_name)

            # Verificar si el bucket existe
            if not bucket.exists():
                logger.info(f" Bucket {self.bucket_name} no existe. Creándolo...")

                # Crear el bucket con configuración específica
                bucket = storage.Bucket(self.client, self.bucket_name)
                bucket.storage_class = "STANDARD"
                bucket.location = "US-CENTRAL1"  # Ubicación regional específica
                bucket.iam_configuration.uniform_bucket_level_access_enabled = True

                # Crear el bucket
                bucket.create(location="US-CENTRAL1")

                logger.info(f" Bucket {self.bucket_name} creado exitosamente en US-CENTRAL1")
            else:
                logger.info(f" Bucket {self.bucket_name} ya existe")
                # Recargar el bucket para obtener su configuración actual
                bucket.reload()

            # Configurar acceso público (tanto para buckets nuevos como existentes)
            try:
                policy = bucket.get_iam_policy(requested_policy_version=3)

                # Verificar si allUsers ya tiene acceso
                has_public_access = False
                for binding in policy.bindings:
                    if binding.get("role") == "roles/storage.objectViewer" and "allUsers" in binding.get("members", []):
                        has_public_access = True
                        break

                if not has_public_access:
                    logger.info(f" Configurando acceso público para el bucket...")
                    policy.bindings.append(
                        {
                            "role": "roles/storage.objectViewer",
                            "members": {"allUsers"}
                        }
                    )
                    bucket.set_iam_policy(policy)
                    logger.info(f" Bucket configurado con acceso público")
                else:
                    logger.info(f" Bucket ya tiene acceso público configurado")

            except Exception as policy_error:
                logger.warning(f" No se pudo configurar acceso público: {policy_error}")
                logger.info(f" Continuando sin acceso público - las URLs pueden no funcionar")

            self._bucket_initialized = True

        except Exception as e:
            logger.error(f" Error verificando/creando bucket: {e}")
            raise

    def _ensure_session_bucket(self):
        """Ensures chat sessions bucket exists and has CORS enabled"""
        try:
            bucket = self.client.bucket(self.session_bucket_name)
            if not bucket.exists():
                logger.info(f"Creating session bucket: {self.session_bucket_name}")
                bucket.create(location="US-CENTRAL1")
            
            # Configure CORS
            logger.info(f"Configuring CORS for session bucket: {self.session_bucket_name}")
            self.configure_cors(self.session_bucket_name, origins=["*"])
            
        except Exception as e:
            logger.error(f"Error configuring session bucket: {e}")

    def create_school_bucket(self, school_id: str, school_name: str) -> str:
        """
        Crea un bucket único para un colegio específico
        
        Args:
            school_id: ID del colegio (UUID)
            school_name: Nombre del colegio (para metadata)
        
        Returns:
            Nombre del bucket creado
        """
        try:
            # Generar nombre de bucket único
            # Formato: {project_id}-colegio-{primeros-8-chars-del-uuid}
            # GCS requiere: solo minúsculas, números y guiones, 3-63 caracteres
            short_id = school_id[:8].lower()
            bucket_name = f"{self.project_id}-colegio-{short_id}"
            
            logger.info(f"Creating bucket for school: {school_name} -> {bucket_name}")
            
            # Crear el bucket
            bucket = storage.Bucket(self.client, bucket_name)
            bucket.storage_class = "STANDARD"
            bucket.location = "US-CENTRAL1"
            bucket.iam_configuration.uniform_bucket_level_access_enabled = True
            
            # Agregar metadata del colegio
            bucket.labels = {
                "tipo": "colegio",
                "school_id": short_id
            }
            
            # Crear el bucket
            bucket.create(location="US-CENTRAL1")
            logger.info(f"Bucket created successfully: {bucket_name}")
            
            # Crear las carpetas requeridas (objetos con tamaño 0 terminado en /)
            folders = ["sesiones/", "logo/", "documentos/"]
            for folder in folders:
                blob = bucket.blob(folder)
                blob.upload_from_string(b"") # Subir contenido vacío
            
            logger.info(f"Folders created successfully in bucket: {bucket_name}")

            # Configurar acceso público
            try:
                policy = bucket.get_iam_policy(requested_policy_version=3)
                policy.bindings.append({
                    "role": "roles/storage.objectViewer",
                    "members": {"allUsers"}
                })
                bucket.set_iam_policy(policy)
                logger.info(f"Public access configured for bucket: {bucket_name}")
            except Exception as policy_error:
                logger.warning(f"Could not configure public access: {policy_error}")
            
            return bucket_name
            
        except Exception as e:
            logger.error(f"Error creating school bucket: {e}")
            raise e

    def get_school_bucket_name(self, school_id: str) -> str:
        """Genera el nombre del bucket para un colegio"""
        short_id = school_id[:8].lower()
        return f"{self.project_id}-colegio-{short_id}"

    def upload_school_logo(self, file_content: bytes, filename: str, content_type: str, school_bucket_name: str) -> str:
        """
        Sube el logo de un colegio a su bucket específico en GCS y retorna la URL pública

        Args:
            file_content: Contenido del archivo en bytes
            filename: Nombre original del archivo
            content_type: Tipo MIME del archivo (ej: 'image/png')
            school_bucket_name: Nombre del bucket del colegio

        Returns:
            URL pública del archivo subido
        """
        try:
            # Determinar extensión del archivo
            file_extension = filename.split('.')[-1] if '.' in filename else 'png'
            
            # Formato: logo/uuid.png (para evitar cache y superposiciones)
            file_uuid = str(uuid.uuid4())
            logo_filename = f"logo/{file_uuid}.{file_extension}"

            # Obtener el bucket del colegio
            bucket = self.client.bucket(school_bucket_name)

            # Crear el blob y subirlo
            blob = bucket.blob(logo_filename)
            blob.upload_from_string(file_content, content_type=content_type)

            # Retornar la URL pública
            public_url = blob.public_url
            logger.info(f"Logo uploaded successfully to {school_bucket_name}: {public_url}")
            return public_url

        except Exception as e:
            logger.error(f"Error uploading logo to school bucket: {e}")
            raise

    def upload_school_document(self, file_content: bytes, filename: str, content_type: str, school_bucket_name: str) -> dict:
        """
        Sube un documento a la carpeta 'documentos/' del bucket del colegio
        """
        try:
            bucket = self.client.bucket(school_bucket_name)
            
            # Usar nombre original pero asegurar que esté en la carpeta documentos
            blob_path = f"documentos/{filename}"
            
            blob = bucket.blob(blob_path)
            blob.upload_from_string(file_content, content_type=content_type)
            
            return {
                "filename": filename,
                "url": blob.public_url,
                "size": len(file_content),
                "content_type": content_type
            }
        except Exception as e:
            logger.error(f"Error uploading document: {e}")
            raise


    def upload_school_document_from_file(self, file_obj, filename: str, content_type: str, school_bucket_name: str) -> dict:
        """
        Sube un documento usando un objeto file-like para evitar cargar todo en memoria (streaming).
        """
        try:
            bucket = self.client.bucket(school_bucket_name)
            blob_path = f"documentos/{filename}"
            blob = bucket.blob(blob_path)
            
            # Usar upload_from_file para streaming
            # file_obj debe ser un objeto binario (abierto en 'rb' o SpooledTemporaryFile)
            blob.upload_from_file(file_obj, content_type=content_type)
            
            # Recargar para obtener tamaño real
            blob.reload()
            
            return {
                "filename": filename,
                "url": blob.public_url,
                "size": blob.size,
                "content_type": content_type
            }
        except Exception as e:
            logger.error(f"Error streaming document upload: {e}")
            raise

    def list_school_documents(self, school_bucket_name: str) -> list:
        """
        Lista los documentos en la carpeta 'documentos/' del bucket del colegio
        """
        try:
            bucket = self.client.bucket(school_bucket_name)
            blobs = bucket.list_blobs(prefix="documentos/")
            
            documents = []
            for blob in blobs:
                # Ignorar el objeto carpeta en sí mismo
                if blob.name == "documentos/":
                    continue
                    
                documents.append({
                    "filename": blob.name.replace("documentos/", ""),
                    "url": blob.public_url,
                    "size": blob.size,
                    "content_type": blob.content_type,
                    "updated_at": blob.updated
                })
                
            return documents
        except Exception as e:
            logger.error(f"Error listing documents: {e}")
            return []

    def list_bucket_documents(self, bucket_name: str, prefix: str = "") -> list:
        """
        Lista documentos de un bucket genérico (ej: doclegales, sentencias_cl)
        """
        try:
            bucket = self.client.bucket(bucket_name)
            if not bucket.exists():
                logger.warning(f"Bucket {bucket_name} not found")
                return []
                
            blobs = bucket.list_blobs(prefix=prefix)
            
            documents = []
            for blob in blobs:
                # Ignorar carpetas
                if blob.name.endswith("/"):
                    continue
                    
                documents.append({
                    "filename": blob.name,
                    "url": blob.public_url,
                    "size": blob.size,
                    "content_type": blob.content_type,
                    "bucket": bucket_name,
                    "updated_at": blob.updated
                })
                
            return documents
        except Exception as e:
            logger.error(f"Error listing generic bucket {bucket_name}: {e}")
            return []

    def delete_school_document(self, school_bucket_name: str, filename: str) -> bool:
        """
        Elimina un documento de la carpeta 'documentos/'
        """
        try:
            bucket = self.client.bucket(school_bucket_name)
            blob_path = f"documentos/{filename}"
            blob = bucket.blob(blob_path)
            
            if blob.exists():
                blob.delete()
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting document: {e}")
            raise

    def delete_school_logo(self, logo_url: str) -> bool:
        """
        Elimina un logo de colegio de GCS
        """
        try:
            # Esta función necesita ser actualizada porque ahora el logo puede estar en cualquier bucket
            logger.warning("delete_school_logo legacy implementation called - review logic")
            return True

        except Exception as e:
            logger.error(f" Error eliminando logo de GCS: {e}")
            return False

    def read_school_document_content(self, school_bucket_name: str, filename: str) -> str:
        """
        Descarga y lee el contenido de un documento (PDF o Texto) desde el bucket.
        """
        try:
            bucket = self.client.bucket(school_bucket_name)
            blob_path = f"documentos/{filename}"
            blob = bucket.blob(blob_path)
            
            if not blob.exists():
                return f"Error: El documento '{filename}' no existe en la carpeta documentos/."

            content = blob.download_as_bytes()
            
            # Simple detección por extensión
            if filename.lower().endswith('.pdf'):
                try:
                    import io
                    import pypdf
                    reader = pypdf.PdfReader(io.BytesIO(content))
                    text_content = ""
                    for page in reader.pages:
                        text_content += page.extract_text() + "\n"
                    return text_content
                except ImportError:
                    return "Error: La librería 'pypdf' no está instalada. No se pueden leer PDFs."
                except Exception as e:
                    return f"Error leyendo PDF: {str(e)}"
            else:
                # Intentar decodificar como texto
                try:
                    return content.decode('utf-8')
                except UnicodeDecodeError:
                    return f"Error: El archivo '{filename}' no parece ser texto plano ni PDF."

        except Exception as e:
            logger.error(f"Error reading document content: {e}")
            return f"Error leyendo contenido del documento: {str(e)}"

    def read_blob_content(self, bucket_name: str, blob_path: str) -> str:
        """
        Descarga y lee el contenido de un blob (PDF o Texto) desde cualquier ruta.
        """
        try:
            bucket = self.client.bucket(bucket_name)
            blob = bucket.blob(blob_path)
            
            if not blob.exists():
                return f"Error: El archivo no existe en la ruta especificada."

            content = blob.download_as_bytes()
            filename = blob.name
            
            # Simple detección por extensión
            if filename.lower().endswith('.pdf'):
                try:
                    import io
                    import pypdf
                    reader = pypdf.PdfReader(io.BytesIO(content))
                    text_content = ""
                    for page in reader.pages:
                        text_content += page.extract_text() + "\n"
                    return text_content
                except ImportError:
                    return "Error: La librería 'pypdf' no está instalada. No se pueden leer PDFs."
                except Exception as e:
                    return f"Error leyendo PDF: {str(e)}"
            else:
                # Intentar decodificar como texto
                try:
                    return content.decode('utf-8')
                except UnicodeDecodeError:
                     # Si falla utf-8, intentar latin-1
                    try:
                        return content.decode('latin-1')
                    except:
                        return f"Error: El archivo no parece ser texto plano ni PDF válido."

        except Exception as e:
            logger.error(f"Error reading blob content: {e}")
            return f"Error leyendo contenido del archivo: {str(e)}"

    def download_blob(self, bucket_name: str, source_blob_name: str) -> tuple[bytes, str]:
        """
        Descarga un blob y retorna su contenido y content-type.
        Usa las credenciales del servicio para acceder a buckets privados.
        """
        try:
            bucket = self.client.bucket(bucket_name)
            blob = bucket.blob(source_blob_name)
            
            if not blob.exists():
                logger.warning(f"Blob {source_blob_name} does not exist in {bucket_name}")
                return None, None

            content = blob.download_as_bytes()
            # Recargar para obtener metadata como content-type
            blob.reload()
            return content, blob.content_type
            
        except Exception as e:
            logger.error(f"Error downloading blob {source_blob_name}: {e}")
            raise

    def generate_upload_signed_url(self, blob_name: str, content_type: str, bucket_name: str = None) -> str:
        """
        Generates a v4 signed URL for uploading a file to GCS.
        """
        try:
            target_bucket = bucket_name or self.session_bucket_name
            bucket = self.client.bucket(target_bucket)
            blob = bucket.blob(blob_name)

            url = blob.generate_signed_url(
                version="v4",
                expiration=timedelta(minutes=15),
                method="PUT",
                content_type=content_type
            )
            
            logger.info(f"Generated signed URL for {blob_name} in {target_bucket}")
            return url
            
        except Exception as e:
            logger.error(f"Error generating signed URL: {e}")
            raise

    def configure_cors(self, bucket_name: str, origins: list = ["*"]):
        """Configura CORS para permitir uploads directos desde el navegador"""
        try:
            bucket = self.client.bucket(bucket_name)
            bucket.cors = [
                {
                    "origin": origins,
                    "responseHeader": [
                        "Content-Type",
                        "x-goog-resumable"
                    ],
                    "method": ["GET", "POST", "PUT", "OPTIONS", "HEAD"],
                    "maxAgeSeconds": 3600
                }
            ]
            bucket.patch()
            logger.info(f"✅ CORS configured for bucket {bucket_name}")
        except Exception as e:
            logger.error(f"❌ Error configuring CORS for {bucket_name}: {e}")
            raise

    def split_pdf_and_upload_chunks(self, bucket_name: str, blob_path: str, pages_per_chunk: int = 15) -> list:
        """
        Descarga un PDF grande, lo divide en partes más pequeñas y las sube temporalmente.
        Retorna la lista de GS URIs de las partes.
        """
        try:
            import io
            import pypdf
            
            bucket = self.client.bucket(bucket_name)
            blob = bucket.blob(blob_path)
            
            # Descargar archivo completo
            content = blob.download_as_bytes()
            pdf_reader = pypdf.PdfReader(io.BytesIO(content))
            total_pages = len(pdf_reader.pages)
            
            logger.info(f"📚 [STORAGE] Splitting PDF {blob_path} ({total_pages} pages) into chunks of {pages_per_chunk}")
            
            chunk_uris = []
            session_uuid = str(uuid.uuid4())
            
            for i in range(0, total_pages, pages_per_chunk):
                pdf_writer = pypdf.PdfWriter()
                end_page = min(i + pages_per_chunk, total_pages)
                
                for page_num in range(i, end_page):
                    pdf_writer.add_page(pdf_reader.pages[page_num])
                
                # Guardar chunk en memoria
                chunk_buffer = io.BytesIO()
                pdf_writer.write(chunk_buffer)
                chunk_buffer.seek(0)
                
                # Nombre del chunk
                chunk_filename = f"temp_chunks/{session_uuid}/part_{i}_{end_page}.pdf"
                chunk_blob = bucket.blob(chunk_filename)
                
                # Subir chunk
                chunk_blob.upload_from_file(chunk_buffer, content_type="application/pdf")
                chunk_uri = f"gs://{bucket_name}/{chunk_filename}"
                chunk_uris.append(chunk_uri)
                
                logger.info(f"📤 [STORAGE] Uploaded chunk: {chunk_uri}")
                
            return chunk_uris

        except Exception as e:
            logger.error(f"❌ [STORAGE] Error splitting PDF: {e}")
            return []

    def upload_chunk_to_gcs(self, bucket_name: str, upload_id: str, chunk_index: int, content: bytes):
        """Sube un chunk temporal para carga por partes"""
        try:
            bucket = self.client.bucket(bucket_name)
            blob_path = f"temp_uploads/{upload_id}/{chunk_index}"
            blob = bucket.blob(blob_path)
            blob.upload_from_string(content, content_type="application/octet-stream")
            return f"gs://{bucket_name}/{blob_path}"
        except Exception as e:
            logger.error(f"❌ [STORAGE] Error uploading chunk {chunk_index}: {e}")
            raise

    def compose_chunks(self, bucket_name: str, upload_id: str, total_chunks: int, target_path: str, content_type: str = "application/pdf") -> str:
        """Combina los chunks en el archivo final"""
        try:
            bucket = self.client.bucket(bucket_name)
            
            # Recopilar blobs de los chunks (ordenados)
            chunks = []
            for i in range(total_chunks):
                blob_path = f"temp_uploads/{upload_id}/{i}"
                blob = bucket.blob(blob_path)
                chunks.append(blob)
            
            # Blob destino
            target_blob = bucket.blob(target_path)
            
            # Compose! (Nota: Compose acepta max 32 blobs. Si hay más, se necesita composición recursiva)
            # Para 70MB en chunks de 5MB = 14 chunks. OK.
            # Para 200MB en chunks de 5MB = 40 chunks. NECESITA RECURSIVIDAD.
            # Implementación simple hasta 32 chunks (160MB con 5MB chunks)
            
            if len(chunks) > 32:
                # Estrategia de composición iterativa para > 32 chunks
                logger.info(f"🔄 [STORAGE] Composing {len(chunks)} chunks iteratively (>32 limit)")
                
                # Crear batches de 32
                intermediate_blobs = []
                batch_size = 32
                
                for i in range(0, len(chunks), batch_size):
                    batch = chunks[i:i + batch_size]
                    # Nombre temporal para el resultado intermedio
                    inter_name = f"temp_uploads/{upload_id}/intermediate_{i}"
                    inter_blob = bucket.blob(inter_name)
                    inter_blob.compose(batch)
                    intermediate_blobs.append(inter_blob)
                
                # Componer los intermedios en el final
                target_blob.compose(intermediate_blobs)
                
                # Limpiar intermedios
                for b in intermediate_blobs:
                    try:
                        b.delete()
                    except: pass
            else:
                target_blob.compose(chunks)
            
            # Set content type
            target_blob.content_type = content_type
            target_blob.patch()
            
            # Limpiar chunks
            for blob in chunks:
                try:
                    blob.delete()
                except: pass
                
            return f"gs://{bucket_name}/{target_path}"
            
        except Exception as e:
            logger.error(f"❌ [STORAGE] Error composing chunks: {e}")
            raise
    def get_file_size(self, bucket_name: str, blob_path: str) -> int:
        """Obtiene el tamaño de un archivo en GCS en bytes"""
        try:
            bucket = self.client.bucket(bucket_name)
            blob = bucket.blob(blob_path)
            blob.reload()
            return blob.size
        except Exception as e:
            logger.error(f"❌ [STORAGE] Error getting file size: {e}")
            return 0

# Instancia singleton
storage_service = StorageService()
