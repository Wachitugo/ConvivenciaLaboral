import React, { useState, useEffect } from 'react';
import { API_URL } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { createLogger } from '../../utils/logger';

const logger = createLogger('CalendarEventComposer');

function CalendarEventComposer({ summary, start_time, end_time, description, attendees, introText, onSend, onCancel, sessionId, messageIndex, initialSuccess = false }) {
    const { current } = useTheme();
    const [user, setUser] = useState(null);

    // Parse dates for display
    const formatDate = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleString('es-CL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    useEffect(() => {
        const userStr = localStorage.getItem('usuario');
        if (userStr) {
            try {
                setUser(JSON.parse(userStr));
            } catch (e) {
                logger.error("Error parsing user from localStorage", e);
            }
        }
    }, []);

    // State for editable fields
    const [summaryInput, setSummaryInput] = useState(summary || '');
    const [descriptionInput, setDescriptionInput] = useState(description || '');
    const [startTimeInput, setStartTimeInput] = useState('');
    const [endTimeInput, setEndTimeInput] = useState('');
    const [attendeesInput, setAttendeesInput] = useState('');

    // Initialize inputs
    useEffect(() => {
        if (start_time) {
            const date = new Date(start_time);
            // Format for datetime-local: YYYY-MM-DDThh:mm
            const localIso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            setStartTimeInput(localIso);
        }
        if (end_time) {
            const date = new Date(end_time);
            const localIso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            setEndTimeInput(localIso);
        }
        if (attendees && Array.isArray(attendees)) {
            setAttendeesInput(attendees.join(', '));
        }
    }, [start_time, end_time, attendees]);


    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(initialSuccess);
    const [isCancelled, setIsCancelled] = useState(false);

    const handleCancel = () => {
        setIsCancelled(true);
        if (onCancel) onCancel();
    };

    const handleSend = async () => {
        setIsSending(true);
        setError(null);

        try {
            const apiUrl = API_URL;

            // Convert attendees string back to array
            const attendeesList = attendeesInput
                .split(',')
                .map(email => email.trim())
                .filter(email => email.length > 0);

            // Convert inputs back to ISO for backend (adding :00Z or local offset)
            // Backend expects ISO. Let's send what we have + seconds. 
            // Better: Create Date object from input and toISOString it.
            const startIso = new Date(startTimeInput).toISOString();
            const endIso = new Date(endTimeInput).toISOString();

            const response = await fetch(`${apiUrl}/chat/create-event`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    summary: summaryInput,
                    start_time: startIso,
                    end_time: endIso,
                    description: descriptionInput,
                    attendees: attendeesList,
                    user_id: user?.id,
                    session_id: sessionId,
                    message_id: messageIndex
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Error al agendar evento");
            }

            setSuccess(true);
            if (onSend) onSend();

        } catch (err) {
            setError(err.message);
        } finally {
            setIsSending(false);
        }
    };

    if (success) {
        return (
            <div className={`w-full h-full flex items-center justify-center animate-fade-in`}>
                <div className="rounded-2xl p-8 text-center shadow-sm w-full">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4 shadow-sm">
                        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-green-900 mb-2">¡Evento Agendado!</h3>
                    <p className="text-md text-green-700 leading-relaxed">
                        Se ha creado el evento en el calendario correctamente.
                    </p>
                </div>
            </div>
        );
    }

    if (isCancelled) {
        return (
            <div className={`w-full flex items-center justify-center animate-fade-in py-4 opacity-75`}>
                <div className="rounded-2xl p-4 text-center border border-gray-200 w-full bg-gray-50">
                    <p className="text-sm text-gray-500 italic">
                        Agendamiento cancelado por el usuario.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col font-sans animate-fade-in space-y-4">
            <div className={`w-full flex-grow overflow-hidden rounded-xl ${current.cardBg} flex flex-col transition-all duration-300`}>

                {/* Header */}
                <div className={`px-6 py-4 bg-gray-50 border-b ${current.cardBorder || 'border-gray-100'}`}>
                    <div className={`px-1 text-sm ${current.textSecondary} italic font-medium`}>
                        {introText || 'Nuevo Evento'}
                    </div>
                </div>

                <div className="p-6 flex flex-col gap-5 flex-grow">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Input Summary */}
                    <div className="group">
                        <h2 className={`text-lg mb-1 font-bold text-blue-800`}>Agendar en Calendario</h2>
                        <div className={`flex items-center border-b ${current.inputBorder || 'border-gray-200'} group-focus-within:border-blue-400 transition-colors py-1`}>
                            <span className={`text-gray-400 w-20 font-medium text-md`}>Evento:</span>
                            <input
                                type="text"
                                value={summaryInput}
                                onChange={(e) => setSummaryInput(e.target.value)}
                                className={`w-full px-2 py-2 focus:outline-none bg-transparent ${current.textPrimary} font-bold placeholder-gray-300 text-sm`}
                                style={{ fontFamily: "'Open Sans', sans-serif" }}
                                placeholder="Título del evento"
                            />
                        </div>
                    </div>

                    {/* Time Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="group">
                            <div className={`flex items-center border-b ${current.inputBorder || 'border-gray-200'} group-focus-within:border-blue-400 transition-colors py-1`}>
                                <span className={`text-gray-400 w-16 font-medium text-md`}>Inicio:</span>
                                <input
                                    type="datetime-local"
                                    value={startTimeInput}
                                    onChange={(e) => setStartTimeInput(e.target.value)}
                                    className={`w-full px-2 py-2 focus:outline-none bg-transparent ${current.textPrimary} text-sm`}
                                    style={{ fontFamily: "'Open Sans', sans-serif" }}
                                />
                            </div>
                        </div>
                        <div className="group">
                            <div className={`flex items-center border-b ${current.inputBorder || 'border-gray-200'} group-focus-within:border-blue-400 transition-colors py-1`}>
                                <span className={`text-gray-400 w-20 font-medium text-md`}>Término:</span>
                                <input
                                    type="datetime-local"
                                    value={endTimeInput}
                                    onChange={(e) => setEndTimeInput(e.target.value)}
                                    className={`w-full px-2 py-2 focus:outline-none bg-transparent ${current.textPrimary} text-sm`}
                                    style={{ fontFamily: "'Open Sans', sans-serif" }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Input Attendees */}
                    <div className="group">
                        <div className={`flex items-center border-b ${current.inputBorder || 'border-gray-200'} group-focus-within:border-blue-400 transition-colors py-1`}>
                            <span className={`text-gray-400 w-24 font-medium text-md`}>Invitados:</span>
                            <input
                                type="text"
                                value={attendeesInput}
                                onChange={(e) => setAttendeesInput(e.target.value)}
                                className={`w-full px-2 py-2 focus:outline-none bg-transparent ${current.textPrimary} placeholder-gray-300 text-sm`}
                                style={{ fontFamily: "'Open Sans', sans-serif" }}
                                placeholder="correos separados por coma"
                            />
                        </div>
                    </div>

                    {/* Textarea Description */}
                    <div className="flex-grow min-h-[150px] relative mt-2">
                        <textarea
                            value={descriptionInput}
                            onChange={(e) => setDescriptionInput(e.target.value)}
                            className={`w-full h-full resize-none focus:outline-none bg-transparent ${current.textPrimary} custom-scrollbar leading-relaxed text-sm`}
                            style={{ fontFamily: "'Open Sans', sans-serif" }}
                            placeholder="Descripción o detalles adicionales..."
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end pt-4 border-t border-gray-50 gap-3">
                        <button
                            onClick={onCancel}
                            className={`${current.textSecondary} hover:${current.textPrimary} text-sm font-medium px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors`}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={isSending}
                            className={`flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm shadow-blue-200 transition-all transform active:scale-95 ${isSending ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {isSending ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Agendando...
                                </>
                            ) : (
                                <>
                                    <span>Agendar</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CalendarEventComposer;
