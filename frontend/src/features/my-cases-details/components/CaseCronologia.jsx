import { useState, useEffect } from 'react';
import { casesService } from '../../../services/api';
import CaseCronologiaSkeleton from '../skeletons/CaseCronologiaSkeleton';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('CaseCronologia');

// Iconos para cada tipo de evento
const EventIcon = ({ type, className = "w-5 h-5" }) => {
  switch (type) {
    case 'case_created':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      );
    case 'document':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    case 'email':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    default:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

// Colores para cada tipo de evento
const getEventColors = (type) => {
  switch (type) {
    case 'case_created':
      return {
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-300',
        border: 'border-emerald-500/30',
        dot: 'bg-emerald-400'
      };
    case 'document':
      return {
        bg: 'bg-blue-500/20',
        text: 'text-blue-300',
        border: 'border-blue-500/30',
        dot: 'bg-blue-400'
      };
    case 'email':
      return {
        bg: 'bg-yellow-500/20',
        text: 'text-yellow-300',
        border: 'border-yellow-500/30',
        dot: 'bg-yellow-400'
      };
    case 'calendar':
      return {
        bg: 'bg-purple-500/20',
        text: 'text-purple-300',
        border: 'border-purple-500/30',
        dot: 'bg-purple-400'
      };
    default:
      return {
        bg: 'bg-white/10',
        text: 'text-white/70',
        border: 'border-white/20',
        dot: 'bg-white/50'
      };
  }
};

// Etiquetas para cada tipo de evento
const getEventLabel = (type) => {
  switch (type) {
    case 'case_created':
      return 'Inicio';
    case 'document':
      return 'Documento';
    case 'email':
      return 'Correo';
    case 'calendar':
      return 'Agendamiento';
    default:
      return 'Evento';
  }
};

// Formatear fecha y hora
const formatDateTime = (timestamp) => {
  if (!timestamp) return { date: 'Sin fecha', time: '' };

  try {
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return { date: dateStr, time: timeStr };
  } catch {
    return { date: 'Sin fecha', time: '' };
  }
};

// Formatear fecha completa para el modal
const formatFullDateTime = (timestamp) => {
  if (!timestamp) return 'Sin fecha';
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Sin fecha';
  }
};

