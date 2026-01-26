import React from 'react';

// Función para formatear tamaño de archivo
const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Función para formatear fecha de forma segura
const formatDate = (dateValue) => {
    if (!dateValue) return 'Sin fecha';
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'Sin fecha';
    return date.toLocaleDateString();
};

function FileListItem({
    doc,
    editingId,
    editingName,
    setEditingName,
    onStartRename,
    onSaveRename,
    onCancelRename,
    onDownload,
    onDelete
}) {
    return (
        <div className="group p-3 border-b border-stone-200 hover:bg-stone-100 hover:border-stone-300 transition-all cursor-pointer">
            <div className="flex items-start gap-3">
                {/* Información del archivo */}
                <div className="flex-1 min-w-0">
                    {editingId === doc.id ? (
                        <form onSubmit={(e) => { e.preventDefault(); onSaveRename(doc.id); }} className="flex items-center gap-2 mb-1">
                            <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') onCancelRename();
                                }}
                                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                            <button
                                type="submit"
                                className="text-green-600 hover:text-green-700"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onCancelRename(); }}
                                className="text-red-600 hover:text-red-700"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </form>
                    ) : (
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-900 truncate" title={doc.name}>
                                {doc.name}
                            </p>
                        </div>
                    )}

                    <div className="flex items-center gap-3 text-xs">
                        <span className="text-gray-500">{formatFileSize(doc.size)}</span>
                        <div className="w-1 h-1 rounded-full bg-stone-300"></div>
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{formatDate(doc.uploadedAt)}</span>
                        </div>
                    </div>
                </div>

                {/* Menú de opciones */}
                <div className="flex-shrink-0 relative">
                    <button
                        onClick={(e) => { e.stopPropagation(); onStartRename(doc); }}
                        className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-stone-200 transition-all flex items-center justify-center cursor-pointer opacity-50 group-hover:opacity-100"
                        title="Renombrar"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDownload(doc); }}
                        className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-stone-200 transition-all flex items-center justify-center cursor-pointer opacity- group-hover:opacity-100"
                        title="Descargar"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
                        className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all flex items-center justify-center cursor-pointer opacity- group-hover:opacity-100"
                        title="Eliminar"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FileListItem;
