function StudentToolbarSkeleton() {
    return (
        <div className="flex flex-col p-4 gap-3 flex-shrink-0">
            {/* Breadcrumb Row */}
            <div className="w-full flex items-center justify-between gap-4">
                {/* Breadcrumb skeleton */}
                <div className="h-4 w-32 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                </div>

                {/* Contador skeleton */}
                <div className="h-4 w-20 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
                {/* Search bar skeleton */}
                <div className="flex-1 min-w-0">
                    <div className="w-full h-9 bg-gray-200 rounded-lg relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                    </div>
                </div>

                {/* Filtros skeleton */}
                <div className="flex flex-wrap gap-2">
                    <div className="h-9 w-28 bg-gray-200 rounded-lg relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                    </div>
                    <div className="h-9 w-24 bg-gray-200 rounded-lg relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                    </div>
                    <div className="h-9 w-32 bg-gray-200 rounded-lg relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentToolbarSkeleton;
