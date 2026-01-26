import React from 'react';
import StudentDetailHeaderSkeleton from './StudentDetailHeaderSkeleton';
import StudentTabsSkeleton from './StudentTabsSkeleton';
import PaecTabSkeleton from './PaecTabSkeleton';

/**
 * Shimmer - Efecto de brillo animado para skeletons
 */
const Shimmer = () => (
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
);

/**
 * PersonalInfoCardSkeleton - Skeleton responsivo para la tarjeta de información personal
 */
const PersonalInfoCardSkeleton = () => (
    <div className="bg-white rounded-xl border-2 border-gray-300 shadow-sm p-3 sm:p-4 mb-3 sm:mb-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-200 rounded relative overflow-hidden">
                    <Shimmer />
                </div>
                <div className="h-4 sm:h-5 w-32 sm:w-40 bg-gray-200 rounded relative overflow-hidden">
                    <Shimmer />
                </div>
            </div>
            <div className="h-7 w-14 sm:w-16 bg-blue-100 rounded-lg relative overflow-hidden">
                <Shimmer />
            </div>
        </div>

        {/* Grid de información */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {/* Nombre completo - 2 columnas */}
            <div className="sm:col-span-2 bg-gray-100 p-2.5 sm:p-3 rounded-lg">
                <div className="h-3 w-24 bg-gray-200 rounded mb-1.5 relative overflow-hidden">
                    <Shimmer />
                </div>
                <div className="h-4 sm:h-5 w-full bg-gray-200 rounded relative overflow-hidden">
                    <Shimmer />
                </div>
            </div>

            {/* Campos individuales */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-100 p-2.5 sm:p-3 rounded-lg">
                    <div className="h-3 w-16 sm:w-20 bg-gray-200 rounded mb-1.5 relative overflow-hidden">
                        <Shimmer />
                    </div>
                    <div className="h-3.5 sm:h-4 w-24 sm:w-28 bg-gray-200 rounded relative overflow-hidden">
                        <Shimmer />
                    </div>
                </div>
            ))}
        </div>

        <hr className="border-gray-200 my-3 sm:my-4 -mx-3 sm:-mx-4" />

        {/* Programas */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="h-3 w-20 bg-gray-200 rounded relative overflow-hidden">
                <Shimmer />
            </div>
            <div className="flex gap-3 sm:gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="w-8 h-4 bg-gray-200 rounded-full relative overflow-hidden">
                            <Shimmer />
                        </div>
                        <div className="h-3 w-8 bg-gray-100 rounded relative overflow-hidden">
                            <Shimmer />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

/**
 * StudentDetailPageSkeleton - Skeleton responsivo para la página completa de detalle del estudiante
 */
function StudentDetailPageSkeleton() {
    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <StudentDetailHeaderSkeleton />

            {/* Tabs */}
            <StudentTabsSkeleton />

            {/* Contenido - Stack en móvil, Grid en desktop */}
            <div className="flex-1 overflow-auto p-3 sm:p-4">
                <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3 sm:gap-4 h-full">
                    {/* Info personal - Arriba en móvil, Izquierda en desktop */}
                    <div className="lg:col-span-1">
                        <PersonalInfoCardSkeleton />
                    </div>

                    {/* Tab content - Abajo en móvil, Derecha en desktop */}
                    <div className="lg:col-span-2 flex-1">
                        <PaecTabSkeleton />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentDetailPageSkeleton;
