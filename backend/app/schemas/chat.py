from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class ChatMetadata(BaseModel):
    """Metadata accompanying chat responses with IDs and references"""
    
    case_id: Optional[str] = Field(None, description="Current case ID if applicable")
    session_id: Optional[str] = Field(None, description="Chat session ID")
    file_ids: Optional[List[str]] = Field(None, description="IDs of files referenced in response")
    document_ids: Optional[List[str]] = Field(None, description="Firestore document IDs")
    protocol: Optional[Dict[str, Any]] = Field(None, description="Protocol data if activated")
    extracted_ids: Optional[List[str]] = Field(None, description="IDs extracted during sanitization")
    

class ChatResponse(BaseModel):
    """Structured chat response with sanitized text and metadata"""
    
    text: str = Field(..., description="User-facing response text (IDs removed)")
    metadata: ChatMetadata = Field(default_factory=ChatMetadata, description="Structured metadata with IDs")
    suggestions: Optional[List[str]] = Field(None, description="Suggested follow-up questions")
    

class StreamChunk(BaseModel):
    """A chunk of streamed response data"""
    
    type: str = Field(..., description="Type of chunk: 'thinking', 'content', 'metadata', 'suggestions'")
    content: Any = Field(..., description="Content of the chunk (varies by type)")
    

class ChatRequest(BaseModel):
    """Request to chat endpoint"""
    
    message: str = Field(..., description="User message")
    session_id: str = Field(..., description="Chat session ID")
    school_name: str = Field(..., description="School name for context")
    files: Optional[List[str]] = Field(None, description="File URIs if any")
    case_id: Optional[str] = Field(None, description="Case ID if chat is in case context")
    user_id: Optional[str] = Field(None, description="User ID for personalization")
