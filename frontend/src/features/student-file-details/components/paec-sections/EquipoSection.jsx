import React from 'react';
import { Users } from 'lucide-react';
import { EmptyState } from '../';
import SectionHeader from './SectionHeader';

const EquipoSection = ({ equipoProfesionales, onEdit }) => {
    const hasEquipo = equipoProfesionales && equipoProfesionales.length > 0;

    return (
        <div className="mb-4">
            <SectionHeader
                icon={Users}
                title="Equipo de Profesionales"
                onEdit={onEdit}
            />
            {hasEquipo ? (
                <>
                    {/* Vista Cards - Móvil */}
                    <div className="space-y-2 md:hidden">
                        {equipoProfesionales.map((prof, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <p className="text-sm font-medium text-gray-900">{prof.nombre}</p>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex-shrink-0">
                                        {prof.rol}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600">{prof.responsabilidad}</p>
                            </div>
                        ))}
                    </div>

                    {/* Vista Tabla - Desktop */}
                    <div className="hidden md:block overflow-hidden rounded-lg border border-gray-200">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase">Nombre</th>
                                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase">Rol</th>
                                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase">Responsabilidad</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {equipoProfesionales.map((prof, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-3 py-2 font-medium text-gray-900">{prof.nombre}</td>
                                        <td className="px-3 py-2">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                {prof.rol}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-gray-600">{prof.responsabilidad}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <EmptyState
                    message="No hay profesionales asignados al equipo"
                    icon={Users}
                    size="md"
                />
            )}
        </div>
    );
};

export default EquipoSection;
