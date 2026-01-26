function SuggestionCardsSkeleton() {
  return (
    <div className="mb-3 flex flex-wrap gap-2 justify-center">
      {/* Skeleton buttons que imitan las suggestion cards */}
      <div className="px-3 py-1.5 h-8 w-48 bg-gray-200 border border-gray-200 rounded-full relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
      </div>
      <div className="px-3 py-1.5 h-8 w-64 bg-gray-200 border border-gray-200 rounded-full relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
      </div>
      <div className="px-3 py-1.5 h-8 w-40 bg-gray-200 border border-gray-200 rounded-full relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
      </div>
      <div className="px-3 py-1.5 h-8 w-56 bg-gray-200 border border-gray-200 rounded-full relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
      </div>   <div className="px-3 py-1.5 h-8 w-56 bg-gray-200 border border-gray-200 rounded-full relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
      </div>   <div className="px-3 py-1.5 h-8 w-56 bg-gray-200 border border-gray-200 rounded-full relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
      </div>
    </div>
  );
}

export default SuggestionCardsSkeleton;
