import React, { useState } from 'react';
import { Mic, Square, Play, Pause, Trash2, Save } from 'lucide-react';
import { formatTime } from '../utils/formatTime';
import { ConfirmModal } from '../../../components/modals';

function AudioRecorder({
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
    onPlayStateChange
}) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = () => {
        onDiscardRecording();
        setShowDeleteModal(false);
    };

    // Estado inicial - Burbuja compacta
    if (!hasRecording && !isRecording) {
        return (
            <button
                onClick={onStartRecording}
                className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
                title="Iniciar grabación"
            >
                <Mic size={20} />
                <span className="text-sm font-medium">Iniciar Grabación</span>
            </button>
        );
    }

    // Grabando - Burbuja expandida
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

    // Audio grabado - Burbuja con controles
    if (hasRecording && !isRecording) {
        return (
            <>
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
                        onClick={handleDeleteClick}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-red-500 hover:bg-red-50 transition-colors"
                        title="Eliminar grabación"
                    >
                        <Trash2 size={16} />
                        <span className="text-sm font-medium">Eliminar</span>
                    </button>

                    <button
                        onClick={onSaveRecording}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-green-600 hover:bg-green-50 transition-colors"
                        title="Guardar grabación"
                    >
                        <Save size={16} />
                        <span className="text-sm font-medium">Guardar</span>
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

                <ConfirmModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={handleConfirmDelete}
                    title="¿Eliminar grabación?"
                    message="La grabación actual se eliminará y no podrá recuperarse. ¿Deseas continuar?"
                    confirmText="Eliminar"
                    cancelText="Cancelar"
                    icon="danger"
                />
            </>
        );
    }

    return null;
}

export default AudioRecorder;
