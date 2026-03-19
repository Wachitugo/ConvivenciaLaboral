export default function ChartSkeleton({ height = "h-[300px]", titleWidth = "w-32" }) {
    return (
        <div className={`bg-white/5 rounded-2xl border border-white/10 p-4 ${height} flex flex-col animate-pulse`}>
            <div className={`h-5 ${titleWidth} bg-white/10 rounded-lg mb-4 flex-shrink-0`}></div>
            <div className="flex-1 bg-white/5 rounded-xl border border-white/5"></div>
        </div>
    );
}
