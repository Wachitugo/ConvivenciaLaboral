function StudentToolbarSkeleton() {
    return (
        <div className="p-3 pb-4 mb-2 border-b border-black/5">
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
                {/* Search bar skeleton */}
                <div className="max-w-xs min-w-[200px]">
                    <div className="w-full h-9 bg-white/10 rounded-full relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    </div>
                </div>

                {/* Filtros skeleton */}
                <div className="flex flex-wrap gap-2">
                    <div className="h-9 w-28 bg-white/10 rounded-xl relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    </div>
                    <div className="h-9 w-24 bg-white/10 rounded-xl relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    </div>
                    <div className="h-9 w-32 bg-white/10 rounded-xl relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    </div>
                </div>

                {/* Contador skeleton */}
                <div className="ml-auto h-4 w-20 bg-white/10 rounded-full relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                </div>
            </div>
        </div>
    );
}

export default StudentToolbarSkeleton;
