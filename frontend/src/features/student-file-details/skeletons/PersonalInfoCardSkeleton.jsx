import React from 'react';

function PersonalInfoCardSkeleton() {
    return (
        <div className="flex flex-col bg-white overflow-hidden rounded-xl border-2 border-gray-300 shadow-sm animate-pulse">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <div className="h-5 w-32 sm:w-48 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 w-24 sm:w-64 bg-gray-100 rounded"></div>
                </div>
                <div className="h-8 w-8 sm:w-20 bg-gray-200 rounded-lg flex-shrink-0"></div>
            </div>

            {/* Contenido */}
            <div className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                    {/* Info Grid - same responsive layout as component */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                        {/* Nombre - spans 2 columns */}
                        <div className="col-span-1 sm:col-span-2 bg-gray-100 p-2.5 sm:p-3 rounded-lg">
                            <div className="h-3 w-24 bg-gray-200 rounded mb-2"></div>
                            <div className="h-5 w-full sm:w-40 bg-gray-200 rounded"></div>
                        </div>

                        {/* RUT */}
                        <div className="bg-gray-100 p-2.5 sm:p-3 rounded-lg">
                            <div className="h-3 w-12 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 w-24 bg-gray-200 rounded"></div>
                        </div>

                        {/* Curso */}
                        <div className="bg-gray-100 p-2.5 sm:p-3 rounded-lg">
                            <div className="h-3 w-14 bg-gray-200 rounded mb-2"></div>
                            <div className="h-5 w-16 bg-gray-200 rounded"></div>
                        </div>

                        {/* Email */}
                        <div className="bg-gray-100 p-2.5 sm:p-3 rounded-lg">
                            <div className="h-3 w-14 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 w-full sm:w-32 bg-gray-200 rounded"></div>
                        </div>

                        {/* Nacimiento */}
                        <div className="bg-gray-100 p-2.5 sm:p-3 rounded-lg">
                            <div className="h-3 w-20 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 w-24 bg-gray-200 rounded"></div>
                        </div>

                        {/* Edad */}
                        <div className="bg-gray-100 p-2.5 sm:p-3 rounded-lg">
                            <div className="h-3 w-10 bg-gray-200 rounded mb-2"></div>
                            <div className="h-5 w-16 bg-gray-200 rounded"></div>
                        </div>

                        {/* Apoderado */}
                        <div className="bg-gray-100 p-2.5 sm:p-3 rounded-lg">
                            <div className="h-3 w-20 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 w-28 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>

                <hr className="border-gray-200 my-3 sm:my-4 -mx-3 sm:-mx-4" />

                {/* Programas - responsive layout */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                        <div className="h-3 w-20 bg-gray-200 rounded"></div>

                        {/* Toggle TEA */}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-4 bg-gray-200 rounded-full"></div>
                            <div className="h-3 w-8 bg-gray-200 rounded"></div>
                        </div>

                        {/* Toggle PIE */}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-4 bg-gray-200 rounded-full"></div>
                            <div className="h-3 w-8 bg-gray-200 rounded"></div>
                        </div>

                        {/* Toggle PAEC */}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-4 bg-gray-200 rounded-full"></div>
                            <div className="h-3 w-10 bg-gray-200 rounded"></div>
                        </div>
                    </div>

                    {/* Teléfono apoderado */}
                    <div className="sm:ml-auto flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-gray-200 rounded"></div>
                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PersonalInfoCardSkeleton;
