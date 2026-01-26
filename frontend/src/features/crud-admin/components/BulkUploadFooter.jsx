import React from 'react';
import { Upload, User, Loader2 } from 'lucide-react';

/**
 * Footer del modal con botones de cancelar y acción principal
 */
export default function BulkUploadFooter({ mode, file, isProcessing, onCancel, onSubmit }) {
    const isDisabled = (mode === 'bulk' && !file) || isProcessing;
    const isActive = ((mode === 'bulk' && file) || mode === 'individual') && !isProcessing;

    return (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all"
            >
                Cancelar
            </button>
            <button
                onClick={onSubmit}
                disabled={isDisabled}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${isActive
                    ? 'bg-black hover:bg-gray-800 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
            >
                {isProcessing ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Procesando...</span>
                    </>
                ) : (
                    <>
                        {mode === 'bulk' ? <Upload size={16} /> : <User size={16} />}
                        <span>{mode === 'bulk' ? 'Cargar' : 'Registrar'}</span>
                    </>
                )}
            </button>
        </div>
    );
}
