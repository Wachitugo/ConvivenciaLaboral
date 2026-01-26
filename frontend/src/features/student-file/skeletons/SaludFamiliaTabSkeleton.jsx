import React from 'react';

/**
 * Shimmer - Efecto de brillo animado para skeletons
 */
const Shimmer = () => (
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
);

/**
 * SaludFamiliaTabSkeleton - Skeleton responsivo para el tab Salud y Familia
 */
function SaludFamiliaTabSkeleton() {
    return (
        <div className="flex flex-col h-full bg-white overflow-hidden rounded-xl shadow-sm">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-200 rounded relative overflow-hidden">
                        <Shimmer />
                    </div>
                    <div className="h-4 sm:h-5 w-32 sm:w-44 bg-gray-200 rounded relative overflow-hidden">
                        <Shimmer />
                    </div>
                </div>
                <div className="h-3 sm:h-3.5 w-48 sm:w-72 bg-gray-100 rounded mt-1 relative overflow-hidden">
                    <Shimmer />
                </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-auto p-3 sm:p-4">
                {/* Información General */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gray-200 rounded relative overflow-hidden">
                                <Shimmer />
                            </div>
                            <div className="h-3.5 sm:h-4 w-28 sm:w-36 bg-gray-200 rounded relative overflow-hidden">
                                <Shimmer />
                            </div>
                        </div>
                        <div className="h-6 w-8 sm:w-16 bg-gray-100 rounded-lg relative overflow-hidden">
                            <Shimmer />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        {[1, 2].map((i) => (
                            <div key={i} className="bg-gray-50 p-2.5 sm:p-3 rounded-lg">
                                <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                                    <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-gray-200 rounded relative overflow-hidden">
                                        <Shimmer />
                                    </div>
                                    <div className="h-3 w-16 sm:w-24 bg-gray-200 rounded relative overflow-hidden">
                                        <Shimmer />
                                    </div>
                                </div>
                                <div className="h-6 sm:h-7 w-12 sm:w-16 bg-gray-200 rounded relative overflow-hidden">
                                    <Shimmer />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <hr className="border-gray-200 my-3 sm:my-4 -mx-3 sm:-mx-4" />

                {/* Alergias y Condiciones */}
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
                    <div className="space-y-2 sm:space-y-3">
                        {/* Alergias */}
                        <div className="bg-gray-50 p-2.5 sm:p-3 rounded-lg">
                            <div className="h-3 w-14 sm:w-16 bg-gray-200 rounded mb-2 relative overflow-hidden">
                                <Shimmer />
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-6 sm:h-7 w-16 sm:w-20 bg-white border border-gray-200 rounded-lg relative overflow-hidden">
                                        <Shimmer />
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Condiciones */}
                        <div className="bg-gray-50 p-2.5 sm:p-3 rounded-lg">
                            <div className="h-3 w-24 sm:w-32 bg-gray-200 rounded mb-2 relative overflow-hidden">
                                <Shimmer />
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {[1, 2].map((i) => (
                                    <div key={i} className="h-6 sm:h-7 w-20 sm:w-24 bg-white border border-gray-200 rounded-lg relative overflow-hidden">
                                        <Shimmer />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="border-gray-200 my-3 sm:my-4 -mx-3 sm:-mx-4" />

                {/* Contactos de Emergencia */}
                <div>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-gray-50 border border-gray-200">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 flex-shrink-0 relative overflow-hidden">
                                    <Shimmer />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="h-3.5 sm:h-4 w-20 sm:w-24 bg-gray-200 rounded mb-1 relative overflow-hidden">
                                        <Shimmer />
                                    </div>
                                    <div className="h-3 w-14 sm:w-16 bg-gray-100 rounded mb-1 relative overflow-hidden">
                                        <Shimmer />
                                    </div>
                                    <div className="h-3 w-16 sm:w-20 bg-gray-200 rounded relative overflow-hidden">
                                        <Shimmer />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SaludFamiliaTabSkeleton;
