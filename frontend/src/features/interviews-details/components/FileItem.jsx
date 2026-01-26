import React, { useState } from 'react';
import { Edit2, Download, Trash2, Check, X } from 'lucide-react';
import { getFileIcon, formatFileSize, formatDate } from '../utils/fileUtils.jsx';
import { ConfirmModal } from '../../../components/modals';

function FileItem({
    doc,
    isEditing,
    editingName,
    onEditNameChange,
    onStartRename,
    onSaveRename,
    onCancelRename,
    onDownload,
    onDelete,
    onSelect,
    isSelected
}) {
    const { Icon, className } = getFileIcon(doc.type);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') onSaveRename(doc.id);
        if (e.key === 'Escape') onCancelRename();
    };

    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = React.useRef(null);

    const isAudio = (doc.type && doc.type.startsWith('audio/')) ||
        doc.name.match(/\.(mp3|wav|m4a|webm|ogg)$/i) ||
        (doc.name.endsWith('.mp4') && doc.type?.includes('audio'));

    const handlePlay = () => {
        if (!doc.url) return;

        if (!audioRef.current) {
            audioRef.current = new Audio(doc.url);
            audioRef.current.onended = () => setIsPlaying(false);
        }

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = () => {
        onDelete(doc.id);
        setShowDeleteModal(false);
    };

    return (
        <>
            <div className={`border rounded-lg p-2 flex items-center gap-3 transition-colors group ${isSelected
                ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
                : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}>
                {/* File Icon */}
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className={className} />
                </div>

                {/* File Information - Clickable for selection */}
                <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => !isEditing && onSelect && onSelect(doc)}
                >
                    {isEditing ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <input
                                type="text"
                                value={editingName}
                                onChange={(e) => onEditNameChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                            <button
                                onClick={() => onSaveRename(doc.id)}
                                className="p-1 rounded hover:bg-green-50 text-green-600 transition-colors"
                                title="Guardar"
                            >
                                <Check size={16} />
                            </button>
                            <button
                                onClick={onCancelRename}
                                className="p-1 rounded hover:bg-gray-100 text-gray-600 transition-colors"
                                title="Cancelar"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                            <p className="text-xs text-gray-500">
                                {formatFileSize(doc.size)} • {formatDate(doc.uploadedAt)}
                            </p>
                        </>
                    )}
                </div>

                {/* Actions */}
                {
                    !isEditing && (
                        <div className="flex items-center gap-1 transition-opacity">
                            {/* Play Button for Audio */}
                            {isAudio && (
                                <button
                                    onClick={handlePlay}
                                    className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${isPlaying ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}
                                    title={isPlaying ? "Pausar" : "Reproducir"}
                                >
                                    {isPlaying ? <BoxStopIcon /> : <BoxPlayIcon />}
                                </button>
                            )}

                            <button
                                onClick={() => onStartRename(doc)}
                                className="p-2 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                                title="Renombrar"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => onDownload(doc)}
                                className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                                title="Descargar"
                            >
                                <Download size={16} />
                            </button>
                            <button
                                onClick={handleDeleteClick}
                                className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                                title="Eliminar"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )
                }
            </div>

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleConfirmDelete}
                title="¿Eliminar archivo?"
                message={`El archivo "${doc.name}" se eliminará permanentemente. ¿Deseas continuar?`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                icon="danger"
            />
        </>
    );
}

// Simple icons for play/pause to avoid extra imports if not available
const BoxPlayIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
);

const BoxStopIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
    </svg>
);
export default FileItem;
