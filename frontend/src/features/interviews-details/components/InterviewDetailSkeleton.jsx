import React from 'react';

function InterviewDetailSkeleton() {
    return (
        <div style={{ fontFamily: "'Poppins', sans-serif" }} className="flex-1 flex flex-col rounded-lg shadow-md bg-white border border-gray-300 transition-all duration-300 overflow-hidden">
            {/* Header Skeleton */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                    </div>
                    <div className="h-6 w-48 bg-gray-200 rounded relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="h-9 w-24 bg-gray-200 rounded-lg relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                    </div>
                    <div className="h-9 w-24 bg-gray-200 rounded-lg relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                    </div>
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="flex flex-col p-4 gap-3 flex-1 overflow-hidden">

                {/* Breadcrumb & Asociar Caso Button Skeleton */}
                <div className="w-full mb-1 mt-2 flex-shrink-0 flex items-center justify-between gap-4">
                    <div className="h-4 w-48 bg-gray-200 rounded relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                    </div>
                    <div className="h-8 w-32 bg-gray-200 rounded-lg relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                    </div>
                </div>

                {/* Layout Vertical: Info General arriba, Tabs abajo */}
                <div className="flex flex-col gap-4 flex-1 overflow-hidden">

                    {/* TOP: General Info Card Skeleton */}
                    <div className="flex-shrink-0 p-5 rounded-xl border-2 border-gray-300 shadow-md">
                        {/* Header con título */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-5 w-40 bg-gray-200 rounded relative overflow-hidden">
                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                            </div>
                            <div className="h-4 w-16 bg-gray-200 rounded relative overflow-hidden">
                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                            </div>
                        </div>

                        {/* Grid de 5 columnas */}
                        <div className="grid grid-cols-5 gap-4">
                            {/* Nombre */}
                            <div className="col-span-2 sm:col-span-1">
                                <div className="h-3 w-20 bg-gray-200 rounded mb-2 relative overflow-hidden">
                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                                </div>
                                <div className="h-4 w-32 bg-gray-200 rounded relative overflow-hidden">
                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                                </div>
                            </div>

                            {/* Estado */}
                            <div className="col-span-2 sm:col-span-1 justify-self-center">
                                <div className="h-3 w-12 bg-gray-200 rounded mb-2 relative overflow-hidden">
                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                                </div>
                                <div className="h-6 w-24 bg-gray-200 rounded-full relative overflow-hidden">
                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                                </div>
                            </div>

                            {/* Curso */}
                            <div className="col-span-2 sm:col-span-1 justify-self-center">
                                <div className="h-3 w-12 bg-gray-200 rounded mb-2 relative overflow-hidden">
                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                                </div>
                                <div className="h-4 w-20 bg-gray-200 rounded relative overflow-hidden">
                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                                </div>
                            </div>

                            {/* Género */}
                            <div className="col-span-2 sm:col-span-1 justify-self-center">
                                <div className="h-3 w-12 bg-gray-200 rounded mb-2 relative overflow-hidden">
                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                                </div>
                                <div className="h-4 w-20 bg-gray-200 rounded relative overflow-hidden">
                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                                </div>
                            </div>

                            {/* Fecha */}
                            <div className="col-span-2 sm:col-span-1 justify-self-end">
                                <div className="h-3 w-24 bg-gray-200 rounded mb-2 relative overflow-hidden">
                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                                </div>
                                <div className="h-4 w-20 bg-gray-200 rounded relative overflow-hidden">
                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM: Tabs & Content */}
                    <div className="flex-1 flex flex-col overflow-hidden rounded-xl border-2 border-gray-300">

                        {/* Tabs Skeleton - Grid de 3 columnas */}
                        <div className="grid grid-cols-3 gap-2 rounded-t-xl p-1 bg-gray-50 border-b border-gray-300 flex-shrink-0">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="h-9 bg-gray-200 rounded-xl relative overflow-hidden">
                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                                </div>
                            ))}
                        </div>

                        {/* Tab Content Skeleton */}
                        <div className="flex-1 bg-white rounded-b-xl p-6 overflow-hidden">
                            <div className="space-y-3">
                                <div className="h-4 w-3/4 bg-gray-200 rounded relative overflow-hidden">
                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                                </div>
                                <div className="h-4 w-full bg-gray-200 rounded relative overflow-hidden">
                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                                </div>
                                <div className="h-4 w-5/6 bg-gray-200 rounded relative overflow-hidden">
                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                                </div>
                                <div className="h-32 w-full bg-gray-200 rounded-lg mt-4 relative overflow-hidden">
                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default InterviewDetailSkeleton;
