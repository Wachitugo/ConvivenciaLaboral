import React from 'react';

function TabContentSkeleton() {
    return (
        <div className="flex flex-col h-full overflow-hidden animate-pulse">
            {/* Header */}
            <div className="p-4 border-b border-[#1A71B8]/30 flex items-center justify-between">
                <div>
                    <div className="h-5 w-56 bg-white/10 rounded-lg mb-2"></div>
                    <div className="h-3 w-72 bg-white/10 rounded"></div>
                </div>
                <div className="h-8 w-20 bg-white/10 rounded-lg"></div>
            </div>

            {/* Contenido */}
            <div className="p-4 space-y-4">
                {/* Primera sección */}
                <div>
                    <div className="h-4 w-40 bg-white/10 rounded-lg mb-3"></div>
                    <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                                <div className="h-3 w-20 bg-white/10 rounded mb-2"></div>
                                <div className="h-5 w-28 bg-white/10 rounded-lg"></div>
                            </div>
                        ))}
                    </div>
                </div>

                <hr className="border-white/10 -mx-4" />

                {/* Segunda sección */}
                <div>
                    <div className="h-4 w-36 bg-white/10 rounded-lg mb-3"></div>
                    <div className="space-y-2">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="flex items-start gap-2 p-2 bg-white/5 border border-white/10 rounded-2xl">
                                <div className="w-5 h-5 bg-white/10 rounded-full flex-shrink-0"></div>
                                <div className="flex-1">
                                    <div className="h-3 w-full bg-white/10 rounded mb-1"></div>
                                    <div className="h-3 w-3/4 bg-white/10 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <hr className="border-white/10 -mx-4" />

                {/* Tercera sección - Grid */}
                <div>
                    <div className="h-4 w-32 bg-white/10 rounded-lg mb-3"></div>
                    <div className="grid grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map((_, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-3">
                                <div className="h-3 w-20 bg-white/10 rounded mb-2"></div>
                                <div className="h-3 w-full bg-white/10 rounded mb-1"></div>
                                <div className="h-3 w-2/3 bg-white/10 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TabContentSkeleton;
