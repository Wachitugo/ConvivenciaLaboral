from typing import List, Optional, AsyncGenerator
import logging
import time
import asyncio
from langchain_google_vertexai import ChatVertexAI
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage, SystemMessage
from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.prebuilt import create_react_agent
from google.cloud import firestore
from app.core.config import get_settings
from app.services.tools.google_tools import google_tools
from app.services.chat.history_service import history_service
from app.services.chat.search_service import search_service
from app.services.chat.prompt_service import prompt_service
from app.services.chat.case_file_tool import case_file_tool
from app.services.chat.response_sanitizer import response_sanitizer
from app.services.chat.intent_router import intent_router
from app.services.chat.document_analyzer import document_analyzer
from app.schemas.chat import ChatResponse, ChatMetadata
# user_service_simple imported lazily to avoid circular imports
# user_service_simple imported lazily to avoid circular imports
from app.services.protocols.protocol_execution_service import protocol_execution_service
from app.services.protocols.protocol_agent import protocol_agent
from app.services.case_service import case_service
from app.services.case_service import case_service
from app.services.storage_service import storage_service
from app.services.token_service import token_service, LimitExceededException


logger = logging.getLogger(__name__)
settings = get_settings()

@tool
async def list_calendar_events(day: Optional[str] = None):
    """Lista los eventos del calendario. Puede filtrar por día (YYYY-MM-DD)."""
    logger.info(f"🗓️ TOOL CALLED: list_calendar_events(day={day})")
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, google_tools.list_events, day)

@tool
async def prepare_calendar_event(summary: str, start_time: str, end_time: str, description: str = "", attendees: List[str] = None):
    """Prepara un evento de calendario para revisión. NO crea el evento. start_time/end_time en ISO."""
    import json
    logger.info(f"🗓️ TOOL CALLED: prepare_calendar_event(summary={summary})")
    
    draft_data = {
        "type": "calendar_draft",
        "summary": summary,
        "start_time": start_time,
        "end_time": end_time,
        "description": description,
        "attendees": attendees or []
    }
    return json.dumps(draft_data)

@tool
async def prepare_email_content(to: str, subject: str, body: str, cc: List[str] = None):
    """HERRAMIENTA OBLIGATORIA PARA CORREOS - Prepara el contenido de un correo electrónico para el usuario.
    
    USA ESTA HERRAMIENTA cuando el usuario pida: redactar, enviar, escribir, elaborar, mandar, o notificar por correo.
    
    Args:
        to: Dirección de correo del destinatario (ej: "ejemplo@correo.com")
        subject: Asunto del correo
        body: Cuerpo del correo (puede incluir saludo, contenido, y despedida)
        cc: Lista opcional de correos en copia
    
    Returns:
        JSON con el borrador que el frontend mostrará al usuario para revisión y envío
    
    IMPORTANTE: Esta herramienta NO envía el correo directamente. Muestra el borrador al usuario para que lo revise y confirme el envío.
    """
    import json
    logger.info(f"📧 TOOL CALLED: prepare_email_content(to={to}, subject={subject}, cc={cc})")
    
    # Retornar JSON estructurado que el frontend reconocerá para mostrar el UI de Gmail
    draft_data = {
        "type": "email_draft",
        "to": to,
        "subject": subject,
        "body": body,
        "cc": cc or []
    }
    return json.dumps(draft_data)





