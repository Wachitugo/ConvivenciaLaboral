"""
Reglamento Search Service

Servicio de búsqueda RAG unificado para:
1. Reglamento Interno de la Empresa (Protocolos internos)
2. Ley Karin (Ley 21.643) y normativa laboral relacionada

Query Enrichment: Construye queries genéricas enfocadas en la conducta
laboral para encontrar los protocolos pertinentes.
"""

import logging
from typing import List, Dict, Optional
from google.cloud import discoveryengine_v1beta
from google.api_core.client_options import ClientOptions
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class ReglamentoSearchService:
    """Servicio de búsqueda RAG para Reglamento Interno y Ley Karin"""
    
    def __init__(self):
        self.location = settings.LOCATION or "global"
        self.project_id = settings.PROJECT_ID
        
        # Search App IDs
        # Aplicación para documentos legales genéricos (Ley Karin, Código del Trabajo)
        self.LEY_KARIN_APP_ID = settings.DOCLEGALES_APP_ID 
    
    async def search_general_info(
        self,
        query: str,
        company_search_app_id: str,
    ) -> Dict[str, any]:
        """
        Busca información general en Reglamento Interno y Ley Karin (para SIMPLE_QA).
        """
        try:
            logger.info(f"🔍 [GENERAL_SEARCH] Query: '{query}'")
            
            # 1. Enriquecer query mínimamente
            enriched_query = f"{query} protocolo prevención"
            if "ley" in query.lower() or "decreto" in query.lower() or "karin" in query.lower():
                enriched_query = query 
                
            # 2. Búsqueda en paralelo (Reglamento + Ley Karin)
            import asyncio
            
            tasks = [
                self._search_in_app(company_search_app_id, enriched_query, max_results=2),
                self._search_in_app(self.LEY_KARIN_APP_ID, enriched_query, max_results=2)
            ]
            
            results = await asyncio.gather(*tasks)
            reglamento_results, ley_karin_results = results[0], results[1]
            
            logger.info(f"✅ [GENERAL_SEARCH] Found {len(reglamento_results)} Reglamento docs + {len(ley_karin_results)} Ley Karin docs")
            
            total_tokens = self._estimate_tokens(reglamento_results) + self._estimate_tokens(ley_karin_results)
            
            return {
                "reglamento_results": reglamento_results,
                "ley_karin_results": ley_karin_results,
                "total_tokens": total_tokens
            }
            
        except Exception as e:
            logger.error(f"❌ [GENERAL_SEARCH] Error: {e}")
            return {"reglamento_results": [], "ley_karin_results": [], "total_tokens": 0}

    async def search_reglamento_for_case(
        self,
        query: str,
        company_search_app_id: str,
        case_type: str = None
    ) -> Dict[str, any]:
        """
        Busca en Reglamento Interno y Ley Karin.
        
        Args:
            query: Query del usuario (NO se usa en búsqueda directa, usamos enriched_query)
            company_search_app_id: ID de la Search App de la empresa
            case_type: Tipo de caso (acoso_laboral, acoso_sexual, etc.)
            
        Returns:
            {
                "reglamento_results": [...],  # Resultados del Reglamento Interno
                "ley_karin_results": [...],   # Resultados de la Ley 21.643
                "total_tokens": int           # Estimación de tokens
            }
        """
        try:
            logger.info(f"🔍 [REGLAMENTO_SEARCH] Query: '{query}' | Type: {case_type}")
            
            # 1. Construir query inteligente usando LLM
            enriched_query = await self._build_enriched_query(query, case_type)
            logger.info(f"🔍 [REGLAMENTO_SEARCH] Enriched query: '{enriched_query}'")
            
            # 2. Búsqueda en Reglamento Interno de la empresa
            reglamento_results = await self._search_in_app(
                app_id=company_search_app_id,
                query=enriched_query,
                max_results=3
            )
            logger.info(f"✅ [REGLAMENTO_SEARCH] Found {len(reglamento_results)} results from Company Rules")
            
            # 3. Búsqueda SIEMPRE en Ley Karin / Normativa Laboral
            # En Ley Karin, la normativa siempre es relevante para contrastar
            ley_karin_results = await self._search_in_app(
                app_id=self.LEY_KARIN_APP_ID,
                query=enriched_query,
                max_results=2
            )
            logger.info(f"✅ [REGLAMENTO_SEARCH] Found {len(ley_karin_results)} results from Ley Karin App")
            
            # 4. Calcular tokens aproximados
            total_tokens = self._estimate_tokens(reglamento_results) + self._estimate_tokens(ley_karin_results)
            
            return {
                "reglamento_results": reglamento_results,
                "ley_karin_results": ley_karin_results,
                "total_tokens": total_tokens
            }
            
        except Exception as e:
            logger.error(f"❌ [REGLAMENTO_SEARCH] Error: {e}")
            return {
                "reglamento_results": [],
                "ley_karin_results": [],
                "total_tokens": 0
            }
    
    async def _search_in_app(
        self,
        app_id: str,
        query: str,
        max_results: int = 10 
    ) -> List[Dict]:
        """
        Ejecuta búsqueda en una Search App específica.
        Returns: Lista de resultados con extractive segments
        """
        # Si no hay app_id configurado (ej: Ley Karin App aun no creada), retornar vacío
        if not app_id:
            logger.warning(f"⚠️ [REGLAMENTO_SEARCH] No App ID provided for search. Skipping.")
            return []

        try:
            client_options = (
                ClientOptions(api_endpoint=f"{self.location}-discoveryengine.googleapis.com")
                if self.location != "global"
                else None
            )
            
            client = discoveryengine_v1beta.SearchServiceClient(client_options=client_options)
            
            serving_config = (
                f"projects/{self.project_id}/locations/{self.location}/"
                f"collections/default_collection/engines/{app_id}/"
                f"servingConfigs/default_search"
            )
            
            # 1. Definir request Enterprise (con Extractive Segments)
            enterprise_request = {
                "serving_config": serving_config,
                "query": query,
                "page_size": max_results,
                "content_search_spec": {
                    "extractive_content_spec": {
                        "max_extractive_answer_count": 1, 
                        "max_extractive_segment_count": 5,
                        "return_extractive_segment_score": True
                    },
                    "snippet_spec": {
                        "return_snippet": True,
                        "max_snippet_count": 5,
                    }
                }
            }
            
            response = None
            try:
                # Intentar búsqueda Enterprise
                response = client.search(enterprise_request)
            except Exception as e:
                # Si falla (ej: 400 por ser motor Standard), intentar búsqueda Standard
                error_msg = str(e).lower()
                if "enterprise" in error_msg or "400" in error_msg or "invalid argument" in error_msg:
                    logger.warning(f"⚠️ [RAG] Enterprise search failed for {app_id}, retrying with Standard search. Error: {e}")
                    
                    standard_request = {
                        "serving_config": serving_config,
                        "query": query,
                        "page_size": max_results,
                        "content_search_spec": {
                            # SIN extractive_content_spec
                            "snippet_spec": {
                                "return_snippet": True,
                                "max_snippet_count": 5,
                            }
                        }
                    }
                    response = client.search(standard_request)
                else:
                    raise e

            all_results = list(response.results)
            
            results = []
            
            for result in all_results:
                try:
                    derived_data = result.document.derived_struct_data if result.document.derived_struct_data else {}
                    title = derived_data.get("title", "Documento")
                    link = derived_data.get("link", "")
                    
                    segments = []
                    
                    # Intentar obtener Extractive Segments (si fue Enterprise exitoso)
                    extractive_segments = derived_data.get("extractive_segments", [])
                    if extractive_segments:
                        segments_list = list(extractive_segments) if not isinstance(extractive_segments, list) else extractive_segments
                        
                        for seg in segments_list[:5]:
                            try:
                                seg_dict = dict(seg) if hasattr(seg, 'items') else {}
                                content = seg_dict.get('content', '')
                                page_num = seg_dict.get('pageNumber', seg_dict.get('page_number', ''))
                                relevance_score = seg_dict.get('relevanceScore', 0.8)
                                
                                if content:
                                    segments.append({
                                        "content": content,
                                        "score": float(relevance_score) if relevance_score else 0.8,
                                        "page_number": page_num
                                    })
                            except Exception:
                                continue
                    
                    # Fallback a Snippets (siempre disponible o si fue Standard)
                    if not segments:
                        snippets = derived_data.get("snippets", [])
                        if snippets:
                            snippets_list = list(snippets) if not isinstance(snippets, list) else snippets
                            for snippet in snippets_list[:3]:
                                snippet_dict = dict(snippet) if hasattr(snippet, 'items') else snippet
                                content = snippet_dict.get("snippet", "")
                                if content:
                                    # [MEJORA] Subir score de snippets a 0.85 para competir con Enterprise
                                    segments.append({"content": content, "score": 0.85})
                    
                    # Fallback título
                    if not segments:
                        segments.append({"content": f"Documento disponible: {title}", "score": 0.3})
                    
                    results.append({
                        "title": title,
                        "segments": segments,
                        "uri": link
                    })
                
                except Exception as e:
                    logger.warning(f"⚠️ [RAG] Error processing result: {e}")
                    continue
            
            return results
            
        except Exception as e:
            logger.error(f"❌ [REGLAMENTO_SEARCH] Error searching app {app_id}: {e}")
            return []
    
    async def _build_enriched_query(
        self,
        original_query: str,
        case_type: str = None
    ) -> str:
        """
        Construye query inteligente que COMBINA la intención del usuario con contexto del caso.
        
        NUEVO: Usa LLM para extraer keywords relevantes de la query original y combinarlas
        con el contexto del caso (tipo). Esto evita perder información importante.
        
        Examples:
            "cuál es el protocolo contra acoso laboral" + case_type="acoso_laboral"
            → "protocolo acoso laboral hostigamiento trabajador"
            
            "la ley karin" → "ley karin 21.643 protocolo"
        """
        import re
        
        # Fast-path: Detectar si el usuario menciona un documento específico
        doc_patterns = [
            r"(ley|decreto|código|circular|reglamento)\s+n?[°º]?\s*\d+",  # "ley 21.643", "Decreto 170"
            r"(la|el)\s+(ley|decreto|código)\s+n?[°º]?\s*\d+",  # "la ley 21.643"
            r"ley\s+karin",  # "ley karin"
        ]
        
        has_specific_doc = any(re.search(pattern, original_query, re.IGNORECASE) for pattern in doc_patterns)
        
        # Si menciona documento específico, preservar query original
        if has_specific_doc:
            logger.info(f"🔍 [REGLAMENTO_SEARCH] Specific document detected, using original query")
            enriched = original_query.lower()
            
            # Agregar "protocolo" si no está presente
            if "protocolo" not in enriched:
                enriched += " protocolo"
            
            logger.info(f"🔍 [REGLAMENTO_SEARCH] Enriched (specific doc): '{enriched}'")
            return enriched
        
        # Caso general: Usar LLM para extraer keywords relevantes
        logger.info(f"🔍 [REGLAMENTO_SEARCH] Using LLM to extract keywords from query")
        
        try:
            keywords = await self._extract_keywords_llm(original_query, case_type)
            logger.info(f"🔍 [REGLAMENTO_SEARCH] Enriched query: '{keywords}'")
            return keywords
        except Exception as e:
            logger.warning(f"⚠️ [REGLAMENTO_SEARCH] LLM extraction failed: {e}, using fallback")
            # Fallback: query original + "protocolo trabajadores"
            return f"protocolo {original_query.lower()} trabajadores"
    
    async def _extract_keywords_llm(
        self,
        original_query: str,
        case_type: str = None
    ) -> str:
        """
        Usa LLM para extraer keywords relevantes de la query original y combinarlas
        con el contexto del caso.
        
        Esto es más robusto que heurísticas porque:
        - Entiende sinónimos ("acoso" = "hostigamiento")
        - Preserva términos importantes
        - Combina inteligentemente con contexto
        """
        from langchain_google_vertexai import ChatVertexAI
        from langchain_core.messages import HumanMessage, SystemMessage
        
        # LLM rápido para extracción
        llm = ChatVertexAI(
            model_name=settings.VERTEX_MODEL_FLASH or "gemini-2.0-flash-exp",
            temperature=0.1,
            max_output_tokens=100,
            project=settings.PROJECT_ID,
            location=self.location
        )
        
        # Construir contexto
        context_parts = []
        if case_type:
            context_parts.append(f"Tipo de caso: {case_type}")
        context_str = " | ".join(context_parts) if context_parts else "Sin contexto adicional"
        
        prompt = f"""Extrae las palabras clave más relevantes para buscar PROTOCOLOS laborales y de prevención.

Query del usuario: "{original_query}"
Contexto del caso: {context_str}

REGLAS:
1. Extrae los términos IMPORTANTES de la query original (NO los ignores)
2. Combina con el contexto del caso si es relevante
3. Agrega "protocolo" si no está presente
4. Mantén términos como "acoso", "hostigamiento", "violencia", "denuncia", etc.
5. Agrega "trabajador" o "laboral" al final si aplica

EJEMPLOS:
- "cuál es el protocolo contra acoso" + tipo=acoso_laboral → "protocolo acoso hostigamiento laboral trabajador"
- "qué hacer en caso de denuncia" + tipo=violencia_trabajo → "protocolo denuncia violencia laboral trabajador"  
- "procedimiento para denunciar" + tipo=acoso_sexual → "protocolo procedimiento denuncia acoso sexual trabajador"

Responde SOLO con las keywords separadas por espacios (no markdown, no explicación)."""

        messages = [
            SystemMessage(content="Eres un extractor de keywords para búsqueda de protocolos laborales y de prevención."),
            HumanMessage(content=prompt)
        ]
        
        response = await llm.ainvoke(messages)
        keywords = response.content.strip().lower()
        
        # Limpiar posibles artifacts de markdown
        keywords = keywords.replace("```", "").replace("`", "").strip()
        
        return keywords
    
    def _estimate_tokens(self, results: List[Dict]) -> int:
        total_chars = 0
        for result in results:
            total_chars += len(result.get("title", ""))
            for segment in result.get("segments", []):
                total_chars += len(segment.get("content", ""))
        return total_chars // 4
    
    def format_results_for_prompt(
        self,
        reglamento_results: List[Dict],
        ley_karin_results: List[Dict] = None,
        max_tokens: int = 3000
    ) -> str:
        """
        Formatea resultados RAG para el prompt.
        Asegura un balance entre Reglamento y Normativa (50/50 del presupuesto de tokens).
        """
        # Extraer segmentos planos
        reg_segments = []
        for result in (reglamento_results or []):
            for seg in result.get('segments', []):
                reg_segments.append({
                    "source": "reglamento",
                    "title": result.get('title', 'Documento'),
                    "content": seg.get('content', ''),
                    "score": seg.get('score', 0.5),
                    "page": seg.get('page_number', '')
                })
        
        ley_segments = []
        for result in (ley_karin_results or []):
            for seg in result.get('segments', []):
                ley_segments.append({
                    "source": "ley_karin",
                    "title": result.get('title', 'Documento'),
                    "content": seg.get('content', ''),
                    "score": seg.get('score', 0.5),
                    "page": seg.get('page_number', '')
                })
        
        if not reg_segments and not ley_segments:
            return ""
        
        # Ordenar por relevancia dentro de cada fuente
        reg_segments.sort(key=lambda x: x['score'], reverse=True)
        ley_segments.sort(key=lambda x: x['score'], reverse=True)
        
        # Seleccionar balanceado (aprox mitad para cada uno si hay espacio)
        selected = []
        current_tokens = 0
        limit_tokens = max_tokens
        
        # Presupuesto: dar prioridad al Reglamento Interno (es lo particular de la empresa)
        # Intentar meter todo lo de reglamento hasta el 70% del límite
        reg_limit = int(limit_tokens * 0.7)
        
        for seg in reg_segments:
            seg_tokens = len(seg['content']) // 4 + 20
            if current_tokens + seg_tokens <= reg_limit:
                selected.append(seg)
                current_tokens += seg_tokens
        
        # Llenar el resto con Ley Karin
        for seg in ley_segments:
            seg_tokens = len(seg['content']) // 4 + 20
            if current_tokens + seg_tokens <= limit_tokens:
                selected.append(seg)
                current_tokens += seg_tokens
        
        # Formatear output
        reg_segs = [s for s in selected if s['source'] == 'reglamento']
        ley_segs = [s for s in selected if s['source'] == 'ley_karin']
        
        formatted = ""
        
        if reg_segs:
            formatted += "═════ REGLAMENTO INTERNO DE LA EMPRESA ═════\n\n"
            seen_titles = set()
            for seg in reg_segs:
                if seg['title'] not in seen_titles:
                    formatted += f"🏢 Documento: {seg['title']}\n"
                    seen_titles.add(seg['title'])
                page_info = f" (Pág. {seg['page']})" if seg['page'] else ""
                formatted += f"   → {seg['content']}{page_info}\n\n"
        
        if ley_segs:
            formatted += "\n═════ LEY KARIN Y NORMATIVA VIGENTE ═════\n\n"
            seen_titles = set()
            for seg in ley_segs:
                if seg['title'] not in seen_titles:
                    formatted += f"⚖️ Documento: {seg['title']}\n"
                    seen_titles.add(seg['title'])
                page_info = f" (Pág. {seg['page']})" if seg['page'] else ""
                formatted += f"   → {seg['content']}{page_info}\n\n"
        
        return formatted


# Singleton instance
reglamento_search_service = ReglamentoSearchService()
