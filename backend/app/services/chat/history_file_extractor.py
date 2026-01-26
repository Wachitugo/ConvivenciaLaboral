"""
Helper utilities for chat history file extraction
"""
from typing import List, Optional
from langchain_core.messages import HumanMessage
import logging

logger = logging.getLogger(__name__)


def extract_files_from_history(history: List) -> List[str]:
    """
    Extract file URIs from recent chat history.
    
    Args:
        history: List of chat messages
        
    Returns:
        List of file URIs found in history
    """
    files = []
    
    # Look through recent history (last 5 messages) for file attachments
    for message in reversed(history[-5:]):
        if isinstance(message, HumanMessage):
            content = message.content
            
            # Handle multimodal content (list with text and files)
            if isinstance(content, list):
                for item in content:
                    if isinstance(item, dict):
                        # Image URLs
                        if item.get("type") == "image_url":
                            url = item.get("image_url", {}).get("url")
                            if url:
                                files.append(url)
                        # Media files (PDFs, etc.)
                        elif item.get("type") == "media":
                            file_uri = item.get("file_uri")
                            if file_uri:
                                files.append(file_uri)
    
    # Remove duplicates while preserving order
    seen = set()
    unique_files = []
    for f in files:
        if f not in seen:
            seen.add(f)
            unique_files.append(f)
    
    if unique_files:
        logger.info(f"📎 [HISTORY] Extracted {len(unique_files)} files from history")
    
    return unique_files


def should_use_history_files(message: str, has_files: bool) -> bool:
    """
    Detect if message references previous documents without attaching them.
    
    Args:
        message: User message
        has_files: Whether files are currently attached
        
    Returns:
        True if should extract files from history
    """
    if has_files:
        # Files already attached, no need to extract from history
        return False
    
    # Normalize message
    message_lower = message.lower()
    
    # Keywords that indicate reference to previous documents
    document_references = [
        "este documento",
        "estos documentos",
        "el documento",
        "los documentos",
        "ese documento",
        "esos documentos",
        "basado en este",
        "basado en el",
        "basado en ese",
        "del documento",
        "de los documentos",
        "según el documento",
        "según este documento",
        "archivo adjunto",
        "archivos adjuntos",
        "lo que subí",
        "lo que adjunté",
        # Case references (when there are files in history)
        "ese caso",
        "este caso",
        "el caso",
        "analiza el caso",
        "analiza ese caso",
        "explica el caso",
        "explica ese caso",
    ]
    
    return any(ref in message_lower for ref in document_references)
