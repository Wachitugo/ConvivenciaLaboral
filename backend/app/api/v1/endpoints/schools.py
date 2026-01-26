from fastapi import APIRouter, HTTPException, Query, File, UploadFile, Form, BackgroundTasks
from typing import List, Optional
import logging
from app.services.school_service import school_service
from app.services.storage_service import storage_service
from app.services.discovery_service import discovery_service
from app.schemas.user import Colegio, ColegioCreate, ColegioUpdate

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/", response_model=Colegio)
async def create_colegio(colegio_data: ColegioCreate):
    """Crea un nuevo colegio"""
    try:
        nuevo_colegio = school_service.create_colegio(colegio_data)
        return nuevo_colegio
    except Exception as e:
        logger.exception("Error creating school")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.post("/with-logo", response_model=Colegio)
async def create_colegio_with_logo(
    nombre: str = Form(...),
    slug: Optional[str] = Form(None),
    direccion: Optional[str] = Form(None),
    logo: Optional[UploadFile] = File(None)
):
    """Crea un nuevo colegio con logo"""
    try:
        # 1. Crear el colegio primero (esto crea el bucket automáticamente)
        colegio_data = ColegioCreate(
            nombre=nombre,
            slug=slug,
            direccion=direccion,
            logo_url=None  # Temporal, se actualizará después
        )

        nuevo_colegio = school_service.create_colegio(colegio_data)
        
        # 2. Si se subió un logo, subirlo al bucket del colegio
        if logo:
            # Validar tipo de archivo
            if not logo.content_type.startswith('image/'):
                raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")

            # Leer el contenido del archivo
            file_content = await logo.read()

            # Subir al bucket específico del colegio
            logo_url = storage_service.upload_school_logo(
                file_content=file_content,
                filename=logo.filename,
                content_type=logo.content_type,
                school_bucket_name=nuevo_colegio.bucket_name
            )
            
            # 3. Actualizar el colegio con la URL del logo
            updated_colegio = school_service.update_colegio(
                nuevo_colegio.id,
                ColegioUpdate(logo_url=logo_url)
            )
            
            return updated_colegio if updated_colegio else nuevo_colegio

        return nuevo_colegio

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error creating school with logo")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/", response_model=List[Colegio])
async def get_all_colegios():
    """Obtiene todos los colegios"""
    try:
        colegios = school_service.get_all_colegios()
        return colegios
    except Exception as e:
        logger.exception("Error getting schools")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.get("/search", response_model=List[Colegio])
async def search_colegios(nombre: str = Query(..., min_length=1)):
    """Busca colegios por nombre"""
    try:
        colegios = school_service.search_colegios_by_name(nombre)
        return colegios
    except Exception as e:
        logger.exception("Error searching schools")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.get("/by-slug/{slug}", response_model=Colegio)
async def get_colegio_by_slug(slug: str):
    """Obtiene un colegio por slug"""
    try:
        colegio = school_service.get_colegio_by_slug(slug)
        if not colegio:
            raise HTTPException(status_code=404, detail="Colegio no encontrado")
        return colegio
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error getting school by slug")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.get("/{colegio_id}", response_model=Colegio)
async def get_colegio(colegio_id: str):
    """Obtiene un colegio por ID"""
    try:
        colegio = school_service.get_colegio_by_id(colegio_id)
        if not colegio:
            raise HTTPException(status_code=404, detail="Colegio no encontrado")
        return colegio
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error getting school")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.patch("/{colegio_id}", response_model=Colegio)
async def update_colegio(colegio_id: str, update_data: ColegioUpdate):
    """Actualiza un colegio"""
    try:
        updated_colegio = school_service.update_colegio(colegio_id, update_data)
        if not updated_colegio:
            raise HTTPException(status_code=404, detail="Colegio no encontrado")
        return updated_colegio
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error updating school")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.patch("/{colegio_id}/update-with-logo", response_model=Colegio)
async def update_colegio_with_logo(
    colegio_id: str,
    nombre: str = Form(...),
    slug: Optional[str] = Form(None),
    direccion: Optional[str] = Form(None),
    logo: Optional[UploadFile] = File(None)
):
    """Actualiza un colegio con opción de cambiar el logo"""
    try:
        # Verificar que el colegio existe
        existing_colegio = school_service.get_colegio_by_id(colegio_id)
        if not existing_colegio:
            raise HTTPException(status_code=404, detail="Colegio no encontrado")

        logo_url = existing_colegio.logo_url  # Mantener el logo actual por defecto

        # Si se subió un nuevo logo, subirlo a GCS
        if logo:
            # Validar tipo de archivo
            if not logo.content_type.startswith('image/'):
                raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")

            if not existing_colegio.bucket_name:
                 raise HTTPException(status_code=400, detail="El colegio no tiene un bucket de almacenamiento configurado")

            # Leer el contenido del archivo
            file_content = await logo.read()

            # Subir a GCS
            logo_url = storage_service.upload_school_logo(
                file_content=file_content,
                filename=logo.filename,
                content_type=logo.content_type,
                school_bucket_name=existing_colegio.bucket_name
            )

        # Actualizar el colegio con los nuevos datos
        update_data = ColegioUpdate(
            nombre=nombre,
            slug=slug,
            direccion=direccion,
            logo_url=logo_url
        )

        updated_colegio = school_service.update_colegio(colegio_id, update_data)
        return updated_colegio

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error updating school with logo")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.delete("/{colegio_id}")
async def delete_colegio(colegio_id: str):
    """
    Elimina un colegio.
    Falla si hay usuarios asociados.
    """
    try:
        success = school_service.delete_colegio(colegio_id)
        if not success:
            raise HTTPException(status_code=404, detail="Colegio no encontrado")
        return {"mensaje": "Colegio eliminado exitosamente"}
    except Exception as e:
        logger.exception("Error deleting school")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.get("/proxy-image/")
