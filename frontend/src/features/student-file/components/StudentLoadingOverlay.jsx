import React from 'react';

function StudentLoadingOverlay({ message = 'Procesando...', submessage = 'Esto puede tomar unos segundos' }) {
    return (
        <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-12 h-12 border-4 border-blue-200 rounded-full"></div>
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">{message}</p>
                    <p className="text-xs text-gray-500 mt-1">{submessage}</p>
                </div>
            </div>
        </div>
    );
}

export default StudentLoadingOverlay;
