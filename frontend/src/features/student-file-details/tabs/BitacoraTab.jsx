import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BookOpen, Plus, Mic, FileText, X, Save, Play, Pause, Trash2, Square, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAudioRecorder } from '../../interviews-details/hooks/useAudioRecorder';
import { formatTime } from '../../interviews-details/utils/formatTime';
import { API_URL } from '../../../services/api';
import { ConfirmModal } from '../../../components/modals';

// Helper para obtener headers de autenticación
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

function BitacoraTab({ student, canEdit = true }) {
    const [entries, setEntries] = useState([]);
    const [isAddingText, setIsAddingText] = useState(false);
    const [newEntryText, setNewEntryText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [entryToDelete, setEntryToDelete] = useState(null); // Para el modal de eliminación
    const [showDeleteAudioModal, setShowDeleteAudioModal] = useState(false); // Para el modal de eliminar audio grabado

    const {
        hasRecording,
        isRecording,
        isPlaying,
        setIsPlaying,
        recordingDuration,
        audioBlob,
        audioUrl,
        audioPreviewRef,
        startRecording,
        stopRecording,
        discardRecording,
        resetRecording,
        togglePlayback
    } = useAudioRecorder();

    // Obtener datos del usuario actual
    const getCurrentUser = () => {
        try {
            const userStr = localStorage.getItem('usuario');
            if (userStr) {
                const user = JSON.parse(userStr);
                return {
                    id: user.id || user.uid || '',
                    name: user.nombre || user.email || 'Usuario'
                };
            }
        } catch (e) {
            console.error('Error getting user:', e);
        }
        return { id: '', name: 'Usuario' };
    };

    // Cargar entradas desde el backend
    const loadEntries = useCallback(async () => {
        if (!student?.id || !student?.colegio_id) return;

        try {
            setError(null);
            const response = await fetch(
                `${API_URL}/students/${student.id}/bitacora?school_id=${student.colegio_id}`,
                {
                    headers: getAuthHeaders()
                }
            );

            if (!response.ok) {
                throw new Error('Error al cargar las entradas');
            }

            const data = await response.json();
            setEntries(data);
        } catch (err) {
            console.error('Error loading bitacora entries:', err);
            setError('No se pudieron cargar las entradas');
        } finally {
            setIsLoading(false);
        }
    }, [student?.id, student?.colegio_id]);

    // Cargar entradas al montar
    useEffect(() => {
        loadEntries();
    }, [loadEntries]);

    // Polling para actualizar transcripciones pendientes
    useEffect(() => {
        const hasPendingTranscriptions = entries.some(
            e => e.type === 'audio' && e.transcription_status === 'pending'
        );

        if (!hasPendingTranscriptions) return;

        const interval = setInterval(() => {
            loadEntries();
        }, 5000); // Cada 5 segundos

        return () => clearInterval(interval);
    }, [entries, loadEntries]);

    const handleStartTextEntry = () => {
        setIsAddingText(true);
        setNewEntryText('');
    };

    const handleCancelTextEntry = () => {
        setIsAddingText(false);
        setNewEntryText('');
    };

    const handleSaveTextEntry = async () => {
        if (!newEntryText.trim() || !student?.id) return;

        const user = getCurrentUser();
        setIsSaving(true);

        try {
            const formData = new FormData();
            formData.append('school_id', student.colegio_id);
            formData.append('author_id', user.id);
            formData.append('author_name', user.name);
            formData.append('content', newEntryText.trim());

            const response = await fetch(
                `${API_URL}/students/${student.id}/bitacora/text`,
                {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error('Error al guardar la nota');
            }

            const newEntry = await response.json();
            setEntries(prev => [newEntry, ...prev]);
            handleCancelTextEntry();
        } catch (err) {
            console.error('Error saving text entry:', err);
            setError('No se pudo guardar la nota');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAudioEntry = async () => {
        if (!audioBlob || !student?.id) return;

        const user = getCurrentUser();
        setIsSaving(true);

        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.webm');
            formData.append('school_id', student.colegio_id);
            formData.append('author_id', user.id);
            formData.append('author_name', user.name);
            formData.append('duration', recordingDuration.toString());

            const response = await fetch(
                `${API_URL}/students/${student.id}/bitacora/audio`,
                {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error('Error al guardar el audio');
            }

            const newEntry = await response.json();
            setEntries(prev => [newEntry, ...prev]);
            resetRecording();
        } catch (err) {
            console.error('Error saving audio entry:', err);
            setError('No se pudo guardar el audio');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteEntry = async (entryId) => {
        if (!student?.id) return;

        try {
            const response = await fetch(
                `${API_URL}/students/${student.id}/bitacora/${entryId}?school_id=${student.colegio_id}`,
                {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                }
            );

            if (!response.ok) {
                throw new Error('Error al eliminar');
            }

            setEntries(prev => prev.filter(e => e.id !== entryId));
            setEntryToDelete(null);
        } catch (err) {
            console.error('Error deleting entry:', err);
            setError('No se pudo eliminar la entrada');
            setEntryToDelete(null);
        }
    };

    const formatDate = (isoString) => {
        // Si la fecha no tiene zona horaria, asumimos que es UTC (el backend guarda en UTC)
        let dateStr = isoString;
        if (dateStr && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
            dateStr = dateStr + 'Z';
        }
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-CL', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Estado de carga inicial
    if (isLoading) {
        return (
            <div className="relative flex flex-col h-full bg-white overflow-hidden rounded-xl shadow-sm" style={{ minHeight: '400px' }}>
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col h-full bg-white overflow-hidden rounded-xl shadow-sm" style={{ minHeight: '400px' }}>
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <BookOpen size={18} className="text-blue-600 flex-shrink-0 sm:w-5 sm:h-5" />
                        Bitácora del Trabajador
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        Registro cronologico de observaciones y eventos
                    </p>
                </div>
                <span className="text-xs text-gray-400">
                    {entries.length} {entries.length === 1 ? 'registro' : 'registros'}
                </span>
            </div>

            {/* Error message */}
            {error && (
                <div className="mx-3 sm:mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                    <AlertCircle size={16} />
                    {error}
                    <button
                        onClick={() => setError(null)}
                        className="ml-auto text-red-500 hover:text-red-700"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Timeline de Entradas */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-20">
                {entries.length === 0 && !isAddingText ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                        <BookOpen size={48} className="mb-3 opacity-50" />
                        <p className="text-sm font-medium">Sin entradas en la bitacora</p>
                        <p className="text-xs mt-1">Usa el boton + para agregar una observacion</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Formulario de nueva nota de texto */}
                        {isAddingText && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 animate-fadeIn">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-blue-700 flex items-center gap-2">
                                        <FileText size={16} />
                                        Nueva nota
                                    </span>
                                    <button
                                        onClick={handleCancelTextEntry}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                        disabled={isSaving}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                <textarea
                                    value={newEntryText}
                                    onChange={(e) => setNewEntryText(e.target.value)}
                                    placeholder="Escribe tu observacion aqui..."
                                    className="w-full h-24 p-3 rounded-lg border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none resize-none text-sm"
                                    autoFocus
                                    disabled={isSaving}
                                />
                                <div className="flex justify-end mt-3">
                                    <button
                                        onClick={handleSaveTextEntry}
                                        disabled={!newEntryText.trim() || isSaving}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        {isSaving ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Save size={16} />
                                        )}
                                        {isSaving ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Lista de entradas */}
                        {entries.map((entry) => (
                            <EntryCard
                                key={entry.id}
                                entry={entry}
                                onDelete={() => setEntryToDelete(entry)}
                                formatDate={formatDate}
                                canEdit={canEdit}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Boton flotante con grabador integrado */}
            {canEdit && (
                <div className="absolute bottom-4 right-4 z-20">
                    <FloatingRecorderButton
                        onSelectText={handleStartTextEntry}
                        isAddingText={isAddingText}
                        isSaving={isSaving}
                        // Audio props
                        hasRecording={hasRecording}
                        isRecording={isRecording}
                        isPlaying={isPlaying}
                        recordingDuration={recordingDuration}
                        audioUrl={audioUrl}
                        audioPreviewRef={audioPreviewRef}
                        onStartRecording={startRecording}
                        onStopRecording={stopRecording}
                        onDiscardRecording={discardRecording}
                        onSaveRecording={handleSaveAudioEntry}
                        onTogglePlayback={togglePlayback}
                        onPlayStateChange={setIsPlaying}
                        onDeleteRequest={() => setShowDeleteAudioModal(true)}
                    />
                </div>
            )}

            {/* Modal de confirmación para eliminar entrada */}
            <ConfirmModal
                isOpen={!!entryToDelete}
                onClose={() => setEntryToDelete(null)}
                onConfirm={() => handleDeleteEntry(entryToDelete?.id)}
                title="¿Eliminar esta entrada?"
                message="Esta entrada se eliminará permanentemente y no podrá recuperarse."
                confirmText="Eliminar"
                cancelText="Cancelar"
                icon="danger"
            />

            {/* Modal de confirmación para eliminar audio grabado */}
            <ConfirmModal
                isOpen={showDeleteAudioModal}
                onClose={() => setShowDeleteAudioModal(false)}
                onConfirm={() => {
                    discardRecording();
                    setShowDeleteAudioModal(false);
                }}
                title="¿Eliminar grabación?"
                message="La grabación actual se eliminará y no podrá recuperarse. ¿Deseas continuar?"
                confirmText="Eliminar"
                cancelText="Cancelar"
                icon="danger"
            />
        </div>
    );
}

// Componente para cada entrada del timeline
function EntryCard({ entry, onDelete, formatDate, canEdit }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [showFullTranscription, setShowFullTranscription] = useState(false);
    const audioRef = useRef(null);

    const togglePlay = async () => {
        if (audioRef.current) {
            try {
                if (isPlaying) {
                    audioRef.current.pause();
                    setIsPlaying(false);
                } else {
                    await audioRef.current.play();
                    setIsPlaying(true);
                }
            } catch (error) {
                console.error('Error reproduciendo audio:', error);
                setIsPlaying(false);
            }
        }
    };

    // Obtener URL del audio (backend usa audio_url, local usa audioUrl)
    const audioSrc = entry.audio_url || entry.audioUrl;

    // Truncar transcripción si es muy larga
    const maxLength = 200;
    const transcription = entry.transcription || '';
    const isLongTranscription = transcription.length > maxLength;
    const displayTranscription = showFullTranscription
        ? transcription
        : transcription.substring(0, maxLength) + (isLongTranscription ? '...' : '');

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:shadow-md transition-shadow">
            {/* Header de la entrada */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${entry.type === 'audio' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                        {entry.type === 'audio' ? <Mic size={14} className="sm:w-4 sm:h-4" /> : <FileText size={14} className="sm:w-4 sm:h-4" />}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{entry.author_name || entry.author}</p>
                        <p className="text-xs text-gray-400">{formatDate(entry.created_at || entry.createdAt)}</p>
                    </div>
                </div>
                {canEdit && (
                    <button
                        onClick={onDelete}
                        className="text-gray-300 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                        title="Eliminar entrada"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            {/* Contenido */}
            {entry.type === 'text' ? (
                <p className="text-sm text-gray-700 leading-relaxed pl-9 sm:pl-10">
                    {entry.content}
                </p>
            ) : (
                <div className="pl-9 sm:pl-10 space-y-3">
                    {/* Transcripcion encima del audio */}
                    {entry.transcription_status === 'pending' ? (
                        <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-2">
                            <Loader2 size={14} className="animate-spin" />
                            <span>Transcribiendo audio...</span>
                        </div>
                    ) : entry.transcription_status === 'error' ? (
                        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                            <AlertCircle size={14} />
                            <span>Error en la transcripcion</span>
                        </div>
                    ) : entry.transcription ? (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1 font-medium">Transcripcion:</p>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {displayTranscription}
                            </p>
                            {isLongTranscription && (
                                <button
                                    onClick={() => setShowFullTranscription(!showFullTranscription)}
                                    className="text-xs text-blue-600 hover:text-blue-700 mt-2 font-medium"
                                >
                                    {showFullTranscription ? 'Ver menos' : 'Ver mas'}
                                </button>
                            )}
                        </div>
                    ) : null}

                    {/* Reproductor de audio */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={togglePlay}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition-colors flex-shrink-0"
                        >
                            {isPlaying ? <Pause size={14} className="sm:w-4 sm:h-4" /> : <Play size={14} className="sm:w-4 sm:h-4 ml-0.5" />}
                        </button>
                        <div className="flex-1 h-7 sm:h-8 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full flex items-center gap-0.5 px-2">
                                {[...Array(20)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`flex-1 rounded-full ${isPlaying ? 'bg-purple-400 animate-pulse' : 'bg-gray-300'}`}
                                        style={{ height: `${Math.random() * 60 + 20}%` }}
                                    />
                                ))}
                            </div>
                        </div>
                        <span className="text-xs font-mono text-gray-500 flex-shrink-0">
                            {formatTime(entry.duration || 0)}
                        </span>
                        {audioSrc && (
                            <audio
                                ref={audioRef}
                                src={audioSrc}
                                onEnded={() => setIsPlaying(false)}
                                className="hidden"
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Boton flotante con grabador integrado - Estilo AudioRecorder
function FloatingRecorderButton({
    onSelectText,
    isAddingText,
    isSaving,
    hasRecording,
    isRecording,
    isPlaying,
    recordingDuration,
    audioUrl,
    audioPreviewRef,
    onStartRecording,
    onStopRecording,
    onDiscardRecording,
    onSaveRecording,
    onTogglePlayback,
    onPlayStateChange,
    onDeleteRequest
}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAudioMode, setIsAudioMode] = useState(false);

    // Cancelar modo audio
    const handleCancelAudio = () => {
        setIsAudioMode(false);
        if (hasRecording || isRecording) {
            onDiscardRecording();
        }
    };

    // Si esta agregando texto, ocultar el boton
    if (isAddingText) return null;

    // Estado: Guardando
    if (isSaving) {
        return (
            <div className="flex items-center gap-3 px-5 py-3 bg-blue-600 rounded-full shadow-xl">
                <Loader2 size={20} className="text-white animate-spin" />
                <span className="text-sm font-medium text-white">Guardando...</span>
            </div>
        );
    }

    // Estado: Grabando - Burbuja expandida roja con animación
    if (isRecording) {
        return (
            <div className="flex items-center gap-4 px-5 py-3 bg-red-500 rounded-full shadow-xl animate-pulse">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-white animate-ping"></div>
                    <span className="text-base font-mono font-semibold text-white">
                        {formatTime(recordingDuration)}
                    </span>
                </div>
                <button
                    onClick={onStopRecording}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-red-600 hover:bg-red-50 transition-colors"
                    title="Detener grabación"
                >
                    <Square size={16} fill="currentColor" />
                    <span className="text-sm font-medium">Detener</span>
                </button>
            </div>
        );
    }

    // Estado: Audio grabado - Burbuja con controles y texto
    if (hasRecording) {
        return (
            <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-full shadow-xl">
                <button
                    onClick={onTogglePlayback}
                    className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
                    title={isPlaying ? "Pausar" : "Reproducir"}
                >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                </button>

                <span className="text-sm font-mono font-medium text-gray-600 px-1">
                    {formatTime(recordingDuration)}
                </span>

                <div className="w-px h-6 bg-gray-200"></div>

                <button
                    onClick={onDeleteRequest}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-red-500 hover:bg-red-50 transition-colors"
                    title="Eliminar grabación"
                >
                    <Trash2 size={16} />
                    <span className="text-sm font-medium hidden sm:inline">Eliminar</span>
                </button>

                <button
                    onClick={onSaveRecording}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-green-600 hover:bg-green-50 transition-colors"
                    title="Guardar grabación"
                >
                    <Save size={16} />
                    <span className="text-sm font-medium hidden sm:inline">Guardar</span>
                </button>

                {audioUrl && (
                    <audio
                        ref={audioPreviewRef}
                        src={audioUrl}
                        onEnded={() => onPlayStateChange(false)}
                        onPause={() => onPlayStateChange(false)}
                        onPlay={() => onPlayStateChange(true)}
                        className="hidden"
                    />
                )}
            </div>
        );
    }

    // Estado: Modo audio activado pero sin grabar aún - Botón "Iniciar Grabación"
    if (isAudioMode) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-full shadow-xl">
                <button
                    onClick={onStartRecording}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all hover:scale-105 active:scale-95"
                    title="Iniciar grabación"
                >
                    <Mic size={18} />
                    <span className="text-sm font-medium">Iniciar Grabación</span>
                </button>
                <button
                    onClick={handleCancelAudio}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
                    title="Cancelar"
                >
                    <X size={18} />
                </button>
            </div>
        );
    }

    // Estado inicial: Menu de opciones con botones claros
    return (
        <>
            {/* Backdrop para cerrar menu */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            <div className="relative z-20">
                {/* Menu de opciones expandido horizontalmente */}
                {isMenuOpen && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-full shadow-xl animate-fadeIn">
                        {/* Opción: Nota escrita */}
                        <button
                            onClick={() => {
                                setIsMenuOpen(false);
                                onSelectText();
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                            title="Agregar nota escrita"
                        >
                            <FileText size={18} />
                            <span className="text-sm font-medium">Nota</span>
                        </button>

                        {/* Opción: Grabación de audio */}
                        <button
                            onClick={() => {
                                setIsMenuOpen(false);
                                setIsAudioMode(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                            title="Preparar grabación de audio"
                        >
                            <Mic size={18} />
                            <span className="text-sm font-medium">Grabar</span>
                        </button>

                        {/* Botón cerrar */}
                        <button
                            onClick={() => setIsMenuOpen(false)}
                            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
                            title="Cerrar"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* Boton principal + (solo visible cuando menu cerrado) */}
                {!isMenuOpen && (
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
                        aria-label="Agregar entrada"
                    >
                        <Plus size={20} />
                        <span className="text-sm font-medium">Agregar</span>
                    </button>
                )}
            </div>
        </>
    );
}

export default BitacoraTab;
