import { useState, useEffect } from 'react';

import CaseInvolved from './CaseInvolved';
import CaseTimeline from './CaseTimeline';
import CaseAISummary from './CaseAISummary';
import CaseDocuments from './CaseDocuments';
import CaseCronologia from './CaseCronologia';
import CaseDetailTabsHeaderSkeleton from '../skeletons/CaseDetailTabsHeaderSkeleton';

function CaseDetailTabs({ caseData, onUpdateCase, onReloadDocuments, isLoading = false, documents = [], isLoadingDocs = false }) {
  const [activeTab, setActiveTab] = useState('resumen');
  const [isLoadingHeader, setIsLoadingHeader] = useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  const [isLoadingInvolved, setIsLoadingInvolved] = useState(true);
  const [isLoadingProtocol, setIsLoadingProtocol] = useState(true);
  const [isLoadingCronologia, setIsLoadingCronologia] = useState(true);

  // Simular carga de cada tab
  useEffect(() => {
    // Resetear estados al cambiar de caso
    setIsLoadingHeader(true);
    setIsLoadingSummary(true);

    setIsLoadingInvolved(true);
    setIsLoadingProtocol(true);
    setIsLoadingCronologia(true);

    // Simular tiempos de carga diferentes para cada tab, pero respetar el isLoading real
    const headerTimer = setTimeout(() => setIsLoadingHeader(false), 600);
    const summaryTimer = setTimeout(() => setIsLoadingSummary(false), 1500);

    const involvedTimer = setTimeout(() => setIsLoadingInvolved(false), 1200);
    const protocolTimer = setTimeout(() => setIsLoadingProtocol(false), 1400);
    const cronologiaTimer = setTimeout(() => setIsLoadingCronologia(false), 1000);

    return () => {
      clearTimeout(headerTimer);
      clearTimeout(summaryTimer);

      clearTimeout(involvedTimer);
      clearTimeout(protocolTimer);
      clearTimeout(cronologiaTimer);
    };
  }, [caseData.id]);

  // Combine real loading with simulated loading
  const effectiveIsLoadingProtocol = isLoading || isLoadingProtocol;

  const effectiveIsLoadingSummary = isLoading || isLoadingSummary;

  const tabs = [
    {
      id: 'resumen',
      label: 'Resumen',
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'protocolo',
      label: 'Protocolo',
      count: caseData.timeline?.length || 0,
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    {
      id: 'involucrados',
      label: 'Involucrados',
      count: caseData.involved?.length || 0,
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 'cronologia',
      label: 'Cronología',
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'documentos',
      label: 'Documentos',
      count: documents.length || 0,
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  return (
    <div className="flex flex-col overflow-hidden rounded-xl shadow-sm border-2 border-gray-300 h-full bg-white">
      {/* Tabs Header */}
      {isLoadingHeader ? (
        <CaseDetailTabsHeaderSkeleton />
      ) : (
        <div className="flex border-b border-gray-200 bg-white px-2 sm:px-4 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all relative whitespace-nowrap ${activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              <span className={`flex-shrink-0 ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400'}`}>
                {tab.icon}
              </span>
              <span className="hidden xs:inline sm:inline">{tab.label}</span>
              <span className="xs:hidden sm:hidden">{tab.label.split(' ')[0]}</span>
              {tab.count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 bg-white rounded-b-xl min-h-[500px] overflow-y-auto">
        {activeTab === 'resumen' && (
          <CaseAISummary caseData={caseData} isLoading={isLoadingSummary} onUpdateCase={onUpdateCase} />
        )}

        {activeTab === 'documentos' && (
          <CaseDocuments
            allFiles={documents}
            isLoading={isLoadingDocs}
            caseId={caseData.id}
            onRefresh={onReloadDocuments}
          />
        )}

        {activeTab === 'cronologia' && (
          <CaseCronologia
            caseId={caseData.id}
            isLoading={isLoading || isLoadingCronologia}
          />
        )}

        {activeTab === 'involucrados' && (
          <CaseInvolved caseData={caseData} onUpdateCase={onUpdateCase} isLoading={isLoading || isLoadingInvolved} />
        )}

        {activeTab === 'protocolo' && (
          <CaseTimeline caseData={caseData} onUpdateCase={onUpdateCase} isLoading={effectiveIsLoadingProtocol} />
        )}
      </div>
    </div>
  );
}

export default CaseDetailTabs;
