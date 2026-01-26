function CaseGeneralInfoSkeleton() {
  return (
    <div className="flex flex-col bg-white overflow-hidden rounded-xl border-2 border-gray-300 shadow-sm animate-pulse" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-200 rounded flex-shrink-0"></div>
            <div className="h-5 bg-gray-200 rounded w-36 sm:w-44"></div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-48 mt-1.5 hidden sm:block"></div>
          <div className="h-3 bg-gray-200 rounded w-24 mt-1.5 sm:hidden"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded-lg w-16 sm:w-20 flex-shrink-0"></div>
      </div>

      {/* Contenido */}
      <div className="p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {/* Nombre del Caso - ocupa 2 columnas */}
          <div className="col-span-1 sm:col-span-2 bg-gray-50 p-2.5 sm:p-3 rounded-lg">
            <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-5 bg-gray-200 rounded w-full"></div>
          </div>

          {/* Estado */}
          <div className="bg-gray-50 p-2.5 sm:p-3 rounded-lg">
            <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded-full w-24"></div>
          </div>

          {/* Fecha de creación */}
          <div className="bg-gray-50 p-2.5 sm:p-3 rounded-lg">
            <div className="h-3 bg-gray-200 rounded w-28 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaseGeneralInfoSkeleton;
