import React from 'react';

/**
 * Shimmer - Efecto de brillo animado para skeletons
 */
const Shimmer = () => (
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
);

/**
 * PaecTabSkeleton - Skeleton responsivo para el tab PAEC
 */
function PaecTabSkeleton() {
    return (
        <div className="flex flex-col h-full bg-white overflow-hidden rounded-xl shadow-sm">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-200 rounded relative overflow-hidden">
                        <Shimmer />
                    </div>
                    <div className="h-4 sm:h-5 w-32 sm:w-64 bg-gray-200 rounded relative overflow-hidden">
                        <Shimmer />
                    </div>
                </div>
                <div className="h-3 sm:h-3.5 w-48 sm:w-80 bg-gray-100 rounded mt-1 relative overflow-hidden">
                    <Shimmer />
                </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-auto p-3 sm:p-4">
                {/* Diagnóstico */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2 gap-2">
                        <div className="h-3 w-28 sm:w-32 bg-gray-200 rounded relative overflow-hidden">
                            <Shimmer />
                        </div>
                        <div className="h-6 w-8 sm:w-16 bg-gray-100 rounded-lg relative overflow-hidden">
                            <Shimmer />
                        </div>
                    </div>
                    <div className="h-10 sm:h-12 w-full bg-gray-100 rounded-lg relative overflow-hidden">
                        <Shimmer />
                    </div>
                </div>

                <hr className="border-gray-200 my-3 sm:my-4 -mx-3 sm:-mx-4" />

                {/* Antecedentes de Salud */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gray-200 rounded relative overflow-hidden">
                                <Shimmer />
                            </div>
                            <div className="h-3.5 sm:h-4 w-32 sm:w-40 bg-gray-200 rounded relative overflow-hidden">
                                <Shimmer />
                            </div>
                        </div>
                        <div className="h-6 w-8 sm:w-16 bg-gray-100 rounded-lg relative overflow-hidden">
                            <Shimmer />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className={`bg-gray-50 p-2.5 sm:p-3 rounded-lg min-h-[70px] sm:min-h-[80px] ${i === 3 ? 'sm:col-span-2 lg:col-span-1' : ''}`}>
                                <div className="h-3 w-20 sm:w-24 bg-gray-200 rounded mb-2 relative overflow-hidden">
                                    <Shimmer />
                                </div>
                                <div className="h-3.5 sm:h-4 w-28 sm:w-32 bg-gray-200 rounded mb-1 relative overflow-hidden">
                                    <Shimmer />
                                </div>
                                <div className="h-3 w-16 sm:w-20 bg-gray-100 rounded relative overflow-hidden">
                                    <Shimmer />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <hr className="border-gray-200 my-3 sm:my-4" />

                {/* Equipo de Profesionales - Cards en móvil, Tabla en desktop */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gray-200 rounded relative overflow-hidden">
                                <Shimmer />
                            </div>
                            <div className="h-3.5 sm:h-4 w-36 sm:w-44 bg-gray-200 rounded relative overflow-hidden">
                                <Shimmer />
                            </div>
                        </div>
                        <div className="h-6 w-8 sm:w-16 bg-gray-100 rounded-lg relative overflow-hidden">
                            <Shimmer />
                        </div>
                    </div>

                    {/* Cards - Móvil */}
                    <div className="space-y-2 md:hidden">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <div className="h-4 w-24 bg-gray-200 rounded relative overflow-hidden"><Shimmer /></div>
                                    <div className="h-5 w-16 bg-blue-100 rounded-full relative overflow-hidden"><Shimmer /></div>
                                </div>
                                <div className="h-3 w-40 bg-gray-100 rounded relative overflow-hidden"><Shimmer /></div>
                            </div>
                        ))}
                    </div>

                    {/* Tabla - Desktop */}
                    <div className="hidden md:block overflow-hidden rounded-lg border border-gray-200">
                        <div className="bg-gray-50 px-3 py-2 flex gap-4">
                            <div className="h-3 w-20 bg-gray-200 rounded relative overflow-hidden"><Shimmer /></div>
                            <div className="h-3 w-16 bg-gray-200 rounded relative overflow-hidden"><Shimmer /></div>
                            <div className="h-3 w-28 bg-gray-200 rounded relative overflow-hidden"><Shimmer /></div>
                        </div>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="px-3 py-2 border-t border-gray-100 flex gap-4">
                                <div className="h-4 w-32 bg-gray-200 rounded relative overflow-hidden"><Shimmer /></div>
                                <div className="h-5 w-20 bg-gray-100 rounded-full relative overflow-hidden"><Shimmer /></div>
                                <div className="h-4 w-40 bg-gray-100 rounded relative overflow-hidden"><Shimmer /></div>
                            </div>
                        ))}
                    </div>
                </div>

                <hr className="border-gray-200 my-3 sm:my-4 -mx-3 sm:-mx-4" />

                {/* Protocolos - 1 columna móvil, 2 columnas desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {[1, 2].map((col) => (
                        <div key={col}>
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gray-200 rounded relative overflow-hidden"><Shimmer /></div>
                                <div className="h-3.5 sm:h-4 w-28 sm:w-36 bg-gray-200 rounded relative overflow-hidden"><Shimmer /></div>
                            </div>
                            <div className="space-y-1.5 sm:space-y-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-200 rounded-full relative overflow-hidden"><Shimmer /></div>
                                        <div className="flex-1 h-3.5 sm:h-4 bg-gray-200 rounded relative overflow-hidden"><Shimmer /></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <hr className="border-gray-200 my-3 sm:my-4 -mx-3 sm:-mx-4" />

                {/* Info Adicional - 2 columnas móvil, 4 columnas desktop */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gray-200 rounded relative overflow-hidden"><Shimmer /></div>
                            <div className="h-3.5 sm:h-4 w-32 sm:w-40 bg-gray-200 rounded relative overflow-hidden"><Shimmer /></div>
                        </div>
                        <div className="h-6 w-8 sm:w-16 bg-gray-100 rounded-lg relative overflow-hidden"><Shimmer /></div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-gray-50 rounded-lg p-2.5 sm:p-3 min-h-[80px] sm:min-h-[100px]">
                                <div className="flex items-center gap-1.5 mb-1.5 sm:mb-2">
                                    <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-gray-200 rounded relative overflow-hidden"><Shimmer /></div>
                                    <div className="h-3 w-16 sm:w-20 bg-gray-200 rounded relative overflow-hidden"><Shimmer /></div>
                                </div>
                                <div className="space-y-1.5">
                                    {[1, 2].map((j) => (
                                        <div key={j} className="h-3 w-full bg-gray-100 rounded relative overflow-hidden"><Shimmer /></div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PaecTabSkeleton;
