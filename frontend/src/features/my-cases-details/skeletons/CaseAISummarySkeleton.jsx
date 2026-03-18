function CaseAISummarySkeleton() {
  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }} className="h-full flex flex-col animate-pulse">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-[#1A71B8]/30 flex items-center justify-between flex-shrink-0 gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white/10 rounded flex-shrink-0"></div>
              <div className="h-5 bg-white/10 rounded-lg w-36 sm:w-44"></div>
            </div>
            <div className="h-3 bg-white/10 rounded w-44 mt-1.5 hidden sm:block"></div>
            <div className="h-3 bg-white/10 rounded w-24 mt-1.5 sm:hidden"></div>
          </div>
          <div className="h-8 bg-white/10 rounded-lg w-16 sm:w-20 flex-shrink-0"></div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {/* Bloque puntos clave */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-4 h-4 bg-white/10 rounded"></div>
              <div className="h-4 bg-white/10 rounded-lg w-28"></div>
            </div>
            <div className="space-y-2.5">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#34B6D8]/30 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-white/10 rounded-lg w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bloque descripción */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-2">
            <div className="h-4 bg-white/10 rounded-lg w-full"></div>
            <div className="h-4 bg-white/10 rounded-lg w-5/6"></div>
            <div className="h-4 bg-white/10 rounded-lg w-4/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaseAISummarySkeleton;
