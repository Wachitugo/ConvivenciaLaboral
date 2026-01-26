function CaseAISummarySkeleton() {
  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }} className="h-full flex flex-col animate-pulse">
      <div className="bg-white h-full flex flex-col">
        {/* Header con estilo de PersonalInfoCard */}
        <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-200 rounded flex-shrink-0"></div>
              <div className="h-5 bg-gray-200 rounded w-36 sm:w-44"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-44 mt-1.5 hidden sm:block"></div>
            <div className="h-3 bg-gray-200 rounded w-24 mt-1.5 sm:hidden"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded-lg w-16 sm:w-20 flex-shrink-0"></div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {/* Puntos Clave */}
          <div className="bg-gray-50 border border-gray-200 p-3 rounded-md">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-200 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaseAISummarySkeleton;
