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
        bg: 'bg-emerald-100',
        text: 'text-emerald-600',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500'
      };
    case 'document':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        border: 'border-blue-200',
        dot: 'bg-blue-500'
      };
    case 'email':
      return {
        bg: 'bg-green-100',
        text: 'text-green-600',
        border: 'border-green-200',
        dot: 'bg-green-500'
      };
    case 'calendar':
      return {
        bg: 'bg-purple-100',
        text: 'text-purple-600',
        border: 'border-purple-200',
        dot: 'bg-purple-500'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        border: 'border-gray-200',
        dot: 'bg-gray-500'
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
    <div className="flex flex-col h-full bg-white overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="truncate">Cronología</span>
            {events.length > 0 && (
              <span className="text-xs sm:text-sm text-gray-500 font-normal">({events.length})</span>
            )}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
            <span className="hidden sm:inline">Historial de actividades del caso</span>
            <span className="sm:hidden">Actividades del caso</span>
          </p>
        </div>
      </div>

      {/* Contenido */}
      {error ? (
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 min-h-0">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 min-h-0">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">No hay actividades registradas</p>
            <p className="text-xs text-gray-400 mt-1">Los documentos, correos y agendamientos aparecerán aquí</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 min-h-0">
          <div className="relative">
            {/* Línea vertical del timeline */}
            <div className="absolute left-[18px] top-3 bottom-3 w-0.5 bg-gray-200"></div>

            <div className="space-y-4">
              {events.map((event, index) => {
                const colors = getEventColors(event.type);
                const { date, time } = formatDateTime(event.timestamp);
                const label = getEventLabel(event.type);
                const isClickable = event.type === 'email' || event.type === 'calendar';

                return (
                  <div key={index} className="relative pl-10">
                    {/* Círculo indicador en la línea */}
                    <div className={`absolute left-2.5 top-4 w-3 h-3 rounded-full ${colors.dot} ring-4 ring-white`}></div>

                    {/* Card del evento */}
                    <div
                      className={`p-3 border ${colors.border} rounded-xl bg-white transition-all ${isClickable
                        ? 'cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.99]'
                        : 'hover:shadow-sm'
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
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                              {label}
                            </span>
                            {isClickable && (
                              <span className="text-xs text-gray-400">
                                Click para ver detalle
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900 truncate" title={event.title}>
                            {event.title}
                          </p>
                          {event.description && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate" title={event.description}>
                              {event.description}
                            </p>
                          )}

                          {/* Metadata específica según tipo */}
                          {event.type === 'email' && event.metadata?.to && (
                            <p className="text-xs text-gray-400 mt-1">
                              Para: {event.metadata.to}
                            </p>
                          )}
                          {event.type === 'calendar' && event.metadata?.start_time && (
                            <p className="text-xs text-gray-400 mt-1">
                              Fecha: {formatDateTime(event.metadata.start_time).date} {formatDateTime(event.metadata.start_time).time}
                            </p>
                          )}

                          {/* Fecha y hora del evento */}
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{date}</span>
                            {time && (
                              <>
                                <span className="text-gray-300">|</span>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
