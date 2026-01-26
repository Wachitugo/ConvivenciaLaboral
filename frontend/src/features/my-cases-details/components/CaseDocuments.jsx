import { useState, useMemo } from 'react';
import CaseDocumentsSkeleton from '../skeletons/CaseDocumentsSkeleton';
import { casesService, chatService } from '../../../services/api';
import { createLogger } from '../../../utils/logger';
import pdfIcon from '../../../assets/pdf.svg';

const logger = createLogger('CaseDocuments');

// Helper functions for file icons and colors
const getFileIcon = (contentType) => {
  const type = contentType || 'application/octet-stream';
  if (type.startsWith('image/')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  } else if (type === 'application/pdf') {
    return (
      <img src={pdfIcon} alt="PDF" className="w-5 h-5" />
    );
  } else if (type.includes('word') || type.includes('document')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  } else if (type.includes('sheet') || type.includes('excel')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    );
  } else {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
};

const getFileColor = (contentType) => {
  const type = contentType || 'application/octet-stream';
  if (type.startsWith('image/')) {
    return 'bg-purple-100 text-purple-600';
  } else if (type === 'application/pdf') {
    return 'bg-red-100 text-red-600';
  } else if (type.includes('word') || type.includes('document')) {
    return 'bg-blue-100 text-blue-600';
  } else if (type.includes('sheet') || type.includes('excel')) {
    return 'bg-green-100 text-green-600';
  } else if (type.includes('presentation') || type.includes('powerpoint')) {
    return 'bg-orange-100 text-orange-600';
  } else {
    return 'bg-gray-100 text-gray-600';
  }
};

const getFileLabel = (contentType, fileName) => {
  const type = contentType || 'application/octet-stream';
  if (type.startsWith('image/')) {
    const ext = type.split('/')[1]?.toUpperCase();
    return ext === 'JPEG' ? 'JPG' : ext;
  } else if (type === 'application/pdf') {
    return 'PDF';
  } else if (type.includes('wordprocessingml')) {
    return 'DOCX';
  } else if (type.includes('msword')) {
    return 'DOC';
  } else if (type.includes('spreadsheetml')) {
    return 'XLSX';
  } else if (type.includes('ms-excel')) {
    return 'XLS';
  }
  // Fallback to extension
  const extension = fileName?.split('.').pop()?.toUpperCase();
  return extension || 'FILE';
};

// Check if file type can be previewed
const canPreview = (contentType) => {
  const type = contentType || '';
  return type.startsWith('image/') || type === 'application/pdf';
};

