import asyncio
import logging
from typing import List, Optional, Dict
import vertexai
from vertexai.generative_models import GenerativeModel, Part, SafetySetting, HarmCategory, HarmBlockThreshold
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class DocumentAnalyzer:
    """
    Fast-path service for analyzing documents without ReAct agent overhead.
    Optimized for quick document analysis with single LLM call.
    """
    
    def __init__(self):
        self._llm = None
        self.model_location = settings.VERTEX_LOCATION or "us-central1"
    
    @property
    def llm(self):
        """Lazy-loaded Vertex AI Generative Model with Gemini 3 Flash Preview"""
        if self._llm is None:
            # Initialize Vertex AI with project and location
            vertexai.init(
                project=settings.PROJECT_ID,
                location=self.model_location
            )
            
            logger.info(f"🤖 [DOC_ANALYZER] Initializing Gemini 2.5 Flash Lite with Vertex AI SDK")
            
            # Create model with Gemini 2.5 Flash Lite
            self._llm = GenerativeModel(
                model_name="gemini-2.5-flash-lite",
                safety_settings=[
                    SafetySetting(
                        category=HarmCategory.HARM_CATEGORY_HARASSMENT,
                        threshold=HarmBlockThreshold.BLOCK_NONE
                    ),
                    SafetySetting(
                        category=HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                        threshold=HarmBlockThreshold.BLOCK_NONE
                    ),
                    SafetySetting(
                        category=HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                        threshold=HarmBlockThreshold.BLOCK_NONE
                    ),
                    SafetySetting(
                        category=HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                        threshold=HarmBlockThreshold.BLOCK_NONE
                    ),
                ]
            )
        return self._llm
    
    async def analyze_documents(
        self,
        files: List[str],
        message: str,
        school_name: str,
        case_context: Optional[Dict] = None
    ) -> str:
        """
        Directly analyzes documents with a single LLM call (no tools).
        
        Args:
            files: List of GCS URIs
            message: User message about the documents
            school_name: School name for context
            case_context: Optional case context information
            
        Returns:
            Analysis response text
        """
        import time
        start_time = time.time()
        
        try:
            file_count = len(files)
            logger.info(f"📄 [DOC_ANALYZER] Analyzing {file_count} documents")
            logger.info(f"📎 [DOC_ANALYZER] Files: {files}")
            
            # Build system prompt with current date
            from datetime import datetime
            current_date_str = datetime.now().strftime("%A %d de %B de %Y")
            
            system_prompt = f"""Eres CONI, asistente de IA especializado en convivencia escolar para {school_name}.

FECHA ACTUAL DEL SISTEMA: {current_date_str}
(Usa esta fecha como referencia. Si un documento menciona fechas futuras respecto a hoy, es probable que sea un error tipográfico o el documento es antiguo)

Tu tarea es analizar los documentos adjuntos que el usuario te ha compartido.

INSTRUCCIONES:
1. Lee cuidadosamente cada documento adjunto
2. Identifica información clave relevante para convivencia escolar
3. Si el usuario pregunta algo específico, enfócate en eso
4. Proporciona un análisis claro y estructurado
5. Si detectas posibles protocolos aplicables, menciónallos
6. NO menciones IDs técnicos del sistema

FORMATO DE RESPUESTA:
- Sé conciso pero completo
- Usa bullet points para mayor claridad
- Menciona el nombre de los documentos cuando sea relevante
- Si encuentras información sobre estudiantes involucrados, edades, cursos, etc., resúmela"""

            if case_context:
                system_prompt += f"\n\nCONTEXTO DEL CASO ACTIVO:\n{case_context.get('summary', '')}"
            
            # Build content parts for Vertex AI SDK
            content_parts = [system_prompt, message or "Analiza estos documentos"]
            
            for file_uri in files:
                # Vertex AI SDK format for GCS file URIs
                if file_uri.startswith("gs://"):
                    content_parts.append(Part.from_uri(file_uri, mime_type="application/pdf"))
            
            # Single LLM call - no ReAct overhead
            setup_time = time.time() - start_time
            logger.info(f"⏱️ [DOC_ANALYZER] Setup time: {setup_time:.2f}s")
            logger.info(f"🚀 [DOC_ANALYZER] Starting LLM inference...")
            llm_start = time.time()
            
            # Generate response using Vertex AI SDK
            try:
                logger.info(f"🔧 [DOC_ANALYZER] Calling generate_content_async with {len(content_parts)} parts")
                response = await self.llm.generate_content_async(content_parts)
                logger.info(f"🔧 [DOC_ANALYZER] Response received, checking content...")
            except ValueError as e:
                error_msg = str(e)
                logger.error(f"❌ [DOC_ANALYZER] ValueError: {error_msg}")
                if "model output must contain either output text or tool calls" in error_msg:
                    return "Lo siento, el modelo no pudo generar una respuesta para estos archivos. Esto puede ocurrir si el contenido fue bloqueado por políticas de seguridad o si los archivos están vacíos. Por favor, intenta con otros archivos."
                raise
            except Exception as e:
                logger.error(f"❌ [DOC_ANALYZER] Unexpected error type: {type(e).__name__}: {e}")
                if "model output must contain either output text or tool calls" in str(e):
                    return "Lo siento, el modelo no pudo generar una respuesta para estos archivos. Esto puede ocurrir si el contenido fue bloqueado por políticas de seguridad."
                raise
            
            llm_time = time.time() - llm_start
            total_time = time.time() - start_time
            
            # Check if response has text
            if not response.text or len(response.text.strip()) == 0:
                # Check if blocked by safety
                if hasattr(response, 'prompt_feedback') and response.prompt_feedback:
                    logger.error(f"❌ [DOC_ANALYZER] Prompt blocked: {response.prompt_feedback}")
                    return "Lo siento, el contenido fue bloqueado por políticas de seguridad. Por favor, intenta con otros archivos o reformula tu solicitud."
                
                logger.error(f"❌ [DOC_ANALYZER] Model returned empty response")
                return "Lo siento, el modelo no pudo generar una respuesta. Por favor, intenta nuevamente."
            
            logger.info(f"✅ [DOC_ANALYZER] Analysis complete ({len(response.text)} chars)")
            logger.info(f"📊 [DOC_ANALYZER] Timing breakdown:")
            logger.info(f"   - Setup: {setup_time:.2f}s")
            logger.info(f"   - LLM inference: {llm_time:.2f}s")
            logger.info(f"   - Total: {total_time:.2f}s")
            return response.text
            
        except Exception as e:
            logger.error(f"❌ [DOC_ANALYZER] Error analyzing documents: {e}")
            return f"Lo siento, tuve un error al analizar los documentos: {str(e)}"
    
    async def analyze_documents_stream(
        self,
        message: str,
        school_name: str,
        files: List[str] = None,
        search_app_id: str = None,
        case_context: Optional[Dict] = None,
        user_id: Optional[str] = None
    ):
        """
        🔄 Streaming híbrido: PDFs directos O búsqueda RAG.
        
        LÓGICA:
        - Si `files` está presente → Streaming de análisis directo de PDFs
        - Si `files` es None/vacío → Streaming de búsqueda RAG
        
        Args:
            message: Mensaje/consulta del usuario
            school_name: Nombre del colegio
            files: Lista opcional de GCS URIs (PDFs adjuntos)
            search_app_id: ID de la Search App del colegio (para RAG)
            case_context: Contexto del caso activo (opcional)
            
        Yields:
            Text chunks as they are generated by the model
        """
        # DECISIÓN: ¿Streaming directo o RAG?
        if files:
            logger.info("📄 [DOC STREAM] Using Direct PDF Analysis Mode")
            async for chunk in self._stream_pdfs_direct(files, message, school_name, case_context, user_id):
                yield chunk
        else:
            logger.info("🔍 [DOC STREAM] Using RAG Search Mode")
            async for chunk in self._stream_via_rag(message, school_name, search_app_id, case_context, user_id):
                yield chunk
    
    async def _stream_pdfs_direct(
        self,
        files: List[str],
        message: str,
        school_name: str,
        case_context: Optional[Dict] = None,
        user_id: Optional[str] = None
    ):
        """Streaming de análisis directo de PDFs"""
        import time
        from langchain_google_vertexai import ChatVertexAI
        from langchain_core.messages import HumanMessage, SystemMessage
        from app.services.users.user_service import user_service
        from app.services.storage_service import storage_service
        
        start_time = time.time()
        
        try:
            file_count = len(files)
            logger.info(f"📄 [DOC_ANALYZER_STREAM] Analyzing {file_count} documents")
            logger.info(f"📎 [DOC_ANALYZER_STREAM] Files: {files}")
            
            # Build system prompt with current date
            from datetime import datetime
            current_date_str = datetime.now().strftime("%A %d de %B de %Y")
            
            system_prompt = f"""Eres CONI, asistente de IA especializado en convivencia escolar para {school_name}.

FECHA ACTUAL DEL SISTEMA: {current_date_str}
(Usa esta fecha como referencia. Si un documento menciona fechas futuras respecto a hoy, es probable que sea un error tipográfico o el documento es antiguo)

Tu tarea es analizar los documentos adjuntos que el usuario te ha compartido.

INSTRUCCIONES:
1. Lee cuidadosamente cada documento adjunto
2. Identifica información clave relevante para convivencia escolar
3. Si el usuario pregunta algo específico, enfócate en eso
4. Proporciona un análisis claro y estructurado
5. Si detectas posibles protocolos aplicables, menciónallos
6. NO menciones IDs técnicos del sistema

FORMATO DE RESPUESTA:
- Sé conciso pero completo
- Usa bullet points para mayor claridad
- Menciona el nombre de los documentos cuando sea relevante
- Si encuentras información sobre estudiantes involucrados, edades, cursos, etc., resúmela"""

            if case_context:
                system_prompt += f"\n\nCONTEXTO DEL CASO ACTIVO:\n{case_context.get('summary', '')}"
            
            # Build messages
            content_parts = [{"type": "text", "text": message or "Analiza estos documentos"}]
            
            for file_uri in files:
                # Vertex AI SDK format for GCS file URIs
                if file_uri.startswith("gs://"):
                   # Check file size metadata
                   try:
                       parts = file_uri.replace("gs://", "").split("/", 1)
                       if len(parts) == 2:
                           bucket_name, blob_path = parts
                           bucket = storage_service.client.bucket(bucket_name)
                           blob = bucket.blob(blob_path)
                           blob.reload() # Fetch metadata
                           
                           # Limit: 20MB (approx 20 * 1024 * 1024 bytes)
                           if blob.size and blob.size > 20 * 1024 * 1024:
                               logger.warning(f"⚠️ [DOC_ANALYZER_STREAM] File {blob.name} is too large ({blob.size} bytes). Splitting into chunks.")
                               
                               # Dividir PDF en partes más pequeñas para mantener las imágenes
                               chunk_uris = storage_service.split_pdf_and_upload_chunks(bucket_name, blob_path, pages_per_chunk=15)
                               
                               if chunk_uris:
                                   logger.info(f"✅ [DOC_ANALYZER_STREAM] Split into {len(chunk_uris)} chunks")
                                   for chunk_uri in chunk_uris:
                                       content_parts.append({
                                           "type": "media",
                                           "file_uri": chunk_uri,
                                           "mime_type": "application/pdf"
                                       })
                               else:
                                   # Fallback si falla el splitting (ej: no es PDF válido) - usar texto
                                   logger.error(f"❌ [DOC_ANALYZER_STREAM] Failed to split PDF. Attempting text extraction as fallback.")
                                   extracted_text = storage_service.read_blob_content(bucket_name, blob_path)
                                   content_parts.append({
                                       "type": "text", 
                                       "text": f"\n\n--- CONTENIDO (FALLBACK) DE {blob.name} ---\n{extracted_text[:50000]} \n--- FIN CONTENIDO ---\n"
                                   })
                               continue # Skip adding original large file

                   except Exception as e:
                       logger.error(f"❌ [DOC_ANALYZER_STREAM] Error checking/splitting file size: {e}")
                       # If check fails, try adding as media anyway (fallback to original behavior)

                   # LangChain format for media (if safe size or check failed)
                   content_parts.append({
                       "type": "media",
                       "file_uri": file_uri,
                       "mime_type": "application/pdf"
                   })
            
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=content_parts)
            ]
            
            # Use ChatVertexAI for easy streaming and token tracking
            flash_llm = ChatVertexAI(
                model=settings.VERTEX_MODEL_FLASH or "gemini-2.0-flash-exp",
                temperature=0.3,
                max_output_tokens=8192,
                project=settings.PROJECT_ID,
                location=settings.VERTEX_LOCATION or "us-central1",
                max_retries=5,
                streaming=True
            )
            
            setup_time = time.time() - start_time
            logger.info(f"⏱️ [DOC_ANALYZER_STREAM] Setup time: {setup_time:.2f}s")
            logger.info(f"🚀 [DOC_ANALYZER_STREAM] Starting streaming LLM inference...")
            llm_start = time.time()
            total_chars = 0
            accumulated_usage = None
            
            async for chunk in flash_llm.astream(messages):
                if chunk.content:
                    total_chars += len(chunk.content)
                    yield chunk.content
                
                if chunk.usage_metadata:
                    accumulated_usage = chunk.usage_metadata
            
            # Track usage
            if user_id and accumulated_usage:
                user_service.update_token_usage(
                    user_id=user_id,
                    input_tokens=accumulated_usage.get('input_tokens', 0),
                    output_tokens=accumulated_usage.get('output_tokens', 0),
                    model_name=flash_llm.model_name
                )
            
            # Check if we got any content at all
            if total_chars == 0:
                logger.warning(f"⚠️ [DOC_ANALYZER_STREAM] No content received from model")
                yield "Lo siento, el modelo no pudo generar una respuesta. Por favor, intenta nuevamente."
            
            llm_time = time.time() - llm_start
            total_time = time.time() - start_time
            
            logger.info(f"✅ [DOC_ANALYZER_STREAM] Streaming complete ({total_chars} chars)")
            logger.info(f"📊 [DOC_ANALYZER_STREAM] Timing breakdown:")
            logger.info(f"   - Setup: {setup_time:.2f}s")
            logger.info(f"   - LLM streaming: {llm_time:.2f}s")
            logger.info(f"   - Total: {total_time:.2f}s")
            
        except Exception as e:
            logger.error(f"❌ [DOC_ANALYZER_STREAM] Error analyzing documents: {e}")
            yield f"Lo siento, tuve un error al analizar los documentos: {str(e)}"
    
    async def _stream_via_rag(
        self,
        message: str,
        school_name: str,
        search_app_id: str = None,
        case_context: Optional[Dict] = None,
        user_id: Optional[str] = None
    ):
        """Streaming de análisis mediante RAG"""
        import time
        from app.services.users.user_service import user_service
        
        start_time = time.time()
        
        try:
            logger.info(f"🔍 [DOC_ANALYZER_RAG_STREAM] Processing query: {message[:100]}...")
            
            # 1. Clasificar consulta (Token usage here is negligible or null if hardcoded, but if LLM used, separate tracking needed)
            query_info = await self._classify_query(message)
            logger.info(f"📊 [DOC_ANALYZER_RAG_STREAM] Query classified: {query_info}")
            
            # ... (Search logic remains same)
            # 2. Búsqueda RAG con 2 pasos
            from app.services.chat.rice_search_service import rice_search_service
            
            # Fallback: usar app demo si no se provee ID
            if not search_app_id:
                search_app_id = "demostracion_1767713503741"
                logger.warning(f"⚠️ [DOC_ANALYZER_RAG_STREAM] No search_app_id provided, using default: {search_app_id}")
            
            # IMPORTANTE: Detectar si consulta es sobre documentos legales
            legal_keywords = ['rex', 'ley', 'decreto', 'circular', 'normativa',
                            'superintendencia', 'mineduc', 'ministerio', 'legal']
            message_lower = message.lower()
            has_legal_keyword = any(kw in message_lower for kw in legal_keywords)
            
            # SPECIAL CASE: Si usuario pregunta QUÉ documentos hay, hacer búsqueda amplia
            is_listing_query = any(keyword in message_lower for keyword in [
                "qué documentos hay", "cuáles documentos", "qué protocolos hay",
                "cuáles protocolos", "lista de documentos", "lista de protocolos",
                "documentos disponibles", "protocolos disponibles", "documentos tiene"
            ])
            
            if is_listing_query:
                logger.info(f"📋 [DOC_ANALYZER_RAG_STREAM] Listing query detected, performing broad search")
                rice_results = await rice_search_service._search_in_app(
                    app_id=search_app_id,
                    query="protocolo reglamento documento manual",
                    max_results=15
                )
                rag_results = {
                    "rice_results": rice_results,
                    "legal_results": [],
                    "total_tokens": 0,
                    "source": "listing"
                }
            elif has_legal_keyword:
                # Consulta sobre documentos legales → usar search_rice_for_case
                logger.info(f"⚖️ [DOC_ANALYZER_RAG_STREAM] Legal keywords detected, searching with severity=grave for legal results")
                rag_results = await rice_search_service.search_rice_for_case(
                    query=message,
                    school_search_app_id=search_app_id,
                    case_type=query_info.get('type'),
                    severity='grave'  # Force legal results
                )
            else:
                # Búsqueda normal específica
                rag_results = await rice_search_service.search_rice_for_case(
                    query=message,
                    school_search_app_id=search_app_id,
                    case_type=query_info.get('type'),
                    severity=query_info.get('severity')
                )
            
            logger.info(f"✅ [DOC_ANALYZER_RAG_STREAM] Found {len(rag_results.get('rice_results', []))} results")
            
            # 3. Construir prompt
            from datetime import datetime
            current_date_str = datetime.now().strftime("%A %d de %B de %Y")
            
            system_prompt = f"""Eres CONI, asistente de IA especializado en convivencia escolar para {school_name}.

FECHA ACTUAL DEL SISTEMA: {current_date_str}

SITUACIÓN: El usuario te está consultando sobre protocolos, documentación o casos escolares.

INSTRUCCIONES:
1. Analiza los fragmentos de documentos proporcionados
2. Proporciona una respuesta clara y estructurada
3. CITA los documentos cuando sea relevante
4. Si no hay información suficiente, indícalo claramente
5. NO inventes información

FORMATO:
- Sé conciso pero completo
- Usa bullet points para mayor claridad"""

            if case_context:
                system_prompt += f"\n\nCONTEXTO DEL CASO:\n{case_context.get('summary', '')}"
            
            # Agregar contexto RAG
            if rag_results.get('rice_results'):
                # Extraer nombres únicos
                document_names = list(set([
                    result['title'] for result in rag_results.get('rice_results', [])
                ]))
                
                rag_context = rice_search_service.format_results_for_prompt(
                    rice_results=rag_results.get('rice_results', []),
                    legal_results=rag_results.get('legal_results', [])
                )
                
                if is_listing_query:
                    doc_list = "\n".join([f"{i}. {name}" for i, name in enumerate(document_names, 1)])
                    system_prompt += f"\n\n═══ DOCUMENTOS DISPONIBLES ═══\n\n{doc_list}\n\nINSTRUCCIONES: Lista estos documentos explícitamente y describe su propósito."
                else:
                    system_prompt += f"\n\n═══ DOCUMENTOS ENCONTRADOS ═══\n\n{rag_context}\n\nDocumentos: {', '.join(document_names)}"
            else:
                system_prompt += "\n\n⚠️ No se encontraron documentos. Proporciona orientación general."
            
            # 4. Stream LLM response
            from langchain_google_vertexai import ChatVertexAI
            from langchain_core.messages import HumanMessage, SystemMessage
            
            flash_llm = ChatVertexAI(
                model_name=settings.VERTEX_MODEL_FLASH or "gemini-2.5-flash-lite",
                temperature=0.4,
                project=settings.PROJECT_ID,
                location=self.model_location,
                streaming=True
            )
            
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=message)
            ]
            
            setup_time = time.time() - start_time
            logger.info(f"⏱️ [DOC_ANALYZER_RAG_STREAM] Setup: {setup_time:.2f}s, starting stream...")
            
            total_chars = 0
            accumulated_usage = None
            
            async for chunk in flash_llm.astream(messages):
                if chunk.content:
                    total_chars += len(chunk.content)
                    yield chunk.content
                
                if chunk.usage_metadata:
                    accumulated_usage = chunk.usage_metadata
            
            # Track Usage
            if user_id and accumulated_usage:
                user_service.update_token_usage(
                    user_id=user_id,
                    input_tokens=accumulated_usage.get('input_tokens', 0),
                    output_tokens=accumulated_usage.get('output_tokens', 0),
                    model_name=flash_llm.model_name
                )
            
            # Agregar referencias automáticamente al final del stream
            if rag_results.get('rice_results') or rag_results.get('legal_results'):
                from app.services.chat.reference_builder import build_references_section
                
                references_section = build_references_section(
                    rice_results=rag_results.get('rice_results', []),
                    legal_results=rag_results.get('legal_results', []),
                    target_document=rag_results.get('target_document')
                )
                
                if references_section:
                    yield references_section
                    logger.info(f"📚 [DOC_ANALYZER_RAG_STREAM] Added automatic references section")
            
            total_time = time.time() - start_time
            logger.info(f"✅ [DOC_ANALYZER_RAG_STREAM] Complete ({total_chars} chars, {total_time:.2f}s)")
            
        except Exception as e:
            logger.error(f"❌ [DOC_ANALYZER_RAG_STREAM] Error: {e}")
            yield f"Lo siento, tuve un error al procesar tu consulta: {str(e)}"
    
    async def _classify_query(self, message: str) -> dict:
        """
        Clasifica rápidamente el tipo de consulta.
        
        Returns:
            {
                "type": "protocolo" | "caso" | "documento" | "consulta_general",
                "severity": "leve" | "grave" | "gravísimo" | None
            }
        """
        try:
            # Clasificación simple basada en keywords
            message_lower = message.lower()
            
            # Detectar tipo
            query_type = "consulta_general"
            if "protocolo" in message_lower:
                query_type = "protocolo"
            elif any(word in message_lower for word in ["caso", "incidente", "situación"]):
                query_type = "caso"
            elif any(word in message_lower for word in ["documento", "rice", "reglamento"]):
                query_type = "documento"
            
            # Detectar gravedad (solo para casos)
            severity = None
            if query_type == "caso":
                if any(word in message_lower for word in ["grave", "agresión", "violencia", "bullying"]):
                    severity = "grave"
                elif any(word in message_lower for word in ["conflicto", "desacuerdo", "discusión"]):
                    severity = "leve"
            
            return {
                "type": query_type,
                "severity": severity
            }
            
        except Exception as e:
            logger.warning(f"⚠️ [DOC_ANALYZER] Error classifying query: {e}")
            return {
                "type": "consulta_general",
                "severity": None
            }
    
    async def extract_context_summary(self, analysis_text: str, user_message: str = "", user_id: str = None) -> dict:
        """
        Extrae un resumen estructurado del análisis de documentos para usar como contexto de sesión.
        """
        try:
            from datetime import datetime
            from langchain_google_vertexai import ChatVertexAI
            from langchain_core.messages import HumanMessage
            from pydantic import BaseModel, Field
            from typing import List
            from app.services.users.user_service import user_service
            
            logger.info(f"🔍 [CONTEXT_EXTRACT] Extracting structured summary from analysis")
            
            # Define schema for structured output
            class ContextSummary(BaseModel):
                summary: str = Field(description="Resumen conciso del contenido analizado (máximo 200 palabras)")
                key_concepts: List[str] = Field(description="3-5 conceptos clave (ej: maltrato, bullying, proceso sancionatorio)")
                has_potential_case: bool = Field(description="True si parece ser un caso de convivencia escolar")
            
            # Use Flash for fast extraction
            flash_llm = ChatVertexAI(
                model_name=settings.VERTEX_MODEL_FLASH or "gemini-2.0-flash-exp",
                temperature=0.3,
                project=settings.PROJECT_ID,
                location=self.model_location
            )
            
            extraction_prompt = f"""Analiza el siguiente texto y extrae información estructurada:

TEXTO DEL ANÁLISIS:
{analysis_text[:1500]}...

MENSAJE ORIGINAL DEL USUARIO:
{user_message}

TAREA:
1. Crea un resumen conciso (máximo 200 palabras) del contenido
2. Identifica 3-5 conceptos clave (tipo de conflicto, partes involucradas, etc.)
3. Determina si esto parece ser un caso de convivencia escolar (maltrato, bullying, conflicto, etc.)

IMPORTANTE:
- NO uses nombres propios de personas en el resumen
- Enfócate en el tipo de situación y conceptos relevantes
- Sé conciso pero informativo"""
            
            # TRACKING STRATEGY: 
            # with_structured_output hides usage. We will do a raw invoke first to capture usage, 
            # OR just accept we miss it for this metadata task.
            # User requirement is strict. 
            # Alternative: Use raw invoke and simple JSON parsing prompt + Pydantic validation manually.
            
            json_prompt = extraction_prompt + "\n\nResponde SOLO con un JSON válido {summary, key_concepts, has_potential_case}."
            
            messages = [HumanMessage(content=json_prompt)]
            response = await flash_llm.ainvoke(messages)
            
            # Track Usage
            if user_id and hasattr(response, 'usage_metadata'):
                user_service.update_token_usage(
                    user_id=user_id,
                    input_tokens=response.usage_metadata.get('input_tokens', 0),
                    output_tokens=response.usage_metadata.get('output_tokens', 0),
                    model_name=flash_llm.model_name
                )
            
            # Parse response
            import json
            import re
            content = response.content
            if "```json" in content:
                content = re.search(r'```json\s*([\s\S]*?)\s*```', content).group(1)
            elif "```" in content:
                content = content.split("```")[1]
            
            try:
                data = json.loads(content)
                result = ContextSummary(**data)
            except:
                logger.warning("⚠️ [CONTEXT_EXTRACT] JSON parse failed, trying structured output fallback (ignoring usage)")
                structured_llm = flash_llm.with_structured_output(ContextSummary)
                result = await structured_llm.ainvoke([HumanMessage(content=extraction_prompt)])

            if not result:
                # ... fallback
                return {
                    "summary": "Documentos analizados sin contexto específico",
                    "key_concepts": [],
                    "has_potential_case": False,
                    "extracted_at": datetime.utcnow().isoformat()
                }

            context_dict = {
                "summary": result.summary,
                "key_concepts": result.key_concepts,
                "has_potential_case": result.has_potential_case,
                "extracted_at": datetime.utcnow().isoformat()
            }
            
            logger.info(f"✅ [CONTEXT_EXTRACT] Extracted context: {context_dict['key_concepts']}")
            return context_dict
            
        except Exception as e:
            logger.error(f"❌ [CONTEXT_EXTRACT] Error extracting context: {e}")
            # Return minimal context on error
            from datetime import datetime
            return {
                "summary": "Documentos analizados",
                "key_concepts": [],
                "has_potential_case": False,
                "extracted_at": datetime.utcnow().isoformat()
            }


# Singleton instance
document_analyzer = DocumentAnalyzer()
