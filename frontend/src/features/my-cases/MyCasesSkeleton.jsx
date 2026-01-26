import CasesHeaderSkeleton from './skeletons/CasesHeaderSkeleton';
import CasesToolbarSkeleton from './skeletons/CasesToolbarSkeleton';
import CasesGridSkeleton from './skeletons/CasesGridSkeleton';

function MyCasesSkeleton() {
  return (
    <div className="flex-1 flex flex-col bg-white rounded-lg shadow-md border border-gray-300 transition-all duration-300 overflow-hidden">
      <CasesHeaderSkeleton />
      <CasesToolbarSkeleton />
      <CasesGridSkeleton />
    </div>
  );
}

export default MyCasesSkeleton;
