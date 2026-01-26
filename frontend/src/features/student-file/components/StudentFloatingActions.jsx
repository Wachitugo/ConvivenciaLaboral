import React from 'react';

function StudentFloatingActions({ selectedCount, isDeleting, onDelete, onClearSelection }) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
            <div className="flex items-center gap-4 px-5 py-3 bg-white rounded-xl shadow-lg border border-gray-200 backdrop-blur-sm">
                <span className="text-sm font-medium text-gray-700">
                    {selectedCount} seleccionado{selectedCount > 1 ? 's' : ''}
                </span>
                <div className="w-px h-5 bg-gray-200" />
                <button
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                </button>
                <button onClick={onClearSelection} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Cancelar selección">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default StudentFloatingActions;
