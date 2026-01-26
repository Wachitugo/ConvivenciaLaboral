export default function RecentCasesSkeleton() {
    return (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 w-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto">
                {[1, 2, 3, 4, 5].map((item) => (
                    <div
                        key={item}
                        className="border border-gray-200 bg-white rounded-lg p-3"
                    >
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-gray-200 animate-pulse"></div>
                            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
