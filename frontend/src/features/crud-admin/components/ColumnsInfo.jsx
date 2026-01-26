import React from 'react';
import { Download } from 'lucide-react';

/**
 * Panel informativo con las columnas requeridas del Excel y botón de plantilla
 */
export default function ColumnsInfo({ uploadType, onDownloadTemplate }) {
    return (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Columnas del Excel</p>
                <button
                    type="button"
                    onClick={onDownloadTemplate}
                    className="px-3 py-1.5 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                    <Download size={14} />
                    Plantilla
                </button>
            </div>

            {uploadType === 'alumnos' ? (
                <div className="space-y-3">
                    <div>
                        <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-1.5">Obligatorios</p>
                        <div className="flex flex-wrap gap-1.5">
                            <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">Nombres</span>
                            <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">Apellidos</span>
                            <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">RUT</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Opcionales</p>
                        <div className="flex flex-wrap gap-1.5">
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">Email</span>
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">Curso</span>
                            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">TEA</span>
                            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">PIE</span>
                            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">PAEC</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div>
                        <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-1.5">Obligatorios</p>
                        <div className="flex flex-wrap gap-1.5">
                            <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">Nombre</span>
                            <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">Apellido</span>
                            <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">Email</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Opcionales</p>
                        <div className="flex flex-wrap gap-1.5">
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">RUT</span>
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">Rol</span>
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">Asignatura</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
