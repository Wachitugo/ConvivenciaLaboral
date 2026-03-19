import CasesToolbarSkeleton from './skeletons/CasesToolbarSkeleton';
import CasesGridSkeleton from './skeletons/CasesGridSkeleton';

function MyCasesSkeleton() {
  return (
    <div className="flex-1 flex flex-col bg-[#0A3866]/20 backdrop-blur-3xl border border-[#1A71B8]/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] rounded-[32px] overflow-hidden transition-all duration-300">
      <CasesToolbarSkeleton />
      <CasesGridSkeleton />
    </div>
  );
}

export default MyCasesSkeleton;
