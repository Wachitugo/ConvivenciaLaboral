function SuggestionCardsSkeleton() {
  return (
    <div className="mb-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-4 bg-[#0A3866]/40 border border-[#1A71B8]/30 rounded-2xl"
        >
          {/* Icon */}
          <div className="w-10 h-10 shrink-0 bg-[#1A71B8]/20 rounded-xl relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="h-3.5 bg-[#1A71B8]/20 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="h-2.5 w-3/4 bg-[#1A71B8]/10 rounded-md relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          </div>

          {/* Arrow */}
          <div className="w-3.5 h-3.5 shrink-0 bg-[#1A71B8]/20 rounded relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default SuggestionCardsSkeleton;
