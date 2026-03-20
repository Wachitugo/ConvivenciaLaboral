import { getEstadoColor, getEstadoTexto, formatearFecha } from './timelineConstants';
import { calculateDeadlineDate } from '../../../utils/dateUtils';
import StepCompletionForm from './StepCompletionForm';

function ProtocolStep({ paso, index, isLastStep, onComplete, isEditing, onCancelEdit, onSubmitEdit, caseCreatedAt }) {
  return (
    <div className="relative pl-9 group" data-tour={index <= 1 ? `protocolo-step-${index}` : undefined}>
      {/* Indicador de estado */}
      <div className={`absolute left-0 top-0 w-8 h-8 rounded-full border-2 border-[#0A3866] shadow-[0_0_8px_rgba(0,0,0,0.5)] transition-all flex items-center justify-center z-10 ${getEstadoColor(paso.estado)}`}>
        {paso.estado === 'completado' && (
          <svg className="w-4 h-4 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {paso.estado === 'pendiente' && (
          <span className="text-[10px] font-bold text-white/80">{index + 1}</span>
        )}
      </div>

      {/* Contenido del paso */}
      <div className="pb-8">
        {/* Mostrar formulario de edición si está en modo edición */}
        {isEditing ? (
          <StepCompletionForm
            paso={paso}
            onComplete={onSubmitEdit}
            onCancel={onCancelEdit}
          />
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-white tracking-wide">{paso.titulo}</h3>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${paso.estado === 'completado'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : paso.estado === 'en_progreso'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-white/10 text-white/60 border border-white/20'
                  }`}>
                  {getEstadoTexto(paso.estado)}
                </span>
              </div>
              
              {paso.estado !== 'completado' && paso.status !== 'completed' && (
                <button
                  onClick={onComplete}
                  className="px-3 py-1.5 text-xs uppercase tracking-wider font-bold text-[#34B6D8] border border-[#34B6D8]/50 hover:bg-[#34B6D8]/10 hover:border-[#34B6D8] hover:text-white hover:shadow-[0_0_12px_rgba(52,182,216,0.5)] rounded-lg transition-all ml-auto bg-[#34B6D8]/5"
                >
                  Completar
                </button>
              )}
            </div>

            {paso.descripcion && paso.descripcion !== paso.titulo && (
              <p className="text-sm text-white/80 text-justify leading-relaxed">{paso.descripcion}</p>
            )}

            {paso.estado === 'completado' && (
              <div className="flex items-center gap-1.5 mt-1">
                <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs text-emerald-400 font-semibold">
                  Completado {paso.fecha ? formatearFecha(paso.fecha) : 'recientemente'}
                </span>
              </div>
            )}

            {/* Mostrar plazo calculado si existe estimated_time y el paso no está completado */}
            {paso.estado !== 'completado' && paso.estimated_time && !/ver documento/i.test(paso.estimated_time) && (
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full border border-orange-500/40 bg-orange-500/10 text-orange-300 flex items-center gap-1.5 uppercase font-bold tracking-wider">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {(() => {
                    const durationStr = paso.estimated_time;

                    // Prioridad 1: deadline calculado por el backend (incluye lógica post-investigación)
                    if (paso.deadline) {
                      const backendDate = new Date(paso.deadline);
                      if (!isNaN(backendDate.getTime())) {
                        return `Vence: ${backendDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })} (${durationStr})`;
                      }
                    }

                    // Prioridad 2: calcular desde creación del caso (fallback para protocolos sin deadline guardado)
                    const baseDate = caseCreatedAt ? new Date(caseCreatedAt) : new Date();
                    const freshDeadline = calculateDeadlineDate(durationStr, baseDate);
                    if (!freshDeadline) return durationStr;
                    return `Vence: ${freshDeadline.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })} (${durationStr})`;
                  })()}
                </span>
              </div>
            )}

            {paso.files && paso.files.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {paso.files.map(file => (
                  <div key={file.id} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/30 text-white/80 border border-white/20 rounded-lg text-xs font-bold hover:bg-white/10 hover:text-white hover:border-white/30 transition-all cursor-pointer shadow-inner">
                    <svg className="w-4 h-4 text-[#34B6D8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{file.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProtocolStep;