class GeneralChatAgent:
    def __init__(self):
        self.project_id = settings.PROJECT_ID
        self.location = settings.LOCATION
        self.data_store_id = settings.DATA_STORE_ID
        self.bucket_name = f"{self.project_id}-chat-sessions"
        
        self.retriever_tool = search_service.create_search_tool()
        self.list_documents_tool = search_service.create_list_documents_tool()
        
        logger.info(f"🔧 Configuración GeneralChatAgent:")
        logger.info(f"   - Project ID: {self.project_id}")
        
        self.tools = [list_calendar_events, prepare_calendar_event, prepare_email_content]
        if self.retriever_tool:
            self.tools.append(self.retriever_tool)
        if self.list_documents_tool:
            self.tools.append(self.list_documents_tool)
        
        # Add case file tool
        case_file_retrieval_tool = case_file_tool.create_case_file_tool()
        if case_file_retrieval_tool:
            self.tools.append(case_file_retrieval_tool)
        
        self.model_location = settings.VERTEX_LOCATION or "us-central1"
        self._llm = None

    @property
    def llm(self):
        if self._llm is None:
            # Use Reason model for complex chat/reasoning tasks, fallback to Flash or default
            model_name = settings.VERTEX_MODEL_REASON or settings.VERTEX_MODEL_FLASH or settings.VERTEX_MODEL

            logger.info(f"🤖 [CHAT_AGENT] Initializing with model: {model_name}")
            self._llm = ChatVertexAI(
                model_name=model_name,
                temperature=0.5,
                project=self.project_id,
                location=self.model_location,
                streaming=True,
                max_retries=2,
                model_kwargs={
                    "request_timeout": 300  # Timeout para procesar múltiples archivos
                }
            )
        return self._llm

    async def _load_history(self, session_id: str, bucket_name: str = None) -> List[BaseMessage]:
        return await history_service.load_history(session_id, bucket_name)

    async def _save_history(self, session_id: str, history: List[BaseMessage], bucket_name: str = None):
        await history_service.save_history(session_id, history, bucket_name)

    async def list_sessions(self) -> List[dict]:
        return await history_service.list_sessions()


    async def _load_case_context(self, case_id: str) -> Optional[dict]:
        """
        Carga datos del caso desde Firestore y los formatea para el contexto del agente
        
        Returns:
            {
                "summary": "Cadena de contexto formateada para mensaje del sistema (IDs sanitized)",
                "details": {
                    "id": "case-123",
                    "title": "...",
                    "description": "...",
                    "involved": [...],
                    "case_type": "...",
                    "status": "...",
                    "files": [...]
                }
            }
        """
        if not case_id:
            return None
        
        try:
            logger.info(f"📋 [CONTEXT] Loading case context for case_id: {case_id}")
            
            # Cargar caso desde Firestore
            case = case_service.get_case_by_id(case_id)
            if not case:
                logger.warning(f"⚠️ [CONTEXT] Case {case_id} not found")
                return None
            
            # Cargar archivos del caso
            case_files = case_file_tool.get_case_files_data(case_id)
            
            # Formatear personas involucradas
            involved_text = ""
            if case.involved and len(case.involved) > 0:
                involved_list = [f"{p.name} ({p.role or 'Sin rol'})" for p in case.involved]
                involved_text = "\n".join([f"  - {person}" for person in involved_list])
            else:
                involved_text = "  - No especificadas"
            
            # Formatear archivos
            files_text = ""
            if case_files and len(case_files) > 0:
                files_list = [f"{f['name']} ({f['type']}, {f['size_str']})" for f in case_files]
                files_text = "\n".join([f"  - {file}" for file in files_list])
            else:
                files_text = "  - No hay archivos adjuntos"
            
            # Crear resumen de contexto para mensaje del sistema (SIN case_id visible)
            summary = f"""
═══════════════════════════════════════════════════════════
CONTEXTO DEL CASO ACTIVO
═══════════════════════════════════════════════════════════

**Título**: {case.title}
**Tipo de Caso**: {case.case_type}
**Estado**: {case.status}

**Descripción del Caso**:
{case.description or "No especificada"}

**Personas Involucradas**:
{involved_text}

**Archivos Adjuntos Disponibles**:
{files_text}

═══════════════════════════════════════════════════════════
INSTRUCCIONES IMPORTANTES:
═══════════════════════════════════════════════════════════

1. Este caso YA FUE CREADO y contiene información registrada.
2. Tienes acceso completo a todos los datos mostrados arriba.
3. NO pidas al usuario que repita información que ya está aquí.
4. NO menciones IDs técnicos del sistema al usuario.
5. Si necesitas más detalles específicos, pregunta solo por lo que falta.
6. Los archivos listados pueden ser consultados usando la herramienta get_case_files.
7. Si el usuario pregunta "¿de qué trata el caso?" o similar, resume la información de arriba.

═══════════════════════════════════════════════════════════
"""
            
            logger.info(f"✅ [CONTEXT] Case context loaded successfully for '{case.title}'")
            
            return {
                "summary": summary,
                "details": {
                    "id": case.id,
                    "title": case.title,
                    "description": case.description or "",
                    "involved": [{"name": p.name, "role": p.role or "Sin rol"} for p in case.involved] if case.involved else [],
                    "case_type": case.case_type,
                    "status": case.status,
                    "files": case_files
                }
            }
            
        except Exception as e:
            logger.error(f"❌ [CONTEXT] Error loading case context: {e}")
            return None


    def _detect_protocol_intent(self, message: str, case_id: str = None) -> bool:
        """Detecta si el mensaje requiere explícitamente activar un protocolo o ver pasos."""
        import unicodedata
        def normalize(text):
            return ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn').lower()

        message_norm = normalize(message)
        
        # EXCLUSION PATTERNS: Informational queries (NOT activation)
        exclusion_patterns = [
            # Questions about what/which protocols
            "que es un protocolo", "que es el protocolo", "que son los protocolos",
            "cual es el protocolo", "cuales son los protocolos",
            
            # Questions about how protocols work
            "que significa protocolo", "definicion de protocolo",
            "como funciona el protocolo", "como funciona un protocolo",
            "para que sirve el protocolo", "para que sirve un protocolo",
            
            # Requests for information/explanation
            "explicame el protocolo", "explicame un protocolo",
            "dame informacion sobre", "cuentame sobre",
            "describe el protocolo", "describe un protocolo",
            
            # Questions about protocol creation/generation (informational)
            "como se genera un protocolo", "como generar un protocolo",
            "como se crea un protocolo", "como crear un protocolo",
            "que necesito para generar", "que necesito para crear",
            
            # Questions asking which protocol to use
            "que protocolo", "cual protocolo", "cuales protocolos"
        ]
        
        # Check exclusions first (fast rejection)
        if any(pattern in message_norm for pattern in exclusion_patterns):
            return False

        # ACTIVATION PATTERNS: Explicit action keywords
        activation_patterns = [
            "activar protocolo", "activa protocolo", "activa el protocolo",
            "iniciar protocolo", "inicia protocolo", "inicia el protocolo",
            "generar protocolo", "genera protocolo", "genera el protocolo",
            "crear protocolo", "crea protocolo", "crea el protocolo",
            "necesito los pasos del protocolo",
            "siguientes pasos del protocolo",
            "procede con el protocolo", "continua con el protocolo"
        ]
        
        # Check activation patterns
        if any(pattern in message_norm for pattern in activation_patterns):
            return True
        
        # Special case: If there's an active case and user asks about next steps
        # (but be careful not to trigger on "cuáles son los pasos" which is informational)
        if case_id and ("siguiente" in message_norm or "continuar" in message_norm):
            # Only if it's not an informational question
            if not any(q in message_norm for q in ["que son", "cuales son", "cual es"]):
                return True
        
        return False
        


    def _detect_analysis_intent(self, message: str) -> bool:
        """Detecta si el usuario pide analizar un caso, revisar situación, etc."""
        keywords = ["analiza", "analizar", "caso", "revisar", "evaluar", "situación", "resumen", "conflicto"]
        message_lower = message.lower()
        return any(k in message_lower for k in keywords)

    def _prepare_analysis_messages(self, message: str, history: List, school_name: str, files: List[str] = None, session_id: str = None, bucket_name: str = None) -> List[BaseMessage]:
        """Prepara los mensajes para el análisis de caso."""
        system_prompt = prompt_service.get_case_analysis_prompt(school_name)
        messages = [SystemMessage(content=system_prompt)]
        
        # Agregar historial reciente (últimos 3 mensajes para contexto)
        if history:
            # Preservar TODOS los mensajes de sistema (contexto del caso)
            system_messages = [m for m in history if isinstance(m, SystemMessage)]
            messages.extend(system_messages)
            
            # Agregar últimos 3 mensajes de interacción (User/AI)
            interaction_messages = [m for m in history if not isinstance(m, SystemMessage)]
            messages.extend(interaction_messages[-3:])
        
        # Preparar mensaje del usuario con archivos si existen
        if files:
            import mimetypes
            if message and message.strip():
                content = [{"type": "text", "text": message}]
            else:
                content = []
            for file_uri in files:
                # Ensure URI format
                if not file_uri.startswith("gs://") and not file_uri.startswith("http") and session_id:
                    file_uri = f"gs://{bucket_name or self.bucket_name}/{session_id}/{file_uri}"
                
                # Detect MIME type
                mime_type, _ = mimetypes.guess_type(file_uri)
                
                if mime_type and mime_type.startswith("image/"):
                    content.append({"type": "image_url", "image_url": {"url": file_uri}})
                else:
                    # Assume it's a document (PDF, etc.) supported by Vertex AI
                    content.append({
                        "type": "media",
                        "mime_type": mime_type or "application/pdf",
                        "file_uri": file_uri
                    })
            messages.append(HumanMessage(content=content))
        else:
            messages.append(HumanMessage(content=message))
            
        return messages

    async def _check_case_well_defined(self, history: List[BaseMessage]) -> dict:
        """Verifica si el caso tiene la información mínima: Nombres, Edades, Cursos/Grados."""
        try:
            # Construir historial reciente para contexto
            recent_history = ""
            if history:
                for msg in history:
                    role = "Usuario" if isinstance(msg, HumanMessage) else "Asistente"
                    recent_history += f"{role}: {msg.content}\n"

            prompt = """Analiza la conversación y determina si se han mencionado claramente los siguientes datos de los involucrados en el caso:
            1. Nombres (al menos un nombre o iniciales claras)
            2. Edades (o nivel de desarrollo implícito claro, como el curso)
            3. Cursos o Grados escolares

            NOTA: NO es necesario preguntar por diagnósticos TEA/NEE a menos que el caso específicamente lo requiera.

            Responde SOLO con un JSON:
            {
                "is_defined": boolean,
                "missing_info": [lista de strings con lo que falta, ej: "nombres", "edades", "cursos"]
            }
            """
            
            messages = [
                SystemMessage(content=prompt),
                HumanMessage(content=f"Historial:\n{recent_history}")
            ]
            
            response = await self.llm.ainvoke(messages)
            content = response.content.strip()
            
            # Limpiar markdown
            if "```" in content:
                import re
                match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', content, re.DOTALL)
                if match:
                    content = match.group(1)
            
            import json
            return json.loads(content)
        except Exception as e:
            logger.warning(f" Error checking case definition: {e}")
            # En caso de error, asumir definido para no bloquear, o pedir confirmación
            return {"is_defined": True, "missing_info": []}

    async def _has_active_protocol(self, case_id: str, session_id: str) -> bool:
        """Verifica si ya existe un protocolo generado para esta sesión"""
        if not case_id:
            return False
        
        # Consultar si existe protocolo dinámico cargado
        # Usamos load_dynamic_protocol de protocol_execution_service que busca en Firestore/Storage
        protocol = await protocol_execution_service.load_dynamic_protocol(case_id, session_id)
        return protocol is not None

    async def _generate_case_analysis(self, message: str, history: List, school_name: str, files: List[str] = None, session_id: str = None, bucket_name: str = None, user_id: str = None) -> str:
        """Genera el análisis inicial y empático del caso, considerando archivos adjuntos"""
        try:
            messages = self._prepare_analysis_messages(message, history, school_name, files, session_id, bucket_name)
            response = await self.llm.ainvoke(messages)
            

            return response.content
        except Exception as e:
            logger.warning(f" Error generando análisis de caso: {e}")
            return "Entendido. Procederé a buscar el protocolo correspondiente."
    
    def _build_sanitized_response(
        self,
        ai_response: str,
        case_id: Optional[str] = None,
        session_id: Optional[str] = None,
        suggestions: Optional[List[str]] = None
    ) -> dict:
        """
        Builds a dual-structure response with sanitized text and metadata.
        
        Args:
            ai_response: Raw AI response text
            case_id: Case ID if applicable
            session_id: Session ID
            suggestions: Suggested follow-up questions
            
        Returns:
            Dict with 'text', 'metadata', and 'suggestions' keys
        """
        # Sanitize the text and extract IDs
        sanitized_text, extracted_metadata = response_sanitizer.sanitize(
            ai_response,
            case_id=case_id,
            session_id=session_id,
            preserve_document_names=True
        )
        
        # Build metadata
        metadata = response_sanitizer.build_metadata(
            case_id=case_id,
            session_id=session_id
        )
        
        # Merge extracted IDs into metadata
        if extracted_metadata.get('extracted_ids'):
            metadata['extracted_ids'] = extracted_metadata['extracted_ids']
        
        return {
            "text": sanitized_text,
            "metadata": metadata,
            "suggestions": suggestions or []
        }
    
    
    async def stream_chat(self, message: str, session_id: str, school_name: str, files: List[str] = None, case_id: str = None, user_id: str = None) -> AsyncGenerator[str, None]:
        import json
        import asyncio

        # 0. Determinar bucket de almacenamiento
        # 0. Determinar bucket de almacenamiento y Data Store
        current_bucket = self.bucket_name
        data_store_id = None
        search_app_id = None  # Initialize to avoid UnboundLocalError
        
        # FALLBACK: Si user_id no viene en la request, intentar recuperarlo de los metadatos de la sesión
        if not user_id and session_id:
            try:
                metadata = await history_service.get_session_metadata(session_id)
                if metadata and metadata.get("user_id"):
                    user_id = metadata.get("user_id")
                    logger.info(f"♻️ [STREAM] Recovered user_id {user_id} from session metadata")
                else:
                     logger.warning(f"⚠️ [STREAM] No user_id provided AND no metadata found for session {session_id}. Potentially falling back to Global Data Store.")
            except Exception as e:
                logger.warning(f"⚠️ [STREAM] Failed to recover user_id from metadata: {e}")

        # --- TOKEN LIMIT CHECK ---
        if user_id:
            try:
                # Check limits before doing anything expensive
                token_service.check_limits(user_id)
            except LimitExceededException as e:
                logger.warning(f"🚫 [LIMIT] Token limit exceeded for user {user_id}: {e.message}")
                yield json.dumps({"type": "content", "content": f"\n\n🚫 **{e.message}**\n\nPor favor contacta a tu administrador para aumentar tu cupo."}, ensure_ascii=False) + "\n"
                return
            except Exception as e:
                logger.error(f"⚠️ [LIMIT] Error checking token limits (falling open): {e}")

        if user_id:
            try:
                from app.services.users.user_service import user_service
                from app.services.school_service import school_service
                
                # Use simple service if possible to avoid circular dep issues, or standard one
                # Note: imports are inside method to match existing pattern
                
                user = user_service.get_user_by_id(user_id)
                if user and user.colegios:
                     school_id = user.colegios[0]
                     current_bucket = storage_service.get_school_bucket_name(school_id)
                     
                     # Data Store Resolution
                     colegio = school_service.get_colegio_by_id(school_id)
                     if colegio:
                         data_store_id = colegio.data_store_id
                         search_app_id = colegio.search_app_id
                         
            except Exception as e:
                logger.warning(f"Error resolving school bucket/datastore for user {user_id}: {e}")
        
        # Set Context
        from app.core.context import current_data_store_id, current_user_email
        current_data_store_id.set(data_store_id)
        
        # Set user email for email tools
        if user_id:
            try:
                user = user_service.get_user_by_id(user_id)
                if user and user.correo:
                    current_user_email.set(user.correo)
                    logger.info(f"✉️ [STREAM] User email set in context: {user.correo}")
            except Exception as e:
                logger.warning(f"⚠️ [STREAM] Could not set user email in context: {e}")
        
        logger.info(f"   🪣 [STREAM] Bucket resolved: {current_bucket} | Data Store: {data_store_id}")
        
        logger.info(f"   🪣 [STREAM] Bucket resolved: {current_bucket}")

        # Cargar historial (lo necesitamos para intent classification y para procesos)
        history = await self._load_history(session_id, current_bucket)
        
        # EARLY CHECK REMOVED: We now support remote document analysis without attached files.
        # The intent router and downstream logic will handle this.

        # PRE-LOAD: Auto-load case files BEFORE intent classification if no files attached and case exists
        # This allows the intent router to correctly classify as DOCUMENT_ANALYSIS with files
        if case_id and not files:
            analysis_keywords = ["analiz", "revis", "examin", "verific", "lee", "estudia", "resum", "que dice", "transcripci", "entrevista", "contenido"]
            if any(keyword in message.lower() for keyword in analysis_keywords):
                logger.info(f"📂 [PRE-LOAD] Auto-loading case files before intent classification")
                try:
                    from app.services.case_service import case_service
                    case_docs = case_service.get_case_documents(case_id)
                    
                    if case_docs:
                        case_files = []
                        for doc in case_docs:
                            gcs_uri = doc.get("gcs_uri", "")
                            content_type = doc.get("content_type", "")
                            name = doc.get("name", "").lower()
                            
                            # Solo PDFs y TXTs son analizables
                            if gcs_uri.startswith("gs://"):
                                is_analyzable = (
                                    content_type == "application/pdf" or
                                    content_type.startswith("text/") or
                                    name.endswith(".pdf") or
                                    name.endswith(".txt")
                                )
                                if is_analyzable:
                                    case_files.append(gcs_uri)
                        
                        MAX_AUTO_LOAD_DOCS = 10
                        if len(case_files) > MAX_AUTO_LOAD_DOCS:
                            case_files = case_files[:MAX_AUTO_LOAD_DOCS]
                        
                        if case_files:
                            files = case_files
                            logger.info(f"✅ [PRE-LOAD] Loaded {len(case_files)} case documents: {[f.split('/')[-1] for f in case_files]}")
                        else:
                            logger.info(f"📭 [PRE-LOAD] No analyzable PDF/TXT files found")
                    else:
                        logger.info(f"📭 [PRE-LOAD] No documents registered for case")
                except Exception as e:
                    logger.error(f"❌ [PRE-LOAD] Error loading case files: {e}")
        
        # 1. Classify intent for optimal routing
        intent_result = await intent_router.classify_intent(
            message=message,
            has_files=bool(files and len(files) > 0),
            case_id=case_id,
            history=history,
            user_id=user_id  # Pass user_id for token tracking
        )
        logger.info(f"🎯 [STREAM ROUTER] Intent: {intent_result['intent']} (confidence: {intent_result['confidence']})")
        
        # AMBIGUITY CHECK - Handle low-confidence classifications
        from app.services.chat.ambiguity_handler import ambiguity_handler
        
        if ambiguity_handler.should_handle(intent_result):
            logger.info(f"🤔 [AMBIGUITY] Requesting clarification from user")
            
            # Generate clarification message
            clarification = ambiguity_handler.generate_clarification(
                message=message,
                intent_result=intent_result,
                has_files=bool(files),
                case_id=case_id
            )
            
            # Stream clarification
            yield json.dumps({"type": "content", "content": clarification}, ensure_ascii=False) + "\n"
            
            # Save to history
            new_messages = [HumanMessage(content=message), AIMessage(content=clarification)]
            await history_service.append_messages(session_id, new_messages)
            return
        
        # Legacy protocol detection for backward compatibility
        is_protocol = self._detect_protocol_intent(message, case_id)
        is_analysis = self._detect_analysis_intent(message)


        # NUEVO: Cargar e inyectar contexto del caso (Siempre, ya que no se persiste en BD)
        if case_id:
            # Verificar si ya tenemos un mensaje de sistema con el contexto
            has_context = any(isinstance(m, SystemMessage) and "CONTEXTO DEL CASO" in str(m.content) for m in history)
            
            if not has_context:
                logger.info(f"🆕 [STREAM CONTEXT] Injecting case context for session {session_id}")
                case_context = await self._load_case_context(case_id)
                
                if case_context:
                    # Inyectar contexto del caso como mensaje del sistema al inicio
                    context_message = SystemMessage(content=case_context["summary"])
                    history.insert(0, context_message)
                    logger.info(f"✅ [STREAM CONTEXT] Case context injected: '{case_context['details']['title']}'")
                    
                    # IMPORTANT: Set context in ContextVar for search tool enrichment
                    from app.core.context import current_case_context
                    current_case_context.set(case_context["summary"])
                else:
                    logger.warning(f"⚠️ [STREAM CONTEXT] Could not load case context for {case_id}")
            
            # Import case_service (needed for add_session_to_case later)
            from app.services.case_service import case_service

        # Task de Protocolo (Background)
        protocol_task = None
        if is_protocol:
            async def generate_protocol_task():
                logger.info(f"   🚀 [STREAM] Iniciando tarea de protocolo en background...")
                try:
                    # VALIDACIÓN DE PROTOCOLO EN STREAM
                    # 1. Ya existe?
                    has_protocol = await self._has_active_protocol(case_id, session_id)
                    if has_protocol:
                        return " (El protocolo ya se encuentra activo y guardado para este caso.)"

                    # 2. Caso bien definido?
                    # En stream es difícil interrumpir el flujo visual, pero podemos chequear y devolver error
                    case_check = await self._check_case_well_defined(history)
                    if not case_check.get("is_defined", False):
                        missing = ", ".join(case_check['missing_info'])
                        return f"\n\n**Aviso:** No puedo generar el protocolo oficial aún. Faltan datos clave: {missing}. Por favor facilítamelos."

                    protocol_context = None
                    if case_id:
                        protocol_context = await protocol_execution_service.get_protocol_context(case_id, session_id)
                    
                    # Pass user_id for token tracking
                    protocol_response, _ = await protocol_agent.process_request(
                        message, history, school_name, protocol_context, files=files, bucket_name=current_bucket, 
                        case_id=case_id, session_id=session_id, user_id=user_id
                    )
                    
                    # Intentar extraer protocolo para guardarlo
                    if case_id:
                         await protocol_execution_service.extract_and_save_protocol(protocol_response, case_id, session_id, message)
                    
                    return protocol_response
                except Exception as e:
                    logger.info(f"   ❌ [STREAM] Error en ProtocolAgent background task: {e}")
                    return "\n\n(Error al generar el protocolo detallado.)"

            protocol_task = asyncio.create_task(generate_protocol_task())

        # Vincular sesión al caso si existe
        if case_id:
            case_service.add_session_to_case(case_id, session_id)

        # FAST PATH: CASE_QUERY - Answer from loaded context
        if intent_result['intent'] == intent_router.CASE_QUERY and case_id and case_context:
            logger.info(f"⚡ [FAST PATH STREAM] CASE_QUERY - answering from context (cached)")
            
            # Use already-loaded context (no reload needed!)
            # Simple prompt to answer from context
            system_prompt = f"""Eres CONI, asistente de convivencia escolar para {school_name}.
Habla de forma cercana y natural, como un colega de confianza.

CONTEXTO DEL CASO ACTIVO:
{case_context['summary']}

Responde usando la información del caso. Si algo no está disponible, dilo de forma simple.
Evita lenguaje corporativo ("cabe destacar", "es importante mencionar", etc.)
NO menciones IDs técnicos del sistema."""

            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=message)
            ]
            
            # Stream the response
            yield json.dumps({"type": "thinking", "content": f"Consultando caso..."}, ensure_ascii=False) + "\n"
            await asyncio.sleep(0.3)
            
            full_response = ""
            # Track tokens for CASE_QUERY
            accumulated_usage = None
            
            async for chunk in self.llm.astream(messages):
                if chunk.content:
                    full_response += chunk.content
                    yield json.dumps({"type": "content", "content": chunk.content}, ensure_ascii=False) + "\n"
                
                # Check for usage metadata in chunk
                if chunk.usage_metadata:
                    accumulated_usage = chunk.usage_metadata

            # Save usage
            if user_id and accumulated_usage:
                from app.services.users.user_service import user_service
                user_service.update_token_usage(
                    user_id=user_id,
                    input_tokens=accumulated_usage.get('input_tokens', 0),
                    output_tokens=accumulated_usage.get('output_tokens', 0),
                    model_name=self.llm.model_name
                )
                logger.info(f"📊 [STREAM FALLBACK] Token usage tracked for {user_id}: {accumulated_usage}")
            else:
                logger.warning(f"⚠️ [STREAM FALLBACK] Token usage NOT tracked. User: {user_id}, Usage: {accumulated_usage}")
            
            # Save history
            new_messages = [HumanMessage(content=message), AIMessage(content=full_response)]
            await history_service.append_messages(session_id, new_messages)
            return
        
        # FAST PATH: DOCUMENT_ANALYSIS - Direct analysis
        if intent_result['intent'] == intent_router.DOCUMENT_ANALYSIS and files:
            logger.info(f"⚡ [FAST PATH STREAM] DOCUMENT_ANALYSIS - direct processing")
            
            # Get case context if needed
            case_context = None
            if case_id:
                case_context = await self._load_case_context(case_id)
            
            # Convert files to full GCS URIs if needed
            full_file_uris = []
            for file_uri in files:
                if not file_uri.startswith("gs://"):
                    file_uri = f"gs://{current_bucket}/{session_id}/{file_uri}"
                full_file_uris.append(file_uri)
            
            logger.info(f"📄 [FAST PATH] File URIs: {full_file_uris}")
            
            # Stream initial thinking
            yield json.dumps({"type": "thinking", "content": f"Preparando análisis de {len(full_file_uris)} documento(s)..."}, ensure_ascii=False) + "\n"
            await asyncio.sleep(0.3)
            
            # Show progress for each file
            for i, file_uri in enumerate(full_file_uris, 1):
                # Extract filename from URI
                filename = file_uri.split('/')[-1]
                # Remove session ID prefix if present
                if '__' in filename:
                    filename = filename.split('__', 1)[1]
                
                yield json.dumps({
                    "type": "thinking",
                    "content": f"Analizando documento {i}/{len(full_file_uris)}: {filename}..."
                }, ensure_ascii=False) + "\n"
                await asyncio.sleep(0.2)
            
            # Consolidation message
            yield json.dumps({
                "type": "thinking",
                "content": "Consolidando análisis de todos los documentos..."
            }, ensure_ascii=False) + "\n"
            await asyncio.sleep(0.3)
            
            
            # Now do the actual analysis with streaming
            try:
                full_response_text = ""
                # Pass user_id for token tracking inside DocumentAnalyzer
                async for chunk in document_analyzer.analyze_documents_stream(
                    files=full_file_uris,
                    message=message,
                    school_name=school_name,

                    search_app_id=search_app_id,
                    case_context=case_context,
                    user_id=user_id
                ):
                    full_response_text += chunk
                    yield json.dumps({"type": "content", "content": chunk}, ensure_ascii=False) + "\n"
                
                analysis_response = full_response_text
                
                # IMPORTANT: Extract and save context summary (only if no active case)
                if not case_id:
                    try:
                        logger.info(f"📝 [SESSION_CONTEXT STREAM] Extracting context from analysis for session {session_id}")
                        context_summary = await document_analyzer.extract_context_summary(
                            analysis_text=analysis_response,
                            user_message=message
                        )
                        await history_service.update_session_context(session_id, context_summary)
                        logger.info(f"✅ [SESSION_CONTEXT STREAM] Saved context: {context_summary.get('key_concepts', [])}")
                    except Exception as e:
                        logger.warning(f"⚠️ [SESSION_CONTEXT STREAM] Error saving context (non-critical): {e}")
                
            except Exception as e:
                # Handle analysis errors gracefully
                logger.error(f"❌ [DOC_ANALYZER] Error: {e}")
                error_message = "Lo siento, no pude analizar los documentos. "
                
                if "quota" in str(e).lower():
                    error_message += "Se excedió la cuota de procesamiento. Por favor, intenta con menos documentos."
                elif "size" in str(e).lower() or "token" in str(e).lower() or "limit" in str(e).lower():
                    error_message += "Los documentos son muy grandes o exceden los límites de procesamiento. Por favor, reduce el número de páginas o archivos."
                else:
                    error_message += f"Error: {str(e)[:100]}"
                
                # Stream error as content
                yield json.dumps({"type": "content", "content": error_message}, ensure_ascii=False) + "\n"
                
                # Save error to history
                new_messages = [
                    HumanMessage(content=message),
                    AIMessage(content=error_message)
                ]
                await history_service.append_messages(session_id, new_messages)
                return
            
            # Generate suggestions
            suggestions = await self._generate_suggestions(message, history, school_name, user_id=user_id)
            if suggestions:
                yield json.dumps({"type": "suggestions", "content": suggestions}, ensure_ascii=False) + "\n"
            
            # Save history
            new_messages = []
            if full_file_uris:
                content = [{"type": "text", "text": message}] if message else []
                for file_uri in full_file_uris:
                    content.append({"type": "image_url", "image_url": {"url": file_uri}})
                new_messages.append(HumanMessage(content=content))
            else:
                new_messages.append(HumanMessage(content=message))
            new_messages.append(AIMessage(content=analysis_response))
            await history_service.append_messages(session_id, new_messages)
            return
        
        # FAST PATH: TOOL_REQUIRED (email/calendar) - Deterministic execution
        if intent_result['intent'] == intent_router.TOOL_REQUIRED:
            logger.info(f"🚀 [FAST PATH STREAM] TOOL_REQUIRED - Using Tool Orchestrator")
            
            from app.services.chat.tool_orchestrator import tool_orchestrator
            
            # Stream thinking message
            yield json.dumps({"type": "thinking", "content": "Preparando..."}, ensure_ascii=False) + "\n"
            await asyncio.sleep(0.2)
            
            # Execute tool orchestrator
            ai_response = await tool_orchestrator.execute_tool_request(
                message=message,
                user_id=user_id,
                case_id=case_id,
                history=history,
                school_name=school_name
            )
            
            # Stream the response content
            yield json.dumps({"type": "content", "content": ai_response}, ensure_ascii=False) + "\n"
            
            # Save history
            new_messages = [HumanMessage(content=message), AIMessage(content=ai_response)]
            await history_service.append_messages(session_id, new_messages)
            
            # Send empty suggestions for tool requests
            yield json.dumps({"type": "suggestions", "content": []}, ensure_ascii=False) + "\n"
            return
        
        # FAST PATH: SIMPLE_QA - Fast answers using Flash model
        if intent_result['intent'] == intent_router.SIMPLE_QA:
            logger.info(f"🚀 [FAST PATH STREAM] SIMPLE_QA - Using Simple QA Service")
            
            from app.services.chat.simple_qa_service import simple_qa_service
            
            # Get user context if available
            user_context = None
            if user_id:
                try:
                    from app.services.users.user_service_simple import user_service_simple
                    user = user_service_simple.get_user_by_id(user_id)
                    if user:
                        user_context = {
                            "nombre": user.nombre,
                            "rol": user.rol
                        }
                except Exception as e:
                    logger.warning(f"⚠️ [SIMPLE_QA] Error getting user context: {e}")
            
            # Stream thinking message
            yield json.dumps({"type": "thinking", "content": "Pensando..."}, ensure_ascii=False) + "\n"
            await asyncio.sleep(0.1)
            
            # Get answer from Simple QA Service
            ai_response = await simple_qa_service.answer_question(
                message=message,
                school_name=school_name,
                history=history,
                user_context=user_context
            )
            
            # Stream the response content
            yield json.dumps({"type": "content", "content": ai_response}, ensure_ascii=False) + "\n"
            
            # Save history
            new_messages = [HumanMessage(content=message), AIMessage(content=ai_response)]
            await history_service.append_messages(session_id, new_messages)
            
            # Generate and send suggestions
            suggestions = await self._generate_suggestions(message, history, school_name, user_id=user_id)
            yield json.dumps({"type": "suggestions", "content": suggestions or []}, ensure_ascii=False) + "\n"
            return
        
        # FAST PATH: CASE_QUERY - Fast answers about active case
        if intent_result['intent'] == intent_router.CASE_QUERY and case_id:
            logger.info(f"🚀 [FAST PATH STREAM] CASE_QUERY - Using Case Query Service")
            
            from app.services.chat.case_query_service import case_query_service
            
            # Stream thinking message
            yield json.dumps({"type": "thinking", "content": "Consultando información del caso..."}, ensure_ascii=False) + "\n"
            await asyncio.sleep(0.1)
            
            # Get answer from Case Query Service
            ai_response = await case_query_service.answer_case_question(
                message=message,
                case_id=case_id,
                school_name=school_name
            )
            
            # Stream the response content
            yield json.dumps({"type": "content", "content": ai_response}, ensure_ascii=False) + "\n"
            
            # Save history
            new_messages = [HumanMessage(content=message), AIMessage(content=ai_response)]
            await history_service.append_messages(session_id, new_messages)
            
            # Generate and send suggestions
            suggestions = await self._generate_suggestions(message, history, school_name, user_id=user_id)
            yield json.dumps({"type": "suggestions", "content": suggestions or []}, ensure_ascii=False) + "\n"
            return
        
        # FAST PATH: CASE_CREATION - Guided case documentation
        if intent_result['intent'] == intent_router.CASE_CREATION:
            logger.info(f"🚀 [FAST PATH STREAM] CASE_CREATION - Using Case Creation Service")
            
            from app.services.chat.case_creation_service import case_creation_service
            from app.services.users.user_service_simple import user_service_simple
            
            # Get user context for personalization
            user_context = None
            search_app_id = None  # For RAG search
            
            if user_id:
                try:
                    user_data = user_service_simple.get_user_by_id(user_id)
                    if user_data:
                        user_context = {
                            "nombre": user_data.nombre,
                            "rol": user_data.rol,
                            "correo": user_data.correo
                        }
                        
                        # Get search_app_id from colegio
                        if user_data.colegios:
                            from app.services.school_service import school_service
                            school_id = user_data.colegios[0]
                            colegio = school_service.get_colegio_by_id(school_id)
                            if colegio and colegio.search_app_id:
                                search_app_id = colegio.search_app_id
                                logger.info(f"🏫 [CASE_CREATION] Using search_app_id: {search_app_id}")
                            else:
                                # Fallback to demo app
                                search_app_id = "demostracion_1767713503741"
                                logger.warning(f"⚠️ [CASE_CREATION] No search_app_id in colegio, using demo: {search_app_id}")
                except Exception as e:
                    logger.warning(f"⚠️ [CASE_CREATION] Could not load user context: {e}")
            
            # Stream thinking message
            yield json.dumps({"type": "thinking", "content": "Analizando descripción del caso..."}, ensure_ascii=False) + "\n"
            await asyncio.sleep(0.1)
            
            # Get guided response from Case Creation Service
            ai_response = await case_creation_service.analyze_case_description(
                message=message,
                school_name=school_name,
                history=history,
                user_context=user_context,
                search_app_id=search_app_id,  # Pass Search App ID for RAG
                case_id=case_id  # Pass case_id to update ai_summary
            )
            
            # Stream the response content
            yield json.dumps({"type": "content", "content": ai_response}, ensure_ascii=False) + "\n"
            
            # Save history
            new_messages = [HumanMessage(content=message), AIMessage(content=ai_response)]
            await history_service.append_messages(session_id, new_messages)
            
            # Generate and send suggestions
            suggestions = await self._generate_suggestions(message, history, school_name, user_id=user_id)
            yield json.dumps({"type": "suggestions", "content": suggestions or []}, ensure_ascii=False) + "\n"
            return
        
        # Handle DOCUMENT_ANALYSIS intent but no files -> USE SEARCH APPS (RAG Mode)
        if intent_result['intent'] == intent_router.DOCUMENT_ANALYSIS and not files:
            logger.info(f"🔍 [REMOTE SEARCH] User requested document analysis without attachments. Using Search Apps...")
            
            yield json.dumps({"type": "thinking", "content": f"Buscando en documentos del colegio y normativas legales..."}, ensure_ascii=False) + "\n"
            
            try:
                # Get session context for better search
                session_context = None
                try:
                    session_context_summary = await history_service.get_session_context(session_id)
                    if session_context_summary:
                        session_context = {"summary": session_context_summary}
                        logger.info(f"📝 [REMOTE SEARCH] Using session context for document search")
                except Exception as e:
                    logger.debug(f"Session context not available: {e}")
                
                # Stream response from RAG Search via document_analyzer
                full_response_text = ""
                async for chunk in document_analyzer.analyze_documents_stream(
                    message=message,
                    school_name=school_name,
                    files=None,  # No files = RAG mode (uses Search Apps)
                    search_app_id=search_app_id,
                    case_context=session_context,
                    user_id=user_id
                ):
                    full_response_text += chunk
                    yield json.dumps({"type": "content", "content": chunk}, ensure_ascii=False) + "\n"
                
                # Generate suggestions
                suggestions = await self._generate_suggestions(message, history, school_name, user_id=user_id)
                if suggestions:
                    yield json.dumps({"type": "suggestions", "content": suggestions}, ensure_ascii=False) + "\n"
                
                # Save history
                new_messages = [HumanMessage(content=message), AIMessage(content=full_response_text)]
                await history_service.append_messages(session_id, new_messages)
                return

            except Exception as e:
                logger.error(f"❌ [REMOTE SEARCH] Error: {e}")
                error_message = f"Lo siento, tuve un error al buscar en los documentos: {str(e)}"
                yield json.dumps({"type": "content", "content": error_message}, ensure_ascii=False) + "\n"
                msg = [HumanMessage(content=message), AIMessage(content=error_message)]
                await history_service.append_messages(session_id, msg)
                return


        # Task de Sugerencias (Background - paralelo a todo)
        suggestions_task = asyncio.create_task(self._generate_suggestions(message, history, school_name, user_id=user_id))

        # Simular pensamientos iniciales (UI Feedback)
        thoughts = [
            f"Analizando Información del Colegio {school_name}...",
            "Consultando contexto..."
        ]
        if is_protocol:
            thoughts.append("Iniciando búsqueda de protocolos...")
        
        for thought in thoughts:
            yield json.dumps({"type": "thinking", "content": thought}, ensure_ascii=False) + "\n"
            await asyncio.sleep(0.5)

        # Generar y Stream de Análisis (Foreground)
        full_analysis_response = ""
        try:
            if is_protocol or is_analysis:
                # Si es PROTOCOLO (activación), usar prompt de confirmación
                if is_protocol:
                    # Prompt corto de "Activando..."
                    messages = [
                        SystemMessage(content=prompt_service.get_protocol_activation_prompt(school_name)),
                        HumanMessage(content=message) # Agregamos el mensaje del usuario para que Vertex tenga contexto
                    ]
                else:
                    # Si es SOLO ANÁLISIS, usar prompt de análisis normal
                    messages = self._prepare_analysis_messages(message, history, school_name, files, session_id, bucket_name=current_bucket)
                
                stream_generator = self.llm.astream(messages)
            
                logger.info(f"   🌊 [STREAM] Streaming análisis...")
                
                async for chunk in stream_generator:
                    content = chunk.content
                    if content:
                        full_analysis_response += content
                        yield json.dumps({"type": "content", "content": content}, ensure_ascii=False) + "\n"
        
            else:
                # Flujo NO protocolo (Chat general con tools o conversación)
                # FIX: Replaced obsolete self.chat() call with direct model streaming
                
                # Basic system prompt for general chat
                system_prompt = f"Eres un asistente experto en Convivencia Escolar para el colegio {school_name}. Responde de manera profesional, empática y precisa."
                
                messages = [SystemMessage(content=system_prompt)]
                
                # Add history
                if history:
                    # Filter system messages to avoid duplication if we just added one? 
                    # Actually history usually contains previous interaction. 
                    # For consistency/safety:
                    interaction_messages = [m for m in history if not isinstance(m, SystemMessage)]
                    messages.extend(interaction_messages[-5:]) # Last 5 for context
                
                messages.append(HumanMessage(content=message))
                
                stream_generator = self.llm.astream(messages)
                
                logger.info(f"   💬 [STREAM] Streaming general chat response...")
                
                # Track usage for general chat
                accumulated_usage = None
                
                async for chunk in stream_generator:
                    content = chunk.content
                    if content:
                        full_analysis_response += content
                        yield json.dumps({"type": "content", "content": content}, ensure_ascii=False) + "\n"
                    
                    if chunk.usage_metadata:
                        accumulated_usage = chunk.usage_metadata

                if user_id and accumulated_usage:
                    from app.services.users.user_service import user_service
                    user_service.update_token_usage(
                        user_id=user_id,
                        input_tokens=accumulated_usage.get('input_tokens', 0),
                        output_tokens=accumulated_usage.get('output_tokens', 0),
                        model_name=self.llm.model_name
                    )

        except Exception as e:
            logger.info(f"Error streaming analisis: {e}")
            yield json.dumps({"type": "content", "content": "Lo siento, ocurrió un error procesando tu mensaje."}, ensure_ascii=False) + "\n"

        # Esperar y adjuntar Protocolo (si aplica)
        full_response = full_analysis_response
        if protocol_task:
            logger.info(f"   ⏳ [STREAM] Esperando tarea de protocolo...")
            # Yield un separador o indicador visual si se desea (opcional)
            # yield json.dumps({"type": "content", "content": "\n\nGenerating protocol...\n\n"}) 
            
            # Mantener vivo el stream con thinking (opcional, pero ayuda a que no timeout)
            yield json.dumps({"type": "thinking", "content": "Generando reporte oficial..."}, ensure_ascii=False) + "\n"

            protocol_content = await protocol_task
            
            # Streaming del protocolo (simulado o bloque completo)
            # Como ya lo tenemos todo, lo enviamos. Podríamos partirlo si es muy largo para efecto visual.
            prefix = "\n\n---\n\n"
            yield json.dumps({"type": "content", "content": prefix + protocol_content}, ensure_ascii=False) + "\n"
            
            full_response += prefix + protocol_content

        # Emitir Sugerencias (ya deberían estar listas o casi listas)
        try:
            suggestions = await suggestions_task
            if suggestions:
                logger.info(f"   💡 [STREAM] Sugerencias listas: {suggestions}")
                yield json.dumps({"type": "suggestions", "content": suggestions}, ensure_ascii=False) + "\n"
        except Exception as e:
            logger.info(f"   ⚠️ Error generando sugerencias: {e}")

       
    async def _generate_suggestions(self, message: str, history: List[BaseMessage], school_name: str, user_id: str = None) -> List[str]:
        """Genera 3 preguntas sugeridas breves basadas en el mensaje del usuario y contexto."""
        try:
            from langchain_core.messages import SystemMessage, HumanMessage
            
            # Construir historial reciente para contexto
            recent_history = ""
            if history:
                for msg in history[-3:]:
                    role = "Usuario" if isinstance(msg, HumanMessage) else "Asistente"
                    recent_history += f"{role}: {msg.content}\n"

            prompt = f"""Eres un asistente experto en Convivencia Escolar para el colegio {school_name}.
            Basado en la siguiente conversación y el ULTIMO mensaje del usuario, sugiere 3 preguntas cortas que el usuario podría hacerte a continuación.

            DIRECTRICES:
            1. Las preguntas DEBEN estar relacionadas con: Protocolos (RICE, Aula Segura), Leyes (21.030, etc.), Gestión de Casos, Redacción de correos formales o Análisis de situaciones conflictivas/riesgo.
            2. EVITA preguntas genéricas de asistente personal como "¿Qué hora es?", "¿Cuál es mi horario?", "¿Tengo tareas?".
            3. Si el usuario saluda, sugiere: "¿Cómo activo un protocolo?", "¿Qué dice el reglamento sobre bullying?", "¿Ayúdame a redactar un correo?".
            4. **PRIORIDAD:** Si el usuario describe un conflicto entre estudiantes O un caso de desregulación y NO menciona si tienen diagnóstico, SUGIERE INMEDIATAMENTE: "¿El estudiante tiene diagnóstico TEA?".
            5. Si hay un caso en curso, sugiere pasos lógicos siguientes del protocolo.

            Historial reciente:
            {recent_history}
            
            Ultimo mensaje usuario: {message}
            
            Responde SOLO con un array JSON de strings."""
            
            messages = [
                HumanMessage(content=prompt)
            ]
            
            # Use flash-lite model for faster suggestions (not pro)
            flash_llm = ChatVertexAI(
                model_name=settings.VERTEX_MODEL_FLASH,  # Use flash-lite for speed
                temperature=0.7,
                project=self.project_id,
                location=self.model_location,
                max_retries=1
            )
            
            response = await flash_llm.ainvoke(messages)
            
            # Track token usage for suggestions
            if user_id and response.usage_metadata:
                try:
                    from app.services.users.user_service import user_service
                    user_service.update_token_usage(
                        user_id=user_id,
                        input_tokens=response.usage_metadata.get('input_tokens', 0),
                        output_tokens=response.usage_metadata.get('output_tokens', 0),
                        model_name=flash_llm.model_name
                    )
                    logger.info(f"📊 [SUGGESTIONS] Token usage tracked for {user_id}: {response.usage_metadata}")
                except Exception as e:
                    logger.warning(f"⚠️ [SUGGESTIONS] Error tracking tokens: {e}")

            content = response.content.strip()
            logger.info(f"   🧠 [SUGGESTIONS] Raw response: {content[:100]}...")
            
            # Limpiar markdown si el modelo lo incluye
            if "```json" in content:
                import re
                match = re.search(r'```json\s*(\[.*?\])\s*```', content, re.DOTALL)
                if match:
                    content = match.group(1)
            elif "```" in content:
                 import re
                 match = re.search(r'```\s*(\[.*?\])\s*```', content, re.DOTALL)
                 if match:
                    content = match.group(1)

            import json
            try:
                suggestions = json.loads(content)
            except json.JSONDecodeError:
                logger.info(f"   ⚠️ [SUGGESTIONS] JSON parse failed, trying fallback list parsing")
                # Fallback: intentar parsear como lista de texto si el modelo devolvió algo como:
                # 1. Pregunta 1
                # 2. Pregunta 2
                lines = content.split('\n')
                suggestions = []
                for line in lines:
                    line = line.strip()
                    # Quitar numeración "1. ", "- " etc
                    import re
                    clean_line = re.sub(r'^[\d-]+\.?\s*', '', line)
                    if clean_line and "?" in clean_line:
                        suggestions.append(clean_line)

            if isinstance(suggestions, list):
                final_suggestions = suggestions[:3] # Asegurar max 3
                logger.info(f"   ✅ [SUGGESTIONS] Generated: {final_suggestions}")
                return final_suggestions
            return []
            
        except Exception as e:
            logger.info(f"   ❌ Error generating suggestions: {e}")
            return []


try:
    vertex_agent = GeneralChatAgent()
except Exception as e:
    logger.warning(f" Could not initialize GeneralChatAgent: {e}")
    class MockVertexAgent:
        async def chat(self, *args, **kwargs): return "Error: Agent service not available."
        async def stream_chat(self, *args, **kwargs): yield "Error: Agent service not available."
    vertex_agent = MockVertexAgent()
