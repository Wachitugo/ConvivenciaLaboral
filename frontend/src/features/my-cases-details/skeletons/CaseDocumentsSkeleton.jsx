function CaseDocumentsSkeleton() {
  return (
    <div
      className="flex flex-col h-full bg-white overflow-hidden animate-pulse"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Header de documentos */}
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
        <div className="h-8 bg-gray-200 rounded-lg w-16 sm:w-20 flex-shrink-0"></div>
      </div>

      {/* Lista de documentos skeleton */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="p-3 border border-gray-200 rounded-xl bg-gray-50/50"
            >
              <div className="flex items-start gap-3">
                {/* Icono del archivo */}
                <div className="p-2 rounded-lg bg-gray-200 w-9 h-9 flex-shrink-0"></div>

                {/* Información del archivo skeleton */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="h-4 bg-gray-200 rounded w-40 sm:w-52 mb-2"></div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                    <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                    <div className="h-3 bg-gray-200 rounded w-10"></div>
                    <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>

                {/* Botones de acción skeleton */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CaseDocumentsSkeleton;
