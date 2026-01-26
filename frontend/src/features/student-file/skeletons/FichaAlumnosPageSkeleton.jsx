import StudentHeaderSkeleton from './StudentHeaderSkeleton';
import StudentToolbarSkeleton from './StudentToolbarSkeleton';
import StudentCardsSkeleton from './StudentCardsSkeleton';

function FichaAlumnosPageSkeleton() {
    return (
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm shadow-cyan-600/20 border border-gray-300 transition-all duration-300 overflow-hidden">
            <StudentHeaderSkeleton />
            <StudentToolbarSkeleton />
            <div className="flex-1 px-3 sm:px-6 pb-4 sm:pb-6 overflow-y-auto">
                <StudentCardsSkeleton count={18} />
            </div>
        </div>
    );
}

export default FichaAlumnosPageSkeleton;
