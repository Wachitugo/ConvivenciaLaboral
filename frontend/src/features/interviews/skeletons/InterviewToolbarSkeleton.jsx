function InterviewToolbarSkeleton() {
  return (
    <div>
      {/* Breadcrumb skeleton */}
      <div className="px-6 pt-5 pb-2">
        <div className="h-4 w-40 bg-gray-200 rounded relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
        </div>
      </div>

      <div className="relative flex flex-col gap-3 px-6 pt-3 pb-4">
        <div className="flex items-center justify-between gap-4">
          {/* Search y Filtros skeleton */}
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            {/* Search bar */}
            <div className="max-w-xs min-w-[200px] h-9 bg-gray-200 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
            </div>

            {/* Filtros principales: sortBy, grade, status, gender */}
            <div className="h-9 w-32 bg-gray-200 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
            </div>
            <div className="h-9 w-24 bg-gray-200 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
            </div>
            <div className="h-9 w-28 bg-gray-200 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
            </div>
            <div className="h-9 w-24 bg-gray-200 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
            </div>

            {/* Botón Más filtros */}
            <div className="h-9 w-28 bg-gray-200 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón Nueva Entrevista */}
            <div className="h-9 w-40 bg-gray-200 rounded-xl relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InterviewToolbarSkeleton;
