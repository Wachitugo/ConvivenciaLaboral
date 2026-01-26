import { useState, useEffect } from 'react';
import { schoolsService } from '../../services/api';
import { createLogger } from '../../utils/logger';

const logger = createLogger('SchoolDocumentsModal');

export default function SchoolDocumentsModal({ isOpen, onClose, school }) {
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);

    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (isOpen && school) {
            loadDocuments();
        }
    }, [isOpen, school]);

    const loadDocuments = async () => {
        if (!school) return;
        setIsLoading(true);
        setError(null);
        try {
            const docs = await schoolsService.listDocuments(school.id);
            setDocuments(docs);
        } catch (err) {
            setError('Error cargando documentos');
            logger.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const uploadFiles = async (files) => {
        if (files.length === 0) return;

        setIsUploading(true);
        setError(null);
        try {
            await Promise.all(files.map(file => schoolsService.uploadDocument(school.id, file)));
            await loadDocuments();
        } catch (err) {
            setError('Error subiendo documentos');
            logger.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files);
        await uploadFiles(files);
        e.target.value = ''; // Reset input
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        await uploadFiles(files);
    };

    const handleDelete = async (filename) => {
        if (!window.confirm(`¿Estás seguro de eliminar el archivo ${filename}?`)) return;

        setIsLoading(true);
        try {
            await schoolsService.deleteDocument(school.id, filename);
            await loadDocuments();
        } catch (err) {
            setError('Error eliminando documento');
            logger.error(err);
            setIsLoading(false);
        }
    };

    if (!isOpen || !school) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-all duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300 scale-100">
                {/* Header */}
                <div className="px-5 py-4 md:px-8 md:py-6 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Documentos del Colegio</h3>
                        <p className="text-sm text-gray-500 mt-1">Gestiona los archivos asociados a <span className="font-medium text-gray-900">{school?.nombre}</span></p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 md:p-8 overflow-y-auto flex-1 bg-white">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {error}
                        </div>
                    )}

                    {/* Upload Area */}
                    <div className="mb-8 group">
                        <label
                            className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${isDragging ? 'border-purple-500 bg-purple-50 scale-[1.02]' : 'border-gray-200 bg-gray-50/50 hover:bg-purple-50/30 hover:border-purple-300'}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
                                {isUploading ? (
                                    <div className="flex flex-col items-center animate-pulse">
                                        <svg className="w-8 h-8 mb-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                        <p className="text-sm font-medium text-purple-600">Subiendo archivos...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className={`w-12 h-12 rounded-full shadow-sm flex items-center justify-center mb-3 transition-transform duration-300 ${isDragging ? 'bg-purple-100 scale-110' : 'bg-white group-hover:scale-110'}`}>
                                            <svg className={`w-6 h-6 ${isDragging ? 'text-purple-600' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                        </div>
                                        <p className={`mb-1 text-sm font-medium transition-colors ${isDragging ? 'text-purple-700' : 'text-gray-700 group-hover:text-purple-700'}`}>
                                            {isDragging ? 'Suelta los archivos aquí' : 'Click para subir o arrastra archivos'}
                                        </p>
                                        <p className="text-xs text-gray-400">PDF, DOC, IMG (Max. 10MB)</p>
                                    </>
                                )}
                            </div>
                            <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} multiple />
                        </label>
                    </div>

                    {/* Documents List */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Archivos Existentes ({documents.length})</h4>

                        {isLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="text-center py-10 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-gray-500 text-sm">No hay documentos cargados en este colegio.</p>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {documents.map((doc) => (
                                    <li key={doc.filename} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:border-purple-100 transition-all group">
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-xs uppercase">
                                                {doc.filename.split('.').pop().slice(0, 3)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors" title={doc.filename}>
                                                    {doc.filename}
                                                </p>
                                                <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                                                    <span>{(doc.size / 1024).toFixed(1)} KB</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                    <span>{new Date(doc.updated_at).toLocaleDateString()}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Ver descarga"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </a>
                                            <button
                                                onClick={() => handleDelete(doc.filename)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Eliminar documento"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 md:px-8 md:py-5 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all font-medium text-sm shadow-sm"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
