import React from 'react';

/**
 * Obtener estilo del badge de rol
 */
const getRoleBadgeStyle = (rol) => {
    switch (rol) {
        case 'admin':
            return 'bg-red-50 text-red-700';
        case 'encargado_convivencia':
            return 'bg-blue-50 text-blue-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

/**
 * Obtener nombre legible del rol
 */
const getRoleDisplayName = (rol) => {
    return rol === 'encargado_convivencia' ? 'Encargado' : rol;
};

/**
 * Tabla de personal del colegio
 */
export default function StaffTable({ staff }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
                <thead>
                    <tr className="border-b border-gray-100">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Usuario</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Rol</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {staff.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                                        {user.nombre?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">{user.nombre}</p>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{user.correo}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeStyle(user.rol)}`}>
                                    {getRoleDisplayName(user.rol)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                <p className="text-xs text-gray-500">
                    Mostrando <span className="font-medium text-gray-900">{staff.length}</span> usuarios
                </p>
            </div>
        </div>
    );
}
