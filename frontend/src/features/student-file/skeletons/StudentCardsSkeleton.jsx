import React from 'react';
import StudentCardSkeleton from './StudentCardSkeleton';

function StudentCardsSkeleton({ count = 12 }) {
    return (
        <div className="flex-1 overflow-auto custom-scrollbar bg-white rounded-lg">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {Array.from({ length: count }).map((_, index) => (
                    <StudentCardSkeleton key={index} />
                ))}
            </div>
        </div>
    );
}

export default StudentCardsSkeleton;
