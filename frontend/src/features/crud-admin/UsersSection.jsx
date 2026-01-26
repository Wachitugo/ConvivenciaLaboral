import { useState } from 'react';
import { ConfirmModal } from '../schools';
import EditUserModal from './EditUserModal';
import CreateUserModal from './CreateUserModal';

export default function UsersSection({
  usuarios,
  colegios,
  onRegistrarUsuario,
  onEliminarUsuario,
  onEditarUsuario,
  onCambiarColegio
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColegioFilter, setSelectedColegioFilter] = useState('');

  // Modales
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, usuario: null });
  const [editModal, setEditModal] = useState({ isOpen: false, usuario: null });
  const [createModal, setCreateModal] = useState(false);

  const handleDelete = (usuario) => {
    setConfirmModal({ isOpen: true, usuario });
  };

  const confirmDelete = async () => {
    if (confirmModal.usuario) {
      await onEliminarUsuario(confirmModal.usuario.id);
    }
  };

  const handleEdit = (usuario) => {
    setEditModal({ isOpen: true, usuario });
  };

  // Filtrar usuarios por búsqueda y colegio
  const filteredUsuarios = usuarios.filter(u => {
    // Filtro de búsqueda por texto
    const searchLower = searchTerm.toLowerCase();
    const colegioNombre = u.colegios_info && u.colegios_info.length > 0 && u.colegios_info[0].nombre
      ? u.colegios_info[0].nombre.toLowerCase()
      : '';

    const matchesSearch = !searchTerm ||
      (u.nombre?.toLowerCase() || '').includes(searchLower) ||
      (u.correo?.toLowerCase() || '').includes(searchLower) ||
      (u.rol?.toLowerCase() || '').includes(searchLower) ||
      colegioNombre.includes(searchLower);

    // Filtro por colegio seleccionado
    const matchesColegio = !selectedColegioFilter ||
      (selectedColegioFilter === 'sin-colegio'
        ? (!u.colegios_info || u.colegios_info.length === 0)
        : (u.colegios_info && u.colegios_info.length > 0 && u.colegios_info[0].id === selectedColegioFilter)
      );

    return matchesSearch && matchesColegio;
  });

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header & Controls */}
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          {/* Search Input - Full width mobile, Flexible desktop */}
          <div className="w-full sm:flex-1 max-w-md">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 border-none rounded-xl bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all duration-200 text-sm font-medium"
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Controls Group (Filter & Button) - Row on mobile (below search), inline on desktop */}
          <div className="flex gap-3 w-full sm:w-auto">
            {/* Filter Dropdown */}
            <div className="relative flex-1 sm:flex-none sm:w-[200px]">
              <select
                value={selectedColegioFilter}
                onChange={(e) => setSelectedColegioFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2.5 border-none rounded-xl bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all duration-200 text-sm font-medium appearance-none cursor-pointer"
              >
                <option value="">Todos los colegios</option>
                <option value="sin-colegio">Sin colegio asignado</option>
                {colegios.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <button
              onClick={() => setCreateModal(true)}
              className="flex-shrink-0 flex items-center justify-center px-4 py-2.5 bg-black hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 whitespace-nowrap"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nuevo Usuario
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] flex flex-col">
          {filteredUsuarios.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontraron usuarios</h3>
              <p className="text-gray-500 text-sm max-w-sm">
                {searchTerm || selectedColegioFilter
                  ? 'Intenta ajustar los filtros de búsqueda para encontrar lo que buscas.'
                  : 'Comienza registrando un nuevo usuario en el sistema.'}
              </p>
              {(!searchTerm && !selectedColegioFilter) && (
                <button
                  onClick={() => setCreateModal(true)}
                  className="mt-6 text-purple-600 font-medium hover:text-purple-700 text-sm hover:underline"
                >
                  Crear primer usuario
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Usuario</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Información</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Colegio</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredUsuarios.map((u) => (
                      <tr key={u.id} className="group hover:bg-gray-50/50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-purple-600 font-bold text-sm border-2 border-white shadow-sm">
                              {u.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-bold text-gray-900">{u.nombre}</div>
                              <div className="text-xs text-gray-500">{u.rol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 white-space-nowrap">
                          <div className="text-sm text-gray-600 font-medium">{u.correo}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {u.colegios_info && u.colegios_info.length > 0 && u.colegios_info[0].nombre ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                              {u.colegios_info[0].nombre}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                              Sin asignar
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2 transition-opacity duration-200">
                            <button
                              onClick={() => handleEdit(u)}
                              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors tooltip"
                              title="Editar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(u)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                <p className="text-xs text-gray-500">
                  Mostrando <span className="font-medium text-gray-900">{filteredUsuarios.length}</span> de <span className="font-medium text-gray-900">{usuarios.length}</span> registros
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modales */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, usuario: null })}
        onConfirm={confirmDelete}
        title="¿Eliminar usuario?"
        message={`¿Estás seguro de que deseas eliminar a "${confirmModal.usuario?.nombre}" (${confirmModal.usuario?.correo})?`}
        confirmText="Sí, eliminar"
        type="danger"
      />

      <EditUserModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, usuario: null })}
        user={editModal.usuario}
        colegios={colegios}
        onSave={onEditarUsuario}
        onCambiarColegio={onCambiarColegio}
      />

      <CreateUserModal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        colegios={colegios}
        onRegistrarUsuario={onRegistrarUsuario}
      />
    </>
  );
}
