import React from 'react';
import { Users, UserPlus, Upload } from 'lucide-react';

/**
 * Estado vacío para alumnos o personal
 */
export default function EmptyState({ type, onUploadClick }) {
    const isStudents = type === 'alumnos';

    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                {isStudents ? (
                    <Users size={28} className="text-gray-400" />
                ) : (
                    <UserPlus size={28} className="text-gray-400" />
                )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
                Sin {isStudents ? 'alumnos' : 'personal'} registrado
            </h3>
            <p className="text-gray-500 text-sm max-w-sm mb-6">
                {isStudents
                    ? 'Carga un archivo Excel para agregar alumnos a este colegio.'
                    : 'Carga un archivo Excel para agregar profesores y personal.'}
            </p>
            <button
                onClick={onUploadClick}
                className="flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
            >
                <Upload size={18} />
                Cargar {isStudents ? 'Alumnos' : 'Personal'}
            </button>
        </div>
    );
}