function CaseDocuments({ allFiles, isLoading = false, caseId, onRefresh }) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [filterSource, setFilterSource] = useState('todos');

  // States for renaming
  const [renamingId, setRenamingId] = useState(null);
  const [newName, setNewName] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // States for preview modal
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const handleMenuToggle = (fileId) => {
    setOpenMenuId(openMenuId === fileId ? null : fileId);
  };

  // Handle preview
  const handlePreview = async (file) => {
    const usuarioData = JSON.parse(localStorage.getItem('usuario'));
    if (!usuarioData) return;

    try {
      setIsPreviewLoading(true);
      setPreviewFile(file);
      // Pass inline=true to get a URL with Content-Disposition: inline
      const response = await casesService.getDocumentDownloadUrl(caseId, file.id, usuarioData.id, true);
      const downloadUrl = response.download_url || response;

      setPreviewUrl(downloadUrl);
    } catch (error) {
      logger.error("Error getting preview URL:", error);
      alert("Error al obtener la vista previa del archivo");
      setPreviewFile(null);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Close preview modal
  const handleClosePreview = () => {
    setPreviewFile(null);
    setPreviewUrl(null);
  };

  // Handle instant download - uses signed URL with Content-Disposition: attachment from backend
  const handleInstantDownload = async (file) => {
    const usuarioData = JSON.parse(localStorage.getItem('usuario'));
    if (!usuarioData) return;

    try {
      setIsActionLoading(true);

      // Get signed URL from backend (now includes Content-Disposition: attachment)
      const response = await casesService.getDocumentDownloadUrl(caseId, file.id, usuarioData.id);
      const downloadUrl = response.download_url || response;

      logger.info('Download URL obtained, initiating download via hidden iframe');

      // Use hidden iframe to trigger download without leaving the page
      // This works because the signed URL includes Content-Disposition: attachment
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = downloadUrl;
      document.body.appendChild(iframe);

      // Clean up iframe after download starts
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 5000);

      logger.info('Download initiated successfully');
    } catch (error) {
      logger.error("Error downloading file:", error);
      alert("Error al descargar el archivo");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files);
    if (uploadedFiles.length === 0) return;

    try {
      setIsUploading(true);
      const usuarioData = JSON.parse(localStorage.getItem('usuario'));
      if (!usuarioData) return;

      // Create temp session for upload
      const sessionId = await chatService.createSession();

      // Use uploadFilesParallel which correctly handles multiple files
      await chatService.uploadFilesParallel(uploadedFiles, sessionId, caseId);

      if (onRefresh) onRefresh();
    } catch (error) {
      logger.error("Error uploading file:", error);
      alert("Error al subir el archivo");
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleAction = async (action, file) => {
    setOpenMenuId(null);
    const usuarioData = JSON.parse(localStorage.getItem('usuario'));
    if (!usuarioData) return;

    if (action === 'rename') {
      setRenamingId(file.id);
      setNewName(file.name);
    }
    else if (action === 'download') {
      handleInstantDownload(file);
    }
    else if (action === 'delete') {
      if (!window.confirm(`¿Estás seguro de eliminar el archivo "${file.name}"?`)) return;

      try {
        setIsActionLoading(true);
        await casesService.deleteCaseDocument(caseId, file.id, usuarioData.id);
        if (onRefresh) onRefresh();
      } catch (error) {
        logger.error("Error deleting file:", error);
        alert("Error al eliminar el archivo");
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    // Local duplicate check
    const isDuplicate = allFiles.some(f => f.name === newName && f.id !== renamingId);
    if (isDuplicate) {
      alert('Ya existe un archivo con ese nombre');
      return;
    }

    try {
      setIsActionLoading(true);
      const usuarioData = JSON.parse(localStorage.getItem('usuario'));
      await casesService.renameCaseDocument(caseId, renamingId, newName, usuarioData.id);
      setRenamingId(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      logger.error("Error renaming file:", error);
      alert("Error al renombrar el archivo");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelRename = () => {
    setRenamingId(null);
    setNewName('');
  };

  // Filtrar archivos según la fuente seleccionada y ocultar archivos de sistema (JSONs de protocolo)
  const filteredFiles = useMemo(() => {
    let files = allFiles;

    // Filtro global: ocultar JSONs de protocolo y otros archivos de sistema si es necesario
    files = files.filter(file => {
      const name = (file.name || '').toLowerCase();
      // Ocultar si termina en .json o contiene 'protocol_'
      return !name.endsWith('.json') && !name.includes('protocol_');
    });

    if (filterSource === 'todos') return files;
    return files.filter(file => file.source === filterSource);
  }, [allFiles, filterSource]);

  // Mostrar skeleton mientras carga
  if (isLoading) {
    return <CaseDocumentsSkeleton />;
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header de documentos */}
      <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="truncate">Documentos</span>
            {filteredFiles.length > 0 && (
              <span className="text-xs sm:text-sm text-gray-500 font-normal">({filteredFiles.length})</span>
            )}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
            <span className="hidden sm:inline">Archivos adjuntos y evidencias del caso</span>
            <span className="sm:hidden">Archivos del caso</span>
          </p>
        </div>
        <label className={`cursor-pointer inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm flex-shrink-0 ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
          {isUploading ? (
            <svg className="animate-spin w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          )}
          <span className="hidden sm:inline">{isUploading ? 'Subiendo...' : 'Subir'}</span>
        </label>
      </div>

      {/* Lista de documentos o estado vacío */}
      {filteredFiles.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 min-h-0">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">No hay documentos</p>
            <p className="text-xs text-gray-400 mt-1">Sube archivos para agregarlos al caso</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 min-h-0">
          <div className="space-y-3">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="group p-3 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all bg-gray-50/50 hover:bg-white"
              >
                <div className="flex items-start gap-3">
                  {/* Icono del archivo */}
                  <div className={`p-2 rounded-lg ${getFileColor(file.content_type)} flex-shrink-0`}>
                    {getFileIcon(file.content_type)}
                  </div>

                  {/* Información del archivo */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    {renamingId === file.id ? (
                      <form onSubmit={handleRenameSubmit} className="flex items-center gap-2 mb-1">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="flex-1 text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button type="submit" className="text-green-600 hover:text-green-700" onClick={(e) => e.stopPropagation()}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleCancelRename(); }} className="text-red-600 hover:text-red-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </form>
                    ) : (
                      <p className="text-sm font-medium text-gray-900 truncate mb-1" title={file.name}>
                        {file.name}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500">{file.size}</span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs font-medium text-gray-400 uppercase">
                        {getFileLabel(file.content_type, file.name)}
                      </span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-400">{file.eventDate}</span>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  {renamingId !== file.id && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Botón de preview - solo para imágenes y PDFs */}
                      {canPreview(file.content_type) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePreview(file); }}
                          className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                          title="Vista previa"
                          disabled={isActionLoading || isPreviewLoading}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAction('rename', file); }}
                        className="p-2 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                        title="Renombrar"
                        disabled={isActionLoading}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {/* Solo mostrar descargar si NO es grabación de entrevista */}
                      {!((file.name || '').toLowerCase().endsWith('.webm') && (file.source === 'entrevista' || file.eventTitle?.toLowerCase().includes('entrevista'))) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAction('download', file); }}
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          title="Descargar"
                          disabled={isActionLoading}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAction('delete', file); }}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                        title="Eliminar"
                        disabled={isActionLoading}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Preview */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={handleClosePreview}
          onKeyDown={(e) => e.key === 'Escape' && handleClosePreview()}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2 rounded-lg ${getFileColor(previewFile.content_type)} flex-shrink-0`}>
                  {getFileIcon(previewFile.content_type)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{previewFile.name}</p>
                  <p className="text-xs text-gray-500">{previewFile.size} • {getFileLabel(previewFile.content_type, previewFile.name)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Botón descargar en el modal */}
                <button
                  onClick={() => handleInstantDownload(previewFile)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  disabled={isActionLoading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="hidden sm:inline">Descargar</span>
                </button>
                {/* Botón cerrar */}
                <button
                  onClick={handleClosePreview}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                  title="Cerrar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenido del preview */}
            <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center min-h-0">
              {isPreviewLoading ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <svg className="animate-spin w-10 h-10 text-blue-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-gray-600">Cargando vista previa...</p>
                </div>
              ) : previewUrl ? (
                previewFile.content_type === 'application/pdf' ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full min-h-[60vh]"
                    title={`Preview de ${previewFile.name}`}
                  />
                ) : previewFile.content_type?.startsWith('image/') ? (
                  <img
                    src={previewUrl}
                    alt={previewFile.name}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <div className={`p-4 rounded-xl ${getFileColor(previewFile.content_type)} mb-4`}>
                      {getFileIcon(previewFile.content_type)}
                    </div>
                    <p className="text-gray-600 mb-2">No se puede previsualizar este tipo de archivo</p>
                    <p className="text-sm text-gray-400">Descárgalo para verlo</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <p className="text-gray-600">Error al cargar la vista previa</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CaseDocuments;
