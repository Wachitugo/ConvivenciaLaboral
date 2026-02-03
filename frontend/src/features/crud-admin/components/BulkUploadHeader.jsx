import React from 'react';
import { X } from 'lucide-react';

/**
 * Header del modal de carga masiva/individual
 */
export default function BulkUploadHeader({ uploadType, schoolName, onClose }) {
    return (
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
                <h3 className="text-xl font-bold text-gray-900">
                    Cargar {uploadType === 'trabajadores' ? 'Trabajadores' : 'Personal'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{schoolName}</p>
            </div>
            <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
                <X size={20} />
            </button>
        </div>
    );
}
