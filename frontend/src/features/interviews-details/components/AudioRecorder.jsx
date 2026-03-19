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
                className="flex items-center gap-2 px-4 py-3 bg-[#1A71B8] text-white rounded-full shadow-[0_8px_32px_rgba(26,113,184,0.4)] border border-white/20 hover:bg-[#1A71B8]/80 transition-all hover:scale-105 active:scale-95"
                title="Iniciar grabación"
            >
                <Mic size={20} />
                <span className="text-sm font-bold">Iniciar Grabación</span>
            </button>
        );
    }

    // Grabando - Burbuja expandida
    if (isRecording) {
        return (
            <div className="flex items-center gap-4 px-5 py-3 bg-red-500/80 backdrop-blur-md rounded-full shadow-[0_8px_32px_rgba(239,68,68,0.4)] border border-red-400/50 animate-pulse">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-white animate-ping"></div>
                    <span className="text-base font-mono font-bold text-white">
                        {formatTime(recordingDuration)}
                    </span>
                </div>
                <button
                    onClick={onStopRecording}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    title="Detener grabación"
                >
                    <Square size={16} fill="currentColor" />
                    <span className="text-sm font-bold">Detener</span>
                </button>
            </div>
        );
    }

    // Audio grabado - Burbuja con controles
    if (hasRecording && !isRecording) {
        return (
            <>
                <div className="flex items-center gap-3 px-4 py-3 bg-[#0A3866]/90 backdrop-blur-xl border border-white/20 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    <button
                        onClick={onTogglePlayback}
                        className="w-10 h-10 rounded-full bg-[#34B6D8] hover:bg-[#34B6D8]/80 text-[#0A3866] flex items-center justify-center transition-colors"
                        title={isPlaying ? "Pausar" : "Reproducir"}
                    >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                    </button>

                    <span className="text-sm font-mono font-bold text-white px-1">
                        {formatTime(recordingDuration)}
                    </span>

                    <div className="w-px h-6 bg-white/20"></div>

                    <button
                        onClick={handleDeleteClick}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Eliminar grabación"
                    >
                        <Trash2 size={16} />
                        <span className="text-sm font-bold">Eliminar</span>
                    </button>

                    <button
                        onClick={onSaveRecording}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        title="Guardar grabación"
                    >
                        <Save size={16} />
                        <span className="text-sm font-bold">Guardar</span>
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
