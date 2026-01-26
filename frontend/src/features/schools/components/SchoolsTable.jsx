import React from 'react';

export default function SchoolsTable({
    colegios,
    onEdit,
    onDelete,
    onView,
    searchTerm,
    onCreate
}) {
    if (colegios.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">No se encontraron colegios</h3>
                <p className="text-gray-500 mt-1 max-w-sm text-center">
                    {searchTerm ? 'Intenta ajustar los términos de búsqueda' : 'Comienza creando el primer colegio en el sistema'}
                </p>
                {!searchTerm && onCreate && (
                    <button
                        onClick={onCreate}
                        className="mt-6 text-purple-600 font-medium hover:text-purple-700 hover:underline"
                    >
                        Registrar primer colegio
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm overflow-x-auto">
            <table className="w-full min-w-[600px]">
                <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Colegio</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dirección</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {colegios.map((c) => (
                        <tr
                            key={c.id}
                            onClick={() => onView(c)}
                            className="group hover:bg-gray-50/50 transition-colors duration-200 cursor-pointer"
                        >
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                    {c.logo_url ? (
                                        <img
                                            src={c.logo_url}
                                            alt={`Logo ${c.nombre}`}
                                            className="h-12 w-12 rounded-xl object-cover shadow-sm border border-gray-100"
                                        />
                                    ) : (
                                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-gray-100">
                                            <span className="text-lg font-bold text-gray-500">{c.nombre.charAt(0)}</span>
                                        </div>
                                    )}
                                    <span className="font-semibold text-gray-900">{c.nombre}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                {c.direccion ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg w-fit">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {c.direccion}
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-400 italic">No registrada</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 transition-all duration-200">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(c);
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(c);
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Eliminar"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Footer Info */}
            <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/50 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">
                    Mostrando {colegios.length} registros
                </span>
            </div>
        </div>
    );
}
