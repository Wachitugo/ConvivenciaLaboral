import json
import logging
import asyncio
from typing import List, Dict, Optional
from datetime import datetime
from google.cloud import storage
from langchain_core.messages import HumanMessage, AIMessage
from app.core.config import get_settings

settings = get_settings()

from google.cloud import firestore
from google.cloud.firestore import FieldFilter


logger = logging.getLogger(__name__)
class HistoryService:
    def __init__(self):
        self.project_id = settings.PROJECT_ID
        self._storage_client = None
        self.bucket_name = f"{self.project_id}-chat-sessions"
        self.db = firestore.Client(project=settings.PROJECT_ID, database=settings.FIRESTORE_DATABASE)
        self.collection_name = "chat_sessions"

    @property
    def storage_client(self):
        if self._storage_client is None:
            self._storage_client = storage.Client()
        return self._storage_client

    async def load_history(self, session_id: str, bucket_name: Optional[str] = None) -> List:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._load_history_sync, session_id, bucket_name)

    def _load_history_sync(self, session_id: str, bucket_name: Optional[str] = None) -> List:
        """Load history from Firestore subcollection. Falls back to GCS if Firestore is empty."""
        try:
            logger.info(f"🔍 [HISTORY] Loading history for session {session_id}, bucket_name={bucket_name}")
            
            # Try loading from Firestore first
            messages_ref = self.db.collection(self.collection_name).document(session_id).collection("messages")
            
            # Intentar cargar con order_by, con fallback por falta de índice
            docs = []
            try:
                # Usar order_by de forma segura - stream devuelve un iterador
                docs = list(messages_ref.order_by("order").stream())
                logger.info(f"✅ [HISTORY] Successfully loaded {len(docs)} documents using order_by")
            except Exception as order_error:
                logger.warning(f"⚠️ [HISTORY] order_by failed (missing index?), loading without order: {order_error}")
                # Fallback: cargar sin orden y ordenar en memoria
                try:
                    all_docs = list(messages_ref.stream())
                    logger.info(f"📄 [HISTORY] Loaded {len(all_docs)} documents without order")
                    
                    # Separar documentos que tienen 'order' vs. los que no (para mensajes antiguos)
                    docs_with_order = []
                    docs_without_order = []
                    
                    for doc in all_docs:
                        doc_dict = doc.to_dict()
                        if 'order' in doc_dict and doc_dict['order'] is not None:
                            docs_with_order.append(doc)
                        else:
                            docs_without_order.append(doc)
                    
                    # Ordenar los que tienen order
                    docs_with_order.sort(key=lambda d: d.to_dict().get('order', 0))
                    
                    # Los documentos sin order van al final (son antiguos)
                    # Ordenar por timestamp si está disponible
                    docs_without_order.sort(key=lambda d: d.to_dict().get('timestamp', 0))
                    
                    docs = docs_with_order + docs_without_order
                    logger.info(f"📊 [HISTORY] Sorted: {len(docs_with_order)} ordered + {len(docs_without_order)} legacy docs")
                except Exception as fallback_error:
                    logger.error(f"❌ [HISTORY] Fallback sorting also failed: {fallback_error}", exc_info=True)
                    docs = []
            
            logger.info(f"📄 [HISTORY] Found {len(docs)} documents in Firestore for session {session_id}")
            
            messages = []
            for doc in docs:
                try:
                    data = doc.to_dict()
                    msg_type = data.get('type')
                    content = data.get('content')
                    
                    if not msg_type or not content:
                        logger.warning(f"⚠️ [HISTORY] Skipping incomplete message: type={msg_type}, has_content={bool(content)}")
                        continue
                    
                    if msg_type == 'human':
                        messages.append(HumanMessage(content=content))
                    elif msg_type == 'ai':
                        messages.append(AIMessage(content=content))
                    else:
                        logger.warning(f"⚠️ [HISTORY] Unknown message type: {msg_type}")
                except Exception as msg_error:
                    logger.error(f"❌ [HISTORY] Error processing message: {msg_error}")
                    continue
            
            # If Firestore has messages, return them
            if messages:
                logger.info(f"✅ [HISTORY] Loaded {len(messages)} valid messages from Firestore for session {session_id}")
                return messages
            
            # Otherwise, fall back to GCS for backward compatibility
            logger.info(f"🔍 [HISTORY] No valid Firestore messages found, checking GCS for session {session_id}")
            gcs_messages = self._load_history_from_gcs(session_id, bucket_name)
            
            # If we loaded from GCS, auto-migrate to Firestore
            if gcs_messages:
                logger.info(f"📦 [HISTORY] Migrating {len(gcs_messages)} messages from GCS to Firestore")
                self._save_history_sync(session_id, gcs_messages, bucket_name)
            
            return gcs_messages
            
        except Exception as e:
            logger.error(f"❌ [HISTORY] Error loading history from Firestore: {e}", exc_info=True)
            # Final fallback to GCS
            return self._load_history_from_gcs(session_id, bucket_name)

    async def load_history_with_timestamps(self, session_id: str, bucket_name: Optional[str] = None) -> List[Dict]:
        """Load history from Firestore with timestamps for frontend display."""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._load_history_with_timestamps_sync, session_id, bucket_name)

    def _load_history_with_timestamps_sync(self, session_id: str, bucket_name: Optional[str] = None) -> List[Dict]:
        """Load history from Firestore subcollection with timestamps."""
        try:
            logger.info(f"🔍 [HISTORY] Loading history with timestamps for session {session_id}")
            
            messages_ref = self.db.collection(self.collection_name).document(session_id).collection("messages")
            
            # Try loading with order_by
            docs = []
            try:
                docs = list(messages_ref.order_by("order").stream())
            except Exception as order_error:
                logger.warning(f"⚠️ [HISTORY] order_by failed, loading without order: {order_error}")
                try:
                    all_docs = list(messages_ref.stream())
                    docs_with_order = []
                    docs_without_order = []
                    
                    for doc in all_docs:
                        doc_dict = doc.to_dict()
                        if 'order' in doc_dict and doc_dict['order'] is not None:
                            docs_with_order.append(doc)
                        else:
                            docs_without_order.append(doc)
                    
                    docs_with_order.sort(key=lambda d: d.to_dict().get('order', 0))
                    docs_without_order.sort(key=lambda d: d.to_dict().get('timestamp', 0))
                    docs = docs_with_order + docs_without_order
                except Exception as fallback_error:
                    logger.error(f"❌ [HISTORY] Fallback also failed: {fallback_error}")
                    docs = []
            
            messages = []
            for doc in docs:
                try:
                    data = doc.to_dict()
                    msg_type = data.get('type')
                    content = data.get('content')
                    timestamp = data.get('timestamp')
                    
                    if not msg_type or not content:
                        continue
                    
                    role = "user" if msg_type == "human" else "bot"
                    
                    # Convert Firestore timestamp to ISO string
                    timestamp_iso = None
                    if timestamp:
                        try:
                            timestamp_iso = timestamp.isoformat() if hasattr(timestamp, 'isoformat') else str(timestamp)
                        except:
                            timestamp_iso = None
                    
                    messages.append({
                        "role": role,
                        "content": content,
                        "timestamp": timestamp_iso
                    })
                except Exception as msg_error:
                    logger.error(f"❌ [HISTORY] Error processing message: {msg_error}")
                    continue
            
            logger.info(f"✅ [HISTORY] Loaded {len(messages)} messages with timestamps for session {session_id}")
            return messages
            
        except Exception as e:
            logger.error(f"❌ [HISTORY] Error loading history with timestamps: {e}", exc_info=True)
            return []

    
    def _load_history_from_gcs(self, session_id: str, bucket_name: Optional[str] = None) -> List:
        """Legacy method to load history from GCS. Used for backward compatibility."""
        try:
            target_bucket_name = bucket_name or self.bucket_name
            bucket = self.storage_client.bucket(target_bucket_name)
            
            # Intentar leer desde la carpeta sesiones/ si es un bucket de colegio
            blob_path = f"sesiones/{session_id}/history.json" if bucket_name else f"{session_id}/history.json"
            blob = bucket.blob(blob_path)
            
            logger.info(f"🔍 [GCS] Loading history for {session_id}. Target Bucket: {target_bucket_name}. Blob Path: {blob_path}. Exists: {blob.exists()}")

            # Retrocompatibilidad para formato antiguo en bucket de colegio
            if bucket_name and not blob.exists():
                 logger.info(f"🔍 [GCS] Checking legacy path in school bucket: {session_id}/history.json")
                 blob = bucket.blob(f"{session_id}/history.json")
            
            # Retrocompatibilidad GLOBAL
            if bucket_name and not blob.exists():
                logger.info(f"🔍 [GCS] Checking default bucket fallback: {self.bucket_name}/{session_id}/history.json")
                default_bucket = self.storage_client.bucket(self.bucket_name)
                blob = default_bucket.blob(f"{session_id}/history.json")
                 
            if blob.exists():
                data = json.loads(blob.download_as_string())
                messages = []
                
                if not isinstance(data, list):
                    logger.warning(f" Warning: Session {session_id} history is not a list. Type: {type(data)}")
                    return []

                for msg in data:
                    if not isinstance(msg, dict):
                        continue
                        
                    msg_type = msg.get('type')
                    content = msg.get('content')
                    
                    if msg_type == 'human':
                        messages.append(HumanMessage(content=content))
                    elif msg_type == 'ai':
                        messages.append(AIMessage(content=content))
                return messages
        except Exception as e:
            logger.info(f"Error loading history from GCS: {e}")
        return []

    async def save_history(self, session_id: str, messages: List, bucket_name: Optional[str] = None):
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, self._save_history_sync, session_id, messages, bucket_name)

    def _save_history_sync(self, session_id: str, messages: List, bucket_name: Optional[str] = None):
        """Save history to Firestore subcollection. This replaces the entire message history."""
        try:
            # Get reference to the messages subcollection
            messages_ref = self.db.collection(self.collection_name).document(session_id).collection("messages")
            
            # Use a batch to perform atomic writes
            batch = self.db.batch()
            
            # First, delete all existing messages in this subcollection
            existing_docs = messages_ref.stream()
            for doc in existing_docs:
                batch.delete(doc.reference)
            
            # Now add all messages with order
            for idx, msg in enumerate(messages):
                msg_data = {
                    'order': idx,
                    'timestamp': firestore.SERVER_TIMESTAMP
                }
                
                if isinstance(msg, HumanMessage):
                    msg_data['type'] = 'human'
                    msg_data['content'] = msg.content
                elif isinstance(msg, AIMessage):
                    msg_data['type'] = 'ai'
                    msg_data['content'] = msg.content
                else:
                    continue
                
                # Create a new document with auto-generated ID
                new_doc_ref = messages_ref.document()
                batch.set(new_doc_ref, msg_data)
            
            # Commit the batch
            batch.commit()
            logger.info(f"💾 [HISTORY] Saved {len(messages)} messages to Firestore for session {session_id}")
            
        except Exception as e:
            logger.error(f"Error saving history to Firestore: {e}")
            # Fallback to GCS if Firestore fails
            logger.warning(f"⚠️ [HISTORY] Falling back to GCS for session {session_id}")
            self._save_history_to_gcs(session_id, messages, bucket_name)

    async def append_messages(self, session_id: str, new_messages: List):
        """Appends new messages to the history without overwriting existing ones."""
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, self._append_messages_sync, session_id, new_messages)

    def _append_messages_sync(self, session_id: str, new_messages: List):
        """Sync implementation of append_messages"""
        try:
            logger.info(f"➕ [HISTORY] Appending {len(new_messages)} messages to session {session_id}")
            messages_ref = self.db.collection(self.collection_name).document(session_id).collection("messages")
            
            # Determine start index de forma robusta
            start_index = 0
            try:
                # Intentar usar order_by para obtener el índice más alto
                last_docs = list(messages_ref.order_by("order", direction=firestore.Query.DESCENDING).limit(1).stream())
                if last_docs:
                    start_index = last_docs[0].to_dict().get('order', -1) + 1
                    logger.info(f"✅ [HISTORY] Found max order: {start_index - 1}, starting at {start_index}")
            except Exception as order_error:
                logger.warning(f"⚠️ [HISTORY] order_by failed for append, using fallback: {order_error}")
                # Fallback: contar todos los documentos y usar el más alto
                try:
                    all_docs = list(messages_ref.stream())
                    max_order = -1
                    
                    for doc in all_docs:
                        doc_order = doc.to_dict().get('order', -1)
                        if doc_order > max_order:
                            max_order = doc_order
                    
                    start_index = max_order + 1
                    logger.info(f"📊 [HISTORY] Scanned {len(all_docs)} docs, max_order={max_order}, starting at {start_index}")
                except Exception as fallback_error:
                    logger.error(f"❌ [HISTORY] Fallback also failed: {fallback_error}")
                    start_index = 0
            
            logger.info(f"📝 [HISTORY] Starting at index {start_index}")
            
            batch = self.db.batch()
            
            for idx, msg in enumerate(new_messages):
                msg_data = {
                    'order': start_index + idx,
                    'timestamp': firestore.SERVER_TIMESTAMP
                }
                
                if isinstance(msg, HumanMessage):
                    msg_data['type'] = 'human'
                    msg_data['content'] = msg.content
                elif isinstance(msg, AIMessage):
                    msg_data['type'] = 'ai'
                    msg_data['content'] = msg.content
                else:
                    logger.warning(f"⚠️ [HISTORY] Skipping unknown message type: {type(msg)}")
                    continue
                
                new_doc_ref = messages_ref.document()
                batch.set(new_doc_ref, msg_data)
            
            batch.commit()
            logger.info(f"✅ [HISTORY] Successfully appended {len(new_messages)} messages to session {session_id}")
            
        except Exception as e:
            logger.error(f"❌ [HISTORY] Error appending history to Firestore: {e}", exc_info=True)

    async def replace_last_ai_message(self, session_id: str, new_content: str, message_order: int = None):
        """Replaces the content of an AI message in the history.
        
        Args:
            session_id: The session ID
            new_content: The new content to replace with
            message_order: Optional order of the message to replace. If None, replaces the last AI message.
        """
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, self._replace_last_ai_message_sync, session_id, new_content, message_order)

    def _replace_last_ai_message_sync(self, session_id: str, new_content: str, message_order: int = None):
        """Sync implementation of replace_last_ai_message"""
        try:
            logger.info(f"✏️ [HISTORY] Replacing AI message for session {session_id}, order={message_order}")
            messages_ref = self.db.collection(self.collection_name).document(session_id).collection("messages")
            
            if message_order is not None:
                # Find the specific message by order
                try:
                    docs = list(messages_ref.where("order", "==", message_order).where("type", "==", "ai").stream())
                    if docs:
                        doc = docs[0]
                        doc.reference.update({'content': new_content})
                        logger.info(f"✅ [HISTORY] Successfully replaced AI message at order {message_order} in session {session_id}")
                        return
                    else:
                        # Message at that order is not AI type, try to find the closest AI message
                        # Look for AI message at order-1 (the bot response right before)
                        logger.warning(f"⚠️ [HISTORY] No AI message found at order {message_order}, trying order {message_order - 1}")
                        docs = list(messages_ref.where("order", "==", message_order - 1).where("type", "==", "ai").stream())
                        if docs:
                            doc = docs[0]
                            doc.reference.update({'content': new_content})
                            logger.info(f"✅ [HISTORY] Successfully replaced AI message at order {message_order - 1} in session {session_id}")
                            return
                        # Still not found, fall through to last AI message logic
                        logger.warning(f"⚠️ [HISTORY] No AI message found at order {message_order - 1} either, falling back to last AI message")
                except Exception as e:
                    logger.error(f"❌ [HISTORY] Error finding message by order: {e}")
                    # Fall through to last message logic
            
            # Fallback: Get the last AI message
            try:
                docs = list(messages_ref.order_by("order", direction=firestore.Query.DESCENDING).stream())
            except Exception:
                # Fallback if order_by fails
                docs = list(messages_ref.stream())
                docs.sort(key=lambda d: d.to_dict().get('order', 0), reverse=True)
            
            # Find the last AI message
            for doc in docs:
                data = doc.to_dict()
                if data.get('type') == 'ai':
                    # Update this message
                    doc.reference.update({'content': new_content})
                    logger.info(f"✅ [HISTORY] Successfully replaced last AI message in session {session_id}")
                    return
            
            logger.warning(f"⚠️ [HISTORY] No AI message found to replace in session {session_id}")
            
        except Exception as e:
            logger.error(f"❌ [HISTORY] Error replacing AI message: {e}", exc_info=True)
    
    def _save_history_to_gcs(self, session_id: str, messages: List, bucket_name: Optional[str] = None):
        """Legacy method to save history to GCS. Used as fallback."""
        try:
            target_bucket_name = bucket_name or self.bucket_name
            bucket = self.storage_client.bucket(target_bucket_name)
            
            if not bucket.exists():
                bucket_location = settings.VERTEX_LOCATION or "us-central1"
                try:
                    bucket = self.storage_client.create_bucket(target_bucket_name, location=bucket_location)
                except Exception as e:
                    logger.warning(f"Could not create bucket {target_bucket_name}: {e}")
                    return
            
            serializable_messages = []
            for msg in messages:
                if isinstance(msg, HumanMessage):
                    serializable_messages.append({'type': 'human', 'content': msg.content})
                elif isinstance(msg, AIMessage):
                    serializable_messages.append({'type': 'ai', 'content': msg.content})
            
            blob_path = f"sesiones/{session_id}/history.json" if bucket_name else f"{session_id}/history.json"
            blob = bucket.blob(blob_path)
            blob.upload_from_string(json.dumps(serializable_messages))
            logger.info(f"💾 [GCS] Saved {len(serializable_messages)} messages to GCS for session {session_id}")
        except Exception as e:
            logger.error(f"Error saving history to GCS: {e}")

    async def save_session_metadata(self, session_id: str, user_id: str, title: str = None):
        """Guarda metadatos de la sesión en Firestore para vincularla al usuario"""
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, self._save_session_metadata_sync, session_id, user_id, title)
    
    def _save_session_metadata_sync(self, session_id: str, user_id: str, title: str = None):
        """Sync implementation of save_session_metadata"""
        try:
            logger.info(f"💾 [METADATA] Saving metadata for session {session_id}, user_id={user_id}, title={title}")
            doc_ref = self.db.collection(self.collection_name).document(session_id)

            data = {
                "id": session_id,
                "user_id": user_id,
                "updated_at": firestore.SERVER_TIMESTAMP
            }

            if title:
                data["title"] = title

            # Usar set con merge=True para crear o actualizar
            doc_ref.set(data, merge=True)
            logger.info(f"✅ [METADATA] Session {session_id} metadata saved successfully")
        except Exception as e:
            logger.error(f"❌ [METADATA] Error saving session metadata: {e}", exc_info=True)

    async def get_session_metadata(self, session_id: str) -> Optional[dict]:
        """Obtiene los metadatos de una sesión desde Firestore"""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._get_session_metadata_sync, session_id)
    
    def _get_session_metadata_sync(self, session_id: str) -> Optional[dict]:
        """Sync implementation of get_session_metadata"""
        try:
            logger.info(f"🔍 [METADATA] Getting metadata for session {session_id}")
            doc_ref = self.db.collection(self.collection_name).document(session_id)
            doc = doc_ref.get()

            if doc.exists:
                data = doc.to_dict()
                result = {
                    "id": data.get("id"),
                    "title": data.get("title", "Conversación sin título"),
                    "user_id": data.get("user_id"),
                    "date": data.get("updated_at").strftime("%d/%m/%Y") if data.get("updated_at") else "Reciente"
                }
                logger.info(f"✅ [METADATA] Found metadata for session {session_id}: title='{result['title']}'")
                return result
            logger.warning(f"⚠️ [METADATA] Session {session_id} not found in Firestore")
            return None
        except Exception as e:
            logger.error(f"❌ [METADATA] Error getting session metadata: {e}", exc_info=True)
            return None

    async def list_sessions(self, user_id: Optional[str] = None) -> List[dict]:
        """Lista las sesiones de chat. Si se proporciona user_id, filtra por usuario usando Firestore."""
        if user_id:
            return await self._list_sessions_firestore(user_id)
        
        # Fallback a GCS si no hay user_id (comportamiento anterior)
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._list_sessions_sync)

    async def _list_sessions_firestore(self, user_id: str) -> List[dict]:
        try:
            # Nota: Eliminamos order_by de la query para evitar requerir un índice compuesto
            # Se ordenará en memoria.
            docs = (self.db.collection(self.collection_name)
                   .where(filter=FieldFilter("user_id", "==", user_id))
                   .stream())
            
            sessions = []
            for doc in docs:
                data = doc.to_dict()
                updated_at = data.get("updated_at")
                sessions.append({
                    "id": data.get("id"),
                    "title": data.get("title", "Conversación sin título"),
                    "date": updated_at.strftime("%d/%m/%Y") if updated_at else "Reciente",
                    "created_at": updated_at.isoformat() if updated_at else None,  # ISO format for frontend processing
                    "timestamp": updated_at
                })
            
            # Ordenar en memoria por timestamp descendente
            sessions.sort(key=lambda x: x.get('timestamp') or datetime.min, reverse=True)
            
            # Limpiar timestamp antes de devolver (created_at ya tiene la info necesaria)
            for s in sessions:
                s.pop('timestamp', None)

            logger.info(f" Found {len(sessions)} sessions for user {user_id} in Firestore")
            return sessions
        except Exception as e:
            logger.info(f"Error listing sessions from Firestore: {e}")
            return []

    def _list_sessions_sync(self) -> List[dict]:
        try:
            bucket = self.storage_client.bucket(self.bucket_name)
            if not bucket.exists():
                logger.warning(f" Bucket {self.bucket_name} no existe.")
                return []
            
            # Listar todos los blobs y filtrar por history.json
            blobs = bucket.list_blobs()
            
            sessions = []
            for blob in blobs:
                if blob.name.endswith('/history.json'):
                    # Estructura esperada: session_id/history.json
                    parts = blob.name.split('/')
                    if len(parts) == 2:
                        session_id = parts[0]
                        
                        # Descargar contenido para el título
                        try:
                            data = json.loads(blob.download_as_string())
                            title = "Conversación sin título"
                            date_str = "Reciente"
                            
                            if blob.updated:
                                date_str = blob.updated.strftime("%d/%m/%Y")
                            
                            # Buscar primer mensaje de usuario para el título y archivos adjuntos
                            files_count = 0
                            if isinstance(data, list):
                                for msg in data:
                                    if isinstance(msg, dict) and msg.get('type') == 'human':
                                        content = msg.get('content', '')
                                        
                                        # Si el contenido es una lista, puede tener archivos (multimodal)
                                        if isinstance(content, list):
                                            text_parts = []
                                            for part in content:
                                                if isinstance(part, dict):
                                                    if part.get('type') == 'text':
                                                        text_parts.append(part.get('text', ''))
                                                    elif part.get('type') == 'image_url':
                                                        files_count += 1
                                            
                                            full_text = " ".join(text_parts)
                                            if title == "Conversación sin título" and full_text:
                                                title = full_text[:40] + "..." if len(full_text) > 40 else full_text
                                        
                                        elif isinstance(content, str) and title == "Conversación sin título":
                                            title = content[:40] + "..." if len(content) > 40 else content
                                            
                            sessions.append({
                                "id": session_id,
                                "title": title,
                                "date": date_str,
                                "created_at": blob.updated.isoformat() if blob.updated else None,  # ISO format for frontend
                                "timestamp": blob.updated, # Para ordenar
                                "files_count": files_count
                            })
                        except Exception as e:
                            logger.info(f"Error leyendo sesión {session_id}: {e}")
            
            # Ordenar por fecha descendente (más reciente primero)
            sessions.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            
            # Limpiar timestamp antes de devolver
            for s in sessions:
                s.pop('timestamp', None)
                
            logger.info(f" Se encontraron {len(sessions)} sesiones anteriores.")
            return sessions

        except Exception as e:
            logger.error(f"Error listing sessions: {e}")
    def get_session_summary(self, session_id: str, bucket_name: Optional[str] = None) -> Optional[dict]:
        """Obtiene un resumen de la sesión (título, fecha, preview) desde Firestore o GCS"""
        try:
            # 1. Try loading from Firestore first
            doc_ref = self.db.collection(self.collection_name).document(session_id)
            doc = doc_ref.get()
            
            if doc.exists:
                # Session metadata exists in Firestore
                data = doc.to_dict()
                title = data.get("title", "Conversación sin título")
                date_str = data.get("updated_at").strftime("%d/%m/%Y") if data.get("updated_at") else "Reciente"
                
                # Get preview from first message in subcollection
                preview = ""
                messages_ref = doc_ref.collection("messages")
                first_messages = messages_ref.order_by("order").limit(1).stream()
                
                for msg_doc in first_messages:
                    msg_data = msg_doc.to_dict()
                    if msg_data.get('type') == 'human':
                        content = msg_data.get('content', '')
                        if isinstance(content, str):
                            preview = content[:100] + "..." if len(content) > 100 else content
                        break
                
                logger.info(f"🔍 [HISTORY] Loaded session summary from Firestore for {session_id}")
                return {
                    "id": session_id,
                    "title": title,
                    "date": date_str,
                    "preview": preview
                }
            
            # 2. Fallback to GCS for backward compatibility
            logger.info(f"🔍 [HISTORY] No Firestore metadata found, checking GCS for session {session_id}")
            target_bucket_name = bucket_name or self.bucket_name
            bucket = self.storage_client.bucket(target_bucket_name)
            
            # Intentar path nuevo (sesiones/) si es school bucket
            blob_path = f"sesiones/{session_id}/history.json" if bucket_name else f"{session_id}/history.json"
            blob = bucket.blob(blob_path)

            # Fallback local para legacy school path
            if bucket_name and not blob.exists():
                blob = bucket.blob(f"{session_id}/history.json")
            
            # Fallback global si no existe en bucket específico
            if not blob.exists() and bucket_name:
                 default_bucket = self.storage_client.bucket(self.bucket_name)
                 blob = default_bucket.blob(f"{session_id}/history.json")

            if not blob.exists():
                return None
                
            data = json.loads(blob.download_as_string())
            title = "Conversación sin título"
            date_str = "Reciente"
            
            if blob.updated:
                date_str = blob.updated.strftime("%d/%m/%Y")
            
            preview = ""
            
            if isinstance(data, list):
                for msg in data:
                    if isinstance(msg, dict) and msg.get('type') == 'human':
                        content = msg.get('content', '')
                        
                        # Si el contenido es una lista (multimodal)
                        if isinstance(content, list):
                            text_parts = []
                            for part in content:
                                if isinstance(part, dict) and part.get('type') == 'text':
                                    text_parts.append(part.get('text', ''))
                            full_text = " ".join(text_parts)
                            if title == "Conversación sin título" and full_text:
                                title = full_text[:40] + "..." if len(full_text) > 40 else full_text
                                preview = full_text[:100] + "..."
                        
                        # Si es string simple
                        elif isinstance(content, str):
                            if title == "Conversación sin título":
                                title = content[:40] + "..." if len(content) > 40 else content
                            preview = content[:100] + "..."
                        
                        break # Usar el primer mensaje para título y preview
            
            logger.info(f"📦 [HISTORY] Loaded session summary from GCS for {session_id}")
            return {
                "id": session_id,
                "title": title,
                "date": date_str,
                "preview": preview
            }
            
        except Exception as e:
            logger.info(f"Error getting session summary for {session_id}: {e}")
            return None
    
    async def update_session_context(self, session_id: str, context_summary: dict):
        """Actualiza el contexto de la sesión con un resumen estructurado"""
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._update_session_context_sync, session_id, context_summary)
    
    def _update_session_context_sync(self, session_id: str, context_summary: dict):
        """Sync - actualiza context_summary en metadata"""
        try:
            doc_ref = self.db.collection(self.collection_name).document(session_id)
            doc_ref.set({"context_summary": context_summary, "updated_at": firestore.SERVER_TIMESTAMP}, merge=True)
            logger.info(f"✅ [CONTEXT] Updated session context for {session_id}")
        except Exception as e:
            logger.error(f"Error updating session context: {e}")
    
    async def get_session_context(self, session_id: str) -> Optional[str]:
        """Obtiene el resumen de contexto de la sesión si existe"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._get_session_context_sync, session_id)
    
    def _get_session_context_sync(self, session_id: str) -> Optional[str]:
        """Sync - obtiene summary de context_summary"""
        try:
            doc_ref = self.db.collection(self.collection_name).document(session_id)
            doc = doc_ref.get()
            if doc.exists:
                data = doc.to_dict()
                context_summary = data.get("context_summary")
                if context_summary and isinstance(context_summary, dict):
                    return context_summary.get("summary")
            return None
        except Exception as e:
            logger.error(f"Error getting session context: {e}")
            return None

history_service = HistoryService()
