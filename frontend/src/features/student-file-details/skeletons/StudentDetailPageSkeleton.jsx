import React from 'react';
import PersonalInfoCardSkeleton from './PersonalInfoCardSkeleton';
import StudentTabsSkeleton from './StudentTabsSkeleton';
import TabContentSkeleton from './TabContentSkeleton';

function StudentDetailPageSkeleton() {
    return (
        <div className="space-y-4">
            {/* PersonalInfoCard Skeleton */}
            <PersonalInfoCardSkeleton />

            {/* Tabs Container Skeleton */}
            <div className="flex flex-col rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] border border-[#1A71B8]/30 bg-[#0A3866]/30 backdrop-blur-3xl overflow-hidden">
                <StudentTabsSkeleton />
                <div className="bg-white/5 rounded-b-3xl">
                    <TabContentSkeleton />
                </div>
            </div>
        </div>
    );
}

export default StudentDetailPageSkeleton;
