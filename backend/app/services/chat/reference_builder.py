"""
Reference Builder Module

Módulo para construir secciones de referencias formateadas
para las respuestas del sistema de chat.
"""

import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


def build_references_section(
    rice_results: List[Dict] = None,
    legal_results: List[Dict] = None,
    target_document: str = None
) -> str:
    """
    Construye una sección de referencias formateada para incluir en respuestas.
    
    Args:
        rice_results: Lista de resultados de búsqueda en RICE
        legal_results: Lista de resultados de búsqueda en documentos legales
        target_document: Documento objetivo para priorizar (opcional)
        
    Returns:
        String con la sección de referencias formateada, o cadena vacía si no hay resultados
    """
    rice_results = rice_results or []
    legal_results = legal_results or []
    
    if not rice_results and not legal_results:
        return ""
    
    lines = []
    lines.append("\n\n---")
    lines.append("### 📚 Referencias")
    
    # Extraer nombres únicos de documentos
    seen_documents = set()
    
    # Procesar resultados de RICE
    if rice_results:
        rice_docs = []
        for result in rice_results:
            title = result.get('title', result.get('document_name', 'Documento del RICE'))
            
            # Limpiar título
            title = _clean_document_title(title)
            
            if title not in seen_documents:
                seen_documents.add(title)
                rice_docs.append(title)
        
        if rice_docs:
            for doc in rice_docs[:3]:  # Limitar a 3 documentos RICE
                # Marcar si es el documento objetivo
                if target_document and target_document.upper() in doc.upper():
                    lines.append(f"- **{doc}** ⭐")
                else:
                    lines.append(f"- {doc}")
    
    # Procesar resultados legales
    if legal_results:
        legal_docs = []
        for result in legal_results:
            title = result.get('title', result.get('document_name', 'Documento Legal'))
            
            # Limpiar título
            title = _clean_document_title(title)
            
            if title not in seen_documents:
                seen_documents.add(title)
                legal_docs.append(title)
        
        if legal_docs:
            for doc in legal_docs[:3]:  # Limitar a 3 documentos legales
                if target_document and target_document.upper() in doc.upper():
                    lines.append(f"- **{doc}** ⭐")
                else:
                    lines.append(f"- {doc}")
    
    # Si no hay documentos válidos después del procesamiento
    if len(lines) <= 2:  # Solo tiene el separador y el título
        return ""
    
    logger.info(f"📚 [REFERENCE_BUILDER] Built references section with {len(seen_documents)} documents")
    return "\n".join(lines)


def _clean_document_title(title: str) -> str:
    """
    Limpia y formatea el título de un documento.
    
    Args:
        title: Título original del documento
        
    Returns:
        Título limpio y formateado
    """
    if not title:
        return "Documento"
    
    # Remover extensiones de archivo
    title = title.replace('.pdf', '').replace('.PDF', '')
    title = title.replace('.docx', '').replace('.DOCX', '')
    
    # Remover prefijos de bucket si existen
    if '/' in title:
        title = title.split('/')[-1]
    
    # Remover caracteres problemáticos
    title = title.replace('_', ' ').replace('-', ' ')
    
    # Capitalizar apropiadamente (solo primera letra de cada palabra importante)
    # pero mantener acrónimos como "REX", "LEY", etc.
    words = title.split()
    cleaned_words = []
    for word in words:
        upper_word = word.upper()
        if upper_word in ['REX', 'LEY', 'DECRETO', 'CIRCULAR', 'NEE', 'TEA', 'RICE']:
            cleaned_words.append(upper_word)
        else:
            cleaned_words.append(word)
    
    title = ' '.join(cleaned_words)
    
    # Limitar longitud
    if len(title) > 80:
        title = title[:77] + "..."
    
    return title.strip()
