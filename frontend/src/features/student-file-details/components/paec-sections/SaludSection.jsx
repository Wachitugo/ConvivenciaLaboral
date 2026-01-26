import React from 'react';
import { Stethoscope, UserX, Pill, Users } from 'lucide-react';
import SectionHeader from './SectionHeader';

const SaludSection = ({ antecedentesSalud, onEdit }) => {
    const medico = antecedentesSalud?.medicoTratante || {};
    const hasMedico = medico.nombre && medico.nombre.trim() !== '';
    const hasIndicaciones = antecedentesSalud?.indicacionesMedicas && antecedentesSalud.indicacionesMedicas.trim() !== '';
    const hasEspecialistas = antecedentesSalud?.otrosEspecialistas && antecedentesSalud.otrosEspecialistas.trim() !== '';

    return (
        <div className="mb-4">
            <SectionHeader
                icon={Stethoscope}
                title="Antecedentes de Salud"
                onEdit={onEdit}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-gray-50 p-2.5 sm:p-3 rounded-lg min-h-[70px] sm:min-h-[80px]">
                    <p className="text-xs font-medium text-gray-500 uppercase">Médico Tratante</p>
                    {hasMedico ? (
                        <>
                            <p className="font-medium text-gray-900 text-sm mt-1">{medico.nombre}</p>
                            <p className="text-xs text-gray-500">{medico.frecuencia || 'Sin frecuencia especificada'}</p>
                        </>
                    ) : (
                        <div className="flex items-center gap-1.5 mt-2 text-gray-400">
                            <UserX size={14} />
                            <span className="text-xs">Sin médico asignado</span>
                        </div>
                    )}
                </div>
                <div className="bg-gray-50 p-2.5 sm:p-3 rounded-lg min-h-[70px] sm:min-h-[80px]">
                    <p className="text-xs font-medium text-gray-500 uppercase">Indicaciones Médicas</p>
                    {hasIndicaciones ? (
                        <p className="text-sm text-gray-700 mt-1">{antecedentesSalud.indicacionesMedicas}</p>
                    ) : (
                        <div className="flex items-center gap-1.5 mt-2 text-gray-400">
                            <Pill size={14} />
                            <span className="text-xs">Sin indicaciones</span>
                        </div>
                    )}
                </div>
                <div className="bg-gray-50 p-2.5 sm:p-3 rounded-lg min-h-[70px] sm:min-h-[80px] sm:col-span-2 lg:col-span-1">
                    <p className="text-xs font-medium text-gray-500 uppercase">Otros Especialistas</p>
                    {hasEspecialistas ? (
                        <p className="text-sm text-gray-700 mt-1">{antecedentesSalud.otrosEspecialistas}</p>
                    ) : (
                        <div className="flex items-center gap-1.5 mt-2 text-gray-400">
                            <Users size={14} />
                            <span className="text-xs">Sin especialistas</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SaludSection;
