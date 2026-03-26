"""
Vertex AI RAG Engine service.

Reemplaza Discovery Engine para búsqueda semántica de documentos.
Activado por empresa cuando rag_corpus_id está presente en el documento del colegio.
"""
import logging
from typing import Optional
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class RagService:
    def __init__(self):
        self.project_id = settings.PROJECT_ID
        # RAG Engine puede estar en una región distinta al resto de Vertex AI
        self.location = getattr(settings, "RAG_LOCATION", None) or settings.VERTEX_LOCATION or "us-central1"
        self._initialized = False

    def _init_vertexai(self):
        if not self._initialized:
            import vertexai
            vertexai.init(project=self.project_id, location=self.location)
            self._initialized = True

    # ── Gestión de corpus ─────────────────────────────────────────────────────

    def create_corpus(self, school_id: str, school_name: str) -> str:
        """
        Crea un corpus RAG para un colegio.
        Retorna el nombre completo del corpus (resource name).
        """
        try:
            self._init_vertexai()
            from vertexai.preview import rag

            display_name = f"corpus-{school_id[:8]}"
            description = f"Documentos de {school_name}"

            corpus = rag.create_corpus(
                display_name=display_name,
                description=description,
            )
            logger.info(f"✅ [RAG] Corpus creado: {corpus.name} para {school_name}")
            return corpus.name

        except Exception as e:
            logger.error(f"❌ [RAG] Error creando corpus para {school_name}: {e}")
            raise

    def import_files_from_gcs(self, corpus_name: str, gcs_folder_path: str) -> dict:
        """
        Importa todos los archivos de una carpeta GCS al corpus RAG.
        gcs_folder_path: ej. "gs://bucket-name/documentos/"

        Esta operación puede tardar varios minutos para archivos grandes.
        """
        try:
            self._init_vertexai()
            from vertexai.preview import rag

            logger.info(f"📥 [RAG] Importando archivos desde {gcs_folder_path} → {corpus_name}")

            response = rag.import_files(
                corpus_name=corpus_name,
                paths=[gcs_folder_path],
                chunk_size=512,
                chunk_overlap=100,
            )

            imported = response.imported_rag_files_count
            failed = response.failed_rag_files_count
            logger.info(f"✅ [RAG] Importación completada: {imported} archivos OK, {failed} fallidos")

            return {"imported": imported, "failed": failed}

        except Exception as e:
            logger.error(f"❌ [RAG] Error importando archivos: {e}")
            raise

    def add_file(self, corpus_name: str, gcs_uri: str) -> bool:
        """
        Agrega un archivo individual al corpus RAG.
        Usado al subir un nuevo documento.
        """
        try:
            self._init_vertexai()
            from vertexai.preview import rag

            logger.info(f"📄 [RAG] Agregando archivo {gcs_uri} → {corpus_name}")

            rag.import_files(
                corpus_name=corpus_name,
                paths=[gcs_uri],
                chunk_size=512,
                chunk_overlap=100,
            )

            logger.info(f"✅ [RAG] Archivo agregado: {gcs_uri}")
            return True

        except Exception as e:
            logger.error(f"❌ [RAG] Error agregando archivo {gcs_uri}: {e}")
            return False

    def query(self, corpus_name: str, query_text: str, top_k: int = 10) -> str:
        """
        Busca en el corpus RAG por similitud semántica.
        Retorna texto formateado con los fragmentos relevantes.
        """
        try:
            self._init_vertexai()
            from vertexai.preview import rag

            response = rag.retrieval_query(
                rag_resources=[rag.RagResource(rag_corpus=corpus_name)],
                text=query_text,
                similarity_top_k=top_k,
            )

            contexts = response.contexts.contexts
            if not contexts:
                return "No se encontraron documentos relevantes."

            results = []
            seen_sources = set()

            for ctx in contexts:
                source = getattr(ctx, "source_uri", "") or getattr(ctx, "source_display_name", "Documento")
                title = source.split("/")[-1] if source else "Documento"

                # Evitar duplicar el mismo documento
                if title not in seen_sources:
                    seen_sources.add(title)

                text = getattr(ctx, "text", "")
                score = getattr(ctx, "score", 0)

                result_text = f"Documento: {title}\n"
                if text:
                    result_text += f"Contenido: {text[:800]}\n"
                result_text += "---"

                results.append(result_text)

            logger.info(f"🔍 [RAG] Query '{query_text[:50]}...' → {len(results)} resultados")
            return "\n".join(results)

        except Exception as e:
            logger.error(f"❌ [RAG] Error en query: {e}")
            return f"Error al buscar documentos: {str(e)}"

    def query_structured(self, corpus_name: str, query_text: str, top_k: int = 10) -> list:
        """
        Busca en el corpus RAG y retorna lista de dicts compatibles con reglamento_search_service.
        Formato: [{"title": str, "content": str, "score": float}]
        """
        try:
            self._init_vertexai()
            from vertexai.preview import rag
            from app.services.chat.reference_builder import _clean_document_title

            response = rag.retrieval_query(
                rag_resources=[rag.RagResource(rag_corpus=corpus_name)],
                text=query_text,
                similarity_top_k=top_k,
            )

            contexts = response.contexts.contexts
            if not contexts:
                return []

            results = []
            seen_sources = set()

            for ctx in contexts:
                source = getattr(ctx, "source_uri", "") or getattr(ctx, "source_display_name", "Documento")
                raw_title = source.split("/")[-1] if source else "Documento"
                title = _clean_document_title(raw_title)
                text = getattr(ctx, "text", "")
                score = getattr(ctx, "score", 0.0)

                if raw_title not in seen_sources:
                    seen_sources.add(raw_title)

                results.append({"title": title, "content": text[:1200], "score": score})

            logger.info(f"🔍 [RAG] Structured query '{query_text[:50]}' → {len(results)} resultados")
            return results

        except Exception as e:
            logger.error(f"❌ [RAG] Error en query_structured: {e}")
            return []

    def query_by_file(self, corpus_name: str, query_text: str, rag_file_name: str, top_k: int = 10) -> list:
        """
        Busca en un archivo específico del corpus RAG usando su resource name.
        Usa rag_file_ids para restringir la búsqueda a ese archivo exacto.

        Args:
            rag_file_name: resource name completo del archivo (projects/.../ragFiles/...)
        """
        try:
            self._init_vertexai()
            from vertexai.preview import rag
            from app.services.chat.reference_builder import _clean_document_title

            # Extraer solo el file_id del resource name completo
            rag_file_id = rag_file_name.split("/")[-1]

            response = rag.retrieval_query(
                rag_resources=[rag.RagResource(
                    rag_corpus=corpus_name,
                    rag_file_ids=[rag_file_id]
                )],
                text=query_text,
                similarity_top_k=top_k,
            )

            contexts = response.contexts.contexts
            if not contexts:
                logger.info(f"🔍 [RAG] File query '{query_text[:40]}' (file_id='{rag_file_id}') → 0 resultados")
                return []

            results = []
            for ctx in contexts:
                source = getattr(ctx, "source_uri", "") or getattr(ctx, "source_display_name", "Documento")
                raw_title = source.split("/")[-1] if source else "Documento"
                title = _clean_document_title(raw_title)
                text = getattr(ctx, "text", "")
                score = getattr(ctx, "score", 0.0)
                results.append({"title": title, "content": text[:1200], "score": score})

            logger.info(f"🔍 [RAG] File query '{query_text[:40]}' (file_id='{rag_file_id}') → {len(results)} resultados")
            return results

        except Exception as e:
            logger.warning(f"⚠️ [RAG] Error en query_by_file: {e}")
            return []

    def list_files(self, corpus_name: str) -> list:
        """Lista los archivos indexados en el corpus RAG."""
        try:
            self._init_vertexai()
            from vertexai.preview import rag

            files = list(rag.list_files(corpus_name=corpus_name))
            result = []
            for f in files:
                name = getattr(f, "display_name", "") or f.name.split("/")[-1]
                result.append({"title": name, "name": f.name})

            logger.info(f"📚 [RAG] {len(result)} archivos en corpus {corpus_name}")
            return result

        except Exception as e:
            logger.error(f"❌ [RAG] Error listando archivos: {e}")
            return []


rag_service = RagService()