// Modal de detalle para correos y agendamientos
const EventDetailModal = ({ event, onClose }) => {
  if (!event) return null;

  const colors = getEventColors(event.type);
  const isEmail = event.type === 'email';
  const isCalendar = event.type === 'calendar';

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del modal */}
        <div className={`px-6 py-4 border-b border-gray-100 flex items-center justify-between ${colors.bg}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-white/80 ${colors.text}`}>
              <EventIcon type={event.type} className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${colors.text}`}>
                {isEmail ? 'Correo Enviado' : 'Evento Agendado'}
              </h3>
              <p className="text-sm text-gray-600">
                {formatFullDateTime(event.timestamp)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/50 text-gray-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido del modal */}
        <div className="flex-1 overflow-y-auto p-6">
          {isEmail && (
            <div className="space-y-4">
              {/* Asunto */}
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Asunto</label>
                <p className="text-lg font-semibold text-gray-900 mt-1">{event.metadata?.subject || event.title}</p>
              </div>

              {/* Destinatario */}
              <div className="flex gap-6">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Para</label>
                  <p className="text-sm text-gray-700 mt-1">{event.metadata?.to || '-'}</p>
                </div>
                {event.metadata?.cc && event.metadata.cc.length > 0 && (
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">CC</label>
                    <p className="text-sm text-gray-700 mt-1">{event.metadata.cc.join(', ')}</p>
                  </div>
                )}
              </div>

              {/* Remitente */}
              {event.metadata?.sender && (
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Enviado desde</label>
                  <p className="text-sm text-gray-700 mt-1">
                    {event.metadata.sender_name ? `${event.metadata.sender_name} <${event.metadata.sender}>` : event.metadata.sender}
                  </p>
                </div>
              )}

              {/* Cuerpo del correo */}
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Mensaje</label>
                <div className="mt-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {event.metadata?.body || 'Sin contenido'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {isCalendar && (
            <div className="space-y-4">
              {/* Título del evento */}
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Evento</label>
                <p className="text-lg font-semibold text-gray-900 mt-1">{event.metadata?.summary || event.title}</p>
              </div>

              {/* Fecha y hora */}
              <div className="flex gap-6">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Inicio</label>
                  <p className="text-sm text-gray-700 mt-1">
                    {event.metadata?.start_time ? formatFullDateTime(event.metadata.start_time) : '-'}
                  </p>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Término</label>
                  <p className="text-sm text-gray-700 mt-1">
                    {event.metadata?.end_time ? formatFullDateTime(event.metadata.end_time) : '-'}
                  </p>
                </div>
              </div>

              {/* Invitados */}
              {event.metadata?.attendees && event.metadata.attendees.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Invitados</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {event.metadata.attendees.map((attendee, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                        {attendee}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Descripción */}
              {event.metadata?.description && (
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Descripción</label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {event.metadata.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

function CaseCronologia({ caseId, isLoading = false }) {
  const [events, setEvents] = useState([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const loadTimeline = async () => {
      if (!caseId) return;

      try {
        setIsLoadingTimeline(true);
        setError(null);

        const usuarioData = JSON.parse(localStorage.getItem('usuario'));
        if (!usuarioData) {
          setError('Usuario no autenticado');
          return;
        }

        const response = await casesService.getCaseTimeline(caseId, usuarioData.id);
        setEvents(response.events || []);
        logger.info(`Loaded ${response.total || 0} timeline events`);
      } catch (err) {
        logger.error('Error loading timeline:', err);
        setError('Error al cargar la cronología');
      } finally {
        setIsLoadingTimeline(false);
      }
    };

    loadTimeline();
  }, [caseId]);

  const handleEventClick = (event) => {
    // Solo abrir modal para correos y agendamientos
    if (event.type === 'email' || event.type === 'calendar') {
      setSelectedEvent(event);
    }
  };

  // Mostrar skeleton mientras carga
  if (isLoading || isLoadingTimeline) {
    return <CaseCronologiaSkeleton />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-[#1A71B8]/30 flex items-center justify-between flex-shrink-0 gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#34B6D8] drop-shadow-[0_0_8px_rgba(52,182,216,0.6)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="truncate">Cronología</span>
            {events.length > 0 && (
              <span className="text-xs sm:text-sm text-white/50 font-normal">({events.length})</span>
            )}
          </h3>
          <p className="text-xs sm:text-sm text-white/50 mt-0.5 truncate">
            <span className="hidden sm:inline">Historial de actividades del caso</span>
            <span className="sm:hidden">Actividades del caso</span>
          </p>
        </div>
      </div>

      {/* Contenido */}
      {error ? (
        <div className="flex-1 flex items-center justify-center p-8 min-h-0">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-900/30 border border-red-500/50 flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-red-200">{error}</p>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8 min-h-0">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
              <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-base font-bold text-white mb-1">No hay actividades registradas</p>
            <p className="text-xs text-white/60 mt-1 uppercase tracking-widest leading-relaxed">Los documentos, correos y agendamientos aparecerán aquí</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 min-h-0">
          <div className="relative">
            {/* Línea vertical del timeline */}
            <div className="absolute left-[18px] top-3 bottom-3 w-0.5 bg-white/10"></div>

            <div className="space-y-4">
              {events.map((event, index) => {
                const colors = getEventColors(event.type);
                const { date, time } = formatDateTime(event.timestamp);
                const label = getEventLabel(event.type);
                const isClickable = event.type === 'email' || event.type === 'calendar';

                return (
                  <div key={index} className="relative pl-10">
                    {/* Círculo indicador en la línea */}
                    <div className={`absolute left-2.5 top-4 w-3 h-3 rounded-full ${colors.dot} ring-4 ring-[#0A3866]/80 shadow-[0_0_8px_currentColor]`}></div>

                    {/* Card del evento */}
                    <div
                      className={`p-3 border ${colors.border} rounded-xl bg-white/5 backdrop-blur-md transition-all ${isClickable
                        ? 'cursor-pointer hover:bg-white/10 hover:scale-[1.01] active:scale-[0.99] hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)]'
                        : ''
                        }`}
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icono del tipo de evento */}
                        <div className={`p-2 rounded-lg ${colors.bg} ${colors.text} flex-shrink-0`}>
                          <EventIcon type={event.type} />
                        </div>

                        {/* Información del evento */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/10 shadow-sm ${colors.bg} ${colors.text}`}>
                              {label}
                            </span>
                            {isClickable && (
                              <span className="text-xs text-white/50 uppercase tracking-widest ml-1 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                Ver detalle
                              </span>
                            )}
                          </div>
                          <p className="text-base font-bold text-white truncate tracking-wide" title={event.title}>
                            {event.title}
                          </p>
                          {event.description && (
                            <p className="text-sm text-white/80 mt-1 truncate leading-relaxed" title={event.description}>
                              {event.description}
                            </p>
                          )}

                          {/* Metadata específica según tipo */}
                          {event.type === 'email' && event.metadata?.to && (
                            <p className="text-xs text-white/70 mt-1.5 font-bold">
                              Para: <span className="font-normal">{event.metadata.to}</span>
                            </p>
                          )}
                          {event.type === 'calendar' && event.metadata?.start_time && (
                            <p className="text-xs text-white/70 mt-1.5 font-bold">
                              Fecha: <span className="font-normal">{formatDateTime(event.metadata.start_time).date} {formatDateTime(event.metadata.start_time).time}</span>
                            </p>
                          )}

                          {/* Fecha y hora del evento */}
                          <div className="flex items-center gap-2 mt-3 text-xs text-white/60 tracking-wider font-mono font-bold bg-black/20 w-fit px-2 py-1 rounded-md border border-white/5">
                            <svg className="w-4 h-4 text-[#34B6D8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{date}</span>
                            {time && (
                              <>
                                <span className="text-white/20 px-1">|</span>
                                <svg className="w-4 h-4 text-[#34B6D8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{time}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Indicador de click para emails y calendarios */}
                        {isClickable && (
                          <div className={`p-1.5 rounded-lg ${colors.bg} ${colors.text} opacity-60`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalle */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}

export default CaseCronologia;
