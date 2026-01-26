import CaseGeneralInfoSkeleton from './CaseGeneralInfoSkeleton';
import CaseDetailTabsHeaderSkeleton from './CaseDetailTabsHeaderSkeleton';
import CaseAISummarySkeleton from './CaseAISummarySkeleton';

function CaseDetailPageSkeleton() {
    return (
        <div
            className="flex-1 flex gap-4"
            style={{ fontFamily: "'Poppins', sans-serif" }}
        >
            <div className="flex-1 flex flex-col">
                {/* Header Skeleton - matches CaseHeader.jsx */}
                <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0 animate-pulse">
                    <div className="flex items-center gap-4">
                        {/* Back button skeleton */}
                        <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
                    </div>
                    {/* Title skeleton */}
                    <div className="h-5 bg-gray-200 rounded w-32"></div>
                    {/* Menu button skeleton */}
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
                    </div>
                </div>

                {/* Contenido del Detalle */}
                <div className="p-4 flex flex-col gap-2 flex-1">
                    {/* Breadcrumb y Botones Skeleton */}
                    <div className="flex items-center justify-between gap-4 flex-shrink-0 animate-pulse">
                        <div className="flex items-center gap-2">
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                            <div className="h-4 bg-gray-200 rounded w-4"></div>
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-8 bg-gray-200 rounded-lg w-24"></div>
                            <div className="h-8 bg-gray-200 rounded-lg w-20"></div>
                        </div>
                    </div>

                    {/* Layout vertical: Info arriba, Tabs abajo */}
                    <div className="flex flex-col gap-4 flex-1 min-h-0">
                        {/* Información General Skeleton */}
                        <CaseGeneralInfoSkeleton />

                        {/* Sistema de tabs Skeleton */}
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <div className="flex flex-col overflow-hidden rounded-xl shadow-sm border-2 border-gray-300 h-full bg-white">
                                {/* Tabs Header Skeleton */}
                                <CaseDetailTabsHeaderSkeleton />

                                {/* Tab Content Skeleton */}
                                <div className="flex-1 bg-white rounded-b-xl min-h-[500px] overflow-y-auto">
                                    <CaseAISummarySkeleton />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CaseDetailPageSkeleton;
