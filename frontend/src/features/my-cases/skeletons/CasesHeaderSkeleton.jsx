function CasesHeaderSkeleton() {
  return (
    <div className="px-6 py-3 flex-shrink-0 space-y-3 border-b border-gray-200">
      <div className="grid grid-cols-3 items-center">
        {/* Toggle button skeleton a la izquierda */}
        <div className="flex justify-start">
          <div className="w-9 h-9 bg-gray-200 rounded-xl relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
          </div>
        </div>

        {/* Título centrado skeleton */}
        <div className="flex justify-center">
          <div className="h-6 w-48 bg-gray-200 rounded relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
          </div>
        </div>

        {/* Espacio vacío a la derecha */}
        <div></div>
      </div>
    </div>
  );
}

export default CasesHeaderSkeleton;
