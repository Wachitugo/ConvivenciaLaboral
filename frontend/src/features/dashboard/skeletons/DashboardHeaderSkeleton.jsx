export default function DashboardHeaderSkeleton() {
    return (
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <div className="grid grid-cols-3 items-center">
                {/* Toggle skeleton */}
                <div className="flex justify-start">
                    <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>

                {/* Title skeleton */}
                <div className="flex justify-center">
                    <div className="h-7 w-40 bg-gray-200 rounded animate-pulse"></div>
                </div>

                {/* Date skeleton */}
                <div className="flex justify-end">
                    <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </div>
        </div>
    );
}
