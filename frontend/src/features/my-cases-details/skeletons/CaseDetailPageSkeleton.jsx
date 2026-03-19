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
                {/* Layout vertical: Info arriba, Tabs abajo */}
                <div className="flex flex-col gap-4 flex-1 min-h-0">
                    {/* Información General Skeleton */}
                    <CaseGeneralInfoSkeleton />

                    {/* Sistema de tabs Skeleton */}
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <div className="flex flex-col overflow-hidden rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] border border-[#1A71B8]/30 h-full bg-[#0A3866]/30 backdrop-blur-3xl">
                            {/* Tabs Header Skeleton */}
                            <CaseDetailTabsHeaderSkeleton />

                            {/* Tab Content Skeleton */}
                            <div className="flex-1 bg-white/5 rounded-b-3xl min-h-[500px] overflow-y-auto">
                                <CaseAISummarySkeleton />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CaseDetailPageSkeleton;
