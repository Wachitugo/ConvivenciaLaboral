import React from 'react';
import { ClipboardList, Edit } from 'lucide-react';
import { EmptyState } from '../';

const DiagnosticoSection = ({ diagnostico, onEdit }) => {
    const isEmpty = !diagnostico || diagnostico.trim() === '' || diagnostico === 'Sin diagnóstico registrado';

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-1 gap-2">
                <p className="text-xs font-medium text-gray-500 uppercase">Diagnóstico Clínico</p>
                {onEdit && (
                    <button
                        onClick={onEdit}
                        className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-1 text-xs sm:text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                    >
                        <Edit size={14} />
                        <span className="hidden sm:inline">Editar</span>
                    </button>
                )}
            </div>
            {isEmpty ? (
                <EmptyState
                    message="No hay diagnóstico clínico registrado"
                    icon={ClipboardList}
                    size="sm"
                />
            ) : (
                <p className="font-semibold text-gray-900 bg-gray-50 p-2.5 sm:p-3 rounded-lg text-sm sm:text-base">{diagnostico}</p>
            )}
        </div>
    );
};

export default DiagnosticoSection;
