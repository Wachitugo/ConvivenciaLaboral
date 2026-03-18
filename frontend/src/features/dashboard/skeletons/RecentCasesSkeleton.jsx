export default function RecentCasesSkeleton() {
    return (
        <div className="bg-white/5 rounded-2xl border border-white/10 p-4 h-full flex flex-col animate-pulse">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="h-5 w-44 bg-white/10 rounded-lg"></div>
                <div className="h-5 w-7 bg-white/10 rounded-full"></div>
            </div>
            <div className="space-y-2 flex-1 overflow-hidden">
                {[1, 2, 3, 4, 5].map((item) => (
                    <div
                        key={item}
                        className="border border-white/10 bg-white/5 rounded-xl p-3"
                    >
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="h-4 w-3/4 bg-white/10 rounded-lg"></div>
                            <div className="h-4 w-8 bg-white/10 rounded"></div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-white/10"></div>
                            <div className="h-3 w-24 bg-white/10 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
