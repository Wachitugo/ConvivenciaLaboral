import CaseCardSkeleton from './CaseCardSkeleton';

function CasesGridSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 custom-scrollbar">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6,7,8,9,10,11,12,13,14,15,16,17,18].map((item) => (
          <CaseCardSkeleton key={item} />
        ))}
      </div>
    </div>
  );
}

export default CasesGridSkeleton;
