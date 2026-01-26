import asyncio
import logging
import contextvars
from google.cloud.discoveryengine import SearchServiceClient, DocumentServiceClient
from google.api_core.client_options import ClientOptions
from langchain_core.tools import tool
from app.core.config import get_settings
from app.core.context import current_school_id, current_data_store_id


logger = logging.getLogger(__name__)
settings = get_settings()

class SearchService:
    def __init__(self):
        self.project_id = settings.PROJECT_ID
        self.location = settings.LOCATION
        self.data_store_id = settings.DATA_STORE_ID
        self._llm = None
    
    @property
    def llm(self):
        """Lazy-loaded Flash LLM for query enrichment"""
        if self._llm is None:
            from langchain_google_vertexai import ChatVertexAI
            model_name = settings.VERTEX_MODEL_FLASH or "gemini-2.0-flash-exp"
            logger.info(f"🤖 [SEARCH] Initializing Flash LLM for query enrichment: {model_name}")
            self._llm = ChatVertexAI(
                model_name=model_name,
                temperature=0.3,  # Low temp for consistent reformulation
                project=settings.PROJECT_ID,
                location=settings.VERTEX_LOCATION or "us-central1"
            )
        return self._llm
    
    async def _enrich_query_with_context(self, query: str, case_context: str = None) -> str:
        """
        Enriquece la query del usuario con contexto del caso para mejorar búsqueda.
        
        Args:
            query: Query original del usuario
            case_context: Contexto del caso activo (opcional)
            
        Returns:
            Query enriquecida o query original si no hay contexto
        """
        if not case_context or len(case_context) < 50:
            # No hay suficiente contexto, devolver query original
            return query
        
        try:
            from langchain_core.messages import HumanMessage
            
            # Prompt para reformular la query
            enrichment_prompt = f"""Tienes un usuario que preguntó: "{query}"

CONTEXTO DEL CASO ACTIVO:
{case_context[:500]}...

TAREA: Reformula la query original para una búsqueda de documentos, extrayendo los conceptos clave del contexto.

REGLAS:
1. Si la query menciona nombres de personas del caso, reemplázalos por el tipo de situación (maltrato, bullying, acoso, etc.)
2. Agrega palabras clave relevantes del contexto (tipo de conflicto, gravedad, etc.)
3. Mantén la query corta (máximo 10 palabras)
4. Enfócate en los protocolos/reglamentos que aplican
5. NO uses nombres propios en la query reformulada

EJEMPLOS:
- Input: "protocolos para Nombre" → Output: "protocolos maltrato físico bullying estudiante"
- Input: "qué hacer en este caso" → Output: "protocolo agresión entre estudiantes proceso sancionatorio"

Responde SOLO con la query reformulada, sin explicaciones."""

            messages = [HumanMessage(content=enrichment_prompt)]
            response = await self.llm.ainvoke(messages)
            enriched_query = response.content.strip()
            
            logger.info(f"🔍 [QUERY ENRICHMENT] '{query}' → '{enriched_query}'")
            return enriched_query
            
        except Exception as e:
            logger.warning(f"⚠️ Error enriching query, using original: {e}")
            return query

    def create_search_tool(self):
        """Crea una herramienta de búsqueda usando directamente el cliente de Discovery Engine"""
        
        if not self.data_store_id or self.data_store_id == "tu-datastore-id":
            logger.warning(f" Data Store ID no configurado")
            return None

        def _search_sync(query: str):
            try:
                # Determinar Data Store ID estrictamente desde contexto
                target_data_store_id = current_data_store_id.get()
                
                # STRICT ISOLATION: No fallback to global self.data_store_id to prevent leakage
                
                logger.debug(f" Buscando en Data Store: {target_data_store_id} Query: {query}")
                
                # Validar configuración
                if not target_data_store_id or target_data_store_id == "tu-datastore-id":
                     return "Error: Data Store ID no configurado para este colegio."

                client_options = (
                    ClientOptions(api_endpoint=f"{self.location}-discoveryengine.googleapis.com")
                    if self.location != "global"
                    else None
                )
                
                client = SearchServiceClient(client_options=client_options)
                
                serving_config = client.serving_config_path(
                    project=self.project_id,
                    location=self.location,
                    data_store=target_data_store_id,
                    serving_config="default_search",
                )
                
                try:
                    request = {
                        "serving_config": serving_config,
                        "query": query,
                        "page_size": 15,  # Increased from 5 for more comprehensive results
                        "content_search_spec": {
                            # Use extractive answers for better precision
                            "extractive_content_spec": {
                                "max_extractive_answer_count": 5,
                                "max_extractive_segment_count": 5,
                                "return_extractive_segment_score": True
                            },
                            "snippet_spec": {
                                "return_snippet": True,
                                "max_snippet_count": 5,
                                "reference_only": False
                            }
                        },
                        # Boost school-specific documents over generic legal ones
                        "boost_spec": {
                            "condition_boost_specs": [
                                {
                                    "condition": "school_id:*",  # Documents with school_id metadata
                                    "boost": 2.0  # Give 2x weight to school-specific docs
                                }
                            ]
                        }
                    }
                    
                    response = client.search(request)
                except Exception as e:
                    logger.warning(f"⚠️ Error en búsqueda optimizada, usando búsqueda simple: {e}")
                    request = {
                        "serving_config": serving_config,
                        "query": query,
                        "page_size": 15,  # Still use larger page size in fallback
                        "content_search_spec": {
                            "snippet_spec": {
                                "return_snippet": True,
                                "max_snippet_count": 5,
                                "reference_only": False
                            }
                        }
                    }
                    response = client.search(request)
                
                results = []
                for result in response.results:
                    try:
                        # Safely get derived_struct_data
                        derived_data = {}
                        if result.document.derived_struct_data:
                            try:
                                derived_data = dict(result.document.derived_struct_data)
                            except Exception as e:
                                logger.warning(f"Error converting derived_struct_data to dict: {e}")
                        
                        title = derived_data.get("title", "Sin título")
                        
                        # If no title, try to get from URI
                        if title == "Sin título" and hasattr(result.document, 'content'):
                            if hasattr(result.document.content, 'uri') and result.document.content.uri:
                                title = result.document.content.uri.split('/')[-1]
                        
                        snippet = ""
                        summary = derived_data.get("summary", "")
                        
                        # Try to get content from various sources
                        try:
                            # Priorizar chunks si existen
                            chunks = derived_data.get("chunks")
                            if chunks and isinstance(chunks, list) and len(chunks) > 0:
                                first_chunk = chunks[0]
                                if isinstance(first_chunk, dict):
                                    snippet = first_chunk.get("content", "")
                            
                            # Fallback a snippets estándar
                            if not snippet:
                                snippets = derived_data.get("snippets")
                                if snippets and isinstance(snippets, list) and len(snippets) > 0:
                                    first_snippet = snippets[0]
                                    if isinstance(first_snippet, dict):
                                        snippet = first_snippet.get("snippet", "")
                            
                            # Fallback a extractive_segments
                            if not snippet:
                                extractive = derived_data.get("extractive_segments")
                                if extractive and isinstance(extractive, list) and len(extractive) > 0:
                                    first_segment = extractive[0]
                                    if isinstance(first_segment, dict):
                                        snippet = first_segment.get("content", "")
                        except Exception as e:
                            logger.warning(f"Error extracting snippet: {e}")
                        
                        # Build result text
                        result_text = f"Documento: {title}\n"
                        
                        if summary:
                            result_text += f"Resumen: {summary}\n"
                        
                        # Add extractive segments if available
                        try:
                            extractive_segments = derived_data.get("extractive_segments")
                            if extractive_segments and isinstance(extractive_segments, list):
                                result_text += "Segmentos relevantes:\n"
                                for segment in extractive_segments[:3]:  # Limit to 3 segments
                                    if isinstance(segment, dict):
                                        content = segment.get('content', '')
                                        if content:
                                            result_text += f"- {content}\n"
                        except Exception as e:
                            logger.warning(f"Error processing extractive segments: {e}")
                        
                        if snippet:
                            result_text += f"Contenido: {snippet}\n"
                        
                        result_text += "---"
                        
                        results.append(result_text)
                        
                    except Exception as e:
                        logger.error(f"Error processing search result: {e}")
                        # Still add a basic result even if processing fails
                        try:
                            fallback_title = "Documento encontrado"
                            if hasattr(result.document, 'content') and hasattr(result.document.content, 'uri'):
                                fallback_title = result.document.content.uri.split('/')[-1]
                            results.append(f"Documento: {fallback_title}\n---")
                        except:
                            pass
                
                if not results:
                    return "No se encontraron documentos relevantes."
                
                return "\n".join(results)
                
            except Exception as e:
                logger.error(f"Error en búsqueda directa: {str(e)}")
                return f"Error al buscar documentos: {str(e)}"

        @tool
        async def search_school_documents(query: str):
            """Busca información en los documentos oficiales de convivencia escolar (reglamentos, leyes, protocolos)."""
            # Try to get case context from the current conversation
            case_context = None
            try:
                from app.core.context import current_case_context
                case_context = current_case_context.get()
            except:
                pass  # No case context available
            
            # FALLBACK: If no case context, try to get session context
            if not case_context:
                try:
                    # Get session_id from current context (passed by chat_service)
                    from app.core.context import current_session_id
                    session_id = current_session_id.get()
                    if session_id:
                        from app.services.chat.history_service import history_service
                        case_context = await history_service.get_session_context(session_id)
                        if case_context:
                            logger.info(f"📝 [QUERY_ENRICH] Using session context for enrichment")
                except Exception as e:
                    logger.debug(f"Session context not available: {e}")
            
            # Enrich query with case or session context if available
            enriched_query = query
            if case_context:
                try:
                    enriched_query = await self._enrich_query_with_context(query, case_context)
                except Exception as e:
                    logger.warning(f"⚠️ Failed to enrich query, using original: {e}")
            
            # Execute search with enriched query
            loop = asyncio.get_running_loop()
            ctx = contextvars.copy_context()
            return await loop.run_in_executor(None, lambda: ctx.run(_search_sync, enriched_query))
        
        return search_school_documents

    # Methods moved to DiscoveryService
    # delete_document and index_document removed.


    def create_list_documents_tool(self):
        """Crea una herramienta para listar todos los documentos disponibles"""
        
        if not self.data_store_id or self.data_store_id == "tu-datastore-id":
            return None

        def _list_documents_sync():
            def try_list_docs(location_to_try):
                try:
                    # Determinar Data Store ID estrictamente desde contexto
                    target_data_store_id = current_data_store_id.get()
                    # STRICT ISOLATION: No fallback to global self.data_store_id
                    
                    logger.info(f"📚 Intentando listar documentos en {target_data_store_id} ({location_to_try})")
                    
                    if not target_data_store_id or target_data_store_id == "tu-datastore-id":
                        return None

                    client_options = (
                        ClientOptions(api_endpoint=f"{location_to_try}-discoveryengine.googleapis.com")
                        if location_to_try != "global"
                        else None
                    )
                    
                    client = DocumentServiceClient(client_options=client_options)
                    
                    parent = client.branch_path(
                        project=self.project_id,
                        location=location_to_try,
                        data_store=target_data_store_id,
                        branch="default_branch",
                    )
                    
                    request = {
                        "parent": parent,
                        "page_size": 100
                    }
                    
                    return client.list_documents(request)
                except Exception as e:
                    logger.warning(f" Falló listado en {location_to_try}: {e}")
                    return None

            try:
                # 1. Intentar con la ubicación configurada
                response = try_list_docs(self.location)
                
                # 2. Si falla y no es global, intentar con global
                if response is None and self.location != "global":
                    response = try_list_docs("global")
                    
                if response is None:
                    return "Error: No se pudo acceder al almacén de documentos en ninguna ubicación (Configurada/Global). Verifique el ID del Data Store y la ubicación."

                documents = []
                for doc in response:
                    # derived_struct_data puede ser None
                    struct_data = doc.derived_struct_data or {}
                    title = struct_data.get("title", "Sin título")
                    
                    # Fallback si no hay título estructurado
                    if title == "Sin título":
                        if doc.content and doc.content.uri:
                            title = doc.content.uri.split('/')[-1]
                        elif doc.name:
                            title = doc.name.split('/')[-1]
                            
                    documents.append(f"- {title}")
                
                if not documents:
                    return "No se encontraron documentos indexados."
                
                return "Documentos disponibles:\n" + "\n".join(documents)
                
            except Exception as e:
                logger.error(f"Error fatal listando documentos: {str(e)}")
                return f"Error al listar documentos: {str(e)}"

        @tool
        async def list_documents():
            """Lista todos los documentos disponibles en la base de conocimientos."""
            loop = asyncio.get_running_loop()
            ctx = contextvars.copy_context()
            return await loop.run_in_executor(None, lambda: ctx.run(_list_documents_sync))
        
        return list_documents

search_service = SearchService()
