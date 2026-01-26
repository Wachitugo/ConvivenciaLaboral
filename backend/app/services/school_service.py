import unicodedata


import uuid
import logging
import re
from typing import List, Optional
from datetime import datetime
from google.cloud import firestore
from app.core.config import get_settings
from app.schemas.user import Colegio, ColegioCreate, ColegioUpdate

logger = logging.getLogger(__name__)
settings = get_settings()



class SchoolService:
    def __init__(self):
        self.project_id = settings.PROJECT_ID
        self._db = None
        self.collection_name = "colegios"

    @property
    def db(self):
        if self._db is None:
            self._db = firestore.Client(
                project=self.project_id,
                database=settings.FIRESTORE_DATABASE
            )
        return self._db

    def create_colegio(self, colegio_data: ColegioCreate) -> Colegio:
        """Crea un nuevo colegio"""
        try:
            from app.services.storage_service import storage_service
            
            colegio_id = str(uuid.uuid4())
            now = datetime.utcnow()

            # Generate slug if not provided
            if not colegio_data.slug:
                # Normalize text to remove accents (e.g. á -> a, ñ -> n)
                # NFKD decomposition separates characters from their diacritics
                # Then we filter out non-spacing mark characters
                normalized = unicodedata.normalize('NFKD', colegio_data.nombre).encode('ASCII', 'ignore').decode('utf-8')
                # If the name had 'ñ', NFKD decomposes it to 'n' + '~', and ASCII ignore removes '~'
                # But typically we want ñ -> n.
                # Let's verify 'ñ'. unicodedata.normalize('NFKD', 'ñ') is 'n\u0303'.
                # encode('ASCII', 'ignore') yields 'n'. Perfect.
                
                colegio_data.slug = re.sub(r'[^a-z0-9]+', '-', normalized.lower()).strip('-')

            # Create buckets etc...
            logger.info(f"Creating bucket for school: {colegio_data.nombre} (slug: {colegio_data.slug})")
            bucket_name = storage_service.create_school_bucket(
                school_id=colegio_id,
                school_name=colegio_data.nombre
            )

            # --- NUEVO: Crear Data Store y Search App en Discovery Engine ---
            from app.services.discovery_service import discovery_service
            data_store_id = None
            search_app_id = None
            try:
                # 1. Crear Data Store
                data_store_id = discovery_service.create_data_store(
                    school_id=colegio_id,
                    school_name=colegio_data.nombre
                )
                
                # 2. Crear Search App (Engine)
                if data_store_id:
                    search_app_id = discovery_service.create_engine(
                        school_id=colegio_id, 
                        data_store_id=data_store_id
                    )
            except Exception as e:
                logger.error(f"Failed to create Discovery Engine resources: {e}")
                # No fallamos la creación del colegio, pero logueamos el error.
                # El usuario podría reintentar o configurarlo manualmente después.


            colegio_dict = colegio_data.model_dump()
            colegio_dict["id"] = colegio_id
            colegio_dict["bucket_name"] = bucket_name
            colegio_dict["data_store_id"] = data_store_id
            colegio_dict["search_app_id"] = search_app_id
            colegio_dict["created_at"] = now
            colegio_dict["updated_at"] = now

            doc_ref = self.db.collection(self.collection_name).document(colegio_id)
            doc_ref.set(colegio_dict)

            logger.info(f"Colegio creado: {colegio_id} - {colegio_data.nombre} - Bucket: {bucket_name}")
            return Colegio(**colegio_dict)

        except Exception as e:
            logger.error(f"Error creando colegio: {e}")
            raise

    def get_all_colegios(self) -> List[Colegio]:
        """Obtiene todos los colegios"""
        try:
            docs = self.db.collection(self.collection_name).order_by(
                "nombre"
            ).stream()

            colegios = []
            for doc in docs:
                colegios.append(Colegio(**doc.to_dict()))

            return colegios

        except Exception as e:
            logger.error(f" Error obteniendo colegios: {e}")
            return []

    def get_colegio_by_id(self, colegio_id: str) -> Optional[Colegio]:
        """Obtiene un colegio por ID"""
        try:
            doc_ref = self.db.collection(self.collection_name).document(colegio_id)
            doc = doc_ref.get()

            if doc.exists:
                return Colegio(**doc.to_dict())
            return None

        except Exception as e:
            logger.error(f" Error obteniendo colegio {colegio_id}: {e}")
            return None

    def get_colegio_by_slug(self, slug: str) -> Optional[Colegio]:
        """Obtiene un colegio por slug"""
        try:
            docs = self.db.collection(self.collection_name).where("slug", "==", slug).limit(1).stream()
            for doc in docs:
                return Colegio(**doc.to_dict())
            return None
        except Exception as e:
            logger.error(f" Error obteniendo colegio por slug {slug}: {e}")
            return None

    def update_colegio(self, colegio_id: str, update_data: ColegioUpdate) -> Optional[Colegio]:
        """Actualiza un colegio"""
        try:
            doc_ref = self.db.collection(self.collection_name).document(colegio_id)
            doc = doc_ref.get()

            if not doc.exists:
                logger.warning(f" Colegio {colegio_id} no existe")
                return None

            # Construir dict de actualización solo con campos no None
            update_dict = {}
            if update_data.nombre is not None:
                update_dict["nombre"] = update_data.nombre
            if update_data.slug is not None:
                update_dict["slug"] = update_data.slug
            if update_data.direccion is not None:
                update_dict["direccion"] = update_data.direccion
            if update_data.logo_url is not None:
                update_dict["logo_url"] = update_data.logo_url
            if update_data.data_store_id is not None:
                update_dict["data_store_id"] = update_data.data_store_id
            if update_data.search_app_id is not None:
                update_dict["search_app_id"] = update_data.search_app_id
            if update_data.token_limit is not None:
                update_dict["token_limit"] = update_data.token_limit
            if update_data.input_token_limit is not None:
                update_dict["input_token_limit"] = update_data.input_token_limit
            if update_data.output_token_limit is not None:
                update_dict["output_token_limit"] = update_data.output_token_limit
            if update_data.warning_thresholds is not None:
                update_dict["warning_thresholds"] = update_data.warning_thresholds

            update_dict["updated_at"] = datetime.utcnow()

            doc_ref.update(update_dict)

            # Obtener y retornar colegio actualizado
            updated_doc = doc_ref.get()
            logger.info(f" Colegio {colegio_id} actualizado")
            return Colegio(**updated_doc.to_dict())

        except Exception as e:
            logger.error(f" Error actualizando colegio: {e}")
            return None

    def delete_colegio(self, colegio_id: str) -> bool:
        """
        Elimina un colegio.
        ADVERTENCIA: Verifica que no haya usuarios asociados antes de eliminar.
        """
        try:
            # Verificar si hay usuarios asociados
            users_ref = self.db.collection("usuarios").where(
                "colegios", "array_contains", colegio_id
            )
            users = list(users_ref.limit(1).stream())

            if users:
                logger.warning(f" No se puede eliminar el colegio {colegio_id}: tiene usuarios asociados")
                raise ValueError(
                    "No se puede eliminar el colegio porque tiene usuarios asociados. "
                    "Primero desasocia todos los usuarios."
                )

            # Obtener datos del colegio antes de eliminar
            doc_ref = self.db.collection(self.collection_name).document(colegio_id)
            doc = doc_ref.get()
            if doc.exists:
                colegio_data = doc.to_dict()
                
                # --- NUEVO: Eliminar recursos de Discovery Engine ---
                from app.services.discovery_service import discovery_service
                
                # 1. Eliminar Search App (Engine)
                if "search_app_id" in colegio_data and colegio_data["search_app_id"]:
                    background_tasks = None # TODO: Consider passing background_tasks if async is preferred, but sync is safer for deletion dependency
                    # Ejecutamos síncrono para asegurar limpieza? O mejor en background para no bloquear?
                    # Para simplificar y asegurar, lo hacemos directo (puede tardar un poco).
                    try:
                        discovery_service.delete_engine(colegio_data["search_app_id"])
                    except Exception as e:
                        logger.error(f"Error deleting engine for school {colegio_id}: {e}")

                # 2. Eliminar Data Store
                if "data_store_id" in colegio_data and colegio_data["data_store_id"]:
                    try:
                        discovery_service.delete_data_store(colegio_data["data_store_id"])
                    except Exception as e:
                        logger.error(f"Error deleting data store for school {colegio_id}: {e}")

            # Eliminar colegio
            doc_ref.delete()

            logger.info(f" Colegio {colegio_id} eliminado")
            return True

        except ValueError:
            raise
        except Exception as e:
            logger.error(f" Error eliminando colegio: {e}")
            return False

    def search_colegios_by_name(self, nombre: str) -> List[Colegio]:
        """Busca colegios por nombre (búsqueda parcial)"""
        try:
            # Firestore no soporta búsqueda LIKE, así que obtenemos todos y filtramos
            all_colegios = self.get_all_colegios()

            # Filtrar por nombre (case-insensitive)
            nombre_lower = nombre.lower()
            filtered = [
                c for c in all_colegios
                if nombre_lower in c.nombre.lower()
            ]

            return filtered

        except Exception as e:
            logger.error(f" Error buscando colegios: {e}")
            return []

    def get_colegios_by_ids(self, colegio_ids: List[str]) -> List[Colegio]:
        """Obtiene múltiples colegios por sus IDs"""
        try:
            colegios = []
            for colegio_id in colegio_ids:
                colegio = self.get_colegio_by_id(colegio_id)
                if colegio:
                    colegios.append(colegio)

            return colegios

        except Exception as e:
            logger.error(f" Error obteniendo colegios por IDs: {e}")
            return []

# Instancia singleton
school_service = SchoolService()
