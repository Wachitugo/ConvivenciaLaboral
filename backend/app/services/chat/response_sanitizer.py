import re
import logging
from typing import Dict, Tuple, List, Optional

logger = logging.getLogger(__name__)


class ResponseSanitizer:
    """
    Removes sensitive database IDs and internal identifiers from user-facing text
    while preserving them in structured metadata for frontend use.
    """
    
    # Patterns for various ID formats
    PATTERNS = {
        # Firestore document IDs (20+ alphanumeric chars)
        'firestore_id': r'\b[a-zA-Z0-9]{20,}\b',
        
        # Case IDs (various formats)
        'case_id_prefix': r'\b(?:case[_-]?id|id[_\s]del[_\s]caso)[:\s]*([a-zA-Z0-9_-]+)',
        
        # Session IDs
        'session_id': r'\b(?:session[_-]?id)[:\s]*([a-zA-Z0-9_-]+)',
        
        # Generic ID patterns in text
        'generic_id': r'\b(?:ID|id)[:\s]*([a-zA-Z0-9_-]{10,})',
        
        # Document IDs in parentheses
        'doc_id_parens': r'\(ID:\s*([a-zA-Z0-9_-]+)\)',
    }
    
    def __init__(self):
        self.replacements = {
            'case_id': '[CASO]',
            'session_id': '[SESIÓN]',
            'document_id': '[DOCUMENTO]',
            'firestore_id': '[ID]',
            'generic': '[REF]'
        }
    
    def sanitize(
        self, 
        text: str, 
        case_id: Optional[str] = None,
        session_id: Optional[str] = None,
        preserve_document_names: bool = True
    ) -> Tuple[str, Dict]:
        """
        Sanitizes text by removing sensitive IDs while extracting them to metadata.
        
        Args:
            text: The text to sanitize
            case_id: Known case ID to specifically remove
            session_id: Known session ID to specifically remove
            preserve_document_names: If True, keeps document filenames like "protocolo.pdf"
            
        Returns:
            Tuple of (sanitized_text, metadata_dict)
        """
        sanitized = text
        metadata = {
            'extracted_ids': [],
            'case_id': case_id,
            'session_id': session_id
        }
        
        # 1. Remove specific known IDs first
        if case_id:
            # Replace exact case_id matches
            sanitized = sanitized.replace(case_id, self.replacements['case_id'])
            
            # Also remove case_id from common phrases
            sanitized = re.sub(
                f'(?:para el caso|del caso|case)\\s+{re.escape(case_id)}',
                'de este caso',
                sanitized,
                flags=re.IGNORECASE
            )
        
        if session_id:
            sanitized = sanitized.replace(session_id, self.replacements['session_id'])
        
        # 2. Remove ID patterns from text
        # Remove "ID: abc123xyz" patterns
        sanitized = re.sub(
            self.PATTERNS['doc_id_parens'],
            '',
            sanitized
        )
        
        # Remove "ID del caso: xyz" or "case_id: xyz" patterns
        def replace_case_id_match(match):
            metadata['extracted_ids'].append(match.group(1))
            return ''
        
        sanitized = re.sub(
            self.PATTERNS['case_id_prefix'],
            replace_case_id_match,
            sanitized,
            flags=re.IGNORECASE
        )
        
        # 3. Remove standalone Firestore IDs (20+ char alphanumeric strings)
        # But preserve document names like "protocolo_bullying_2024.pdf"
        if preserve_document_names:
            # Only remove IDs that don't have file extensions
            def replace_firestore_id(match):
                id_string = match.group(0)
                # Check if it's likely a filename (has dots or common file patterns)
                if '.' in id_string or re.search(r'[_-](pdf|docx|jpg|png|xlsx)', id_string, re.IGNORECASE):
                    return id_string
                metadata['extracted_ids'].append(id_string)
                return self.replacements['firestore_id']
            
            sanitized = re.sub(
                self.PATTERNS['firestore_id'],
                replace_firestore_id,
                sanitized
            )
        else:
            sanitized = re.sub(
                self.PATTERNS['firestore_id'],
                self.replacements['firestore_id'],
                sanitized
            )
        
        # 4. Clean up any resulting formatting issues
        # Remove double spaces
        sanitized = re.sub(r'\s+', ' ', sanitized)
        
        # Remove orphaned colons
        sanitized = re.sub(r':\s*\n', '\n', sanitized)
        
        # Clean up multiple newlines
        sanitized = re.sub(r'\n\s*\n\s*\n', '\n\n', sanitized)
        
        logger.debug(f"🧹 Sanitized response: removed {len(metadata['extracted_ids'])} IDs")
        
        return sanitized.strip(), metadata
    
    def extract_file_references(self, text: str) -> List[Dict[str, str]]:
        """
        Extracts document/file references from text that should be preserved.
        
        Returns:
            List of dicts with 'name' and 'type' keys
        """
        file_refs = []
        
        # Match common file patterns
        file_pattern = r'\b([a-zA-Z0-9_-]+\.(?:pdf|docx|doc|xlsx|xls|jpg|jpeg|png|txt))\b'
        matches = re.finditer(file_pattern, text, re.IGNORECASE)
        
        for match in matches:
            filename = match.group(1)
            extension = filename.split('.')[-1].lower()
            file_refs.append({
                'name': filename,
                'type': extension
            })
        
        return file_refs
    
    def sanitize_context_message(self, context: str, case_id: Optional[str] = None) -> str:
        """
        Specifically sanitizes case context messages for system prompts.
        Removes IDs but keeps structure for agent understanding.
        
        Args:
            context: The context message to sanitize
            case_id: The case ID to remove
            
        Returns:
            Sanitized context string
        """
        sanitized = context
        
        if case_id:
            # Replace "**ID del Caso**: abc123" with just section header
            sanitized = re.sub(
                r'\*\*ID del Caso\*\*:\s*' + re.escape(case_id),
                '**Caso Activo**',
                sanitized
            )
            
            # Remove any other mentions of the case ID
            sanitized = sanitized.replace(case_id, '[ESTE_CASO]')
        
        # Clean up the separator lines if ID was the only content
        sanitized = re.sub(r'\n\n\n+', '\n\n', sanitized)
        
        return sanitized
    
    def build_metadata(
        self,
        case_id: Optional[str] = None,
        session_id: Optional[str] = None,
        file_ids: Optional[List[str]] = None,
        document_ids: Optional[List[str]] = None,
        protocol_data: Optional[Dict] = None
    ) -> Dict:
        """
        Builds structured metadata dict for frontend consumption.
        
        Args:
            case_id: Current case ID
            session_id: Current session ID
            file_ids: List of file/document IDs
            document_ids: List of Firestore document IDs
            protocol_data: Protocol-specific data if applicable
            
        Returns:
            Metadata dictionary
        """
        metadata = {}
        
        if case_id:
            metadata['case_id'] = case_id
        
        if session_id:
            metadata['session_id'] = session_id
        
        if file_ids:
            metadata['file_ids'] = file_ids
        
        if document_ids:
            metadata['document_ids'] = document_ids
        
        if protocol_data:
            metadata['protocol'] = protocol_data
        
        return metadata


# Singleton instance
response_sanitizer = ResponseSanitizer()
