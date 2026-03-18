function StudentCardSkeleton() {
    return (
        <div className="bg-[#0A3866]/40 border border-[#1A71B8]/30 px-3 py-2.5 rounded-2xl flex items-center justify-between gap-2">
            {/* Info */}
            <div className="flex-1 min-w-0 space-y-2">
                <div className="h-3.5 bg-white/10 rounded-full w-3/4 relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                </div>
                <div className="h-3 bg-white/10 rounded-full w-1/2 relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                </div>
            </div>
            {/* Flecha */}
            <div className="w-4 h-4 bg-white/10 rounded relative overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            </div>
        </div>
    );
}

export default StudentCardSkeleton;
