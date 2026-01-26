import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import mammoth from 'mammoth';
import { createLogger } from '../../utils/logger';

const logger = createLogger('FilePreviewPanel');

function FilePreviewPanel({ file, onClose, onBack }) {
  const { current } = useTheme();
  const [docxContent, setDocxContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isImage = file?.type.startsWith('image/');
  const isPdf = file?.type === 'application/pdf';
  const isDocx = file?.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file?.name.endsWith('.docx');

  useEffect(() => {
    if (isDocx && file.url) {
      setLoading(true);
      setError(null);

      const fetchAndConvertMsg = async () => {
        try {
          // Si el archivo es remoto (URL), necesitamos fetch como arraybuffer
          const response = await fetch(file.url);
          if (!response.ok) throw new Error('Failed to fetch file');

          const arrayBuffer = await response.arrayBuffer();

          const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
          setDocxContent(result.value);
        } catch (err) {
          logger.error("Error converting docx:", err);
          setError("No se pudo visualizar el documento. Por favor descárgalo para verlo.");
        } finally {
          setLoading(false);
        }
      };

      fetchAndConvertMsg();
    }
  }, [file, isDocx]);

  if (!file) return null;

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }} className="w-[500px] h-full rounded-lg bg-white border border-gray-300 shadow-md flex flex-col animate-slide-in overflow-hidden">
      {/* Header del panel - Estilo FileListPanel */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4">

        <div className="flex items-center gap-3 flex-1 min-w-0">
          {onBack && (
            <button onClick={onBack} className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all flex items-center justify-center -ml-2" title="Volver a la lista">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-800 truncate" title={file.name}>
              {file.name}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all flex items-center justify-center flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Contenido del archivo */}
      <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-gray-50/30">
        {isImage ? (
          <div className="flex items-center justify-center h-full">
            <img
              src={file.url}
              alt={file.name}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        ) : isPdf ? (
          <div className="h-full">
            <iframe
              src={file.url}
              className="w-full h-full rounded-lg border"
              title={file.name}
            />
          </div>
        ) : isDocx ? (
          <div className="h-full bg-white p-6 rounded-lg shadow-sm border border-gray-100 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-500">Cargando documento...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                <p className="text-sm text-red-500">{error}</p>
                <a href={file.url} download className="text-xs text-blue-600 hover:underline">Descargar archivo</a>
              </div>
            ) : (
              <div
                className="prose prose-sm max-w-none text-justify"
                dangerouslySetInnerHTML={{ __html: docxContent }}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg className="w-20 h-20 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className={`text-sm ${current.textSecondary} mb-2`}>
              Vista previa no disponible para este tipo de archivo
            </p>
            <p className={`text-xs ${current.textSecondary}`}>
              {file.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FilePreviewPanel;
