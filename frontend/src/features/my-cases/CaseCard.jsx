import { useState } from 'react';
import ShareCaseModal from './ShareCaseModal';

function CaseCard({ student: caseItem, onSelect, onEdit, onShare }) {
  const [isHoveringShared, setIsHoveringShared] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Configuración de colores y labels para cada estado
  const getStatusConfig = (status) => {
    const configs = {
      'pendiente': {
        label: 'Pendiente',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        dotColor: 'bg-yellow-500',
        borderColor: 'border-yellow-200'
      },
      'abierto': {
        label: 'Abierto',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        dotColor: 'bg-blue-500',
        borderColor: 'border-blue-200'
      },
      'resuelto': {
        label: 'Resuelto',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        dotColor: 'bg-green-500',
        borderColor: 'border-green-200'
      },
      'no_resuelto': {
        label: 'No Resuelto',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        dotColor: 'bg-red-500',
        borderColor: 'border-red-200'
      }
    };
    return configs[status] || configs['pendiente'];
  };

  const statusConfig = getStatusConfig(caseItem.status);

  return (
    <>
      <div
        key={caseItem.id}
        onClick={() => onSelect(caseItem)}
        className="shadow-md border-2 border-gray-300 rounded-lg p-4 hover:border-blue-400 hover:shadow-lg transition-all duration-150 group flex flex-col relative cursor-pointer"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >  {caseItem.deadlineStatus && caseItem.deadlineStatus !== 'none' && (
        <div
          className={`flex max-w-full items-center justify-between gap-2 rounded-full mb-1 transition-all duration-200 ${caseItem.deadlineStatus === 'red'
            ? ' text-red-800'
            : caseItem.deadlineStatus === 'yellow'
              ? ' text-yellow-800'
              : ' text-green-700'
            }`}
          title={caseItem.deadlineText || "Estado de plazos del protocolo"}
        >
          {/* Lado izquierdo: icono + punto + texto */}
          <div className="flex items-center gap-1.5">
            {/* Icono de alerta para casos críticos (vencidos) */}
            {caseItem.deadlineStatus === 'red' && caseItem.deadlineText?.includes('Venció') && (
              <svg
                className="w-3.5 h-3.5 animate-pulse"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}

            {/* Punto de color del semáforo */}
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${caseItem.deadlineStatus === 'red'
              ? 'bg-red-600'
              : caseItem.deadlineStatus === 'yellow'
                ? 'bg-yellow-600'
                : 'bg-green-600'
              }`} />

            {caseItem.deadlineText && (
              <span className="text-[12px] font-semibold whitespace-nowrap">
                {caseItem.deadlineText}
              </span>
            )}
          </div>

          {/* Lado derecho: signo de exclamación con animación */}
          <span className={`text-md px-3 font-bold ${caseItem.deadlineStatus === 'red'
            ? 'text-red-600 animate-bounce'
            : caseItem.deadlineStatus === 'yellow'
              ? 'text-yellow-600 animate-pulse'
              : 'text-green-600'
            }`}>
            !
          </span>
        </div>
      )}
        {/* Primera fila: título y botones de acción */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div
            className="text-left flex-1 min-w-0"
          >
            {/* Semáforo de plazos Protocolo (Ahora arriba a la izquierda) */}


            <h3 className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors text-sm line-clamp-2">
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
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Editar caso"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsShareModalOpen(true);
              }}
              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Compartir caso"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Segunda fila: involucrados, fecha y estados */}
        <div className="flex items-center justify-between gap-3 mt-auto">
          {/* Información izquierda: involucrados, counter y fecha */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {caseItem.counterCase && (
              <span className="text-[12px] text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-stone-200">
                {caseItem.counterCase}
              </span>
            )}

            <div className="flex items-center gap-1">
              <svg className="w-4 h-4  text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className='text-[12px] text-gray-500 '>{caseItem.involved.length}</span>
            </div>

            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className='text-[12px] text-gray-500 '>{new Date(caseItem.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Indicadores derechos: compartido y estado */}
          <div className="flex items-center gap-1.5">
            {/* Indicador de compartido POR TI */}
            {caseItem.isSharedByMe && (
              <div className="relative">
                <div
                  onMouseEnter={() => setIsHoveringShared(true)}
                  onMouseLeave={() => setIsHoveringShared(false)}
                  className="flex items-center border border-purple-200  gap-1 bg-purple-100 px-2 py-0.5 shadow-sm rounded-xl cursor-pointer"
                >
                  <svg
                    className="w-3 h-3 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                </div>
                {isHoveringShared && caseItem.sharedWith?.length > 0 && (
                  <div className="absolute bottom-full right-0 mb-1.5 w-max bg-gray-900 text-white text-xs rounded py-1.5 px-2.5 shadow-lg z-10">
                    <p className="font-medium mb-0.5 text-gray-300">Compartido con:</p>
                    <ul className="space-y-0.5">
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
                  className="flex items-center border border-blue-200 gap-1 bg-blue-100 px-2 shadow-sm rounded-xl"
                  title={`Compartido por ${caseItem.ownerName || 'otro usuario'}`}
                >
                  <svg
                    className="w-3 h-3 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                  {caseItem.ownerName && (
                    <span className="text-[10px] text-blue-900 max-w-[80px] truncate">de {caseItem.ownerName.split(' ')[0]}</span>
                  )}
                </div>
              </div>
            )}

            {/* Indicador de estado */}
            <div
              className={`flex items-center gap-1 px-2 border rounded-xl shadow-sm ${statusConfig.borderColor} ${statusConfig.bgColor}`}
              title={`Estado: ${statusConfig.label}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
              <span className={`text-[10px] font-medium ${statusConfig.textColor}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de compartir */}
      <ShareCaseModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        caseData={caseItem}
      />
    </>
  );
}
export default CaseCard;
