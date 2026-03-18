function CaseGeneralInfoSkeleton() {
  return (
    <div className="flex flex-col bg-[#0A3866]/30 backdrop-blur-3xl border-b border-[#1A71B8]/30 rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] animate-pulse" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-[#1A71B8]/30 flex items-center justify-between flex-shrink-0 gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white/10 rounded flex-shrink-0"></div>
            <div className="h-5 bg-white/10 rounded-lg w-36 sm:w-44"></div>
          </div>
          <div className="h-3 bg-white/10 rounded w-48 mt-1.5 hidden sm:block"></div>
          <div className="h-3 bg-white/10 rounded w-24 mt-1.5 sm:hidden"></div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="h-7 bg-white/10 rounded-lg w-20"></div>
          <div className="h-7 bg-white/10 rounded-lg w-16"></div>
          <div className="h-7 bg-white/10 rounded-lg w-16"></div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Nombre del Caso - ocupa 2 columnas */}
          <div className="col-span-1 sm:col-span-2 bg-white/5 border border-white/10 p-3.5 sm:p-4 rounded-2xl">
            <div className="h-3 bg-white/10 rounded w-24 mb-2"></div>
            <div className="h-5 bg-white/10 rounded-lg w-3/4"></div>
          </div>

          {/* Estado */}
          <div className="bg-white/5 border border-white/10 p-3.5 sm:p-4 rounded-2xl">
            <div className="h-3 bg-white/10 rounded w-16 mb-2"></div>
            <div className="h-7 bg-white/10 rounded-full w-28"></div>
          </div>

          {/* Fecha de creación */}
          <div className="bg-white/5 border border-white/10 p-3.5 sm:p-4 rounded-2xl">
            <div className="h-3 bg-white/10 rounded w-28 mb-2"></div>
            <div className="h-4 bg-white/10 rounded-lg w-24"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaseGeneralInfoSkeleton;
