import React from 'react';

function PersonalInfoCardSkeleton() {
    return (
        <div className="flex flex-col bg-[#0A3866]/30 backdrop-blur-3xl overflow-hidden rounded-3xl border border-[#1A71B8]/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] animate-pulse">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-[#1A71B8]/30 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <div className="h-5 w-32 sm:w-48 bg-white/10 rounded-lg mb-2"></div>
                    <div className="h-3 w-24 sm:w-64 bg-white/10 rounded"></div>
                </div>
                <div className="h-8 w-8 sm:w-20 bg-white/10 rounded-lg flex-shrink-0"></div>
            </div>

            {/* Contenido */}
            <div className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                        {/* Nombre - spans 2 columns */}
                        <div className="col-span-1 sm:col-span-2 bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-2xl">
                            <div className="h-3 w-24 bg-white/10 rounded mb-2"></div>
                            <div className="h-5 w-full sm:w-40 bg-white/10 rounded-lg"></div>
                        </div>

                        {/* RUT */}
                        <div className="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-2xl">
                            <div className="h-3 w-12 bg-white/10 rounded mb-2"></div>
                            <div className="h-4 w-24 bg-white/10 rounded-lg"></div>
                        </div>

                        {/* Curso */}
                        <div className="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-2xl">
                            <div className="h-3 w-14 bg-white/10 rounded mb-2"></div>
                            <div className="h-5 w-16 bg-white/10 rounded-lg"></div>
                        </div>

                        {/* Email */}
                        <div className="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-2xl">
                            <div className="h-3 w-14 bg-white/10 rounded mb-2"></div>
                            <div className="h-4 w-full sm:w-32 bg-white/10 rounded-lg"></div>
                        </div>

                        {/* Nacimiento */}
                        <div className="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-2xl">
                            <div className="h-3 w-20 bg-white/10 rounded mb-2"></div>
                            <div className="h-4 w-24 bg-white/10 rounded-lg"></div>
                        </div>

                        {/* Edad */}
                        <div className="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-2xl">
                            <div className="h-3 w-10 bg-white/10 rounded mb-2"></div>
                            <div className="h-5 w-16 bg-white/10 rounded-lg"></div>
                        </div>

                        {/* Apoderado */}
                        <div className="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-2xl">
                            <div className="h-3 w-20 bg-white/10 rounded mb-2"></div>
                            <div className="h-4 w-28 bg-white/10 rounded-lg"></div>
                        </div>
                    </div>
                </div>

                <hr className="border-white/10 my-3 sm:my-4 -mx-3 sm:-mx-4" />

                {/* Programas */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                        <div className="h-3 w-20 bg-white/10 rounded"></div>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-8 h-4 bg-white/10 rounded-full"></div>
                                <div className="h-3 w-8 bg-white/10 rounded"></div>
                            </div>
                        ))}
                    </div>
                    <div className="sm:ml-auto flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-white/10 rounded"></div>
                        <div className="h-4 w-24 bg-white/10 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PersonalInfoCardSkeleton;
