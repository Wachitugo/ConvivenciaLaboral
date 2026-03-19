export default function StatsCardsSkeleton() {
    const cards = [1, 2, 3, 4];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 animate-pulse">
            {cards.map((item) => (
                <div
                    key={item}
                    className="bg-white/5 rounded-2xl border border-white/10 p-4"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="h-3 w-20 bg-white/10 rounded mb-3"></div>
                            <div className="h-8 w-14 bg-white/10 rounded-lg"></div>
                        </div>
                        <div className="p-2 bg-white/10 rounded-xl">
                            <div className="w-5 h-5 bg-white/10 rounded"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
