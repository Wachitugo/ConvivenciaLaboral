function ChatHeaderSkeleton() {
  return (
    <div className="px-6 py-3 grid grid-cols-3 border-b border-gray-200 items-center flex-shrink-0">
      {/* Botón izquierdo skeleton */}
      <div className="flex justify-start">
        <div className="w-9 h-9 bg-gray-200 rounded-lg relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
        </div>
      </div>

      {/* Título centrado skeleton */}
      <div className="flex justify-center">
        <div className="h-6 w-40 bg-gray-200 rounded relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
        </div>
      </div>

    
    </div>
  );
}

export default ChatHeaderSkeleton;
