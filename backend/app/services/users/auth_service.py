import firebase_admin
import logging
from firebase_admin import auth, credentials, firestore
from google.cloud import firestore as firestore_client
from typing import Optional, Dict
from datetime import datetime
from app.core.config import get_settings
from app.schemas.user import Usuario, UsuarioCreate, LoginResponse
import os


logger = logging.getLogger(__name__)
settings = get_settings()

class AuthService:
    def __init__(self):
        self.project_id = settings.PROJECT_ID
        self._db = None
        self._firebase_initialized = False
        # REMOVED: self._initialize_firebase() - now lazy initialization

    def _ensure_firebase_initialized(self):
        """Lazy initialization: Inicializa Firebase Admin SDK solo cuando se necesita"""
        if self._firebase_initialized:
            return
            
        try:
            # Verificar si ya hay una app inicializada
            firebase_admin.get_app()
            logger.info("✓ Firebase Admin ya estaba inicializado")
            self._firebase_initialized = True
        except ValueError:
            # No hay app inicializada, crear una nueva
            try:
                # En Cloud Run, usar Application Default Credentials (ADC) como prioridad
                is_cloud_run = os.getenv('K_SERVICE') is not None
                
                if is_cloud_run:
                    # Cloud Run: usar ADC (más confiable)
                    logger.info("🔧 Inicializando Firebase Admin con ADC (Cloud Run)")
                    firebase_admin.initialize_app(options={
                        'projectId': self.project_id,
                    })
                    logger.info("✓ Firebase Admin inicializado con ADC")
                else:
                    # Local: intentar archivo de credenciales primero
                    cred_path = settings.GOOGLE_APPLICATION_CREDENTIALS
                    if os.path.exists(cred_path):
                        logger.info(f"🔧 Inicializando Firebase Admin con archivo: {cred_path}")
                        cred = credentials.Certificate(cred_path)
                        firebase_admin.initialize_app(cred, {
                            'projectId': self.project_id,
                        })
                        logger.info("✓ Firebase Admin inicializado con archivo de credenciales")
                    else:
                        # Fallback a ADC
                        logger.info("🔧 Inicializando Firebase Admin con ADC (local)")
                        firebase_admin.initialize_app(options={
                            'projectId': self.project_id,
                        })
                        logger.info("✓ Firebase Admin inicializado con ADC")
                
                self._firebase_initialized = True
            except Exception as e:
                logger.error(f"❌ Error inicializando Firebase Admin: {e}")
                raise

    @property
    def db(self):
        if self._db is None:
            self._db = firestore_client.Client(
                project=self.project_id,
                database=settings.FIRESTORE_DATABASE
            )
        return self._db

    async def create_user(self, user_data: UsuarioCreate) -> Usuario:
        """
        Crea un usuario en Firebase Authentication y guarda metadata en Firestore
        """
        self._ensure_firebase_initialized()
        try:
            # 1. Crear usuario en Firebase Authentication
            firebase_user = auth.create_user(
                email=user_data.correo,
                password=user_data.password,
                display_name=user_data.nombre,
                disabled=not user_data.activo
            )

            logger.info(f" Usuario creado en Firebase Auth: {firebase_user.uid}")

            # 2. Guardar metadata en Firestore
            now = datetime.utcnow()
            user_dict = {
                "id": firebase_user.uid,
                "nombre": user_data.nombre,
                "correo": user_data.correo,
                "rol": user_data.rol.value,
                "activo": user_data.activo,
                "colegios": user_data.colegios,
                "created_at": now,
                "updated_at": now
            }

            doc_ref = self.db.collection("usuarios").document(firebase_user.uid)
            doc_ref.set(user_dict)

            logger.info(f" Metadata guardada en Firestore: usuarios/{firebase_user.uid}")

            return Usuario(**user_dict)

        except auth.EmailAlreadyExistsError:
            raise ValueError("El correo electrónico ya está registrado")
        except Exception as e:
            logger.error(f" Error creando usuario: {e}")
            raise

    async def verify_token(self, id_token: str) -> Dict:
        """
        Verifica un ID token de Firebase O un token firmado localmente.
        Retorna la información del usuario.
        """
        self._ensure_firebase_initialized()
        try:
            # 1. Intentar verificar como token local (Custom/Dev)
            # Evita llamada a Firebase para tokens generados por /login
            from app.core.security import verify_access_token
            local_payload = verify_access_token(id_token)
            
            if local_payload:
                uid = local_payload.get("uid") or local_payload.get("sub")
                if not uid:
                    raise ValueError("Token local incompleto")
                    
                # Obtener metadata del usuario desde Firestore
                doc_ref = self.db.collection("usuarios").document(uid)
                doc = doc_ref.get()

                if not doc.exists:
                     # Si no existe, podría ser que el token tiene datos viejos?
                     raise ValueError("Usuario no encontrado en Firestore")
                
                user_data = doc.to_dict()
                 # Verificar si el usuario está activo
                if not user_data.get("activo", True):
                    raise ValueError("Usuario desactivado")

                return {
                    "uid": uid,
                    "email": user_data.get("correo"),
                    "user_data": user_data
                }

            # 2. Si falla local, intentar verificar con Firebase (Bearer real)
            try:
                decoded_token = auth.verify_id_token(id_token)
            except Exception:
                # Si fallan ambos, asumir inválido
                raise ValueError("Token inválido o expirado (Local & Firebase)")

            uid = decoded_token['uid']

            # Obtener metadata del usuario desde Firestore
            doc_ref = self.db.collection("usuarios").document(uid)
            doc = doc_ref.get()

            if not doc.exists:
                raise ValueError("Usuario no encontrado en Firestore")

            user_data = doc.to_dict()

            # Verificar si el usuario está activo
            if not user_data.get("activo", True):
                raise ValueError("Usuario desactivado")

            return {
                "uid": uid,
                "email": decoded_token.get("email"),
                "user_data": user_data
            }

        except auth.InvalidIdTokenError:
            raise ValueError("Token inválido")
        except auth.ExpiredIdTokenError:
            raise ValueError("Token expirado")
        except Exception as e:
            logger.error(f" Error verificando token: {e}")
            raise

    async def get_user_by_id(self, user_id: str) -> Optional[Usuario]:
        """Obtiene un usuario por su ID (UID de Firebase)"""
        try:
            doc_ref = self.db.collection("usuarios").document(user_id)
            doc = doc_ref.get()

            if doc.exists:
                return Usuario(**doc.to_dict())
            return None

        except Exception as e:
            logger.error(f" Error obteniendo usuario: {e}")
            return None

    async def get_user_by_email(self, email: str) -> Optional[Usuario]:
        """Obtiene un usuario por su correo electrónico"""
        try:
            # Buscar en Firestore
            users_ref = self.db.collection("usuarios")
            query = users_ref.where("correo", "==", email).limit(1)
            docs = query.stream()

            for doc in docs:
                return Usuario(**doc.to_dict())

            return None

        except Exception as e:
            logger.error(f" Error buscando usuario por email: {e}")
            return None

    async def update_user_active_status(self, user_id: str, activo: bool):
        """Actualiza el estado activo de un usuario en Firebase y Firestore"""
        self._ensure_firebase_initialized()
        try:
            # Actualizar en Firebase Authentication
            auth.update_user(user_id, disabled=not activo)

            # Actualizar en Firestore
            doc_ref = self.db.collection("usuarios").document(user_id)
            doc_ref.update({
                "activo": activo,
                "updated_at": datetime.utcnow()
            })

            logger.info(f" Usuario {user_id} {'activado' if activo else 'desactivado'}")

        except Exception as e:
            logger.error(f" Error actualizando estado de usuario: {e}")
            raise

    async def delete_user(self, user_id: str):
        """Elimina un usuario de Firebase Authentication y Firestore"""
        self._ensure_firebase_initialized()
        try:
            # Eliminar de Firebase Authentication
            auth.delete_user(user_id)

            # Eliminar de Firestore
            doc_ref = self.db.collection("usuarios").document(user_id)
            doc_ref.delete()

            logger.info(f" Usuario {user_id} eliminado completamente")

        except Exception as e:
            logger.error(f" Error eliminando usuario: {e}")
            raise

    async def create_custom_token(self, user_id: str) -> str:
        """Crea un custom token para un usuario (útil para testing)"""
        self._ensure_firebase_initialized()
        try:
            custom_token = auth.create_custom_token(user_id)
            return custom_token.decode('utf-8')
        except Exception as e:
            logger.error(f" Error creando custom token: {e}")
            raise

# Instancia singleton
auth_service = AuthService()
