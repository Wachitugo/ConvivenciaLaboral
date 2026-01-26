import uuid
import bcrypt
import logging
from typing import List, Optional
from datetime import datetime
from google.cloud import firestore
from app.core.config import get_settings
from app.schemas.user import Usuario, UsuarioCreate, UsuarioUpdate

logger = logging.getLogger(__name__)
settings = get_settings()

class UserServiceSimple:
    """Servicio de usuarios simple sin Firebase Authentication"""

    def __init__(self):
        self.project_id = settings.PROJECT_ID
        self._db = None
        self.collection_name = "usuarios"

    @property
    def db(self):
        if self._db is None:
            self._db = firestore.Client(
                project=self.project_id,
                database=settings.FIRESTORE_DATABASE
            )
        return self._db

    def _hash_password(self, password: str) -> str:
        """Hashea una contraseña usando bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')

    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verifica una contraseña contra su hash"""
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

    def create_user(self, user_data: UsuarioCreate) -> Usuario:
        """Crea un nuevo usuario en Firestore"""
        try:
            # Verificar si el correo ya existe
            existing_user = self.get_user_by_email(user_data.correo)
            if existing_user:
                raise ValueError("El correo electrónico ya está registrado")

            user_id = str(uuid.uuid4())
            now = datetime.utcnow()

            # Hashear la contraseña
            hashed_password = self._hash_password(user_data.password)

            user_dict = {
                "id": user_id,
                "nombre": user_data.nombre,
                "correo": user_data.correo,
                "password_hash": hashed_password,  # Guardar hash de la contraseña
                "rol": user_data.rol.value,
                "activo": user_data.activo,
                "colegios": user_data.colegios,
                "created_at": now,
                "updated_at": now
            }

            doc_ref = self.db.collection(self.collection_name).document(user_id)
            doc_ref.set(user_dict)

            logger.info(f"User created: {user_id} - {user_data.nombre} ({user_data.correo})")

            # Retornar usuario sin el password_hash
            return_dict = {k: v for k, v in user_dict.items() if k != 'password_hash'}
            return Usuario(**return_dict)

        except ValueError:
            raise
        except Exception as e:
            logger.exception("Error creating user")
            raise

    def get_all_users(self, include_inactive: bool = False) -> List[Usuario]:
        """Obtiene todos los usuarios"""
        try:
            query = self.db.collection(self.collection_name)

            if not include_inactive:
                query = query.where("activo", "==", True)

            docs = query.stream()

            users = []
            for doc in docs:
                try:
                    users.append(Usuario(**doc.to_dict()))
                except Exception as validation_error:
                    logger.warning(f"Error validating user {doc.id}: {validation_error}")
                    # Continuar con el siguiente usuario en lugar de fallar completamente

            # Ordenar en memoria para evitar necesidad de índice compuesto
            users.sort(key=lambda u: u.nombre)

            return users

        except Exception as e:
            logger.exception("Error getting users")
            return []

    def get_user_by_id(self, user_id: str) -> Optional[Usuario]:
        """Obtiene un usuario por ID"""
        try:
            doc_ref = self.db.collection(self.collection_name).document(user_id)
            doc = doc_ref.get()

            if doc.exists:
                return Usuario(**doc.to_dict())
            return None

        except Exception as e:
            logger.error(f"Error getting user {user_id}: {e}")
            return None

    def get_user_by_email(self, email: str) -> Optional[Usuario]:
        """Obtiene un usuario por correo electrónico"""
        try:
            users_ref = self.db.collection(self.collection_name)
            query = users_ref.where("correo", "==", email).limit(1)
            docs = query.stream()

            for doc in docs:
                return Usuario(**doc.to_dict())

            return None

        except Exception as e:
            logger.error(f"Error searching user by email: {e}")
            return None

    def update_user(self, user_id: str, update_data: UsuarioUpdate) -> Optional[Usuario]:
        """Actualiza un usuario"""
        try:
            doc_ref = self.db.collection(self.collection_name).document(user_id)
            doc = doc_ref.get()

            if not doc.exists:
                logger.warning(f" Usuario {user_id} no existe")
                return None

            # Construir dict de actualización solo con campos no None
            update_dict = {}
            if update_data.nombre is not None:
                update_dict["nombre"] = update_data.nombre
            if update_data.rol is not None:
                update_dict["rol"] = update_data.rol  # Ya es un string, no necesita .value
            if update_data.activo is not None:
                update_dict["activo"] = update_data.activo
            if update_data.colegios is not None:
                update_dict["colegios"] = update_data.colegios

            update_dict["updated_at"] = datetime.utcnow()

            doc_ref.update(update_dict)

            # Obtener y retornar usuario actualizado
            updated_doc = doc_ref.get()
            logger.info(f"User {user_id} updated")
            return Usuario(**updated_doc.to_dict())

        except Exception as e:
            logger.error(f"Error updating user: {e}")
            return None

    def delete_user(self, user_id: str) -> bool:
        """Elimina un usuario"""
        try:
            doc_ref = self.db.collection(self.collection_name).document(user_id)
            doc = doc_ref.get()

            if not doc.exists:
                logger.warning(f" Usuario {user_id} no existe")
                return False

            doc_ref.delete()
            logger.info(f"User {user_id} deleted")
            return True

        except Exception as e:
            logger.error(f"Error deleting user: {e}")
            return False

    def get_users_by_colegio(self, colegio_id: str) -> List[Usuario]:
        """Obtiene todos los usuarios de un colegio"""
        try:
            users_ref = self.db.collection(self.collection_name)
            query = users_ref.where("colegios", "array_contains", colegio_id)
            docs = query.stream()

            users = []
            for doc in docs:
                users.append(Usuario(**doc.to_dict()))

            return users

        except Exception as e:
            logger.error(f"Error getting users by school: {e}")
            return []

    def get_users_by_rol(self, rol: str, colegio_id: Optional[str] = None) -> List[Usuario]:
        """Obtiene usuarios por rol, opcionalmente filtrados por colegio"""
        try:
            users_ref = self.db.collection(self.collection_name)
            query = users_ref.where("rol", "==", rol)

            docs = query.stream()
            users = []

            for doc in docs:
                user_data = doc.to_dict()
                usuario = Usuario(**user_data)

                # Filtrar por colegio si se especifica
                if colegio_id is None or colegio_id in usuario.colegios:
                    users.append(usuario)

            return users

        except Exception as e:
            logger.error(f"Error getting users by role: {e}")
            return []

    def asociar_colegio(self, user_id: str, colegio_id: str) -> bool:
        """Asocia un usuario a un colegio"""
        try:
            doc_ref = self.db.collection(self.collection_name).document(user_id)
            doc = doc_ref.get()

            if not doc.exists:
                logger.warning(f" Usuario {user_id} no existe")
                return False

            user_data = doc.to_dict()
            colegios = user_data.get("colegios", [])

            if colegio_id not in colegios:
                colegios.append(colegio_id)
                doc_ref.update({
                    "colegios": colegios,
                    "updated_at": datetime.utcnow()
                })
                logger.info(f"User {user_id} associated with school {colegio_id}")
            else:
                logger.info(f"User {user_id} already associated with school {colegio_id}")

            return True

        except Exception as e:
            logger.error(f"Error associating school: {e}")
            return False

    def desasociar_colegio(self, user_id: str, colegio_id: str) -> bool:
        """Desasocia un usuario de un colegio"""
        try:
            doc_ref = self.db.collection(self.collection_name).document(user_id)
            doc = doc_ref.get()

            if not doc.exists:
                logger.warning(f" Usuario {user_id} no existe")
                return False

            user_data = doc.to_dict()
            colegios = user_data.get("colegios", [])

            if colegio_id in colegios:
                colegios.remove(colegio_id)
                doc_ref.update({
                    "colegios": colegios,
                    "updated_at": datetime.utcnow()
                })
                logger.info(f"User {user_id} disassociated from school {colegio_id}")
            else:
                logger.info(f"User {user_id} was not associated with school {colegio_id}")

            return True

        except Exception as e:
            logger.error(f"Error disassociating school: {e}")
            return False

    def login(self, correo: str, password: str) -> Optional[Usuario]:
        """Verifica las credenciales de login y retorna el usuario"""
        try:
            # Buscar usuario por correo
            users_ref = self.db.collection(self.collection_name)
            query = users_ref.where("correo", "==", correo).limit(1)
            docs = query.stream()

            user_data = None
            for doc in docs:
                user_data = doc.to_dict()
                break

            if not user_data:
                logger.warning(f"User with email {correo} not found")
                return None

            # Verificar que el usuario esté activo
            if not user_data.get("activo", False):
                logger.warning(f"User {correo} is inactive")
                return None

            # Verificar contraseña
            password_hash = user_data.get("password_hash")
            if not password_hash:
                logger.error(f"User {correo} has no password configured")
                return None

            if not self._verify_password(password, password_hash):
                logger.warning(f"Incorrect password for {correo}")
                return None

            logger.info(f"Successful login for {correo}")

            # Retornar usuario sin el password_hash
            return_dict = {k: v for k, v in user_data.items() if k != 'password_hash'}
            return Usuario(**return_dict)

        except Exception as e:
            logger.exception("Error during login")
            return None

# Instancia singleton
user_service_simple = UserServiceSimple()
