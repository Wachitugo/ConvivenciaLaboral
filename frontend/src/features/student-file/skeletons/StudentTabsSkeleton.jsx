import React from 'react';

/**
 * Shimmer - Efecto de brillo animado para skeletons
 */
const Shimmer = () => (
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
);

/**
 * StudentTabsSkeleton - Skeleton responsivo para los tabs de navegación
 */
function StudentTabsSkeleton() {
    return (
        <div className="bg-white border-b border-gray-200 px-2 sm:px-4 overflow-x-auto">
            <div className="flex gap-0.5 sm:gap-1 min-w-max">
                {[
                    { mobileW: 'w-16', desktopW: 'sm:w-20' },
                    { mobileW: 'w-20', desktopW: 'sm:w-28' },
                    { mobileW: 'w-10', desktopW: 'sm:w-12' },
                    { mobileW: 'w-18', desktopW: 'sm:w-24' }
                ].map((tab, i) => (
                    <div key={i} className="px-2 sm:px-4 py-2.5 sm:py-3 flex items-center gap-1.5 sm:gap-2">
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gray-200 rounded relative overflow-hidden flex-shrink-0">
                            <Shimmer />
                        </div>
                        <div className={`h-3.5 sm:h-4 bg-gray-200 rounded relative overflow-hidden ${tab.mobileW} ${tab.desktopW}`}>
                            <Shimmer />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default StudentTabsSkeleton;
