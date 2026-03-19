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

  useEffect(() => {
    if (currentUserId) {
      setUserId(currentUserId);
    } else {
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

  useEffect(() => {
    if (isOpen && caseData && userId) {
      loadData();
    }
  }, [isOpen, caseData?.id, userId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const users = await casesService.getAvailableUsers(caseData.id, userId);
      setAvailableUsers(users);
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
      const result = await casesService.shareCase(caseData.id, userId, userIds, selectedPermission);
      await loadData();
      setSelectedUsers([]);
      setSearchTerm('');
      if (onShareSuccess) onShareSuccess(result);
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
      await loadData();
    } catch (error) {
      logger.error("Error revocando permiso:", error);
      alert("Error al revocar el permiso");
    }
  };

  const handleUpdatePermission = async (permissionId, targetUserId, newPermissionType) => {
    try {
      await casesService.revokePermission(caseData.id, userId, targetUserId);
      await casesService.shareCase(caseData.id, userId, [targetUserId], newPermissionType);
      await loadData();
    } catch (error) {
      logger.error("Error actualizando permiso:", error);
      alert("Error al actualizar el permiso");
    }
  };

  const filteredUsers = availableUsers.filter(user =>
    user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.correo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitial = (nombre) => (nombre || 'U').charAt(0).toUpperCase();

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#0A3866]/90 backdrop-blur-3xl border border-[#1A71B8]/30 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1A71B8]/30 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">Compartir caso</h2>
            <p className="text-sm text-white/50 mt-0.5 truncate max-w-xs">{caseData?.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-2 border-[#1A71B8] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-white/50">Cargando...</p>
            </div>
          ) : (
            <>
              {/* Agregar usuarios */}
              <div className="mb-5">
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
                  Buscar usuarios
                </p>

                <div className="flex gap-2 mb-3">
                  <div className="flex-1 relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Nombre o correo..."
                      className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#1A71B8]/50 focus:border-[#1A71B8]/50 transition-all"
                    />
                  </div>
                  <select
                    value={selectedPermission}
                    onChange={(e) => setSelectedPermission(e.target.value)}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1A71B8]/50 focus:border-[#1A71B8]/50 transition-all"
                  >
                    <option value="view" className="bg-[#0A3866]">Solo ver</option>
                    <option value="edit" className="bg-[#0A3866]">Ver y editar</option>
                  </select>
                </div>

                {filteredUsers.length > 0 ? (
                  <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar rounded-2xl border border-white/10 bg-white/5 p-2">
                    {filteredUsers.map((user) => {
                      const isSelected = selectedUsers.some(u => u.id === user.id);
                      return (
                        <div
                          key={user.id}
                          onClick={() => handleToggleUser(user)}
                          className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#1A71B8]/20 border border-[#1A71B8]/40'
                              : 'hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected ? 'bg-[#1A71B8] border-[#1A71B8]' : 'border-white/30'
                          }`}>
                            {isSelected && (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1A71B8] to-[#34B6D8] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {getInitial(user.nombre)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user.nombre}</p>
                            <p className="text-xs text-white/40 truncate">{user.correo}</p>
                          </div>
                          <span className="text-[10px] text-white/40 px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg">
                            {user.rol}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-white/40 text-sm bg-white/5 border border-white/10 rounded-2xl">
                    {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios disponibles para compartir'}
                  </div>
                )}

                {selectedUsers.length > 0 && (
                  <button
                    onClick={handleShareWithSelected}
                    disabled={isSaving}
                    className="mt-3 w-full px-4 py-2.5 bg-[#1A71B8] hover:bg-[#1A71B8]/80 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 border border-white/20 shadow-md"
                  >
                    {isSaving ? 'Compartiendo...' : `Compartir con ${selectedUsers.length} usuario(s)`}
                  </button>
                )}
              </div>

              {/* Separador */}
              <div className="border-t border-white/10 my-4" />

              {/* Personas con acceso */}
              <div>
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
                  Con acceso ({currentPermissions.length})
                </p>

                {currentPermissions.length === 0 ? (
                  <div className="text-center py-8 text-white/30 bg-white/5 border border-white/10 rounded-2xl">
                    <svg className="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-sm">Aún no has compartido este caso</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentPermissions.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl"
                      >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#34B6D8] to-[#1A71B8] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {getInitial(perm.user_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{perm.user_name || 'Usuario'}</p>
                          <p className="text-xs text-white/40">
                            {perm.permission_type === 'view' ? 'Solo ver' : 'Ver y editar'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={perm.permission_type}
                            onChange={(e) => handleUpdatePermission(perm.id, perm.user_id, e.target.value)}
                            className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#1A71B8]/50 transition-all"
                          >
                            <option value="view" className="bg-[#0A3866]">Solo ver</option>
                            <option value="edit" className="bg-[#0A3866]">Ver y editar</option>
                          </select>

                          <button
                            onClick={() => handleRemovePermission(perm.user_id)}
                            className="p-1.5 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
        <div className="px-6 py-4 border-t border-[#1A71B8]/30 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 rounded-xl text-sm font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareCaseModal;
