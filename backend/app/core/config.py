import os
from pydantic_settings import BaseSettings
from functools import lru_cache
from dotenv import load_dotenv
from typing import Optional, List

load_dotenv()

class Settings(BaseSettings):
    APP_NAME: str = "Convivencia Inteligente API"
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    CLIENT_ORIGIN: str = "http://localhost:5173"
    # Permitir orígenes adicionales separados por coma
    ALLOWED_ORIGINS: Optional[str] = None
    
    # Google Cloud Config
    PROJECT_ID: str = os.getenv("PROJECT_ID", "tu-proyecto-id")
    LOCATION: str = os.getenv("LOCATION", "us-central1")
    DATA_STORE_ID: str = os.getenv("DATA_STORE_ID", "tu-datastore-id")
    
    # Service Account Path
    GOOGLE_APPLICATION_CREDENTIALS: str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "service-account-key.json")

    # Extra fields
    GOOGLE_AI_API_KEY: Optional[str] = None
    VERTEX_LOCATION: Optional[str] = None
    VERTEX_MODEL: Optional[str] = None
    VERTEX_MODEL_REASON: Optional[str] = None  # For complex reasoning tasks
    VERTEX_MODEL_FLASH: Optional[str] = None   # For faster tasks like document analysis
    PROJECT_NUMBER: Optional[str] = None
    ENGINE_ID: Optional[str] = None
    ASSISTANT_ID: Optional[str] = None
    GCS_BUCKET_LEGAL: Optional[str] = None
    GCS_BUCKET_SCHOOLS: Optional[str] = None
    GCS_BUCKET_SESSIONS: Optional[str] = None
    FIRESTORE_DATABASE: Optional[str] = "(default)"
    DEFAULT_SCHOOL_ID: Optional[str] = None
    
    # Vertex AI Search App IDs
    DOCLEGALES_APP_ID: Optional[str] = None  # Required - Search App ID for legal documents
    DEFAULT_SEARCH_APP_ID: Optional[str] = None  # Default/Demo Search App ID
    
    # File upload limits (aligned with Gemini API constraints)
    MAX_FILES_PER_UPLOAD: int = 30  # Practical limit for multi-document analysis
    MAX_FILE_SIZE_MB: int = 500  # Increased for Chunked Uploads
    MAX_TOTAL_SIZE_MB: int = 1000  # Total upload size limit

    class Config:
        env_file = ".env"
        extra = "ignore"

    def get_allowed_origins(self) -> List[str]:
        """Retorna la lista completa de orígenes permitidos"""
        origins = [
            self.CLIENT_ORIGIN,
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173"
        ]

        # Agregar orígenes adicionales desde variable de entorno
        if self.ALLOWED_ORIGINS:
            additional_origins = [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
            origins.extend(additional_origins)

        # Remover duplicados
        return list(set(origins))

@lru_cache()
def get_settings():
    return Settings()
