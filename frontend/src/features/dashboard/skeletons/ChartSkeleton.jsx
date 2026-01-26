export default function ChartSkeleton({ height = "h-[300px]", titleWidth = "w-32" }) {
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-stone-200 p-4 ${height} flex flex-col`}>
            <div className={`h-6 ${titleWidth} bg-gray-200 rounded mb-4 animate-pulse flex-shrink-0`}></div>
            <div className="flex-1 bg-gray-50 rounded-lg animate-pulse"></div>
        </div>
    );
}
