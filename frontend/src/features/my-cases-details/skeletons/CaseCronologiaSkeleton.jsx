function CaseCronologiaSkeleton() {
  return (
    <div
      className="flex flex-col h-full bg-white overflow-hidden animate-pulse"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-200 rounded flex-shrink-0"></div>
            <div className="h-5 bg-gray-200 rounded w-28 sm:w-36"></div>
            <div className="h-4 bg-gray-200 rounded w-8"></div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-52 mt-1.5 hidden sm:block"></div>
          <div className="h-3 bg-gray-200 rounded w-28 mt-1.5 sm:hidden"></div>
        </div>
      </div>

      {/* Timeline skeleton */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
        <div className="relative">
          {/* Línea vertical */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

          <div className="space-y-6">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="relative pl-10">
                {/* Círculo indicador */}
                <div className="absolute left-2 top-1 w-5 h-5 bg-gray-200 rounded-full"></div>

                {/* Card del evento */}
                <div className="p-3 border border-gray-200 rounded-xl bg-gray-50/50">
                  <div className="flex items-start gap-3">
                    {/* Icono */}
                    <div className="p-2 rounded-lg bg-gray-200 w-9 h-9 flex-shrink-0"></div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="h-4 bg-gray-200 rounded w-40 sm:w-52 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaseCronologiaSkeleton;
