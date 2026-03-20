import { useState } from 'react';

const ROLE_OPTIONS = [
  { value: 'afectado', label: 'Denunciante', color: 'red' },
  { value: 'agresor', label: 'Denunciado', color: 'orange' },
  { value: 'testigo', label: 'Testigo', color: 'blue' },
  { value: 'otro', label: 'Otro', color: 'gray' }
];

const getRoleConfig = (role) => {
  const config = ROLE_OPTIONS.find(r => r.value === role);
  if (!config) return { label: role || 'Sin rol', color: 'gray' };
  return config;
};

const getRoleBadgeClasses = (color) => {
  const colorMap = {
    red: 'bg-red-900/40 text-red-300 border-red-800/50',
    orange: 'bg-orange-900/40 text-orange-300 border-orange-800/50',
    blue: 'bg-blue-900/40 text-blue-300 border-blue-800/50',
    purple: 'bg-purple-900/40 text-purple-300 border-purple-800/50',
    gray: 'bg-white/10 text-white/70 border-white/20'
  };
  return colorMap[color] || colorMap.gray;
};

function InvolvedTable({ involved, onRemoveParticipants, onUpdateParticipant }) {
  const [editingPerson, setEditingPerson] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', role: '', cargo: '', antiguedad: '' });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleEdit = (person) => {
    setEditingPerson(person.id);
    setEditForm({ name: person.name || '', role: person.role || '', cargo: person.cargo || '', antiguedad: person.antiguedad || '' });
  };

  const handleSaveEdit = (personId) => {
    onUpdateParticipant?.(personId, editForm);
    setEditingPerson(null);
    setEditForm({ name: '', role: '' });
  };

  const handleCancelEdit = () => {
    setEditingPerson(null);
    setEditForm({ name: '', role: '' });
  };

  const handleDelete = (personId) => {
    onRemoveParticipants([personId]);
    setConfirmDelete(null);
  };

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
      {involved.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-md">
            <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-white/60 mb-1">No hay involucrados</h3>
          <p className="text-white/40 uppercase tracking-widest text-[10px] max-w-sm">
            Agrega personas involucradas en este caso.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-white/50 uppercase tracking-wider bg-black/20">Involucrado</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-white/50 uppercase tracking-wider bg-black/20">Cargo</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-white/50 uppercase tracking-wider bg-black/20">Antigüedad</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-white/50 uppercase tracking-wider bg-black/20">Rol</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-white/50 uppercase tracking-wider bg-black/20">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {involved.map((person) => {
                  const roleConfig = getRoleConfig(person.role);
                  const isEditing = editingPerson === person.id;
                  const isDeleting = confirmDelete === person.id;

                  return (
                    <tr key={person.id} className="group hover:bg-white/5 transition-all duration-150">
                      {/* Involucrado */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-[#1A71B8] to-[#34B6D8] text-white border-2 border-[#0A3866] flex items-center justify-center font-bold text-sm shadow-sm">
                              {(editForm.name || '?')[0]?.toUpperCase()}
                            </div>
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                              className="flex-1 px-3 py-1.5 border border-[#34B6D8]/50 bg-black/30 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#34B6D8] text-sm"
                              placeholder="Nombre"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-[#1A71B8] to-[#34B6D8] text-white border-2 border-[#0A3866] flex items-center justify-center font-bold text-sm shadow-sm">
                              {(person.name || '?')[0]?.toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-bold text-white">{person.name || 'Sin nombre'}</div>
                              {person.grade && (
                                <div className="text-[10px] uppercase font-bold tracking-wider text-white/50">{person.grade}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Cargo */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.cargo}
                            onChange={(e) => setEditForm(prev => ({ ...prev, cargo: e.target.value }))}
                            className="w-full px-3 py-1.5 border border-[#34B6D8]/50 bg-black/30 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#34B6D8] text-sm"
                            placeholder="Ej: Supervisor"
                          />
                        ) : (
                          <span className="text-sm text-white/70">
                            {person.cargo || <span className="text-white/25 italic text-xs">—</span>}
                          </span>
                        )}
                      </td>

                      {/* Antigüedad */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.antiguedad}
                            onChange={(e) => setEditForm(prev => ({ ...prev, antiguedad: e.target.value }))}
                            className="w-full px-3 py-1.5 border border-[#34B6D8]/50 bg-black/30 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#34B6D8] text-sm"
                            placeholder="Ej: 3 años"
                          />
                        ) : (
                          <span className="text-sm text-white/70">
                            {person.antiguedad || <span className="text-white/25 italic text-xs">—</span>}
                          </span>
                        )}
                      </td>

                      {/* Rol */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                            className="px-3 py-1.5 border border-[#34B6D8]/50 bg-[#0A3866] text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#34B6D8] text-sm"
                          >
                            <option value="">Seleccionar rol...</option>
                            {ROLE_OPTIONS.map(role => (
                              <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getRoleBadgeClasses(roleConfig.color)}`}>
                            {roleConfig.label}
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSaveEdit(person.id)}
                              className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 rounded-lg transition-colors"
                              title="Guardar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                              title="Cancelar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : isDeleting ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-white/50 mr-2 uppercase tracking-widest font-bold">¿Eliminar?</span>
                            <button
                              onClick={() => handleDelete(person.id)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 border border-red-500/30 rounded-lg transition-colors"
                              title="Confirmar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="p-2 text-white/50 hover:text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                              title="Cancelar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(person)}
                              className="p-2 text-white/30 hover:text-amber-300 hover:bg-amber-400/10 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setConfirmDelete(person.id)}
                              className="p-2 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer con contador */}
          <div className="px-6 py-3 border-t border-white/10 bg-black/20">
            <p className="text-[10px] uppercase text-white/40 tracking-widest">
              <span className="font-bold text-[#34B6D8]">{involved.length}</span> persona{involved.length !== 1 ? 's' : ''} involucrada{involved.length !== 1 ? 's' : ''}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default InvolvedTable;
