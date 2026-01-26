import React from 'react';
import { FileText } from 'lucide-react';

function EmptyState() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center bg-gray-50 border border-gray-200 rounded-lg">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 mx-auto mb-3">
                <FileText size={28} />
            </div>
            <p className="text-gray-400 text-sm">No hay documentos adjuntos</p>
            <p className="text-gray-400 text-xs mt-1">Arrastra archivos aquí para subirlos</p>
        </div>
    );
}

export default EmptyState;
