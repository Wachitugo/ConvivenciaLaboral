import React from 'react';

/**
 * Shimmer - Efecto de brillo animado para skeletons
 */
const Shimmer = () => (
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
);

/**
 * StudentDetailHeaderSkeleton - Skeleton responsivo para el header del detalle del estudiante
 */
function StudentDetailHeaderSkeleton() {
    return (
        <div className="bg-white border-b border-gray-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-4">
                {/* Botón volver */}
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 rounded-lg relative overflow-hidden flex-shrink-0">
                    <Shimmer />
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gray-200 rounded-full relative overflow-hidden flex-shrink-0">
                    <Shimmer />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="h-5 sm:h-6 w-32 sm:w-48 bg-gray-200 rounded mb-1.5 sm:mb-2 relative overflow-hidden">
                        <Shimmer />
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <div className="h-3.5 sm:h-4 w-16 sm:w-20 bg-gray-100 rounded relative overflow-hidden">
                            <Shimmer />
                        </div>
                        <div className="h-3.5 sm:h-4 w-20 sm:w-24 bg-gray-100 rounded relative overflow-hidden hidden sm:block">
                            <Shimmer />
                        </div>
                        <div className="h-4 sm:h-5 w-10 sm:w-12 bg-blue-100 rounded-full relative overflow-hidden">
                            <Shimmer />
                        </div>
                    </div>
                </div>

                {/* Badges de programas - Ocultos en móvil */}
                <div className="hidden sm:flex gap-2 flex-shrink-0">
                    <div className="h-6 w-14 sm:w-16 bg-gray-200 rounded-full relative overflow-hidden">
                        <Shimmer />
                    </div>
                    <div className="h-6 w-14 sm:w-16 bg-gray-200 rounded-full relative overflow-hidden">
                        <Shimmer />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentDetailHeaderSkeleton;
