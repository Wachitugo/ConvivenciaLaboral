"""
RICE Search Service

Modific

ado Query Enrichment: Ahora construye queries genéricas
para encontrar protocolos, NO usa detalles específicos del caso
"""

import logging
from typing import List, Dict, Optional
from google.cloud import discoveryengine_v1beta
from google.api_core.client_options import ClientOptions
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class RiceSearchService:
    """Servicio de búsqueda RAG para RICE y marco legal"""
    
    def __init__(self):
        self.location = settings.LOCATION or "global"
        self.project_id = settings.PROJECT_ID
        
        # Search App IDs
        self.DOCLEGALES_APP_ID = settings.DOCLEGALES_APP_ID
    
    async def search_rice_for_case(
        self,
        query: str,
        school_search_app_id: str,
        case_type: str = None,
        severity: str = None
    ) -> Dict[str, any]:
        """
        Busca en RICE del colegio y opcionalmente en marco legal.
        
        Args:
            query: Query del usuario (NO se usa en búsqueda, solo case_type)
            school_search_app_id: ID de la Search App del colegio
            case_type: Tipo de caso (agresión, bullying, conflicto, etc.)
            severity: Gravedad (leve, grave, gravísimo)
            
        Returns:
            {
                "rice_results": [...],  # Resultados del RICE
                "legal_results": [...], # Resultados del marco legal (si aplica)
                "total_tokens": int     # Estimación de tokens
            }
        """
        try:
            logger.info(f"🔍 [RICE_SEARCH] Query: '{query}' | Type: {case_type} | Severity: {severity}")
            
            # 1. Construir query GENÉRICA para protocolos
            enriched_query = self._build_enriched_query(query, case_type, severity)
            logger.info(f"🔍 [RICE_SEARCH] Enriched query: '{enriched_query}'")
            
            # 2. Búsqueda en RICE del colegio
            rice_results = await self._search_in_app(
                app_id=school_search_app_id,
                query=enriched_query,
                max_results=3
            )
            
            logger.info(f"✅ [RICE_SEARCH] Found {len(rice_results)} results from school RICE")
            
            # 3. Búsqueda condicional en marco legal (solo casos graves/gravísimos)
            legal_results = []
            if severity and severity in ["grave", "gravísimo", "gravissimo"]:
                logger.info(f"⚖️ [RICE_SEARCH] Severe case detected, searching legal framework")
                legal_results = await self._search_in_app(
                    app_id=self.DOCLEGALES_APP_ID,
                    query=enriched_query,
                    max_results=2
                )
                logger.info(f"✅ [RICE_SEARCH] Found {len(legal_results)} results from legal framework")
            
            # 4. Calcular tokens aproximados
            total_tokens = self._estimate_tokens(rice_results) + self._estimate_tokens(legal_results)
            
            return {
                "rice_results": rice_results,
                "legal_results": legal_results,
                "total_tokens": total_tokens
            }
            
        except Exception as e:
            logger.error(f"❌ [RICE_SEARCH] Error: {e}")
            return {
                "rice_results": [],
                "legal_results": [],
                "total_tokens": 0
            }
    
    async def _search_in_app(
        self,
        app_id: str,
        query: str,
        max_results: int = 3
    ) -> List[Dict]:
        """
        Ejecuta búsqueda en una Search App específica.
        
        Returns:
            Lista de resultados con extractive segments
        """
        try:
            client_options = (
                ClientOptions(api_endpoint=f"{self.location}-discoveryengine.googleapis.com")
                if self.location != "global"
                else None
            )
            
            client = discoveryengine_v1beta.SearchServiceClient(client_options=client_options)
            
            # IMPORTANTE: Usar engine (app) ID, NO datastore ID
            serving_config = (
                f"projects/{self.project_id}/locations/{self.location}/"
                f"collections/default_collection/engines/{app_id}/"
                f"servingConfigs/default_search"
            )
            
            # Request con Enterprise Edition features
            request = {
                "serving_config": serving_config,
                "query": query,
                "page_size": max_results,
                "content_search_spec": {
                    # Extractive answers (Enterprise Edition)
                    "extractive_content_spec": {
                        "max_extractive_answer_count": 3,
                        "max_extractive_segment_count": 5,
                        "return_extractive_segment_score": True
                    },
                    # Snippets as fallback
                    "snippet_spec": {
                        "return_snippet": True,
                        "max_snippet_count": 3,
                    }
                }
            }
            
            response = client.search(request)
            all_results = list(response.results)
            
            results = []
            total_results = 0
            
            for result in all_results:
                total_results += 1
                try:
                    # Access derived_struct_data directly - it behaves like a dict
                    derived_data = result.document.derived_struct_data if result.document.derived_struct_data else {}
                    
                    title = derived_data.get("title", "Documento")
                    
                    # Priorizar extractive segments (más precisos)
                    segments = []
                    extractive_segments = derived_data.get("extractive_segments", [])
                    
                    # RepeatedComposite/MapComposite handling - convert to list for safety
                    if extractive_segments:
                        segments_list = list(extractive_segments) if not isinstance(extractive_segments, list) else extractive_segments
                        
                        for idx, seg in enumerate(segments_list[:5]):  # Top 5 segments
                            try:
                                # Convert MapComposite to dict (protobuf objects have 'items' method)
                                seg_dict = dict(seg) if hasattr(seg, 'items') else {}
                                
                                # Extract content and pageNumber from the dict
                                content = seg_dict.get('content', '')
                                page_num = seg_dict.get('pageNumber', seg_dict.get('page_number', ''))
                                relevance_score = seg_dict.get('relevanceScore', 0.8)
                                
                                if content:
                                    segments.append({
                                        "content": content,
                                        "score": float(relevance_score) if relevance_score else 0.8,
                                        "page_number": page_num  # Include for citations
                                    })
                                    # Clean summary log
                                    content_preview = content[:150] + "..." if len(content) > 150 else content
                                    score_str = f"{relevance_score:.3f}" if isinstance(relevance_score, (int, float)) else str(relevance_score)
                                    logger.info(
                                        f"📄 [RAG_CONTEXT] Doc: '{title}' | Page: {page_num} | "
                                        f"Score: {score_str} | Content: {content_preview}"
                                    )
                            except Exception as e:
                                logger.warning(f"⚠️ [RAG] Error extracting segment from '{title}': {e}")
                    
                    # Fallback a snippets si no hay extractive segments
                    if not segments:
                        snippets = derived_data.get("snippets", [])
                        if snippets:
                            snippets_list = list(snippets) if not isinstance(snippets, list) else snippets
                            for snippet in snippets_list[:3]:
                                try:
                                    snippet_dict = dict(snippet) if hasattr(snippet, 'items') else snippet
                                    if isinstance(snippet_dict, dict):
                                        content = snippet_dict.get("snippet", "")
                                        if content:
                                            segments.append({
                                                "content": content,
                                                "score": 0.5  # Score genérico para snippets
                                            })
                                            logger.info(f"📄 [RAG_CONTEXT] Doc: '{title}' | Source: snippet | Content: {content[:100]}...")
                                except Exception as e:
                                    logger.warning(f"⚠️ [RAG] Error extracting snippet: {e}")
                    
                    # IMPORTANTE: Para listing queries, incluir documento aunque no tenga segments
                    if not segments:
                        logger.warning(f"⚠️ [RAG] No content extracted for '{title}', using title as fallback")
                        segments.append({
                            "content": f"Documento disponible: {title}",
                            "score": 0.3
                        })
                    
                    results.append({
                        "title": title,
                        "segments": segments,
                        "uri": derived_data.get("link", "")
                    })
                
                except Exception as e:
                    logger.warning(f"⚠️ [RAG] Error processing result: {e}")
                    continue
            
            return results
            
        except Exception as e:
            logger.error(f"❌ [RICE_SEARCH] Error searching app {app_id}: {e}")
            return []
    
    def _build_enriched_query(
        self,
        original_query: str,
        case_type: str = None,
        severity: str = None
    ) -> str:
        """
        Construye query GENÉRICA para protocolos.
        
        CRÍTICO: NO usar detalles específicos del caso (nombres, lugares).
        Solo tipo de protocolo + gravedad.
        
        Examples:
            Bad: "Miguel insultó a Manuel en el patio" → 0 results
            Good: "protocolo violencia verbal leve" → finds protocols
        """
        # Construir query enfocada EN PROTOCOLOS, no en caso específico
        parts = ["protocolo"]
        
        # Agregar tipo (normalizado)
        if case_type:
            parts.append(case_type.replace("_", " "))
        
        # Agregar gravedad
        if severity:
            parts.append(severity)
        
        # Keywords adicionales por tipo
        type_map = {
            "violencia": ["insultos", "maltrato"],
            "agresión": ["golpes", "lesiones"],
            "bullying": ["acoso"],
            "conflicto": ["mediación"],
        }
        
        # Agregar 1-2 keywords relacionados
        if case_type:
            for key, keywords in type_map.items():
                if key in case_type.lower():
                    parts.extend(keywords[:1])  # Take first keyword as list
                    break
        
        # Término general
        parts.append("estudiantes")
        
        # Eliminar duplicados
        seen = set()
        unique = []
        for p in parts:
            pl = p.lower()
            if pl not in seen:
                unique.append(p)
                seen.add(pl)
        
        return " ".join(unique)
    
    def _estimate_tokens(self, results: List[Dict]) -> int:
        """Estima tokens aproximados en los resultados"""
        total_chars = 0
        
        for result in results:
            # Title
            total_chars += len(result.get("title", ""))
            
            # Segments
            for segment in result.get("segments", []):
                total_chars += len(segment.get("content", ""))
        
        # Aproximación: 1 token ≈ 4 caracteres
        return total_chars // 4
    
    def format_results_for_prompt(
        self,
        rice_results: List[Dict],
        legal_results: List[Dict] = None,
        max_tokens: int = 3000  # ~12K caracteres - límite para evitar abrumar al modelo
    ) -> str:
        """
        Formatea resultados RAG para incluir en el prompt del LLM.
        
        MEJORA: Prioriza segmentos por score de relevancia y respeta límite de tokens.
        No trunca segmentos a la mitad - elimina segmentos completos menos relevantes.
        
        Args:
            rice_results: Resultados del RICE del colegio
            legal_results: Resultados del marco legal (opcional)
            max_tokens: Límite aproximado de tokens (1 token ≈ 4 chars)
            
        Returns:
            String formateado con los fragmentos más relevantes
        """
        # 1. Recopilar TODOS los segmentos con metadata para ordenar por relevancia
        all_segments = []
        
        for result in (rice_results or []):
            for seg in result.get('segments', []):
                all_segments.append({
                    "source": "rice",
                    "title": result.get('title', 'Documento'),
                    "content": seg.get('content', ''),
                    "score": seg.get('score', 0.5),
                    "page": seg.get('page_number', '')
                })
        
        for result in (legal_results or []):
            for seg in result.get('segments', []):
                all_segments.append({
                    "source": "legal",
                    "title": result.get('title', 'Documento'),
                    "content": seg.get('content', ''),
                    "score": seg.get('score', 0.5),
                    "page": seg.get('page_number', '')
                })
        
        if not all_segments:
            return ""
        
        # 2. Ordenar por score descendente (más relevantes primero)
        all_segments.sort(key=lambda x: x['score'], reverse=True)
        
        # 3. Seleccionar segmentos hasta alcanzar max_tokens
        selected = []
        current_tokens = 0
        
        for seg in all_segments:
            # Estimar tokens del segmento (1 token ≈ 4 caracteres)
            seg_tokens = len(seg['content']) // 4 + 20  # +20 por título y formato
            
            if current_tokens + seg_tokens <= max_tokens:
                selected.append(seg)
                current_tokens += seg_tokens
            else:
                # Si ya tenemos al menos 2 segmentos, parar
                if len(selected) >= 2:
                    break
                # Si es el primer segmento y es muy grande, truncar contenido
                if len(selected) == 0:
                    # Truncar a max_tokens * 4 caracteres
                    max_chars = max_tokens * 4
                    seg['content'] = seg['content'][:max_chars] + "... [truncado por longitud]"
                    selected.append(seg)
                    break
        
        logger.info(f"📊 [RAG_FORMAT] Selected {len(selected)}/{len(all_segments)} segments, ~{current_tokens} tokens")
        
        # 4. Formatear segmentos seleccionados, agrupados por fuente
        rice_segs = [s for s in selected if s['source'] == 'rice']
        legal_segs = [s for s in selected if s['source'] == 'legal']
        
        formatted = ""
        
        if rice_segs:
            formatted += "═════ RICE DEL COLEGIO ═════\n\n"
            # Agrupar por título de documento
            seen_titles = set()
            for seg in rice_segs:
                if seg['title'] not in seen_titles:
                    formatted += f"📄 Documento: {seg['title']}\n"
                    seen_titles.add(seg['title'])
                page_info = f" (Pág. {seg['page']})" if seg['page'] else ""
                formatted += f"   → {seg['content']}{page_info}\n\n"
        
        if legal_segs:
            formatted += "\n═════ MARCO LEGAL APLICABLE ═════\n\n"
            seen_titles = set()
            for seg in legal_segs:
                if seg['title'] not in seen_titles:
                    formatted += f"⚖️ Documento: {seg['title']}\n"
                    seen_titles.add(seg['title'])
                page_info = f" (Pág. {seg['page']})" if seg['page'] else ""
                formatted += f"   → {seg['content']}{page_info}\n\n"
        
        return formatted


# Singleton instance
rice_search_service = RiceSearchService()
