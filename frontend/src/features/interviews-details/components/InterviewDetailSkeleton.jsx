import React from 'react';

function InterviewDetailSkeleton() {
    return (
        <div style={{ fontFamily: "'Poppins', sans-serif" }} className="flex-1 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300 overflow-auto animate-pulse">
            <div className="flex flex-col gap-3 flex-1 min-h-0">
                <div className="flex flex-col gap-4 flex-1 min-h-0">

                    {/* TOP: General Info Skeleton */}
                    <div className="flex-shrink-0 bg-[#0A3866]/30 backdrop-blur-3xl rounded-3xl border border-[#1A71B8]/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)]">
                        {/* Header */}
                        <div className="p-3 sm:p-4 border-b border-[#1A71B8]/30 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-white/10 rounded flex-shrink-0"></div>
                                <div className="h-5 bg-white/10 rounded-lg w-40"></div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-7 w-24 bg-white/10 rounded-lg"></div>
                                <div className="h-7 w-20 bg-white/10 rounded-lg"></div>
                                <div className="h-7 w-16 bg-[#ef4444]/20 rounded-lg"></div>
                            </div>
                        </div>

                        {/* Grid de campos */}
                        <div className="p-3 sm:p-4">
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                                        <div className="h-3 bg-white/10 rounded w-16 mb-2"></div>
                                        <div className="h-4 bg-white/10 rounded-lg w-24"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM: Tabs Skeleton */}
                    <div className="flex-1 min-h-0">
                        <div className="flex flex-col rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] border border-[#1A71B8]/30 h-full bg-[#0A3866]/30 backdrop-blur-3xl">

                            {/* Tabs header - 3 tabs */}
                            <div className="flex border-b border-[#1A71B8]/30 bg-black/10 px-2 sm:px-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3">
                                        <div className="w-4 h-4 bg-white/10 rounded flex-shrink-0"></div>
                                        <div className="h-3 bg-white/10 rounded w-16 sm:w-20"></div>
                                    </div>
                                ))}
                            </div>

                            {/* Tab content */}
                            <div className="flex-1 bg-white/5 rounded-b-3xl min-h-[500px] p-4 space-y-4">
                                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3">
                                    <div className="h-4 bg-white/10 rounded-lg w-1/3"></div>
                                    <div className="h-4 bg-white/10 rounded-lg w-full"></div>
                                    <div className="h-4 bg-white/10 rounded-lg w-5/6"></div>
                                    <div className="h-4 bg-white/10 rounded-lg w-4/6"></div>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                                    <div className="h-28 bg-white/10 rounded-xl w-full"></div>
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
