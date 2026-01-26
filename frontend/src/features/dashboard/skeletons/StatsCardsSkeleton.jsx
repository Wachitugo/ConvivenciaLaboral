export default function StatsCardsSkeleton() {
    const cards = [1, 2, 3, 4];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {cards.map((item) => (
                <div
                    key={item}
                    className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-4"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            {/* Label */}
                            <div className="h-3 w-20 bg-gray-200 rounded mb-2 animate-pulse"></div>
                            {/* Value */}
                            <div className="h-7 w-12 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        {/* Icon */}
                        <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
