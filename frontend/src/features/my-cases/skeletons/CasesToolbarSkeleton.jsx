function CasesToolbarSkeleton() {
  return (
    <div className="p-3 pb-4 mb-2 border-b border-black/5">
      <div className="flex items-center justify-between gap-4">
        {/* Search y Filtros skeleton */}
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <div className="max-w-xs min-w-[200px] h-9 bg-white/10 rounded-full relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          </div>
          <div className="h-9 w-32 bg-white/10 rounded-xl relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          </div>
          <div className="h-9 w-28 bg-white/10 rounded-xl relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          </div>
          <div className="h-9 w-36 bg-white/10 rounded-xl relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          </div>
          <div className="h-9 w-28 bg-white/10 rounded-full relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          </div>
        </div>
        {/* Botón Nuevo Caso */}
        <div className="h-9 w-32 bg-white/10 rounded-full relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </div>
      </div>
    </div>
  );
}

export default CasesToolbarSkeleton;
