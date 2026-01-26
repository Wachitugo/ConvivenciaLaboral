import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { schoolsService } from '../../../services/api';
import { createLogger } from '../../../utils/logger';
import { FileText, Upload, Trash2, Download, Loader2 } from 'lucide-react';

const logger = createLogger('SchoolDocumentsContent');

const SchoolDocumentsContent = forwardRef(function SchoolDocumentsContent({ school }, ref) {
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    // Exponer función para triggear el upload desde el padre
    useImperativeHandle(ref, () => ({
        triggerUpload: () => {
            fileInputRef.current?.click();
        }
    }));

    useEffect(() => {
        if (school) {
            loadDocuments();
        }
    }, [school]);

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
        e.target.value = '';
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

    if (!school) return null;

    return (
        <>
            {/* Input oculto para upload */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleUpload}
                disabled={isUploading}
                multiple
            />

            {error && (
                <div className="m-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            {isUploading && (
                <div className="m-6 bg-purple-50 border border-purple-100 text-purple-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Subiendo archivos...
                </div>
            )}

            {/* Documents Table */}
            {isLoading ? (
                <div className="p-6 space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <FileText size={28} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Sin documentos</h3>
                    <p className="text-gray-500 text-sm max-w-sm mb-6">
                        Haz clic en el botón "Cargar Documentos" para subir archivos.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Documento</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Tamaño</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Fecha</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {documents.map((doc) => (
                                <tr key={doc.filename} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                                                {doc.filename.split('.').pop().slice(0, 3)}
                                            </div>
                                            <p className="text-sm font-medium text-gray-900 truncate max-w-[250px]" title={doc.filename}>
                                                {doc.filename}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600">{(doc.size / 1024).toFixed(1)} KB</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600">{new Date(doc.updated_at).toLocaleDateString()}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Descargar"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={() => handleDelete(doc.filename)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                        <p className="text-xs text-gray-500">
                            Mostrando <span className="font-medium text-gray-900">{documents.length}</span> documentos
                        </p>
                    </div>
                </div>
            )}
        </>
    );
});

export default SchoolDocumentsContent;
