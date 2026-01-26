function WelcomeMessageSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center w-full px-4 py-4">
      {/* Ícono skeleton */}
      <div className="flex justify-center mb-8">
        <div className="w-48 h-48 bg-gray-200 rounded-full relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
        </div>
      </div>

      {/* Título skeleton */}
      <div className="h-9 w-80 bg-gray-200 rounded relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
      </div>
    </div>
  );
}

export default WelcomeMessageSkeleton;
