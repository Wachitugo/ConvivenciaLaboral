function CaseTimelineSkeleton() {
  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }} className="flex flex-col h-full bg-white overflow-hidden animate-pulse">
      {/* Header del protocolo */}
      <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-200 rounded flex-shrink-0"></div>
            <div className="h-5 bg-gray-200 rounded w-24 sm:w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-10"></div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-44 mt-1.5 hidden sm:block"></div>
          <div className="h-3 bg-gray-200 rounded w-32 mt-1.5 sm:hidden"></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {/* Pasos del protocolo skeleton */}
        <div className="relative space-y-6 bg-gray-50 pl-3 pr-3 pb-3 rounded-md border border-gray-200">
          {/* Línea vertical */}
          <div className="absolute left-[27px] top-9 bottom-3 w-px bg-stone-300"></div>

          {[1, 2, 3].map((item) => (
            <div key={item} className="relative flex items-start gap-4 pt-3">
              <div className="flex flex-col items-center flex-shrink-0 relative z-10">
                <div className="w-8 h-8 rounded-full bg-gray-200 border-4 border-white"></div>
              </div>
              <div className="flex-1 pb-2">
                <div className="h-4 bg-gray-200 rounded w-48 sm:w-64 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CaseTimelineSkeleton;
