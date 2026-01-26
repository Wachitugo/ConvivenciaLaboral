import json
import logging
import asyncio
from typing import Optional
from google.cloud import storage, firestore
from app.core.config import get_settings
from app.schemas.protocol import ExtractedProtocol


logger = logging.getLogger(__name__)
settings = get_settings()

class ProtocolExecutionService:
    def __init__(self):
        self.project_id = settings.PROJECT_ID
        self._db = None
        self._storage_client = None
        self.bucket_name = f"{self.project_id}-chat-sessions"

    @property
    def db(self):
        if self._db is None:
            self._db = firestore.Client(project=self.project_id, database=settings.FIRESTORE_DATABASE)
        return self._db

    @property
    def storage_client(self):
        if self._storage_client is None:
            self._storage_client = storage.Client()
        return self._storage_client

    async def get_protocol_context(self, case_id: str, session_id: str) -> Optional[str]:
        """Obtiene el contexto del protocolo activo"""
        try:
            # Primero verificar si hay protocolo dinámico
            dynamic_protocol = await self.load_dynamic_protocol(case_id, session_id)
            if dynamic_protocol:
                current_step = self.get_current_dynamic_step(dynamic_protocol)
                if current_step:
                    return f"""
                    Estás manejando un caso con protocolo activo extraído de documentos oficiales:
                    - Protocolo: {dynamic_protocol.protocol_name}
                    - Paso actual: {current_step.id}. {current_step.title}
                    - Descripción: {current_step.description}
                    - Estado: {current_step.status}
                    
                    El usuario debe completar este paso antes de continuar al siguiente.
                    """
        except Exception as e:
            logger.info(f"Error getting protocol context: {e}")
        
        return None

    async def extract_and_save_protocol(self, ai_response: str, case_id: str, session_id: str, user_message: str):
        """Extrae automáticamente protocolos de las respuestas del agente y retorna respuesta formateada"""
        try:
            from app.services.protocols.protocol_extractor import protocol_extractor, ExtractedProtocol
            
            # Detectar si el usuario está preguntando sobre protocolos
            protocol_keywords = ["protocolo", "qué debo hacer", "pasos", "procedimiento", "cómo actuar"]
            if any(keyword in user_message.lower() for keyword in protocol_keywords):
                
                # Extraer protocolo de la respuesta
                extracted_protocol = protocol_extractor.extract_protocol_from_response(
                    ai_response, case_id, session_id
                )
                
                
                # Fetch case to get authoritative creation date for deadlines
                base_date = None
                if case_id:
                     try:
                        from app.services.case_service import case_service
                        case_obj = case_service.get_case_by_id(case_id)
                        if case_obj and case_obj.created_at:
                            base_date = case_obj.created_at
                            if base_date.tzinfo:
                                base_date = base_date.replace(tzinfo=None)
                            logger.info(f"📅 [PROTOCOL EXEC] Using case creation date for extraction/saving: {base_date}")
                     except Exception as e:
                         logger.warning(f"⚠️ [PROTOCOL EXEC] Could not fetch case date for case_id={case_id}: {e}")
                
                if not base_date:
                    logger.warning(f"⚠️ [PROTOCOL EXEC] Missing base_date (Case Created At) for case {case_id}. Deadlines will be calculated relative to NOW, which causes shifting dates! Fix this by ensuring case has created_at.")


                if extracted_protocol:
                    # Enforce deadline recalculation if we have a base date
                    # This fixes the issue where AI hallucinates dates relative to "now" instead of "case creation"
                    if base_date:
                        for step in extracted_protocol.steps:
                            # Only recalculate if we have estimated time
                            if step.estimated_time:
                                new_deadline = protocol_extractor.calculate_deadline(step.estimated_time, base_date)
                                if new_deadline:
                                    step.deadline = new_deadline
                                    logger.info(f"🔄 Recalculated deadline for step {step.id}: {step.deadline}")

                    # Guardar protocolo dinámico SOLO si hay un caso asociado
                    if case_id:
                        await self.save_dynamic_protocol(extracted_protocol)
                    else:
                        logger.info(f"ℹ️ Protocolo extraído pero no guardado (sin case_id)")
                    
                    # Generar respuesta completa del protocolo con todos los pasos
                    complete_protocol_response = protocol_extractor.format_complete_protocol_response(extracted_protocol)
                    
                    logger.info(f"Protocolo completo extraído: {extracted_protocol.protocol_name}")
                    logger.info(f"Total de pasos: {len(extracted_protocol.steps)}")
                    
                    # Retornar la respuesta formateada completa
                    return complete_protocol_response
                else:
                    # Intentar extraer paso único
                    single_step = protocol_extractor.detect_single_step_in_response(ai_response)
                    if single_step:
                        # Recalculate for single step too
                        if base_date and single_step.estimated_time:
                             new_deadline = protocol_extractor.calculate_deadline(single_step.estimated_time, base_date)
                             if new_deadline:
                                 single_step.deadline = new_deadline

                        # Crear protocolo con un solo paso por ahora
                        extracted_protocol = ExtractedProtocol(
                            protocol_name="Protocolo en Proceso",
                            case_id=case_id,
                            session_id=session_id,
                            steps=[single_step],
                            extracted_from_response=ai_response
                        )
                        await self.save_dynamic_protocol(extracted_protocol)
                        
                        # Generar respuesta formateada para el paso único
                        complete_protocol_response = protocol_extractor.format_complete_protocol_response(extracted_protocol)
                        
                        logger.info(f"Paso único extraído: {single_step.title}")
                        return complete_protocol_response
        
        except Exception as e:
            logger.info(f"Error extracting protocol: {e}")
        
        # Si no se extrajo ningún protocolo, retornar None para usar la respuesta original
        return None

    async def save_dynamic_protocol(self, protocol):
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, self._save_dynamic_protocol_sync, protocol)

    def _save_dynamic_protocol_sync(self, protocol):
        """Guarda protocolo dinámico en Cloud Storage y Firestore"""
        try:
            # 1. Guardar en Cloud Storage (Backup/Histórico)
            bucket = self.storage_client.bucket(self.bucket_name)
            if not bucket.exists():
                bucket = self.storage_client.create_bucket(self.bucket_name, location=settings.VERTEX_LOCATION or "us-central1")
            
            blob_path = f"{protocol.session_id}/protocol_{protocol.case_id}.json"
            blob = bucket.blob(blob_path)
            blob.upload_from_string(json.dumps(protocol.model_dump(), indent=2))
            logger.info(f"Protocolo guardado en Storage: {blob_path}")
            
            # 2. Guardar en Firestore (Base de datos activa)
            # Usamos una colección 'case_protocols' donde el ID del documento es el case_id
            protocol_data = protocol.model_dump()
            protocol_data['updated_at'] = firestore.SERVER_TIMESTAMP
            
            doc_ref = self.db.collection('case_protocols').document(protocol.case_id)
            doc_ref.set(protocol_data)
            logger.info(f"Protocolo guardado en Firestore: case_protocols/{protocol.case_id}")
            
        except Exception as e:
            logger.info(f"Error saving dynamic protocol: {e}")

    async def load_dynamic_protocol(self, case_id: str, session_id: str):
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._load_dynamic_protocol_sync, case_id, session_id)

    def _load_dynamic_protocol_sync(self, case_id: str, session_id: str):
        """Carga protocolo dinámico desde Firestore (prioridad) o Cloud Storage"""
        try:
            from app.services.protocols.protocol_extractor import ExtractedProtocol
            
            # 1. Intentar cargar desde Firestore (más robusto, independiente de sesión)
            doc_ref = self.db.collection('case_protocols').document(case_id)
            doc = doc_ref.get()
            if doc.exists:
                return ExtractedProtocol(**doc.to_dict())

            # 2. Fallback: Cargar desde Cloud Storage (requiere session_id correcto)
            if session_id:
                bucket = self.storage_client.bucket(self.bucket_name)
                blob_path = f"{session_id}/protocol_{case_id}.json"
                blob = bucket.blob(blob_path)
                
                if blob.exists():
                    data = json.loads(blob.download_as_string())
                    return ExtractedProtocol(**data)
            
        except Exception as e:
            logger.info(f"Error loading dynamic protocol: {e}")
        
        return None

    def get_current_dynamic_step(self, protocol):
        """Obtiene el paso actual del protocolo dinámico"""
        for step in protocol.steps:
            if step.status == "pending":
                return step
        return None

protocol_execution_service = ProtocolExecutionService()
