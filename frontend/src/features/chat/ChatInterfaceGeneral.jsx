import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate, useParams } from 'react-router-dom';
import pdf from '../../assets/pdf.svg';
import useSpeechToText from '../../hooks/useSpeechToText';
import SuggestionCards from './SuggestionCards';
import { useClickOutside } from './hooks';
import { chatService } from '../../services/api';

function ChatInterfaceGeneral({ onSendMessage, relatedCase, isThinking, isStreaming, onStopGenerating, onSuggestionClick, hasMessages = false, availableCases = [], onCaseSelect, initialFiles = [], filesToAddToInput = [], onFilesAddedToInput }) {
  const { current } = useTheme();
  const navigate = useNavigate();
  const { schoolSlug } = useParams();
  const [input, setInput] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]); // Iniciar vacio, no cargar initialFiles automaticamente
  const [isDragging, setIsDragging] = useState(false);
  const [isMultiLine, setIsMultiLine] = useState(false);
  const [showCaseDropdown, setShowCaseDropdown] = useState(false);
  const [caseSearchQuery, setCaseSearchQuery] = useState('');
  const [uploadLimits, setUploadLimits] = useState({ max_files: 20, max_file_size_mb: 500, max_total_size_mb: 1000 });
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const dragCounter = useRef(0);
  const textareaRef = useRef(null);
  const caseDropdownRef = useRef(null);
  const caseSearchInputRef = useRef(null);
  const initialHeightRef = useRef(null);

  // Cerrar dropdown cuando se hace clic fuera
  useClickOutside(showCaseDropdown, () => setShowCaseDropdown(false), '.case-dropdown-container');

  // Fetch upload limits on mount
  useEffect(() => {
    chatService.getUploadLimits()
      .then(limits => {
        if (limits) setUploadLimits(limits);
      })
      .catch(err => console.error('Failed to fetch upload limits:', err));
  }, []);

  // Sincronizar archivos desde el panel lateral (filesToAddToInput)
  useEffect(() => {
    if (filesToAddToInput && filesToAddToInput.length > 0) {
      // Normalizar archivos
      const normalizedFiles = filesToAddToInput.map(f => ({
        ...f,
        type: f.type || f.content_type || 'application/octet-stream',
        // Asegurar que tengan ID único para el input
        id: f.id || Date.now() + Math.random()
      }));

      // Evitar duplicados
      const newFiles = normalizedFiles.filter(iFile =>
        !attachedFiles.some(aFile =>
          (aFile.id === iFile.id) ||
          (aFile.url && iFile.url && aFile.url === iFile.url) ||
          (aFile.gcs_uri && iFile.gcs_uri && aFile.gcs_uri === iFile.gcs_uri)
        )
      );

      if (newFiles.length > 0) {
        setAttachedFiles(prev => [...prev, ...newFiles]);
      }

      // Notificar al padre que ya se procesaron
      if (onFilesAddedToInput) {
        onFilesAddedToInput();
      }
    }
  }, [filesToAddToInput, onFilesAddedToInput, attachedFiles]);

  // Filtrar casos según búsqueda
  const filteredCases = availableCases.filter(caseItem =>
    caseItem.title.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
    (caseItem.caseType && caseItem.caseType.toLowerCase().includes(caseSearchQuery.toLowerCase()))
  );

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;

      // Guardar altura inicial si no existe
      if (initialHeightRef.current === null) {
        textarea.style.height = 'auto';
        initialHeightRef.current = textarea.scrollHeight;
      }

      // Resetear altura y recalcular
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = scrollHeight + 'px';

      // Calcular líneas aproximadas
      const baseHeight = initialHeightRef.current;
      const lineHeight = baseHeight; // aproximadamente la altura de una línea
      const lines = Math.round(scrollHeight / lineHeight);

      // Si el input está vacío, resetear
      if (!input.trim()) {
        setIsMultiLine(false);
      } else if (lines >= 2 && !isMultiLine) {
        // Solo cambiar a multilinea si tiene 2+ líneas y aún no lo está
        setIsMultiLine(true);
      }
      // Una vez en multilinea, quedarse ahí hasta que se vacíe
    }
  }, [input, isMultiLine]);

  // Auto-focus en el input de búsqueda de casos cuando se abre el dropdown
  useEffect(() => {
    if (showCaseDropdown && caseSearchInputRef.current) {
      // Pequeño timeout para asegurar que el elemento sea visible antes de enfocarlo
      setTimeout(() => {
        caseSearchInputRef.current.focus();
      }, 50);
    }
  }, [showCaseDropdown]);

  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    hasRecognitionSupport,
    error: speechError
  } = useSpeechToText({ continuous: true });

  // Show errors from speech recognition
  useEffect(() => {
    if (speechError) {
      alert(speechError);
    }
  }, [speechError]);

  // Efecto para actualizar el input con la transcripción
  useEffect(() => {
    if (transcript) {
      setInput(prev => prev + transcript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  const toggleListening = () => {
    if (!hasRecognitionSupport) {
      alert('Tu navegador no soporta reconocimiento de voz. Por favor, usa Chrome, Edge o Safari.');
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() && attachedFiles.length === 0) return;

    // Enviar mensaje al componente padre con archivos adjuntos
    if (onSendMessage) {
      onSendMessage(input, attachedFiles);
    }

    setInput('');
    setAttachedFiles([]);
    setIsMultiLine(false);
    initialHeightRef.current = null;

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const validateFileTypes = (files) => {
    // Check for .doc and .docx files (Word documents not supported)
    const wordFiles = files.filter(file => {
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      return fileName.endsWith('.doc') ||
        fileName.endsWith('.docx') ||
        fileType === 'application/msword' ||
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    });

    if (wordFiles.length > 0) {
      const fileNames = wordFiles.map(f => f.name).join(', ');
      showError(`Los archivos de Word (.doc, .docx) no son compatibles.\n\nArchivos rechazados: ${fileNames}\n\nPor favor, convierte tus documentos a PDF antes de subirlos.`);
      return false;
    }

    // Check for audio files (not supported in chat)
    const audioFiles = files.filter(file => {
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      return fileType.startsWith('audio/') ||
        fileName.endsWith('.webm') ||
        fileName.endsWith('.mp3') ||
        fileName.endsWith('.wav') ||
        fileName.endsWith('.ogg') ||
        fileName.endsWith('.m4a');
    });

    if (audioFiles.length > 0) {
      const fileNames = audioFiles.map(f => f.name).join(', ');
      showError(`Los archivos de audio no son compatibles en el chat.\n\nArchivos rechazados: ${fileNames}\n\nPara transcribir audios, usa la sección de Entrevistas.`);
      return false;
    }

    return true;
  };

  const validateFiles = (files) => {
    // First check file types
    if (!validateFileTypes(files)) {
      return false;
    }

    // Check file count
    const totalFiles = attachedFiles.length + files.length;
    if (totalFiles > uploadLimits.max_files) {
      showError(`Máximo ${uploadLimits.max_files} archivos permitidos. Intentas subir ${totalFiles} archivos.`);
      return false;
    }

    // Check individual file sizes
    for (const file of files) {
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > uploadLimits.max_file_size_mb) {
        showError(`El archivo "${file.name}" excede el límite de ${uploadLimits.max_file_size_mb}MB (tiene ${sizeMB.toFixed(1)}MB).\n\nPor favor, reduce el tamaño del archivo o divídelo en partes más pequeñas.`);
        return false;
      }
    }

    // Check total size
    const currentTotalMB = attachedFiles.reduce((sum, f) => sum + (f.size || 0), 0) / (1024 * 1024);
    const newFilesMB = files.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024);
    const totalMB = currentTotalMB + newFilesMB;

    if (totalMB > uploadLimits.max_total_size_mb) {
      showError(`El tamaño total (${totalMB.toFixed(1)}MB) excede el límite de ${uploadLimits.max_total_size_mb}MB. Por favor, sube menos archivos.`);
      return false;
    }

    return true;
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Filter out .doc and .docx files
    const invalidFiles = files.filter(file => {
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      return fileName.endsWith('.doc') ||
        fileName.endsWith('.docx') ||
        fileType === 'application/msword' ||
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    });

    // Get valid files only
    const validFiles = files.filter(file => {
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      return !(fileName.endsWith('.doc') ||
        fileName.endsWith('.docx') ||
        fileType === 'application/msword' ||
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });

    // Show error for invalid files if any
    if (invalidFiles.length > 0) {
      const fileNames = invalidFiles.map(f => f.name).join(', ');
      showError(`Los archivos de Word (.doc, .docx) no son compatibles y fueron rechazados:\n\n${fileNames}\n\nPor favor, convierte tus documentos a PDF antes de subirlos.`);
    }

    // Continue with valid files if any
    if (validFiles.length === 0) {
      e.target.value = ''; // Clear file input
      return;
    }

    // Validate valid files before processing
    if (!validateFiles(validFiles)) {
      e.target.value = ''; // Clear file input
      return;
    }

    const processedFiles = validFiles.map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file)
    }));

    setAttachedFiles(prev => [...prev, ...processedFiles]);
  };

  const removeFile = (fileId) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);

    // Filter out .doc and .docx files
    const invalidFiles = files.filter(file => {
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      return fileName.endsWith('.doc') ||
        fileName.endsWith('.docx') ||
        fileType === 'application/msword' ||
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    });

    // Get valid files only
    const validFiles = files.filter(file => {
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      return !(fileName.endsWith('.doc') ||
        fileName.endsWith('.docx') ||
        fileType === 'application/msword' ||
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });

    // Show error for invalid files if any
    if (invalidFiles.length > 0) {
      const fileNames = invalidFiles.map(f => f.name).join(', ');
      showError(`Los archivos de Word (.doc, .docx) no son compatibles y fueron rechazados:\n\n${fileNames}\n\nPor favor, convierte tus documentos a PDF antes de subirlos.`);
    }

    // Continue with valid files if any
    if (validFiles.length === 0) {
      return;
    }

    // Validate valid files before processing
    if (!validateFiles(validFiles)) {
      return;
    }

    const processedFiles = validFiles.map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file)
    }));

    setAttachedFiles(prev => [...prev, ...processedFiles]);
  };

  const handleStopClick = () => {
    if (onStopGenerating) {
      onStopGenerating();
    }
  };

  const handleCaseSelectInternal = (caseItem) => {
    if (onCaseSelect) {
      onCaseSelect(caseItem);
    }
    setShowCaseDropdown(false);
  };

  const getFileIcon = (type) => {
    if (!type) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }

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

  return (
    <div
      className="relative"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-3">
              Archivo no válido
            </h3>

            {/* Message */}
            <p className="text-gray-600 text-center mb-6 whitespace-pre-line leading-relaxed">
              {errorMessage}
            </p>

            {/* Button */}
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Sugerencias - Solo se muestran cuando no hay mensajes */}
      {onSuggestionClick && !hasMessages && (
        <SuggestionCards onSuggestionClick={onSuggestionClick} />
      )}


      {/* Overlay de drag and drop */}
      {isDragging && (
        <div className="absolute inset-0 bg-[#EBF4FF]/90 border-2 border-dashed border-[#1A71B8] rounded-2xl z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <svg className="w-10 h-10 mx-auto text-[#1A71B8] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
        </div>
      )}

      {/* Input con botones integrados */}
      <form onSubmit={handleSubmit}>
        <div className="relative overflow-hidden rounded-[32px] bg-white/80 backdrop-blur-2xl border border-white p-4 shadow-[0_32px_64px_-15px_rgba(10,56,102,0.15)] focus-within:shadow-[0_40px_80px_-15px_rgba(10,56,102,0.22)] transition-all group">
          {/* Interior glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#1A71B8]/10 rounded-full blur-3xl group-focus-within:bg-[#1A71B8]/20 transition-colors pointer-events-none" />

          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.gif"
            multiple
            onChange={handleFileChange}
          />

          {/* Fila superior: adjuntar + textarea */}
          <div className="relative flex items-start gap-4 px-2">
            <label
              htmlFor="file-upload"
              className="flex-shrink-0 mt-[14px] cursor-pointer text-[#64748b] hover:text-[#1A71B8] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
              </svg>
            </label>

            <textarea
              ref={textareaRef}
              value={input + (isListening ? interimTranscript : '')}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              className={`flex-1 bg-transparent text-[#0A3866] placeholder-[#94a3b8]/60 focus:outline-none resize-none max-h-[230px] overflow-y-auto custom-scrollbar text-base md:text-lg font-semibold py-3 leading-relaxed ${isListening ? 'placeholder-red-400' : ''}`}
              placeholder={isListening ? "Escuchando..." : "Describe una situación o haz una consulta..."}
              rows="1"
            />
          </div>

          {/* Chips de caso y archivos dentro del input */}
          {(relatedCase || attachedFiles.length > 0) && (
            <div className="flex flex-wrap gap-1.5 px-2 pt-3">
              {/* Badge caso relacionado */}
              {relatedCase && (
                <div
                  onClick={() => {
                    const basePath = schoolSlug ? `/${schoolSlug}` : '';
                    navigate(`${basePath}/mis-casos/${relatedCase.id}`);
                  }}
                  className="flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-xl border border-[#1A71B8]/20 bg-[#EBF4FF] hover:bg-[#dbeafe] hover:border-[#1A71B8]/35 transition-all cursor-pointer group/case"
                >
                  <div className="flex-shrink-0 w-5 h-5 rounded-md bg-[#1A71B8]/15 flex items-center justify-center">
                    <svg className="w-3 h-3 text-[#1A71B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold text-[#1A71B8] uppercase tracking-wider">Caso</span>
                  <div className="w-px h-3 bg-[#1A71B8]/20" />
                  <span className="text-xs text-[#0A3866] font-medium truncate max-w-[180px] group-hover/case:text-[#1A71B8] transition-colors">
                    {relatedCase.title}
                  </span>
                  <svg className="w-3 h-3 text-[#1A71B8]/40 group-hover/case:text-[#1A71B8] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}

              {/* Chips archivos adjuntos */}
              {attachedFiles.map(file => (
                <div
                  key={file.id}
                  className="flex items-center gap-1.5 pl-2 pr-1.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 transition-all group/file"
                >
                  <div className="flex-shrink-0 w-4 h-4 text-[#1A71B8]">
                    {getFileIcon(file.type)}
                  </div>
                  <span className="text-xs text-slate-600 font-medium truncate max-w-[130px]">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Separador */}
          <div className="border-t border-slate-100 mt-3 mx-2" />

          {/* Fila inferior: controles izquierda + enviar derecha */}
          <div className="flex items-center justify-between pt-3 px-2">
            {/* Controles izquierda */}
            <div className="flex items-center gap-1">
              {/* Micrófono */}
              <button
                type="button"
                onClick={toggleListening}
                disabled={!hasRecognitionSupport}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  !hasRecognitionSupport
                    ? 'text-[#cbd5e1] cursor-not-allowed'
                    : isListening
                      ? 'text-red-500 bg-red-50 animate-pulse'
                      : 'text-[#64748b] hover:bg-slate-50 hover:text-[#1A71B8]'
                }`}
                title={!hasRecognitionSupport ? "Navegador no compatible con dictado por voz" : (isListening ? "Detener grabación" : "Activar micrófono")}
              >
                {isListening ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
                <span>Voz</span>
              </button>

            </div>

            {/* Botón enviar / stop */}
            {isThinking || isStreaming ? (
              <button
                type="button"
                onClick={handleStopClick}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 font-bold text-sm rounded-2xl transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
                <span>Detener</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() && attachedFiles.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#1A71B8] hover:bg-[#0A3866] text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-[#1A71B8]/20 hover:shadow-[#0A3866]/30 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <span>Enviar</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

export default ChatInterfaceGeneral
