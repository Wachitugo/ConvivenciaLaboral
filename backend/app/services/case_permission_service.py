import uuid
import logging
from datetime import datetime
from typing import List, Optional
from google.cloud import firestore
from app.core.config import get_settings
from app.schemas.case import CasePermission, CasePermissionCreate, PermissionType


logger = logging.getLogger(__name__)
settings = get_settings()

class CasePermissionService:
    """Servicio para manejar permisos de casos compartidos"""

    def __init__(self):
        self.db = firestore.Client(project=settings.PROJECT_ID, database=settings.FIRESTORE_DATABASE)
        self.collection_name = "case_permissions"

    def grant_permission(
        self,
        case_id: str,
        owner_id: str,
        user_id: str,
        permission_type: PermissionType,
        user_name: Optional[str] = None
    ) -> CasePermission:
        """
        Otorga permiso a un usuario para acceder a un caso.
        Solo el owner puede otorgar permisos.

        Args:
            case_id: ID del caso
            owner_id: ID del propietario del caso (quien otorga el permiso)
            user_id: ID del usuario que recibirá el permiso
            permission_type: Tipo de permiso (VIEW o EDIT)
            user_name: Nombre del usuario (opcional, para UI)

        Returns:
            CasePermission creado

        Raises:
            ValueError: Si se intenta compartir consigo mismo o si ya existe el permiso
        """
        # Validar que no se comparta consigo mismo
        if user_id == owner_id:
            raise ValueError("No puedes compartir un caso contigo mismo")

        # Verificar si ya existe un permiso para este usuario en este caso
        existing = self.get_user_permission(case_id, user_id)
        if existing:
            # Actualizar el permiso existente
            return self.update_permission(case_id, user_id, permission_type)

        # Crear nuevo permiso
        permission_id = str(uuid.uuid4())
        now = datetime.utcnow()

        permission_dict = {
            "id": permission_id,
            "case_id": case_id,
            "user_id": user_id,
            "permission_type": permission_type.value,
            "granted_by": owner_id,
            "user_name": user_name,
            "created_at": now
        }

        doc_ref = self.db.collection(self.collection_name).document(permission_id)
        doc_ref.set(permission_dict)

        logger.info(f" Permiso {permission_type.value} otorgado a usuario {user_id} para caso {case_id}")

        return CasePermission(**permission_dict)

    def update_permission(
        self,
        case_id: str,
        user_id: str,
        permission_type: PermissionType
    ) -> CasePermission:
        """
        Actualiza el tipo de permiso de un usuario existente

        Args:
            case_id: ID del caso
            user_id: ID del usuario
            permission_type: Nuevo tipo de permiso

        Returns:
            CasePermission actualizado
        """
        # Buscar el permiso existente
        query = (self.db.collection(self.collection_name)
                .where("case_id", "==", case_id)
                .where("user_id", "==", user_id)
                .limit(1))

        docs = list(query.stream())
        if not docs:
            raise ValueError("Permiso no encontrado")

        doc = docs[0]
        doc_ref = self.db.collection(self.collection_name).document(doc.id)
        doc_ref.update({"permission_type": permission_type.value})

        logger.info(f" Permiso actualizado a {permission_type.value} para usuario {user_id} en caso {case_id}")

        # Obtener y retornar el permiso actualizado
        updated_doc = doc_ref.get()
        return CasePermission(**updated_doc.to_dict())

    def revoke_permission(self, case_id: str, owner_id: str, user_id: str) -> bool:
        """
        Revoca el permiso de un usuario para acceder a un caso.
        Solo el owner puede revocar permisos.

        Args:
            case_id: ID del caso
            owner_id: ID del propietario del caso
            user_id: ID del usuario a quien se revocará el permiso

        Returns:
            True si se revocó exitosamente, False si no se encontró el permiso
        """
        # Buscar el permiso
        query = (self.db.collection(self.collection_name)
                .where("case_id", "==", case_id)
                .where("user_id", "==", user_id)
                .limit(1))

        docs = list(query.stream())
        if not docs:
            logger.warning(f" No se encontró permiso para usuario {user_id} en caso {case_id}")
            return False

        # Verificar que quien revoca sea el owner
        doc = docs[0]
        permission_data = doc.to_dict()
        if permission_data.get("granted_by") != owner_id:
            raise ValueError("Solo el propietario del caso puede revocar permisos")

        # Eliminar el permiso
        doc.reference.delete()
        logger.info(f" Permiso revocado para usuario {user_id} en caso {case_id}")

        return True

    def get_case_permissions(self, case_id: str) -> List[CasePermission]:
        """
        Obtiene todos los permisos otorgados para un caso

        Args:
            case_id: ID del caso

        Returns:
            Lista de permisos del caso
        """
        query = self.db.collection(self.collection_name).where("case_id", "==", case_id)
        docs = query.stream()

        permissions = []
        for doc in docs:
            permissions.append(CasePermission(**doc.to_dict()))

        return permissions

    def get_user_permission(self, case_id: str, user_id: str) -> Optional[CasePermission]:
        """
        Obtiene el permiso específico de un usuario para un caso

        Args:
            case_id: ID del caso
            user_id: ID del usuario

        Returns:
            CasePermission si existe, None si no
        """
        query = (self.db.collection(self.collection_name)
                .where("case_id", "==", case_id)
                .where("user_id", "==", user_id)
                .limit(1))

        docs = list(query.stream())
        if not docs:
            return None

        return CasePermission(**docs[0].to_dict())

    def get_shared_users(self, case_id: str) -> List[str]:
        """
        Obtiene lista de IDs de usuarios con acceso al caso

        Args:
            case_id: ID del caso

        Returns:
            Lista de user_ids con permisos
        """
        permissions = self.get_case_permissions(case_id)
        return [p.user_id for p in permissions]

    def check_user_permission(self, case_id: str, user_id: str, owner_id: str) -> Optional[PermissionType]:
        """
        Verifica el nivel de permiso de un usuario en un caso

        Args:
            case_id: ID del caso
            user_id: ID del usuario a verificar
            owner_id: ID del propietario del caso

        Returns:
            PermissionType si el usuario tiene acceso, None si no
            Si el usuario es el owner, retorna EDIT (máximo permiso)
        """
        # El owner siempre tiene permiso de edición
        if user_id == owner_id:
            return PermissionType.EDIT

        # Buscar permiso compartido
        permission = self.get_user_permission(case_id, user_id)
        if permission:
            return permission.permission_type

        return None

    def get_cases_shared_with_user(self, user_id: str) -> List[str]:
        """
        Obtiene todos los IDs de casos que han sido compartidos con un usuario

        Args:
            user_id: ID del usuario

        Returns:
            Lista de case_ids compartidos con el usuario
        """
        query = self.db.collection(self.collection_name).where("user_id", "==", user_id)
        docs = query.stream()

        case_ids = []
        for doc in docs:
            case_ids.append(doc.to_dict()["case_id"])

        return case_ids

    def revoke_all_permissions(self, case_id: str) -> int:
        """
        Revoca todos los permisos de un caso (útil al eliminar un caso)

        Args:
            case_id: ID del caso

        Returns:
            Número de permisos eliminados
        """
        query = self.db.collection(self.collection_name).where("case_id", "==", case_id)
        docs = list(query.stream())

        count = 0
        for doc in docs:
            doc.reference.delete()
            count += 1

        logger.info(f" {count} permisos eliminados para caso {case_id}")
        return count

# Instancia singleton
case_permission_service = CasePermissionService()
