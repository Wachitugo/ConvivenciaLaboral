function ChatInterfaceGeneralSkeleton() {
  return (
    <div className="relative">
      {/* Input Skeleton */}
      <div className="flex items-center gap-3 pl-4 pr-5 py-4 rounded-full border border-gray-200 bg-white">
        {/* Iconos de botones izquierda */}
        <div className="w-5 h-5 bg-gray-200 rounded-full relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
        </div>
        <div className="w-5 h-5 bg-gray-200 rounded-full relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
        </div>
     

        {/* Área de texto placeholder */}
        <div className="flex-1 h-5 bg-gray-100 rounded relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
        </div>

        {/* Botón enviar */}
        <div className="w-5 h-5 bg-gray-200 rounded-full relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
        </div>
      </div>
    </div>
  );
}

export default ChatInterfaceGeneralSkeleton;
