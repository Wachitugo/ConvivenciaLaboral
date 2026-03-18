export default function DashboardHeaderSkeleton() {
    return (
        <div className="relative px-8 py-8 overflow-hidden rounded-t-[32px] border-b border-[#1A71B8]/30 flex-shrink-0 animate-pulse">
            <div className="flex items-center justify-between">
                {/* Title block */}
                <div>
                    <div className="h-9 w-72 bg-white/10 rounded-lg mb-2"></div>
                    <div className="h-3 w-52 bg-white/10 rounded"></div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3">
                    <div className="h-8 w-32 bg-white/10 rounded-xl"></div>
                    <div className="h-8 w-36 bg-white/10 rounded-xl"></div>
                </div>
            </div>
        </div>
    );
}
