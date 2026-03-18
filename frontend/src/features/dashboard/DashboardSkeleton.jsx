import StatsCardsSkeleton from './skeletons/StatsCardsSkeleton';
import RecentCasesSkeleton from './skeletons/RecentCasesSkeleton';
import ChartSkeleton from './skeletons/ChartSkeleton';
import DashboardHeaderSkeleton from './skeletons/DashboardHeaderSkeleton';

function DashboardSkeleton() {
  return (
    <div className="flex-1 flex flex-col bg-[#0A3866]/20 backdrop-blur-3xl border border-[#1A71B8]/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] rounded-[32px] overflow-hidden transition-all duration-300">
      {/* Header Skeleton */}
      <DashboardHeaderSkeleton />

      {/* Content Skeleton */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 py-2 custom-scrollbar">
        {/* KPI Cards */}
        <StatsCardsSkeleton />

        {/* Fila 1: Casos + 2 charts */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="h-full">
            <RecentCasesSkeleton />
          </div>
          <ChartSkeleton height="h-full" titleWidth="w-40" />
          <ChartSkeleton height="h-full" titleWidth="w-36" />
        </div>

        {/* Fila 2: 2 charts */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <ChartSkeleton height="h-[300px]" titleWidth="w-48" />
          <ChartSkeleton height="h-[300px]" titleWidth="w-40" />
        </div>

        {/* Fila 3: 3 charts */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <ChartSkeleton height="h-[300px]" titleWidth="w-36" />
          <ChartSkeleton height="h-[300px]" titleWidth="w-44" />
          <ChartSkeleton height="h-[300px]" titleWidth="w-32" />
        </div>
      </div>
    </div>
  );
}

export default DashboardSkeleton;
