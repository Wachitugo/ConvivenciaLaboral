import { useTheme } from '../../contexts/ThemeContext';
import StatsCardsSkeleton from './skeletons/StatsCardsSkeleton';
import RecentCasesSkeleton from './skeletons/RecentCasesSkeleton';
import ChartSkeleton from './skeletons/ChartSkeleton';
import BreadcrumbSkeleton from './skeletons/BreadcrumbSkeleton';
import DashboardHeaderSkeleton from './skeletons/DashboardHeaderSkeleton';

function DashboardSkeleton() {
  const { current } = useTheme();

  return (
    <div className={`flex-1 flex flex-col rounded-lg shadow-sm bg-white border ${current.cardBorder} overflow-hidden`}>
      {/* Header Skeleton */}
      <DashboardHeaderSkeleton />

      {/* Breadcrumb Skeleton */}
      <div className="px-4 mt-4">
        <BreadcrumbSkeleton />
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 overflow-y-auto p-4 py-4 custom-scrollbar">
        {/* KPI Cards */}
        <StatsCardsSkeleton />

        {/* Fila 1: Casos próximos a vencer y gráficos */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="h-full">
            <RecentCasesSkeleton />
          </div>
          <ChartSkeleton height="h-full" titleWidth="w-40" />
          <ChartSkeleton height="h-full" titleWidth="w-36" />
        </div>

        {/* Fila 2: Evolución mensual y Estado de casos */}
        <div className="grid grid-cols-2 gap-4 mb-2">
          <ChartSkeleton height="h-[300px]" titleWidth="w-48" />
          <ChartSkeleton height="h-[300px]" titleWidth="w-40" />
        </div>
      </div>
    </div>
  );
}

export default DashboardSkeleton;
