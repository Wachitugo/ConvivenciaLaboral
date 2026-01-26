from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import logging.handlers
import os
from pathlib import Path

from app.core.config import get_settings
from app.api.v1.router import api_router

# Configuración de logging profesional
def setup_logging():
    """Configura el sistema de logging con rotación de archivos"""
    # Detectar si estamos en Cloud Run (filesystem read-only)
    is_cloud_run = os.getenv('K_SERVICE') is not None
    
    # Configurar formato de logs
    log_format = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Handler para consola (siempre disponible)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(log_format)
    
    # Configurar logger raíz
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    root_logger.addHandler(console_handler)
    
    # Solo agregar file handler si NO estamos en Cloud Run
    if not is_cloud_run:
        try:
            # Crear directorio de logs si no existe
            log_dir = Path(__file__).parent.parent / "logs"
            log_dir.mkdir(exist_ok=True)
            
            # Handler para archivo con rotación (10MB, 5 backups)
            file_handler = logging.handlers.RotatingFileHandler(
                log_dir / "app.log",
                maxBytes=10 * 1024 * 1024,  # 10MB
                backupCount=5,
                encoding='utf-8'
            )
            file_handler.setLevel(logging.DEBUG)
            file_handler.setFormatter(log_format)
            root_logger.addHandler(file_handler)
        except Exception as e:
            # Si falla crear el archivo, solo usar consola
            root_logger.warning(f"Could not setup file logging: {e}")
    
    # Reducir verbosidad de librerías externas
    logging.getLogger("google").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    
    return logging.getLogger(__name__)

logger = setup_logging()

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    description="API para gestión de convivencia escolar con IA",
    version="1.0.0"
)

allowed_origins = settings.get_allowed_origins()
logger.info(f"CORS configured with allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    """Log successful startup for Cloud Run observability"""
    import os
    port = os.getenv("PORT", "8000")
    logger.info(f"🚀 Application startup complete - listening on port {port}")
    logger.info(f"📍 Environment: {'Cloud Run' if os.getenv('K_SERVICE') else 'Local'}")

@app.get("/")
async def root():
    """Root endpoint - basic health check"""
    return {
        "message": "Convivencia Inteligente API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Detailed health check endpoint for Cloud Run"""
    import os
    return {
        "status": "healthy",
        "service": "backend",
        "version": "1.0.0",
        "environment": "cloud_run" if os.getenv('K_SERVICE') else "local",
        "port": os.getenv("PORT", "8000")
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=True
    )
