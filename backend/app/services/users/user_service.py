from typing import List, Optional
import logging
from datetime import datetime
from google.cloud import firestore
from firebase_admin import auth
from app.core.config import get_settings
from app.schemas.user import (
    Usuario, UsuarioUpdate, UsuarioWithColegios,
    Colegio, RoleName
)

logger = logging.getLogger(__name__)
settings = get_settings()

class UserService:
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

    def get_all_users(self, include_inactive: bool = False) -> List[Usuario]:
        """Obtiene todos los usuarios"""
        try:
            query = self.db.collection(self.collection_name)

            if not include_inactive:
                query = query.where("activo", "==", True)

            docs = query.order_by("created_at", direction=firestore.Query.DESCENDING).stream()

            users = []
            for doc in docs:
                users.append(Usuario(**doc.to_dict()))

            return users

        except Exception as e:
            logger.error(f" Error obteniendo usuarios: {e}")
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
            logger.error(f" Error obteniendo usuario {user_id}: {e}")
            return None

    def get_user_with_colegios(self, user_id: str) -> Optional[UsuarioWithColegios]:
        """Obtiene un usuario con información completa de sus colegios"""
        try:
            user = self.get_user_by_id(user_id)
            if not user:
                return None

            # Obtener información de colegios
            colegios_info = []
            for colegio_id in user.colegios:
                colegio_doc = self.db.collection("colegios").document(colegio_id).get()
                if colegio_doc.exists:
                    colegios_info.append(Colegio(**colegio_doc.to_dict()))

            return UsuarioWithColegios(
                **user.model_dump(),
                colegios_info=colegios_info
            )

        except Exception as e:
            logger.error(f" Error obteniendo usuario con colegios: {e}")
            return None

    def update_user(self, user_id: str, update_data: UsuarioUpdate) -> Optional[Usuario]:
        """Actualiza un usuario"""
        try:
            doc_ref = self.db.collection(self.collection_name).document(user_id)
            doc = doc_ref.get()

            if not doc.exists:
                return None

            # Construir dict de actualización solo con campos no None
            update_dict = {}
            if update_data.nombre is not None:
                update_dict["nombre"] = update_data.nombre
            if update_data.rol is not None:
                update_dict["rol"] = update_data.rol.value
            if update_data.activo is not None:
                update_dict["activo"] = update_data.activo
                # También actualizar en Firebase Authentication
                auth.update_user(user_id, disabled=not update_data.activo)
            if update_data.colegios is not None:
                update_dict["colegios"] = update_data.colegios
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

            # Obtener y retornar usuario actualizado
            updated_doc = doc_ref.get()
            return Usuario(**updated_doc.to_dict())

        except Exception as e:
            logger.error(f" Error actualizando usuario: {e}")
            return None

    def add_colegio_to_user(self, user_id: str, colegio_id: str) -> bool:
        """Asocia un colegio a un usuario"""
        try:
            doc_ref = self.db.collection(self.collection_name).document(user_id)
            doc = doc_ref.get()

            if not doc.exists:
                logger.warning(f" Usuario {user_id} no existe")
                return False

            user_data = doc.to_dict()
            current_colegios = user_data.get("colegios", [])

            # Verificar que el colegio existe
            colegio_doc = self.db.collection("colegios").document(colegio_id).get()
            if not colegio_doc.exists:
                logger.warning(f" Colegio {colegio_id} no existe")
                return False

            # Evitar duplicados
            if colegio_id in current_colegios:
                logger.info(f" Usuario ya pertenece al colegio {colegio_id}")
                return True

            # Agregar colegio
            current_colegios.append(colegio_id)
            doc_ref.update({
                "colegios": current_colegios,
                "updated_at": datetime.utcnow()
            })

            logger.info(f" Colegio {colegio_id} agregado al usuario {user_id}")
            return True

        except Exception as e:
            logger.error(f" Error agregando colegio a usuario: {e}")
            return False

    def remove_colegio_from_user(self, user_id: str, colegio_id: str) -> bool:
        """Desasocia un colegio de un usuario"""
        try:
            doc_ref = self.db.collection(self.collection_name).document(user_id)
            doc = doc_ref.get()

            if not doc.exists:
                logger.warning(f" Usuario {user_id} no existe")
                return False

            user_data = doc.to_dict()
            current_colegios = user_data.get("colegios", [])

            # Remover colegio si existe
            if colegio_id in current_colegios:
                current_colegios.remove(colegio_id)
                doc_ref.update({
                    "colegios": current_colegios,
                    "updated_at": datetime.utcnow()
                })
                logger.info(f" Colegio {colegio_id} removido del usuario {user_id}")
            else:
                logger.info(f" Usuario no pertenece al colegio {colegio_id}")

            return True

        except Exception as e:
            logger.error(f" Error removiendo colegio de usuario: {e}")
            return False

    def get_users_by_colegio(self, colegio_id: str) -> List[Usuario]:
        """Obtiene todos los usuarios de un colegio específico"""
        try:
            query = self.db.collection(self.collection_name).where(
                "colegios", "array_contains", colegio_id
            )
            docs = query.stream()

            users = []
            for doc in docs:
                users.append(Usuario(**doc.to_dict()))

            return users

        except Exception as e:
            logger.error(f" Error obteniendo usuarios del colegio: {e}")
            return []

    def get_users_by_rol(self, rol: RoleName, colegio_id: Optional[str] = None) -> List[Usuario]:
        """Obtiene usuarios por rol, opcionalmente filtrados por colegio"""
        try:
            query = self.db.collection(self.collection_name).where("rol", "==", rol.value)

            if colegio_id:
                query = query.where("colegios", "array_contains", colegio_id)

            docs = query.stream()

            users = []
            for doc in docs:
                users.append(Usuario(**doc.to_dict()))

            return users

        except Exception as e:
            logger.error(f" Error obteniendo usuarios por rol: {e}")
            return []

    def delete_user(self, user_id: str) -> bool:
        """Elimina un usuario de Firestore y Firebase Authentication"""
        try:
            # Eliminar de Firestore
            doc_ref = self.db.collection(self.collection_name).document(user_id)
            doc_ref.delete()

            # Eliminar de Firebase Authentication
            auth.delete_user(user_id)

            logger.info(f" Usuario {user_id} eliminado")
            return True

        except Exception as e:
            logger.error(f" Error eliminando usuario: {e}")
            return False

    def update_token_usage(self, user_id: str, input_tokens: int, output_tokens: int, model_name: str = "unknown"):
        """
        Actualiza el contador de tokens usados por un usuario y sus colegios.
        Incrementa los valores atómicamente.
        """
        if not user_id:
            logger.warning("⚠️ No user_id provided for token tracking")
            return

        try:
            doc_ref = self.db.collection(self.collection_name).document(user_id)
            
            # 1. Obtener usuario para saber sus colegios
            doc_snapshot = doc_ref.get()
            if not doc_snapshot.exists:
                logger.warning(f"⚠️ User {user_id} not found for token tracking")
                return
            
            user_data = doc_snapshot.to_dict()
            colegios = user_data.get("colegios", [])

            # 2. Usar incremento de Firestore para atomicidad en usuario
            updates = {
                "token_usage.input_tokens": firestore.Increment(input_tokens),
                "token_usage.output_tokens": firestore.Increment(output_tokens),
                "token_usage.total_tokens": firestore.Increment(input_tokens + output_tokens),
                "token_usage.last_updated": datetime.utcnow()
            }
            
            # DEBUG LOG
            logger.info(f"💰 [TOKEN_TRACKING] Updating for {user_id}: +{input_tokens} in, +{output_tokens} out. Model: {model_name}")
            
            doc_ref.update(updates)
            
            # 3. Loguear evento
            usage_log = {
                "timestamp": datetime.utcnow(),
                "model": model_name,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": input_tokens + output_tokens,
                "user_id": user_id,
                "user_email": user_data.get("correo"),
                "user_name": user_data.get("nombre"),
                "school_ids": colegios
            }
            doc_ref.collection("usage_logs").add(usage_log)

            # 4. Actualizar colegios (incrementar atomicamente)
            for colegio_id in colegios:
                try:
                    colegio_ref = self.db.collection("colegios").document(colegio_id)
                    colegio_updates = {
                        "token_usage.input_tokens": firestore.Increment(input_tokens),
                        "token_usage.output_tokens": firestore.Increment(output_tokens),
                        "token_usage.total_tokens": firestore.Increment(input_tokens + output_tokens),
                        "token_usage.last_updated": datetime.utcnow()
                    }
                    colegio_ref.update(colegio_updates)
                    # Opcional: Log por colegio
                    colegio_ref.collection("school_usage_logs").add({**usage_log, "user_id": user_id})
                except Exception as e_col:
                    logger.error(f"❌ Error updating simple token usage for school {colegio_id}: {e_col}")
            
            logger.info(f"💰 [TOKENS] Updated usage for user {user_id} and {len(colegios)} schools: +{input_tokens+output_tokens} tokens")
            
        except Exception as e:
            logger.error(f"❌ Error updating token usage for user {user_id}: {e}")

# Instancia singleton
user_service = UserService()
