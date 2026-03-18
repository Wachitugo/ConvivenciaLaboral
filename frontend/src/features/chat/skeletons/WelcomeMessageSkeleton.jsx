function Shimmer() {
  return (
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  );
}

function WelcomeMessageSkeleton() {
  return (
    <div className="flex flex-col w-full px-2 pb-28 relative">
      {/* Label "Asistente Inteligente" */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-px bg-[#1A71B8]/30" />
        <div className="h-3 w-44 bg-[#1A71B8]/20 rounded-full relative overflow-hidden">
          <Shimmer />
        </div>
        <div className="w-2.5 h-2.5 rounded-full bg-[#1A71B8]/30" />
      </div>

      {/* Heading grande */}
      <div className="mb-6 space-y-3">
        <div className="h-16 w-72 bg-[#1A71B8]/20 rounded-2xl relative overflow-hidden">
          <Shimmer />
        </div>
        <div className="h-16 w-96 bg-[#1A71B8]/20 rounded-2xl relative overflow-hidden">
          <Shimmer />
        </div>
        <div className="h-16 w-64 bg-[#1A71B8]/20 rounded-2xl relative overflow-hidden">
          <Shimmer />
        </div>
      </div>

      {/* Subtítulo */}
      <div className="space-y-2 max-w-xl">
        <div className="h-5 w-full bg-[#1A71B8]/10 rounded-lg relative overflow-hidden">
          <Shimmer />
        </div>
        <div className="h-5 w-3/4 bg-[#1A71B8]/10 rounded-lg relative overflow-hidden">
          <Shimmer />
        </div>
      </div>
    </div>
  );
}

export default WelcomeMessageSkeleton;
