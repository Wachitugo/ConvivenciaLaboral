import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import FileItem from './FileItem';

function DocumentList({
    documents,
    documentType = 'audio', // 'audio' | 'pdf'
    title = 'Documentos',
    onDownload,
    onDelete,
    onUpload,
    onSelect,
    selectedDocId,
    fileInputRef,
    acceptedTypes,
    showUploadButton = false,
    emptyMessage = 'Sin documentos'
}) {
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');

    const handleStartRename = (doc) => {
        setEditingId(doc.id);
        setEditingName(doc.name);
    };

    const handleSaveRename = (id) => {
        // Por ahora solo cerramos el editor - la funcionalidad de renombrar
        // puede conectarse al backend si es necesario
        setEditingId(null);
        setEditingName('');
    };

    const handleCancelRename = () => {
        setEditingId(null);
        setEditingName('');
    };

    const handleFileInputChange = (e) => {
        if (e.target.files.length > 0 && onUpload) {
            onUpload(e.target.files);
            e.target.value = '';
        }
    };

    const handleUploadClick = () => {
        fileInputRef?.current?.click();
    };

    return (
        <div className="flex flex-col h-full border border-white/10 shadow-inner bg-white/5 rounded-xl overflow-hidden">
            <div className="flex p-3 border-b border-white/10 bg-transparent flex-shrink-0 items-center justify-between">
                <h4 className="text-xs font-bold text-white/50 uppercase tracking-wide">{title}</h4>
            </div>

            <div className="flex-1 min-h-0 p-2 space-y-2 bg-transparent overflow-y-auto">
                {documents.length > 0 ? (
                    documents.map((doc) => (
                        <FileItem
                            key={doc.id}
                            doc={doc}
                            isEditing={editingId === doc.id}
                            editingName={editingName}
                            onEditNameChange={setEditingName}
                            onStartRename={handleStartRename}
                            onSaveRename={handleSaveRename}
                            onCancelRename={handleCancelRename}
                            onDownload={onDownload}
                            onDelete={onDelete}
                            onSelect={onSelect}
                            isSelected={selectedDocId === doc.id}
                        />
                    ))
                ) : (
                    <div className="h-full flex items-center justify-center text-white/40 text-xs italic py-8">
                        <p>{emptyMessage}</p>
                    </div>
                )}
            </div>

            {/* Botón de subida - Solo si showUploadButton es true */}
            {showUploadButton && (
                <div className="flex justify-end p-2 border-t border-white/10 bg-transparent flex-shrink-0">
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={acceptedTypes}
                        onChange={handleFileInputChange}
                        className="hidden"
                    />
                    <button
                        onClick={handleUploadClick}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#1A71B8] text-white rounded-xl text-sm font-bold hover:bg-[#1A71B8]/80 transition-colors shadow-md"
                    >
                        <Upload size={12} />
                        Adjuntar Archivo
                    </button>
                </div>
            )}
        </div>
    );
}

export default DocumentList;
