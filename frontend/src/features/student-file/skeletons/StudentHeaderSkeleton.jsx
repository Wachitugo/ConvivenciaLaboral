function StudentHeaderSkeleton() {
    return (
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 flex-shrink-0 border-b border-white/10">
            <div className="flex items-center justify-between gap-2">
                {/* Toggle button skeleton */}
                <div className="w-9 h-9 bg-white/10 rounded-xl relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                </div>

                {/* Título skeleton */}
                <div className="hidden sm:block h-6 w-44 bg-white/10 rounded-full relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                </div>

                {/* Spacer */}
                <div className="hidden sm:block w-10"></div>
            </div>
        </div>
    );
}

export default StudentHeaderSkeleton;
