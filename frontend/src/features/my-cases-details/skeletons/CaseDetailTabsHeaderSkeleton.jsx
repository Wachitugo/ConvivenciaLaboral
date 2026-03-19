function CaseDetailTabsHeaderSkeleton() {
  return (
    <div className="flex border-b border-[#1A71B8]/30 bg-black/10 px-2 sm:px-4 overflow-x-auto animate-pulse">
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 sm:py-3"
        >
          <div className="w-4 h-4 bg-white/10 rounded flex-shrink-0"></div>
          <div className="h-3 bg-white/10 rounded w-14 sm:w-20"></div>
        </div>
      ))}
    </div>
  );
}

export default CaseDetailTabsHeaderSkeleton;
