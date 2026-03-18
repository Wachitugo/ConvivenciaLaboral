import { useState } from 'react';
import ShareCaseModal from './ShareCaseModal';
import GlowEffect from '../../components/GlowEffect';

function CaseCard({ student: caseItem, onSelect, onEdit, onShare }) {
  const [isHoveringShared, setIsHoveringShared] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getStatusConfig = (status) => {
    const configs = {
      'pendiente': {
        label: 'Pendiente',
        bgColor: 'bg-[#f59e0b]/10',
        textColor: 'text-[#d97706]',
        dotColor: 'bg-[#d97706]',
        borderColor: 'border-[#f59e0b]/30',
        accentColor: '#f59e0b',
      },
      'abierto': {
        label: 'Abierto',
        bgColor: 'bg-[#1A71B8]/10',
        textColor: 'text-[#1A71B8]',
        dotColor: 'bg-[#1A71B8]',
        borderColor: 'border-[#1A71B8]/20',
        accentColor: '#1A71B8',
      },
      'resuelto': {
        label: 'Resuelto',
        bgColor: 'bg-[#10b981]/10',
        textColor: 'text-[#059669]',
        dotColor: 'bg-[#059669]',
        borderColor: 'border-[#10b981]/30',
        accentColor: '#10b981',
      },
      'no_resuelto': {
        label: 'No Resuelto',
        bgColor: 'bg-[#ef4444]/10',
        textColor: 'text-[#dc2626]',
        dotColor: 'bg-[#dc2626]',
        borderColor: 'border-[#ef4444]/20',
        accentColor: '#ef4444',
      }
    };
    return configs[status] || configs['pendiente'];
  };

  const statusConfig = getStatusConfig(caseItem.status);

  const getDeadlineColor = (status) => {
    if (status === 'red') return '#dc2626';
    if (status === 'yellow') return '#d97706';
    return '#059669';
  };

  const deadlineColor = getDeadlineColor(caseItem.deadlineStatus);

  return (
    <>
      <div className="relative h-full">
        {isHovered && (
          <GlowEffect
            colors={[statusConfig.accentColor ?? '#1A71B8', '#34B6D8', '#0A3866', '#1A71B8']}
            mode="rotate"
            blur="strong"
            scale={1.02}
            duration={4}
            className="opacity-10"
          />
        )}
        <div
          key={caseItem.id}
          onClick={() => onSelect(caseItem)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className=" border border-[#e2e8f0] p-4 hover:bg-[#f8fafc] hover:border-[#1A71B8]/20 transition-all duration-150 group flex flex-col relative cursor-pointer h-full"
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          {/* Semáforo de plazos Protocolo */}
          {caseItem.deadlineStatus && caseItem.deadlineStatus !== 'none' && (
            <div
              className="flex max-w-full items-center justify-between gap-2 rounded-full mb-1 transition-all duration-200"
              style={{ color: deadlineColor }}
              title={caseItem.deadlineText || "Estado de plazos del protocolo"}
            >
              <div className="flex items-center gap-1.5">
                {caseItem.deadlineStatus === 'red' && caseItem.deadlineText?.includes('Venció') && (
                  <svg className="w-3.5 h-3.5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: deadlineColor }}
                />
                {caseItem.deadlineText && (
                  <span className="text-[12px] font-semibold whitespace-nowrap opacity-90">
                    {caseItem.deadlineText}
                  </span>
                )}
              </div>
              <span className={`text-md px-3 font-bold ${caseItem.deadlineStatus === 'red' ? 'animate-bounce' : caseItem.deadlineStatus === 'yellow' ? 'animate-pulse' : ''}`}>
                !
              </span>
            </div>
          )}

          {/* Primera fila: título y botones de acción */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="text-left flex-1 min-w-0">
              <h3 className="font-semibold text-[#0f172a] group-hover:text-[#1A71B8] transition-colors text-sm line-clamp-2">
                {caseItem.title}
              </h3>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(caseItem);
                }}
                className="p-1.5 rounded-lg text-[#64748b] hover:text-[#1A71B8] hover:bg-[#f0f4f8] transition-colors"
                title="Editar caso"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsShareModalOpen(true);
                }}
                className="p-1.5 rounded-lg text-[#64748b] hover:text-[#1A71B8] hover:bg-[#f0f4f8] transition-colors"
                title="Compartir caso"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Segunda fila: involucrados, fecha y estados */}
          <div className="flex items-center justify-between gap-3 mt-auto">
            <div className="flex items-center gap-3 text-xs text-[#64748b]">
              {caseItem.counterCase && (
                <span className="text-[12px] text-[#0f172a] font-mono bg-[#f0f4f8] px-1.5 py-0.5 rounded border border-[#e2e8f0]">
                  {caseItem.counterCase}
                </span>
              )}

              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className='text-[12px]'>{caseItem.involved?.length || 0}</span>
              </div>

              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className='text-[12px]'>{new Date(caseItem.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Indicadores derechos */}
            <div className="flex items-center gap-1.5">
              {/* Indicador de compartido POR TI */}
              {caseItem.isSharedByMe && (
                <div className="relative">
                  <div
                    onMouseEnter={() => setIsHoveringShared(true)}
                    onMouseLeave={() => setIsHoveringShared(false)}
                    className="flex items-center border border-[#1A71B8]/20 gap-1 bg-[#1A71B8]/10 px-2 py-0.5 shadow-sm rounded-xl cursor-pointer"
                  >
                    <svg className="w-3 h-3 text-[#1A71B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </div>
                  {isHoveringShared && caseItem.sharedWith?.length > 0 && (
                    <div className="absolute bottom-full right-0 mb-1.5 w-max bg-white border border-[#e2e8f0] text-[#0f172a] text-xs rounded-xl py-1.5 px-2.5 shadow-[0_4px_16px_rgba(10,56,102,0.12)] z-10">
                      <p className="font-semibold mb-0.5 text-[#0A3866]">Compartido con:</p>
                      <ul className="space-y-0.5 text-[#475569]">
                        {caseItem.sharedWith.map(user => <li key={user.id}>• {user.name}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Indicador de compartido CONTIGO */}
              {caseItem.isSharedWithMe && (
                <div className="relative">
                  <div
                    className="flex items-center border border-[#1A71B8]/20 gap-1 bg-[#1A71B8]/10 px-2 py-0.5 shadow-sm rounded-xl"
                    title={`Compartido por ${caseItem.ownerName || 'otro usuario'}`}
                  >
                    <svg className="w-3 h-3 text-[#1A71B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    {caseItem.ownerName && (
                      <span className="text-[10px] text-[#1A71B8] font-medium max-w-[80px] truncate">
                        de {caseItem.ownerName.split(' ')[0]}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Indicador de estado */}
              <div
                className={`flex items-center gap-1 px-2 py-0.5 border rounded-xl shadow-sm ${statusConfig.borderColor} ${statusConfig.bgColor}`}
                title={`Estado: ${statusConfig.label}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                <span className={`text-[10px] font-semibold ${statusConfig.textColor}`}>
                  {statusConfig.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ShareCaseModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        caseData={caseItem}
      />
    </>
  );
}

export default CaseCard;
