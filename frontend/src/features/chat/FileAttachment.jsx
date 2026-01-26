import { useTheme } from '../../contexts/ThemeContext';
import pdf from '../../assets/pdf.svg';
function FileAttachment({ file, onClick, isUserMessage }) {
  const { current } = useTheme();

  const safeType = file.type || file.content_type || 'application/octet-stream';
  const safeName = file.name || 'Archivo';

  const isPdf = safeType === 'application/pdf';
  const isImage = safeType.startsWith('image/');
  const isWord = safeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    safeType === 'application/msword' ||
    safeName.endsWith('.doc') ||
    safeName.endsWith('.docx');

  return (
    <button
      onClick={() => onClick(file)}
      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all hover:scale-105 shadow-sm ${isUserMessage
        ? 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
        : `${current.formBg} hover:bg-gray-50 dark:hover:bg-gray-700 border-2 ${current.cardBorder}`
        }`}
    >
      {/* Icono del archivo con color específico */}
      <div className="flex-shrink-0">
        {isPdf ? (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isUserMessage ? 'bg-red-100 dark:bg-red-900/40' : 'bg-red-50 dark:bg-red-900/30'
            }`}>
            <img src={pdf} alt="PDF" className="w-5 h-5" />

          </div>
        ) : isImage ? (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isUserMessage ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-blue-50 dark:bg-blue-900/30'
            }`}>
            <svg className={`w-6 h-6 ${isUserMessage ? 'text-blue-700 dark:text-blue-300' : 'text-blue-600 dark:text-blue-400'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
          </div>
        ) : isWord ? (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isUserMessage ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-blue-50 dark:bg-blue-900/30'
            }`}>
            <svg className={`w-6 h-6 ${isUserMessage ? 'text-blue-700 dark:text-blue-300' : 'text-blue-700 dark:text-blue-400'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
              <path d="M14 2v6h6" />
              <text x="6.5" y="18" fontSize="5" fontWeight="bold" fill="currentColor">DOC</text>
            </svg>
          </div>
        ) : (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isUserMessage ? 'bg-gray-100 dark:bg-gray-600' : 'bg-gray-50 dark:bg-gray-700'
            }`}>
            <svg className={`w-6 h-6 ${isUserMessage ? current.textPrimary : current.textSecondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Información del archivo */}
      <div className="flex flex-col items-start min-w-0">
        <span className={`text-xs font-medium truncate max-w-[150px] ${isUserMessage ? current.textPrimary : current.textPrimary
          }`}>
          {safeName}
        </span>

      </div>

      {/* Indicador de click */}
      <svg className={`w-4 h-4 flex-shrink-0 ${isUserMessage ? current.textSecondary : current.textSecondary
        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

export default FileAttachment;