async def proxy_image(url: str = Query(..., description="URL de la imagen a obtener")):
    """
    Proxy para obtener imágenes y evitar problemas de CORS.
    Soporta URLs públicas y URLs de GCS privadas (via storage_service).
    """
    import httpx
    from fastapi.responses import Response
    from urllib.parse import urlparse

    try:
        # 1. Detectar si es una URL de GCS (storage.googleapis.com)
        parsed_url = urlparse(url)
        if parsed_url.netloc == 'storage.googleapis.com':
            # Formato: /<bucket>/<path>
            parts = parsed_url.path.strip('/').split('/', 1)
            if len(parts) == 2:
                bucket_name, blob_path = parts
                
                # Usar credenciales del servicio para descargar
                content, content_type = storage_service.download_blob(bucket_name, blob_path)
                
                if content:
                     return Response(content=content, media_type=content_type or "image/png")
                else:
                    # Si falla (ej: no existe), intentamos método estándar o error
                     logger.warning(f"Could not download blob via service: {blob_path}")

        # 2. Método estándar para otras URLs (o fallback)
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="No se pudo obtener la imagen")
            
            content_type = response.headers.get("content-type", "image/png")
            return Response(content=response.content, media_type=content_type)
            
    except Exception as e:
        logger.exception("Error in image proxy")
        raise HTTPException(status_code=500, detail=f"Error obteniendo imagen: {str(e)}")


@router.post("/{colegio_id}/documents")
async def upload_school_document(
    colegio_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """Sube un documento al bucket del colegio"""
    try:
        colegio = school_service.get_colegio_by_id(colegio_id)
        if not colegio:
            raise HTTPException(status_code=404, detail="Colegio no encontrado")

        if not colegio.bucket_name:
             # Si no tiene bucket, intentar crearlo o usar uno default (fallback)
             # Por ahora, lanzar error si no tiene bucket asignado
             raise HTTPException(status_code=400, detail="El colegio no tiene un bucket de almacenamiento configurado")

        # file.file es un SpooledTemporaryFile (file-like object)
        # Lo pasamos directamente para streaming upload
        result = storage_service.upload_school_document_from_file(
            file_obj=file.file,
            filename=file.filename,
            content_type=file.content_type,
            school_bucket_name=colegio.bucket_name
        )
        
        # Indexar en segundo plano
        gcs_uri = f"gs://{colegio.bucket_name}/documentos/{file.filename}"
        background_tasks.add_task(
            discovery_service.index_document, 
            gcs_uri, 
            colegio_id, 
            colegio.data_store_id
        )
        
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error uploading document")
        raise HTTPException(status_code=500, detail=f"Error subiendo documento: {str(e)}")


@router.get("/{colegio_id}/documents")
async def list_school_documents(colegio_id: str):
    """Lista los documentos del colegio"""
    try:
        colegio = school_service.get_colegio_by_id(colegio_id)
        if not colegio:
            raise HTTPException(status_code=404, detail="Colegio no encontrado")

        if not colegio.bucket_name:
             return []

        documents = storage_service.list_school_documents(colegio.bucket_name)
        return documents

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error listing documents")
        raise HTTPException(status_code=500, detail=f"Error listando documentos: {str(e)}")


@router.delete("/{colegio_id}/documents/{filename}")
async def delete_school_document(
    colegio_id: str, 
    filename: str,
    background_tasks: BackgroundTasks
):
    """Elimina un documento del colegio"""
    try:
        colegio = school_service.get_colegio_by_id(colegio_id)
        if not colegio:
            raise HTTPException(status_code=404, detail="Colegio no encontrado")

        if not colegio.bucket_name:
             raise HTTPException(status_code=400, detail="El colegio no tiene bucket configurado")

        success = storage_service.delete_school_document(colegio.bucket_name, filename)
        
        if not success:
             raise HTTPException(status_code=404, detail="Documento no encontrado")
             
        # Eliminar también del índice de búsqueda en background
        background_tasks.add_task(
            discovery_service.delete_document, 
            filename,
            colegio.data_store_id
        )
        
        return {"message": "Documento eliminado exitosamente"}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error deleting document")
        raise HTTPException(status_code=500, detail=f"Error eliminando documento: {str(e)}")
