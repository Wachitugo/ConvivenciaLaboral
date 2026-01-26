import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import pdf from '../../assets/pdf.svg';

function FileListPanel({ files, onClose, onFileClick, relatedCase, onAddToInput }) {
  const { current } = useTheme();

  if (!files || files.length === 0) return null;

  // Normalizar archivos para asegurar que tengan type
  // Y filtrar archivos internos del sistema (ej: protocol_*.txt) y archivos de audio
  const safeFiles = files
    .filter(f => {
      const name = (f.name || '').toLowerCase();
      const type = (f.type || f.content_type || '').toLowerCase();

      // Ocultar cualquier archivo que empiece con "protocol_"
      if (name.startsWith('protocol_')) return false;

      // Ocultar archivos de audio (webm, mp3, wav, ogg, m4a, etc.)
      if (type.startsWith('audio/')) return false;
      if (name.endsWith('.webm') || name.endsWith('.mp3') || name.endsWith('.wav') ||
        name.endsWith('.ogg') || name.endsWith('.m4a') || name.endsWith('.mp4')) return false;

      return true;
    })
    .map(f => ({
      ...f,
      type: f.type || f.content_type || 'application/octet-stream'
    }));

  const handleAddToInput = (file, e) => {
    e.stopPropagation();
    if (onAddToInput) {
      onAddToInput(file);
    }
  };

  const handleAddAllToInput = () => {
    if (onAddToInput) {
      safeFiles.forEach(file => onAddToInput(file));
    }
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (type === 'application/pdf') {
      return (
        <img src={pdf} alt="PDF" className="w-5 h-5" />
      );
    } else {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
  };

  const getFileColor = (type) => {
    if (type.startsWith('image/')) {
      return 'bg-purple-50 border-purple-200 text-purple-600';
    } else if (type === 'application/pdf') {
      return 'bg-red-50 border-red-200 text-red-600';
    } else if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      type === 'application/msword') {
      return 'bg-blue-50 border-blue-200 text-blue-600';
    } else if (type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      type === 'application/vnd.ms-excel') {
      return 'bg-green-50 border-green-200 text-green-600';
    } else if (type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      type === 'application/vnd.ms-powerpoint') {
      return 'bg-orange-50 border-orange-200 text-orange-600';
    } else {
      return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  const getBadgeColor = (type) => {
    if (type.startsWith('image/')) {
      return 'bg-purple-100 text-purple-700';
    } else if (type === 'application/pdf') {
      return 'bg-red-100 text-red-700';
    } else if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      type === 'application/msword') {
      return 'bg-blue-100 text-blue-700';
    } else if (type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      type === 'application/vnd.ms-excel') {
      return 'bg-green-100 text-green-700';
    } else if (type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      type === 'application/vnd.ms-powerpoint') {
      return 'bg-orange-100 text-orange-700';
    } else {
      return 'bg-gray-100 text-gray-700';
    }
  };

  const getFileLabel = (type, fileName) => {
    // Primero intenta por tipo MIME
    if (type.startsWith('image/')) {
      const extension = type.split('/')[1]?.toUpperCase();
      return extension === 'JPEG' ? 'JPG' : extension;
    } else if (type === 'application/pdf') {
      return 'PDF';
    } else if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return 'DOCX';
    } else if (type === 'application/msword') {
      return 'DOC';
    } else if (type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      return 'XLSX';
    } else if (type === 'application/vnd.ms-excel') {
      return 'XLS';
    } else if (type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      return 'PPTX';
    } else if (type === 'application/vnd.ms-powerpoint') {
      return 'PPT';
    } else if (type === 'text/plain') {
      return 'TXT';
    }

    // Si no se encuentra por tipo MIME, intenta extraer de la extensión del archivo
    const extension = fileName?.split('.').pop()?.toUpperCase();
    return extension || 'FILE';
  };

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }} className="w-[350px] h-full bg-white rounded-lg border border-gray-300 shadow-md flex flex-col animate-slide-in overflow-hidden">
      {/* Header minimalista con más aire */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Archivos
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {safeFiles.length} {safeFiles.length === 1 ? 'archivo' : 'archivos'} adjuntos
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Lista de archivos más espaciosa */}
      <div className="flex-1 overflow-auto custom-scrollbar p-4">
        <div className="space-y-3">
          {safeFiles.map((file, index) => {
            const isImage = file.type.startsWith('image/');
            const isPdf = file.type === 'application/pdf';
            return (
              <div
                key={file.id}
                className="group p-3 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all bg-gray-50/50 hover:bg-white"
              >
                <div className="flex items-start gap-3">
                  {/* Icono */}
                  <div className={`p-2 rounded-lg ${getFileColor(file.type)} bg-opacity-50`}>
                    {getFileIcon(file.type)}
                  </div>

                  {/* Información del archivo */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer pt-0.5"
                    onClick={() => onFileClick(file)}
                  >
                    <p className="text-sm font-medium text-gray-900 truncate mb-1">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs font-medium text-gray-400 uppercase">
                        {getFileLabel(file.type, file.name)}
                      </span>
                    </div>
                  </div>

                  {/* Botón de agregar individual */}
                  <button
                    onClick={(e) => handleAddToInput(file, e)}
                    className="p-1.5 rounded-lg text-gray-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    title="Agregar al mensaje"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer con acciones principales */}
      <div className="p-5 border-t border-gray-100 bg-gray-50/50">

        {/* Indicador de caso relacionado (si existe) */}
        {relatedCase && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-blue-50/50 border border-blue-100 rounded-lg">
            <span className="text-xs font-medium text-blue-700 whitespace-nowrap">Caso:</span>
            <span className="text-xs text-blue-800 truncate" title={relatedCase.title}>
              {relatedCase.title}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          {/* Info Total */}
          <div className="text-xs font-medium text-gray-500">
            Total: <span className="text-gray-900">{(safeFiles.reduce((acc, file) => acc + file.size, 0) / 1024).toFixed(2)} KB</span>
          </div>

          {/* Botón Principal: Agregar todo */}
          <button
            onClick={handleAddAllToInput}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar todo
          </button>
        </div>
      </div>
    </div>
  );
}

export default FileListPanel;