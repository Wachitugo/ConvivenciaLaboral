import React from 'react';
import StudentCardSkeleton from './StudentCardSkeleton';

function StudentCardsSkeleton({ count = 12 }) {
    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-3">
                {Array.from({ length: count }).map((_, index) => (
                    <StudentCardSkeleton key={index} />
                ))}
            </div>
        </div>
    );
}

export default StudentCardsSkeleton;
