import React from 'react';

function StudentTabsSkeleton() {
    return (
        <div className="flex border-b border-gray-200 bg-white px-4 animate-pulse">
            {[1, 2, 3, 4].map((_, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-3">
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
            ))}
        </div>
    );
}

export default StudentTabsSkeleton;
