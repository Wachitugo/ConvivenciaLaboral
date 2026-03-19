function ChatHeaderSkeleton() {
  return (
    <div className="px-4 py-3 grid grid-cols-3 items-center flex-shrink-0">
      <div className="flex justify-start">
        <div className="w-9 h-9 bg-[#1A71B8]/20 rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>

      <div className="flex justify-center" />

      <div className="flex justify-end items-center gap-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-8 h-8 bg-[#1A71B8]/20 rounded-xl relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChatHeaderSkeleton;
