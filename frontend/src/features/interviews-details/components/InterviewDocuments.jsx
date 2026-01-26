import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useFileRename } from '../hooks/useFileRename';
import EmptyState from './EmptyState';
import FileItem from './FileItem';

function InterviewDocuments({
    documents = [],
    setDocuments = () => { },
    handleFiles,
    handleDelete,
    handleDownload,
    onSelectFile,
    uploadingFiles,
    showNotification,
    selectedFileId
}) {
    const { isDragging, handleDragEnter, handleDragLeave, handleDragOver, handleDrop } = useDragAndDrop(handleFiles);
    const { editingId, editingName, setEditingName, startRename, saveRename, cancelRename } = useFileRename(
        setDocuments,
        showNotification || (() => { })
    );

    return (
        <div className="flex flex-col h-full bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
                <h2 className="font-bold text-gray-800 text-base">Archivos Adjuntos</h2>
                {/* Upload button removed from here */}
            </div>

            {/* Drop area and documents list */}
            <div
                className="flex-1 flex flex-col relative overflow-hidden"
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Drop Overlay */}
                {isDragging && (
                    <div className="absolute inset-0 z-10 bg-blue-50/90 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-blue-400 border-dashed m-2 rounded-lg animate-in fade-in duration-200">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 text-blue-600 animate-bounce">
                            <Upload size={32} />
                        </div>
                        <p className="text-blue-700 font-semibold text-lg">Suelta los archivos aquí</p>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2 flex flex-col">
                    {documents.length > 0 ? (
                        documents.map((doc) => (
                            <FileItem
                                key={doc.id}
                                doc={doc}
                                isEditing={editingId === doc.id}
                                editingName={editingName}
                                onEditNameChange={setEditingName}
                                onStartRename={startRename}
                                onSaveRename={saveRename}
                                onCancelRename={cancelRename}
                                onDownload={handleDownload}
                                onDelete={handleDelete}
                                onSelect={onSelectFile}
                                isSelected={doc.id === selectedFileId}
                            />
                        ))
                    ) : (
                        <EmptyState />
                    )}
                </div>
            </div>

        </div>
    );
}

export default InterviewDocuments;
