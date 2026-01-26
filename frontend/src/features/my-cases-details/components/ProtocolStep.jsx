import { getEstadoColor, getEstadoTexto, formatearFecha } from './timelineConstants';
import { calculateDeadlineDate } from '../../../utils/dateUtils';
import StepCompletionForm from './StepCompletionForm';

function ProtocolStep({ paso, index, isLastStep, onComplete, isEditing, onCancelEdit, onSubmitEdit, caseCreatedAt }) {
  return (
    <div className="relative pl-9 group">
      {/* Indicador de estado */}
      <div className={`absolute left-0 top-0 w-8 h-8 rounded-full border-2 border-white shadow-sm transition-all flex items-center justify-center z-10 ${getEstadoColor(paso.estado)}`}>
        {paso.estado === 'completado' && (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {paso.estado === 'pendiente' && (
          <span className="text-xs font-bold text-white">{index + 1}</span>
        )}
      </div>

      {/* Contenido del paso */}
      <div className="pb-">
        {/* Mostrar formulario de edición si está en modo edición */}
        {isEditing ? (
          <StepCompletionForm
            paso={paso}
            onComplete={onSubmitEdit}
            onCancel={onCancelEdit}
          />
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-gray-800">{paso.titulo}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${paso.estado === 'completado'
                ? 'bg-green-100 text-green-700'
                : paso.estado === 'en_progreso'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-stone-100 text-stone-600'
                }`}>
                {getEstadoTexto(paso.estado)}
              </span>
            </div>

            {paso.descripcion && paso.descripcion !== paso.titulo && (
              <p className="text-sm text-gray-600 text-justify leading-relaxed">{paso.descripcion}</p>
            )}

            {paso.estado === 'completado' && paso.fecha && (
              <p className="text-xs text-gray-500 mt-1">
                Completado {formatearFecha(paso.fecha)}
              </p>
            )}

            {/* Mostrar plazo calculado si existe estimated_time y el paso no está completado */}
            {paso.estado !== 'completado' && paso.estimated_time && (
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full border border-orange-200 bg-orange-50 text-orange-700 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {(() => {
                    // Función para calcular fecha límite considerando días hábiles
                    const getHeadlineText = (durationStr) => {
                      // Debugging logs
                      // console.log('ProtocolStep Debug:', { id: paso.id, caseCreatedAt, durationStr });

                      // Si el backend ya calculó una fecha límite, usarla (preferible)
                      // FIX: Usar caseCreatedAt como fecha base si está disponible, sino fallback a now()
                      const baseDate = caseCreatedAt ? new Date(caseCreatedAt) : new Date();

                      // Calculate fresh deadline
                      const freshDeadline = calculateDeadlineDate(durationStr, baseDate);

                      // If we have a fresh calculation relative to Case Creation, stick with it (fixes stale backend dates)
                      if (caseCreatedAt && freshDeadline) {
                        return `Vence: ${freshDeadline.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })} (${durationStr})`;
                      }

                      // Fallback to backend deadline if available and we couldn't recalculate
                      if (paso.deadline) {
                        const backendDate = new Date(paso.deadline);
                        if (!isNaN(backendDate.getTime())) {
                          return `Vence: ${backendDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })} (${durationStr})`;
                        }
                      }

                      // Final fallback
                      if (!freshDeadline) return durationStr;
                      return `Vence: ${freshDeadline.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })} (${durationStr})`;
                    };

                    return getHeadlineText(paso.estimated_time);
                  })()}
                </span>
              </div>
            )}

            {paso.files && paso.files.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {paso.files.map(file => (
                  <div key={file.id} className="flex items-center gap-1.5 px-2 py-1 bg-stone-100 text-stone-600 rounded text-xs hover:bg-stone-200 transition-colors cursor-pointer">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{file.name}</span>
                  </div>
                ))}
              </div>
            )}

            {(paso.estado === 'pendiente' || paso.estado === 'en_progreso') && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={onComplete}
                  className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Completar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProtocolStep;
