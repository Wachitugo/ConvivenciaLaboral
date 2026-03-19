function ChatInterfaceGeneralSkeleton() {
  return (
    <div className="relative">
      {/* Input container */}
      <div className="rounded-2xl border border-[#1A71B8]/30 bg-[#0A3866]/40 overflow-hidden">

        {/* Upper row: paperclip + textarea */}
        <div className="flex items-start gap-3 px-4 pt-4 pb-2">
          <div className="w-5 h-5 mt-1 bg-[#1A71B8]/20 rounded-full relative overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          <div className="flex-1 h-10 bg-[#1A71B8]/10 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-[#1A71B8]/20" />

        {/* Bottom row: mic | divider | quick tags | send button */}
        <div className="flex items-center justify-between px-4 py-3 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-[#1A71B8]/20 rounded-full relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="w-px h-4 bg-[#1A71B8]/20" />
            <div className="hidden sm:flex items-center gap-2">
              {['w-28', 'w-20', 'w-24'].map((w, i) => (
                <div key={i} className={`h-6 ${w} bg-[#1A71B8]/20 rounded-full relative overflow-hidden`}>
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              ))}
            </div>
          </div>

          <div className="h-8 w-24 bg-[#1A71B8]/30 rounded-xl relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatInterfaceGeneralSkeleton;
