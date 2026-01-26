import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function StudentDetailHeader({ isSidebarOpen, toggleSidebar, textPrimary }) {
    const navigate = useNavigate();
    const { schoolSlug } = useParams();

    return (
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 flex-shrink-0 border-b border-gray-100">
            <div className="flex items-center justify-between gap-2">
                {/* Botones izquierda */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 sm:p-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
                        title={isSidebarOpen ? "Cerrar sidebar" : "Abrir sidebar"}
                    >
                        {isSidebarOpen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="9" y1="3" x2="9" y2="21"></line>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px] sm:w-5 sm:h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        )}
                    </button>
                    <button onClick={() => {
                        const basePath = schoolSlug ? `/${schoolSlug}` : '';
                        navigate(`${basePath}/ficha-alumnos`);
                    }} className="flex items-center gap-1.5 sm:gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-xs sm:text-sm font-medium">Volver</span>
                    </button>
                </div>

                {/* Título - solo visible en desktop */}
                <h1 className={`hidden sm:block text-lg font-semibold ${textPrimary} truncate`} style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Ficha del Alumno
                </h1>

                {/* Spacer para mantener el título centrado en desktop */}
                <div className="hidden sm:block w-[120px]"></div>
            </div>
        </div>
    );
}

export default StudentDetailHeader;
