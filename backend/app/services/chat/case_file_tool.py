import asyncio
import logging
from typing import List, Optional
from langchain_core.tools import tool
from google.cloud import firestore
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class CaseFileTool:
    """Herramienta para recuperar archivos asociados a casos"""
    
    def __init__(self):
        self._db = None
    
    @property
    def db(self):
        if self._db is None:
            self._db = firestore.Client(
                project=settings.PROJECT_ID, 
                database=settings.FIRESTORE_DATABASE
            )
        return self._db
    
    def _get_case_files_sync(self, case_id: str) -> str:
        """Recupera de forma síncrona los archivos asociados a un caso desde Firestore"""
        try:
            logger.info(f"🔍 [CASE_FILE_TOOL] Searching for files in case: {case_id}")
            
            # Consultar colección case_documents para archivos asociados a este caso
            docs_ref = self.db.collection("case_documents")
            query = docs_ref.where("case_id", "==", case_id)
            documents = list(query.stream())
            
            if not documents:
                logger.info(f"📁 [CASE_FILE_TOOL] No files found for case {case_id}")
                return f"No se encontraron archivos adjuntos para el caso {case_id}."
            
            # Construir una respuesta legible con información de archivos
            file_list = []
            for doc in documents:
                data = doc.to_dict()
                name = data.get("name", "archivo sin nombre")
                content_type = data.get("content_type", "tipo desconocido")
                size_bytes = data.get("size_bytes", 0)
                
                # Convertir tamaño a formato legible
                if size_bytes < 1024:
                    size_str = f"{size_bytes} bytes"
                elif size_bytes < 1024 * 1024:
                    size_str = f"{size_bytes / 1024:.1f} KB"
                else:
                    size_str = f"{size_bytes / (1024 * 1024):.1f} MB"
                
                file_info = f"- **{name}** ({content_type}, {size_str})"
                
                # Agregar descripción si está disponible
                if data.get("description"):
                    file_info += f"\n  Descripción: {data['description']}"
                
                file_list.append(file_info)
            
            result = f"Archivos encontrados en el caso ({len(file_list)} archivo(s)):\n\n"
            result += "\n".join(file_list)
            
            logger.info(f"✅ [CASE_FILE_TOOL] Found {len(file_list)} files for case {case_id}")
            return result
            
        except Exception as e:
            logger.error(f"❌ [CASE_FILE_TOOL] Error retrieving case files: {e}")
            return f"Error al buscar archivos del caso: {str(e)}"
    
    def get_case_files_data(self, case_id: str) -> list:
        """
        Obtiene archivos de caso como datos estructurados (lista de dicts) para uso interno
        
        Args:
            case_id: ID del caso para recuperar archivos
            
        Returns:
            Lista de diccionarios de archivos con claves: name, type, size, size_str, description
        """
        try:
            logger.info(f"🔍 [CASE_FILE_TOOL] Getting structured file data for case: {case_id}")
            
            # Consultar colección case_documents
            docs_ref = self.db.collection("case_documents")
            query = docs_ref.where("case_id", "==", case_id)
            documents = list(query.stream())
            
            if not documents:
                logger.info(f"📁 [CASE_FILE_TOOL] No files found for case {case_id}")
                return []
            
            # Construir lista estructurada de archivos
            files = []
            for doc in documents:
                data = doc.to_dict()
                name = data.get("name", "archivo sin nombre")
                content_type = data.get("content_type", "tipo desconocido")
                size_bytes = data.get("size_bytes", 0)
                
                # Convertir tamaño a formato legible
                if size_bytes < 1024:
                    size_str = f"{size_bytes} bytes"
                elif size_bytes < 1024 * 1024:
                    size_str = f"{size_bytes / 1024:.1f} KB"
                else:
                    size_str = f"{size_bytes / (1024 * 1024):.1f} MB"
                
                files.append({
                    "name": name,
                    "type": content_type,
                    "size": size_bytes,
                    "size_str": size_str,
                    "description": data.get("description", "")
                })
            
            logger.info(f"✅ [CASE_FILE_TOOL] Retrieved {len(files)} files as structured data")
            return files
            
        except Exception as e:
            logger.error(f"❌ [CASE_FILE_TOOL] Error retrieving case files data: {e}")
            return []
    
    def _search_case_files_sync(self, case_id: str, search_term: Optional[str] = None) -> str:
        """
        Busca archivos en un caso, opcionalmente filtrando por término de búsqueda
        """
        try:
            logger.info(f"🔍 [CASE_FILE_TOOL] Searching files in case {case_id} with term: {search_term}")
            
            # Consultar colección case_documents
            docs_ref = self.db.collection("case_documents")
            query = docs_ref.where("case_id", "==", case_id)
            documents = list(query.stream())
            
            if not documents:
                return f"No se encontraron archivos en el caso {case_id}."
            
            # Filtrar por término de búsqueda si se proporciona
            matching_files = []
            for doc in documents:
                data = doc.to_dict()
                name = data.get("name", "")
                description = data.get("description", "")
                content_type = data.get("content_type", "")
                
                # Si se proporciona término de búsqueda, verificar si coincide
                if search_term:
                    search_lower = search_term.lower()
                    if not (search_lower in name.lower() or 
                           search_lower in description.lower() or
                           search_lower in content_type.lower()):
                        continue
                
                size_bytes = data.get("size_bytes", 0)
                if size_bytes < 1024:
                    size_str = f"{size_bytes} bytes"
                elif size_bytes < 1024 * 1024:
                    size_str = f"{size_bytes / 1024:.1f} KB"
                else:
                    size_str = f"{size_bytes / (1024 * 1024):.1f} MB"
                
                file_info = {
                    "name": name,
                    "type": content_type,
                    "size": size_str,
                    "description": description
                }
                matching_files.append(file_info)
            
            if not matching_files:
                if search_term:
                    return f"No se encontraron archivos que coincidan con '{search_term}' en el caso {case_id}."
                return f"No se encontraron archivos en el caso {case_id}."
            
            # Construir respuesta
            result = f"Archivos encontrados ({len(matching_files)} archivo(s)):\n\n"
            for file_info in matching_files:
                result += f"- **{file_info['name']}** ({file_info['type']}, {file_info['size']})\n"
                if file_info['description']:
                    result += f"  Descripción: {file_info['description']}\n"
            
            logger.info(f"✅ [CASE_FILE_TOOL] Found {len(matching_files)} matching files")
            return result
            
        except Exception as e:
            logger.error(f"❌ [CASE_FILE_TOOL] Error searching case files: {e}")
            return f"Error al buscar archivos: {str(e)}"
    
    def create_case_file_tool(self):
        """Crea una herramienta para recuperar archivos de caso que puede ser usada por el agente"""
        
        @tool
        async def get_case_files(case_id: str, search_term: Optional[str] = None):
            """
            Obtiene los archivos adjuntos de un caso específico. 
            
            Args:
                case_id: ID del caso del cual obtener los archivos
                search_term: (Opcional) Término de búsqueda para filtrar archivos por nombre o descripción
            
            Returns:
                Lista de archivos encontrados con su información
            """
            loop = asyncio.get_running_loop()
            if search_term:
                return await loop.run_in_executor(
                    None, 
                    self._search_case_files_sync, 
                    case_id, 
                    search_term
                )
            else:
                return await loop.run_in_executor(
                    None, 
                    self._get_case_files_sync, 
                    case_id
                )
        
        return get_case_files


case_file_tool = CaseFileTool()
