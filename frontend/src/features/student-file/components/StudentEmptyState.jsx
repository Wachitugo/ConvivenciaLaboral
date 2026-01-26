import React from 'react';

function StudentEmptyState({ type = 'empty', onClearFilters }) {
    if (type === 'no-results') {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto px-4 py-8">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 sm:h-10 sm:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <h3 className="text-base sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">No se encontraron resultados</h3>
                <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4">No hay alumnos que coincidan con los filtros.</p>
                <button onClick={onClearFilters} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors">
                    Limpiar filtros
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto px-4 py-8">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 sm:h-10 sm:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            </div>
            <h3 className="text-base sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">No hay alumnos registrados</h3>
            <p className="text-sm sm:text-base text-gray-500 max-w-sm">Sube una base de datos de alumnos para gestionar sus fichas.</p>
        </div>
    );
}

export default StudentEmptyState;
