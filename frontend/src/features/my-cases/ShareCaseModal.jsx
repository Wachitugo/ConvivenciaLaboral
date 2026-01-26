import { useState, useEffect } from 'react';
import { casesService } from '../../services/api';
import { createLogger } from '../../utils/logger';

const logger = createLogger('ShareCaseModal');

function ShareCaseModal({ isOpen, onClose, caseData, currentUserId, onShareSuccess }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPermission, setSelectedPermission] = useState('view');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [currentPermissions, setCurrentPermissions] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState(null);

  // Obtener userId desde prop o localStorage
  useEffect(() => {
    if (currentUserId) {
      setUserId(currentUserId);
    } else {
      // Fallback: obtener desde localStorage
      try {
        const usuarioData = JSON.parse(localStorage.getItem('usuario'));
        if (usuarioData && usuarioData.id) {
          setUserId(usuarioData.id);
        }
      } catch (error) {
        logger.error("[ShareModal] Error obteniendo usuario desde localStorage:", error);
      }
    }
  }, [currentUserId]);

  // Cargar usuarios disponibles y permisos actuales
  useEffect(() => {
    if (isOpen && caseData && userId) {
      loadData();
    }
  }, [isOpen, caseData?.id, userId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Cargar usuarios disponibles para compartir
      const users = await casesService.getAvailableUsers(caseData.id, userId);
      setAvailableUsers(users);

      // Cargar permisos actuales
      const permissions = await casesService.getCasePermissions(caseData.id, userId);
      setCurrentPermissions(permissions);
    } catch (error) {
      logger.error("[ShareModal] Error cargando datos:", error);
      setAvailableUsers([]);
      setCurrentPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleToggleUser = (user) => {
    const isSelected = selectedUsers.some(u => u.id === user.id);
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleShareWithSelected = async () => {
    if (selectedUsers.length === 0) {
      alert('Selecciona al menos un usuario para compartir');
      return;
    }

    setIsSaving(true);
    try {
      const userIds = selectedUsers.map(u => u.id);
      const result = await casesService.shareCase(
        caseData.id,
        userId,
        userIds,
        selectedPermission
      );

      // Recargar datos
      await loadData();

      // Limpiar selección
      setSelectedUsers([]);
      setSearchTerm('');

      // Notificar éxito
      if (onShareSuccess) {
        onShareSuccess(result);
      }
    } catch (error) {
      logger.error("Error compartiendo caso:", error);
      alert("Error al compartir el caso. Verifica que seas el propietario.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePermission = async (targetUserId) => {
    if (!confirm('¿Deseas revocar el acceso a este usuario?')) return;

    try {
      await casesService.revokePermission(caseData.id, userId, targetUserId);
      // Recargar datos
      await loadData();
    } catch (error) {
      logger.error("Error revocando permiso:", error);
      alert("Error al revocar el permiso");
    }
  };

  const handleUpdatePermission = async (permissionId, targetUserId, newPermissionType) => {
    try {
      // Primero revocar
      await casesService.revokePermission(caseData.id, userId, targetUserId);
      // Luego otorgar nuevo permiso
      await casesService.shareCase(caseData.id, userId, [targetUserId], newPermissionType);
      // Recargar datos
      await loadData();
    } catch (error) {
      logger.error("Error actualizando permiso:", error);
      alert("Error al actualizar el permiso");
    }
  };

  // Filtrar usuarios disponibles por búsqueda
  const filteredUsers = availableUsers.filter(user =>
    user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.correo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Compartir caso</h2>
            <p className="text-sm text-gray-600 mt-1">{caseData?.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-600">Cargando...</p>
            </div>
          ) : (
            <>
              {/* Sección para agregar usuarios */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar y agregar usuarios del colegio
                </label>

                {/* Barra de búsqueda */}
                <div className="flex gap-2 mb-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nombre o correo..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <select
                    value={selectedPermission}
                    onChange={(e) => setSelectedPermission(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="view">Solo ver</option>
                    <option value="edit">Ver y editar</option>
                  </select>
                </div>

                {/* Lista de usuarios disponibles */}
                {filteredUsers.length > 0 ? (
                  <div className="space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                    {filteredUsers.map((user) => {
                      const isSelected = selectedUsers.some(u => u.id === user.id);
                      return (
                        <div
                          key={user.id}
                          onClick={() => handleToggleUser(user)}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50 border border-blue-200'
                              : 'hover:bg-gray-50 border border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                            {user.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user.nombre}</p>
                            <p className="text-xs text-gray-500 truncate">{user.correo}</p>
                          </div>
                          <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                            {user.rol}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios disponibles para compartir'}
                  </div>
                )}

                {/* Botón para compartir con seleccionados */}
                {selectedUsers.length > 0 && (
                  <button
                    onClick={handleShareWithSelected}
                    disabled={isSaving}
                    className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {isSaving ? 'Compartiendo...' : `Compartir con ${selectedUsers.length} usuario(s)`}
                  </button>
                )}
              </div>

              {/* Separador */}
              <div className="border-t border-gray-200 my-4"></div>

              {/* Lista de personas con acceso actual */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Personas con acceso ({currentPermissions.length})
                </h3>

                {currentPermissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-sm">Aún no has compartido este caso</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentPermissions.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {(perm.user_name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{perm.user_name || 'Usuario'}</p>
                            <p className="text-xs text-gray-500">
                              {perm.permission_type === 'view' ? 'Solo ver' : 'Ver y editar'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={perm.permission_type}
                            onChange={(e) => handleUpdatePermission(perm.id, perm.user_id, e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs bg-white"
                          >
                            <option value="view">Solo ver</option>
                            <option value="edit">Ver y editar</option>
                          </select>

                          <button
                            onClick={() => handleRemovePermission(perm.user_id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Revocar acceso"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareCaseModal;
