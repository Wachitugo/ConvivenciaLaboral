function StudentCardSkeleton() {
    return (
        <div className="bg-white rounded-lg border-2 border-gray-200 p-3 flex items-center gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gray-200 relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-2">
                {/* Name */}
                <div className="h-3.5 bg-gray-200 rounded w-3/4 relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                </div>
                {/* Curso */}
                <div className="h-3 bg-gray-200 rounded w-1/2 relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                </div>
            </div>
        </div>
    );
}

export default StudentCardSkeleton;
