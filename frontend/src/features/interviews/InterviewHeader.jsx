import React from 'react';

function InterviewHeader({ isSidebarOpen, toggleSidebar, textPrimary }) {
    return (
        <div className={`px-6 py-3 flex-shrink-0 space-y-3 border-b border-gray-100`}>
            <div className="grid grid-cols-3 items-center">
                {/* Toggle a la izquierda */}
                <div className="flex justify-start">
                    <button
                        onClick={toggleSidebar}
                        className="p-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
                        title={isSidebarOpen ? "Cerrar sidebar" : "Abrir sidebar"}
                    >
                        {isSidebarOpen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="9" y1="3" x2="9" y2="21"></line>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Título centrado */}
                <div className="flex justify-center">
                    <h1
                        className={`text-lg font-semibold ${textPrimary} truncate max-w-md`}
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                        Registro de Entrevistas                    </h1>
                </div>

                {/* Espacio vacío a la derecha */}
                <div></div>
            </div>
        </div>
    );
}

export default InterviewHeader;
