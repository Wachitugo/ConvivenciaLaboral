import { useState } from 'react';

const ROLE_OPTIONS = [
  { value: 'afectado', label: 'Afectado/Víctima', color: 'red' },
  { value: 'agresor', label: 'Agresor', color: 'orange' },
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
    red: 'bg-red-50 text-red-700 border-red-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    gray: 'bg-gray-100 text-gray-600 border-gray-200'
  };
  return colorMap[color] || colorMap.gray;
};

function InvolvedTable({ involved, onRemoveParticipants, onUpdateParticipant }) {
  const [editingPerson, setEditingPerson] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', role: '' });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleEdit = (person) => {
    setEditingPerson(person.id);
    setEditForm({ name: person.name || '', role: person.role || '' });
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
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
      {involved.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No hay involucrados</h3>
          <p className="text-gray-500 text-sm max-w-sm">
            Agrega personas involucradas en este caso.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Involucrado</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Rol</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {involved.map((person) => {
                  const roleConfig = getRoleConfig(person.role);
                  const isEditing = editingPerson === person.id;
                  const isDeleting = confirmDelete === person.id;

                  return (
                    <tr key={person.id} className="group hover:bg-gray-50/50 transition-colors duration-150">
                      {/* Involucrado */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-sm border-2 border-white shadow-sm">
                              {(editForm.name || '?')[0]?.toUpperCase()}
                            </div>
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-sm"
                              placeholder="Nombre"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-sm border-2 border-white shadow-sm">
                              {(person.name || '?')[0]?.toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-bold text-gray-900">{person.name || 'Sin nombre'}</div>
                              {person.grade && (
                                <div className="text-xs text-gray-500">{person.grade}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Rol */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-sm bg-white"
                          >
                            <option value="">Seleccionar rol...</option>
                            {ROLE_OPTIONS.map(role => (
                              <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeClasses(roleConfig.color)}`}>
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
                              className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                              title="Guardar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Cancelar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : isDeleting ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-gray-500 mr-2">¿Eliminar?</span>
                            <button
                              onClick={() => handleDelete(person.id)}
                              className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                              title="Confirmar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setConfirmDelete(person.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/30">
            <p className="text-xs text-gray-500">
              <span className="font-medium text-gray-900">{involved.length}</span> persona{involved.length !== 1 ? 's' : ''} involucrada{involved.length !== 1 ? 's' : ''}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default InvolvedTable;
