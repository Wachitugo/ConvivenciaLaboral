import React from 'react';
import PersonalInfoCardSkeleton from './PersonalInfoCardSkeleton';
import StudentTabsSkeleton from './StudentTabsSkeleton';
import TabContentSkeleton from './TabContentSkeleton';

function StudentDetailPageSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            {/* Breadcrumb Skeleton */}
            <div className="flex items-center gap-2">
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-4 w-4 bg-gray-100 rounded"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>

            {/* PersonalInfoCard Skeleton */}
            <PersonalInfoCardSkeleton />

            {/* Tabs Container Skeleton */}
            <div className="bg-white rounded-xl border-2 border-gray-300 shadow-md overflow-hidden">
                <StudentTabsSkeleton />
                <TabContentSkeleton />
            </div>
        </div>
    );
}

export default StudentDetailPageSkeleton;
