import { useState, useEffect, useRef } from 'react';
import { useLocation, useOutletContext, useNavigate } from 'react-router-dom';
import { createLogger } from '../utils/logger';

const logger = createLogger('ChatGeneralPage');

import {
  ChatContainer,
  FilePreviewPanel,
  FileListPanel,
  CaseListPanel,
  ChatSkeleton
} from '../features/chat';
import {
  useChatExport,
  useChatMessages,
  useChatFiles,
  useCaseAssociation
} from '../features/chat/hooks';
import { casesService, chatService, API_URL } from '../services/api';
import ErrorBoundary from '../components/ErrorBoundary';

function ChatGeneralPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSidebarOpen, toggleSidebar, refreshConversations } = useOutletContext();

  // Custom hooks
  const { messages, isThinking, isStreaming, thinkingText, sendMessage, handleLike, handleDislike, downloadMessage, stopGenerating, sessionId, sessionTitle, isLoadingHistory } = useChatMessages(location.state?.sessionId);
  const {
    chatFiles,
    selectedFile,
    showFileList,
    addFiles,
    handleFileClick,
    closeFilePreview,
    handleBackToFileList,
    toggleFileList,
    closeFileList,
    setChatFiles
  } = useChatFiles();
  const {
    relatedCase,
    availableCases,
    showCaseList,
    setRelatedCase,
    toggleCaseList,
    closeCaseList,
    associateCase
  } = useCaseAssociation(location.state?.relatedCase, sessionId);
  const { exportToPDF, exportToWord } = useChatExport();

  // Local state
  const [chatTitle, setChatTitle] = useState('Nueva Consulta');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(true);
  const [isGeneratingCase, setIsGeneratingCase] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [caseError, setCaseError] = useState(null);
  const [caseSuccess, setCaseSuccess] = useState(null);

  // Simular carga del chat cuando se navega a la página o cambia la sesión
  useEffect(() => {
    setIsChatLoading(true);
    const timer = setTimeout(() => {
      setIsChatLoading(false);
    }, 800); // 0.8 segundos de carga MÍNIMA

    return () => clearTimeout(timer);
  }, [location.state?.sessionId]);

  // COMBINAR loading artificial con estado real de carga del historial
  const showSkeleton = isChatLoading || isLoadingHistory;

  // Sincronizar archivos (chatFiles) basándose en el historial de mensajes Y los documentos del caso
  useEffect(() => {
    const loadSessionFiles = async () => {
      if (!sessionId) return;

      try {
        // 🆕 Si hay caso relacionado, cargar archivos por case_id directamente
        const identifier = relatedCase?.id || sessionId;
        const response = await fetch(`${API_URL}/chat/sessions/${identifier}/files`);

        if (response.ok) {
          const data = await response.json();
          if (data.files && data.files.length > 0) {
            // 🔧 Convertir URLs relativas a absolutas para el preview
            const filesWithFullUrls = data.files.map(file => ({
              ...file,
              url: file.url.startsWith('http') ? file.url : `${API_URL}${file.url}`
            }));
            setChatFiles(filesWithFullUrls);
            logger.info(`✅ Loaded ${filesWithFullUrls.length} files for ${relatedCase ? 'case' : 'session'}: ${identifier}`);
            return; // ✅ Tenemos metadata completa, no necesitamos extraer de mensajes
          }
        }
      } catch (error) {
        logger.warn('Error loading files from endpoint, falling back to message extraction:', error);
        // Fallback silently to message extraction
      }

      // 🔄 Fallback: Extraer archivos desde mensajes (lógica anterior)
      const extractFilesFromMessages = () => {
        const allFiles = [];
        const seenIds = new Set();

        // 0. Agregar documentos del caso si existen
        if (relatedCase && relatedCase.documents) {
          relatedCase.documents.forEach(doc => {
            const id = doc.id || doc.url || doc.gcs_uri;
            if (!seenIds.has(id)) {
              seenIds.add(id);
              allFiles.push(doc);
            }
          });
        }

        messages.forEach(msg => {
          // 1. Archivos adjuntos explícitos (subidos por usuario en esta sesión)
          if (msg.files && Array.isArray(msg.files)) {
            msg.files.forEach(f => {
              // Usar un ID único o generar uno
              const id = f.id || f.name + f.size;
              if (!seenIds.has(id)) {
                seenIds.add(id);
                allFiles.push(f);
              }
            });
          }

          // 2. Archivos embebidos en mensajes multimodales (historial)
          if (Array.isArray(msg.text)) {
            msg.text.forEach(part => {
              if (part.type === 'image_url') {
                const gcsUrl = part.image_url.url;
                let fileName = 'Archivo adjunto';
                let fileUrl = gcsUrl;
                let fileType = 'application/octet-stream';
                let id = gcsUrl;

                // Lógica de paraseo de GCS (similar a MessageBubble)
                if (gcsUrl.startsWith('gs://')) {
                  const parts = gcsUrl.split('/');
                  if (parts.length >= 4) {
                    fileName = parts[parts.length - 1];
                    const sId = parts[parts.length - 2];
                    fileUrl = `${API_URL}/chat/files/${sId}/${encodeURIComponent(fileName)}`;

                    const ext = fileName.split('.').pop().toLowerCase();
                    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
                      fileType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
                    } else if (ext === 'pdf') {
                      fileType = 'application/pdf';
                    } else if (['doc', 'docx'].includes(ext)) {
                      fileType = 'application/msword';
                    }
                    id = fileUrl; // Usar URL generada como ID
                  }
                }

                if (!seenIds.has(id)) {
                  seenIds.add(id);
                  allFiles.push({
                    id: id,
                    name: fileName,
                    type: fileType,
                    size: 0, // ⚠️ Sin metadata endpoint, no sabemos el tamaño real
                    url: fileUrl,
                    isRemote: true,
                    originalUrl: gcsUrl
                  });
                }
              }
            });
          }
        });
        return allFiles;
      };

      const extracted = extractFilesFromMessages();

      // Solo actualizar si hay archivos extraídos
      if (extracted.length > 0) {
        setChatFiles(extracted);
      }
    };

    loadSessionFiles();
  }, [sessionId, messages, relatedCase]); // Removido chatFiles y setChatFiles para evitar loop infinito

  // Detectar si viene de un caso específico
  useEffect(() => {
    if (location.state?.relatedCase) {
      if (!relatedCase) {
        setRelatedCase(location.state.relatedCase);
      }

      // Cargar documentos iniciales si vienen en el estado y no hay archivos cargados aun
      if (location.state.relatedCase.documents && chatFiles.length === 0) {
        logger.debug(" Loading initial documents from case:", location.state.relatedCase.documents);
        // Formatear al formato esperado por el chat si es necesario
        // Asumimos que ya vienen con {id, name, content_type, gcs_uri}
        setChatFiles(location.state.relatedCase.documents);
      }

      // Opcional: Cargar historial de chat si se proporcionó chatId
      if (location.state.chatId) {
        // Aquí cargarías el historial de la conversación
      }
    }
  }, [location.state, relatedCase, setRelatedCase, chatFiles.length]);

  // 🆕 VINCULAR SESIÓN AL CASO INMEDIATAMENTE AL ABRIR EL CHAT
  // Esto asegura que el LLM tenga contexto del caso desde el primer mensaje
  useEffect(() => {
    const linkSessionImmediately = async () => {
      // Solo vincular si hay caso relacionado, sessionId válido, y no estamos cargando historial
      if (relatedCase?.id && sessionId && !isLoadingHistory) {
        try {
          await chatService.linkSessionToCase(sessionId, relatedCase.id);
          logger.info('✅ Session linked to case - LLM has context');
        } catch (error) {
          // No hacer fail si ya está vinculado o hay un error menor
          logger.warn('⚠️ Could not link session to case (might already be linked)');
        }
      }
    };

    linkSessionImmediately();
  }, [relatedCase?.id, sessionId, isLoadingHistory]);

  // Actualizar URL y Sidebar cuando se crea una nueva sesión
  // Ref para evitar loops infinitos de navegación
  const attemptingSyncRef = useRef(null);

  // COMENTADO PARA EVITAR INFINITE LOOP:
  // La sincronización automática de la URL está causando conflictos con el router.
  // Por ahora, mantendremos el estado en memoria y solo actualizaremos cuando sea seguro
  // o dejaremos que la URL se actualice al navegar explícitamente.
  /*
  useEffect(() => {
    const currentUrlSessionId = location.state?.sessionId;
    
    // Solo navegar si hay un sessionId válido y es diferente al de la URL
    if (sessionId && currentUrlSessionId !== sessionId) {
      // Guard clause: Si ya intentamos sincronizar este ID y falló (la URL no cambió), 
      // no sigamos intentando infinitamente
      if (attemptingSyncRef.current === sessionId) {
        logger.warn("Aborting sync: Already attempted to sync this session ID", sessionId);
        return;
      }
      
      logger.info('Updating URL to:', sessionId);
      attemptingSyncRef.current = sessionId;
      
      // Actualizar la URL para reflejar la sesión actual sin recargar
      navigate('.', { state: { ...location.state, sessionId }, replace: true });

      // Refrescar la lista del sidebar para mostrar la nueva sesión
      if (refreshConversations) {
        refreshConversations();
      }
    } else if (currentUrlSessionId === sessionId) {
      // Resetear el ref si la sincronización fue exitosa
      attemptingSyncRef.current = null;
    }
  }, [sessionId, location.state?.sessionId, navigate, refreshConversations]);
  */

  const handleSendMessage = async (messageText, files = []) => {
    const message = await sendMessage(messageText, files, relatedCase?.id);

    if (message && files.length > 0) {
      addFiles(files);
    }

    // Si es el primer mensaje, actualizar el título local y refrescar sidebar
    if (messages.length === 0 && messageText.trim()) {
      const newTitle = messageText.trim();
      setChatTitle(newTitle);

      // Refreshar el sidebar para mostrar el título actualizado
      // El título ya se guarda en el backend automáticamente en useChatMessages
      if (refreshConversations) {
        setTimeout(() => refreshConversations(), 800);
      }
    }
  };

  const handleSuggestionClick = (suggestionText) => {
    handleSendMessage(suggestionText);
  };

  // Export handlers using custom hooks
  const handleExportToPDF = async () => {
    const result = await exportToPDF(sessionTitle || chatTitle, messages, relatedCase);
    if (result.success) {
      setShowOptionsMenu(false);
    }
  };

  const handleExportToWord = async () => {
    const result = await exportToWord(sessionTitle || chatTitle, messages, relatedCase);
    if (result.success) {
      setShowOptionsMenu(false);
    }
  };

  const handleCaseSelect = (selectedCase) => {
    associateCase(selectedCase);
    // Aquí podrías agregar lógica adicional como guardar en backend
  };

  const handleGenerateCase = async () => {
    if (!sessionId) {
      logger.error("No hay una sesión activa para generar el caso.");
      return;
    }

    // Obtener usuario y colegio del localStorage
    let usuario, colegio;
    try {
      usuario = JSON.parse(localStorage.getItem('usuario'));
      const colegios = JSON.parse(localStorage.getItem('colegios'));
      colegio = colegios && colegios.length > 0 ? colegios[0] : null;

      if (!usuario || !colegio) {
        setCaseError({
          message: 'No se pudo identificar tu organización.',
          hint: 'Cierra sesión e inicia nuevamente para continuar.'
        });
        return;
      }
    } catch (error) {
      logger.error("Error obteniendo datos del usuario:", error);
      setCaseError({
        message: 'Error al obtener información del usuario.',
        hint: 'Recarga la página e intenta nuevamente.'
      });
      return;
    }

    try {
      setCaseError(null);
      setIsGeneratingCase(true);
      setLoadingProgress(0);

      // Simular progreso mientras se genera el caso
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 300);

      const newCase = await casesService.generateCase(
        sessionId,
        usuario.id,
        colegio.id
      );

      // Completar el progreso
      clearInterval(progressInterval);
      setLoadingProgress(100);

      // Pequeña pausa para mostrar el 100%
      await new Promise(resolve => setTimeout(resolve, 500));

      // Asociar el caso recién creado
      setRelatedCase({
        id: newCase.id,
        title: newCase.title,
        caseType: newCase.case_type,
        description: newCase.description,
        ownerId: newCase.owner_id,
        ownerName: newCase.owner_name
      });

      setCaseSuccess(newCase.title);
      setTimeout(() => setCaseSuccess(null), 5000);
      logger.info("Caso generado exitosamente:", newCase.id);

    } catch (error) {
      logger.error("Error generando caso:", error);
      const status = error?.response?.status;
      if (status === 400 || status === 404 || status === 422) {
        setCaseError({
          message: 'No hay suficiente información en la conversación para generar un caso.',
          hint: 'Cuéntame más sobre el incidente: ¿quiénes son los involucrados?, ¿qué ocurrió?, ¿cuándo? Luego intenta nuevamente.'
        });
      } else {
        setCaseError({
          message: 'Ocurrió un error al generar el caso.',
          hint: 'Por favor intenta nuevamente en unos momentos.'
        });
      }
      setLoadingProgress(0);
    } finally {
      setIsGeneratingCase(false);
      setShowOptionsMenu(false);
      setLoadingProgress(0);
    }
  };

  const handleAddFileToCase = (file, caseData) => {
    // Agregando archivo al caso
    // Aquí irá la lógica para agregar el archivo al caso
    // Por ejemplo: hacer una petición al backend para asociar el archivo con el caso
    // backend.addFileToCase(caseData.id, file);

    // Mostrar notificación de éxito
    alert(`Archivo "${file.name}" agregado al caso "${caseData.title}"`);
  };

  // Funciones mejoradas de toggle que coordinan ambos paneles
  const handleToggleFileList = () => {
    if (!showFileList) {
      // Si vamos a abrir el panel de archivos, cerrar el de casos
      if (showCaseList) {
        closeCaseList();
      }
    }
    toggleFileList();
  };

  const handleToggleCaseList = () => {
    if (!showCaseList) {
      // Si vamos a abrir el panel de casos, cerrar el de archivos
      if (showFileList) {
        closeFileList();
      }
      // También cerrar la vista previa de archivo si está abierta
      if (selectedFile) {
        closeFilePreview();
      }
    }
    toggleCaseList();
  };

  const handleCompleteStep = (stepId) => {
    // Enviar mensaje al chat indicando que se completó el paso
    handleSendMessage(`He completado el paso ${stepId}. ¿Cuál es el siguiente paso?`);
  };

  const handleClearChat = () => {
    // Navegar a una nueva consulta (esto forzará un reset completo del chat)
    navigate('/chat-general', {
      state: {
        sessionId: null,
        newConsultaTimestamp: Date.now()
      },
      replace: true
    });
  };

  // Estado para coordinar agregar archivos al input desde el panel lateral
  const [filesToAddToInput, setFilesToAddToInput] = useState([]);

  const handleAddFilesToInput = (files) => {
    // Asegurar que siempre sea un array
    const filesArray = Array.isArray(files) ? files : [files];
    setFilesToAddToInput(prev => [...prev, ...filesArray]);
  };

  const handleFilesAddedToInput = () => {
    setFilesToAddToInput([]);
  };

  return (
    <ErrorBoundary>
      {/* Toast de éxito al generar caso */}
      {caseSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-fade-in-down">
          <div className="bg-white border border-green-100 rounded-2xl shadow-xl p-4 flex gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">¡Caso creado exitosamente!</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{caseSuccess}</p>
            </div>
            <button
              onClick={() => setCaseSuccess(null)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Toast de error al generar caso */}
      {caseError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-fade-in-down">
          <div className="bg-white border border-red-100 rounded-2xl shadow-xl p-4 flex gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{caseError.message}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{caseError.hint}</p>
            </div>
            <button
              onClick={() => setCaseError(null)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Wrapper flex para asegurar layout horizontal */}
      <div className="flex w-full h-full overflow-hidden">
        {/* Mostrar skeleton mientras carga el chat */}
        {showSkeleton ? (
          <ChatSkeleton />
        ) : (
          <ChatContainer
            chatTitle={sessionTitle || chatTitle}
            messages={messages}
            isThinking={isThinking}
            thinkingText={thinkingText}
            relatedCase={relatedCase}
            chatFiles={chatFiles}
            showFileList={showFileList}
            showCaseList={showCaseList}
            showOptionsMenu={showOptionsMenu}
            selectedFile={selectedFile}
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
            toggleFileList={handleToggleFileList}
            toggleCaseList={handleToggleCaseList}
            setShowOptionsMenu={setShowOptionsMenu}
            onSendMessage={handleSendMessage}
            onSuggestionClick={handleSuggestionClick}
            onFileClick={handleFileClick}
            onLike={handleLike}
            onDislike={handleDislike}
            onDownload={downloadMessage}
            onExportPDF={handleExportToPDF}
            onExportWord={handleExportToWord}
            onGenerateCase={handleGenerateCase}
            onClearChat={handleClearChat}
            isGeneratingCase={isGeneratingCase}
            loadingProgress={loadingProgress}
            onCompleteStep={handleCompleteStep}
            onStopGenerating={stopGenerating}
            availableCases={availableCases}
            onCaseSelect={handleCaseSelect}
            isStreaming={isStreaming}
            // Props para agregar archivos desde el panel lateral
            filesToAddToInput={filesToAddToInput}
            onFilesAddedToInput={handleFilesAddedToInput}
            sessionId={sessionId}
          />
        )}

        {/* Panel de vista previa de archivos - lado derecho */}
        {selectedFile && (
          <FilePreviewPanel
            file={selectedFile}
            onClose={closeFilePreview}
            onBack={chatFiles.length > 0 ? handleBackToFileList : undefined}
          />
        )}

        {/* Panel de lista de archivos - lado derecho */}
        {showFileList && !selectedFile && (
          <FileListPanel
            files={chatFiles}
            onClose={closeFileList}
            onFileClick={handleFileClick}
            relatedCase={relatedCase}
            onAddToInput={handleAddFilesToInput}
          />
        )}

        {/* Panel de lista de casos - lado derecho */}
        {showCaseList && !selectedFile && !showFileList && (
          <CaseListPanel
            cases={availableCases}
            onClose={closeCaseList}
            onCaseSelect={handleCaseSelect}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default ChatGeneralPage;
