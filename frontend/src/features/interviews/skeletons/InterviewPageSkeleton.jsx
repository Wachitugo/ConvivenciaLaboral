import InterviewHeaderSkeleton from './InterviewHeaderSkeleton';
import InterviewToolbarSkeleton from './InterviewToolbarSkeleton';
import InterviewTableSkeleton from './InterviewTableSkeleton';

function InterviewPageSkeleton() {
  return (
    <div className="flex-1 flex flex-col rounded-lg shadow-sm shadow-cyan-600/20 bg-white border border-gray-300 transition-all duration-300 overflow-hidden">
      <InterviewHeaderSkeleton />
      <InterviewToolbarSkeleton />
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        <InterviewTableSkeleton />
      </div>
    </div>
  );
}

export default InterviewPageSkeleton;
