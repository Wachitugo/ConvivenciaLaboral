import React from 'react';

const InterviewTabs = ({ activeTab, setActiveTab }) => {
    const tabs = [
        {
            id: 'entrevista',
            label: 'Entrevista',
            icon: (
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            )
        },
        {
            id: 'autorización',
            label: 'Autorización',
            icon: (
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            id: 'resumen',
            label: 'Resumen',
            icon: (
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        }
    ];

    return (
        <div className="flex border-b border-[#1A71B8]/30 bg-black/10 px-2 sm:px-4 overflow-x-auto scrollbar-hide relative z-10">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === tab.id
                        ? 'text-white border-b-2 border-[#34B6D8] -mb-px bg-white/5 drop-shadow-[0_0_8px_rgba(52,182,216,0.6)]'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                        }`}
                >
                    <span className={`flex-shrink-0 ${activeTab === tab.id ? 'text-[#34B6D8] drop-shadow-[0_0_8px_rgba(52,182,216,0.6)]' : 'text-white/40'}`}>
                        {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                </button>
            ))}
        </div>
    );
};

export default InterviewTabs;
