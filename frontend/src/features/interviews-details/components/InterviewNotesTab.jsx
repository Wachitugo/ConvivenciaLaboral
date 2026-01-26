import React, { useRef, useMemo } from 'react';
import { Mic, Keyboard } from 'lucide-react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { ALLOWED_FILE_TYPES } from '../constants/fileConstants';
import AudioRecorder from './AudioRecorder';
import TranscriptionView from './TranscriptionView';
import DocumentList from './DocumentList';
import NotesEditor from './NotesEditor';

function InterviewNotesTab({
    formData,
    handleInputChange,
    onSaveRecording,
    onUpload,
    onSave,
    documents = [],
    handleDownload,
    handleDelete,
    onSelectDocument,
    selectedDocumentId
}) {
    const fileInputRef = useRef(null);

    // Hook personalizado para manejo de grabación
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

    // Filtrar documentos por tipo usando useMemo para optimización
    const audioDocuments = useMemo(() =>
        documents.filter(doc =>
            doc.type?.startsWith('audio/') ||
            doc.name?.match(/\.(mp3|wav|ogg|webm|m4a)$/i)
        ),
        [documents]
    );

    const pdfDocuments = useMemo(() =>
        documents.filter(doc =>
            doc.type === 'application/pdf' ||
            doc.name?.endsWith('.pdf')
        ),
        [documents]
    );

    // Handlers
    const handleSaveRecording = () => {
        if (!audioBlob) return;

        const ext = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
        const file = new File(
            [audioBlob],
            `Grabación_${new Date().toISOString()}.${ext}`,
            { type: audioBlob.type }
        );

        onSaveRecording(file);
        resetRecording();
    };

    const handleTypeChange = (type) => {
        handleInputChange({ target: { name: 'type', value: type } });
    };

    return (
        <div style={{ fontFamily: "'Poppins', sans-serif" }} className="relative h-full flex flex-col bg-white">
            {/* Header con estilo consistente */}
            <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 gap-2">
                <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="truncate">Notas de la Entrevista</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                        <span className="hidden sm:inline">Grabaciones y transcripciones de la entrevista</span>
                        <span className="sm:hidden">Grabaciones y notas</span>
                    </p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg flex-shrink-0">
                    <button
                        onClick={() => handleTypeChange('audio')}
                        className={`px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1 sm:gap-1.5 ${formData.type === 'audio'
                            ? 'bg-white shadow-sm text-gray-900'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Mic size={14} />
                        <span className="hidden sm:inline">Audio</span>
                    </button>
                    <button
                        onClick={() => handleTypeChange('written')}
                        className={`px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1 sm:gap-1.5 ${formData.type === 'written'
                            ? 'bg-white shadow-sm text-gray-900'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Keyboard size={14} />
                        <span className="hidden sm:inline">Escrita</span>
                    </button>
                </div>
            </div>

            {/* Layout de dos columnas */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 p-3 sm:p-4 overflow-hidden">

                    {/* COLUMNA IZQUIERDA - Transcripción o Notas (50%) */}
                    <div className="w-full lg:w-1/2 flex flex-col h-full min-h-0 overflow-hidden">
                        <div className="flex-1 min-h-0 overflow-hidden">
                            {formData.type === 'written' ? (
                                <NotesEditor
                                    notes={formData.notes}
                                    onNotesChange={handleInputChange}
                                    onSave={onSave}
                                />
                            ) : (
                                <TranscriptionView
                                    transcription={formData.transcription}
                                    onTranscriptionChange={handleInputChange}
                                    onSave={onSave}
                                />
                            )}
                        </div>
                    </div>

                    {/* COLUMNA DERECHA (50%) - Contenido según el modo */}
                    <div className="w-full lg:w-1/2 flex flex-col gap-4 h-full min-h-0 overflow-hidden">
                        {formData.type === 'audio' ? (
                            // MODO AUDIO: Lista de grabaciones
                            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                                <DocumentList
                                    documents={audioDocuments}
                                    documentType="audio"
                                    title="Grabaciones"
                                    onDownload={handleDownload}
                                    onDelete={handleDelete}
                                    onSelect={onSelectDocument}
                                    selectedDocId={selectedDocumentId}
                                    emptyMessage="Sin grabaciones"
                                />
                            </div>
                        ) : (
                            // MODO ESCRITA: Documentos adjuntos (PDFs, etc.)
                            <div className="flex-1 min-h-0 overflow-y-auto">
                                <DocumentList
                                    documents={pdfDocuments}
                                    documentType="pdf"
                                    title="Documentos Adjuntos"
                                    onDownload={handleDownload}
                                    onDelete={handleDelete}
                                    onUpload={onUpload}
                                    fileInputRef={fileInputRef}
                                    acceptedTypes={Object.keys(ALLOWED_FILE_TYPES).join(',')}
                                    showUploadButton={true}
                                    emptyMessage="Sin documentos adjuntos"
                                />
                            </div>
                        )}
                    </div>
            </div>

            {/* Burbuja flotante de grabación - Solo en modo audio */}
            {formData.type === 'audio' && (
                <div className="absolute bottom-4 right-4 z-20">
                    <AudioRecorder
                        hasRecording={hasRecording}
                        isRecording={isRecording}
                        isPlaying={isPlaying}
                        recordingDuration={recordingDuration}
                        audioUrl={audioUrl}
                        audioPreviewRef={audioPreviewRef}
                        onStartRecording={startRecording}
                        onStopRecording={stopRecording}
                        onDiscardRecording={discardRecording}
                        onSaveRecording={handleSaveRecording}
                        onTogglePlayback={togglePlayback}
                        onPlayStateChange={setIsPlaying}
                    />
                </div>
            )}
        </div>
    );
}

export default InterviewNotesTab;
