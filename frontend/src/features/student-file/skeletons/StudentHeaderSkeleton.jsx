function StudentHeaderSkeleton() {
    return (
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 flex-shrink-0 border-b border-gray-100">
            <div className="flex items-center justify-between gap-2">
                {/* Toggle button skeleton */}
                <div className="w-9 h-9 bg-gray-200 rounded-xl relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                </div>

                {/* Título skeleton - oculto en móvil */}
                <div className="hidden sm:block h-6 w-40 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                </div>

                {/* Spacer */}
                <div className="hidden sm:block w-10"></div>
            </div>
        </div>
    );
}

export default StudentHeaderSkeleton;
