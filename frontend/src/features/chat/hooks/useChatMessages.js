import { useState, useEffect, useRef } from 'react';
import { chatService } from '../../../services/api';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('useChatMessages');

export default function useChatMessages(initialSessionId = null) {
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [sessionTitle, setSessionTitle] = useState(null);
  const [thinkingText, setThinkingText] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const sessionIdRef = useRef(initialSessionId);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    // Actualizar inmediatamente el estado local para evitar race conditions
    setSessionId(initialSessionId);
    sessionIdRef.current = initialSessionId;

    // Siempre limpiar mensajes al cambiar de sesión para evitar mostrar datos incorrectos
    setMessages([]);
    setIsThinking(false);
    setThinkingText(null);
    setSessionTitle(null);

    // Si hay un ID de sesión, iniciamos carga explícita
    if (initialSessionId) {
      setIsLoadingHistory(true);
    } else {
      setIsLoadingHistory(false);
    }

    const initSession = async () => {
      try {
        if (initialSessionId) {
          // Cargar historial existente
          logger.info('📖 Cargando historial de sesión:', initialSessionId);

          // Cargar metadatos (incluido el título) en paralelo con el historial
          const usuario = JSON.parse(localStorage.getItem('usuario'));
          const userId = usuario?.id;

          logger.info('👤 Full User Object:', usuario);
          logger.info('👤 Extracted User ID:', userId);

          const [history, metadata] = await Promise.all([
            chatService.getHistory(initialSessionId, userId),
            chatService.getSessionMetadata(initialSessionId)
          ]);

          // Actualizar título si existe
          if (metadata && metadata.title) {
            setSessionTitle(metadata.title);
            logger.info('📝 Título de sesión cargado:', metadata.title);
          }

          if (Array.isArray(history)) {
            // Generar IDs únicos basados en la sesión y el índice para garantizar unicidad
            const formattedMessages = history.map((msg, index) => ({
              id: `${initialSessionId}-msg-${index}-${Date.now()}`,
              text: msg.content,
              sender: msg.role, // 'user' o 'bot'
              timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
            }));
            setMessages(formattedMessages);
            logger.info(`✅ ${formattedMessages.length} mensajes cargados correctamente`);
          } else {
            logger.error("History is not an array:", history);
            setMessages([]); // Fallback to empty if invalid response
          }
        } else {
          // Crear nueva sesión
          logger.info('✨ Creando nueva sesión de chat');
          const id = await chatService.createSession();
          setSessionId(id);
          sessionIdRef.current = id;
          logger.info('✅ Nueva sesión creada:', id);
          // No necesitamos limpiar mensajes aquí porque ya lo hicimos arriba
        }
      } catch (error) {
        // Silent fail or handle gracefully
        logger.error("Error initializing session:", error);
        setMessages([]); // Ensure messages is empty on error
      } finally {
        setIsLoadingHistory(false);
      }
    };

    initSession();
  }, [initialSessionId]);

  const sendMessage = async (messageText, files = [], caseId = null, onCaseLinked = null) => {
    if (!messageText.trim() && files.length === 0) return null;
    if (!sessionIdRef.current) {
      logger.error('No session ID available');
      return null;
    }

    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
      files: files.length > 0 ? files : null
    };

    setMessages(prev => [...prev, userMessage]);
    setIsThinking(true);
    setIsStreaming(true);
    setThinkingText("Analizando solicitud...");

    try {
      // 1. Upload files if any
      let uploadedFileUris = [];

      // 🔍 DIAGNOSTIC: Log incoming files
      logger.info(`📎 [UPLOAD_DEBUG] Received ${files.length} files`);
      files.forEach((f, i) => {
        logger.info(`📎 [UPLOAD_DEBUG] File ${i}: name=${f.name}, hasGcsUri=${!!f.gcs_uri}, hasFile=${!!f.file}, type=${typeof f.file}`);
      });

      if (files.length > 0) {
        // Separar archivos que necesitan subida de los que ya tienen URI
        const filesToUpload = files.filter(f => !f.gcs_uri);
        const existingFileUris = files.filter(f => f.gcs_uri).map(f => f.gcs_uri);

        logger.info(`📎 [UPLOAD_DEBUG] Files to upload: ${filesToUpload.length}, Existing URIs: ${existingFileUris.length}`);

        // Agregar URIs existentes directamente
        uploadedFileUris = [...existingFileUris];

        // Si hay archivos para subir, subirlos todos en paralelo
        if (filesToUpload.length > 0) {
          setThinkingText(`Subiendo ${filesToUpload.length} archivo${filesToUpload.length > 1 ? 's' : ''}...`);

          const filesArray = filesToUpload.map(fileWrapper => fileWrapper.file || fileWrapper);

          // 🔍 DIAGNOSTIC: Log actual File objects
          logger.info(`📎 [UPLOAD_DEBUG] Files array for upload: ${filesArray.length}`);
          filesArray.forEach((f, i) => {
            logger.info(`📎 [UPLOAD_DEBUG] FileArray ${i}: name=${f.name}, size=${f.size}, isFile=${f instanceof File}`);
          });

          try {
            // Backend handles concurrent upload for all files
            logger.info(`📎 [UPLOAD_DEBUG] Calling uploadFilesParallel with sessionId=${sessionIdRef.current}`);
            const uploadResults = await chatService.uploadFilesParallel(filesArray, sessionIdRef.current, caseId);
            logger.info(`📎 [UPLOAD_DEBUG] Upload results:`, uploadResults);
            const newUris = uploadResults.map(res => res.gcs_uri);
            uploadedFileUris = [...uploadedFileUris, ...newUris];

            logger.info(`✅ ${newUris.length} archivos subidos correctamente`);
          } catch (error) {
            logger.error('Error en carga de archivos:', error);
            // Fallback: upload one by one if batch fails
            for (const fileWrapper of filesToUpload) {
              const fileToUpload = fileWrapper.file || fileWrapper;
              try {
                const result = await chatService.uploadFile(fileToUpload, sessionIdRef.current, caseId);
                uploadedFileUris.push(result.gcs_uri);
              } catch (e) {
                logger.error(`Error subiendo ${fileToUpload.name}:`, e);
              }
            }
          }
        }
      }


      // 2. Send message with streaming
      const botMessageId = Date.now() + 1;
      const initialBotMessage = {
        id: botMessageId,
        text: '',
        sender: 'bot',
        timestamp: new Date(),
        isStreaming: true
      };
      setMessages(prev => [...prev, initialBotMessage]);

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      const usuario = JSON.parse(localStorage.getItem('usuario'));
      const userId = usuario?.id;
      const colegios = JSON.parse(localStorage.getItem('colegios') || '[]');
      const schoolName = colegios?.[0]?.nombre || 'la institución';

      // Generar título si es el primer mensaje
      let title = null;
      if (messages.length === 0 && messageText.trim()) {
        title = messageText.trim();
        logger.info('📝 Generando título para nueva sesión:', title);
      }

      setThinkingText("Consultando bases de conocimiento...");

      // Log para diagnosticar si el caseId se está pasando correctamente
      logger.info(caseId ? '📤 Sending message with case context' : '📤 Sending message without case context');

      await chatService.streamMessage(
        messageText,
        sessionIdRef.current,
        schoolName,
        uploadedFileUris,
        caseId,
        userId,
        (chunk) => {
          setIsThinking(false);
          setThinkingText(null);

          setMessages(prev => prev.map(msg => {
            if (msg.id === botMessageId) {
              return { ...msg, text: msg.text + chunk };
            }
            return msg;
          }));
        },
        abortControllerRef.current.signal,
        title,  // Pasar el título generado
        (thought) => {
          // Callback para actualizaciones de pensamiento
          setThinkingText(thought);
          setIsThinking(true); // Asegurar que se muestre
        },
        (suggestions) => {
          setMessages(prev => prev.map(msg => {
            if (msg.id === botMessageId) {
              return { ...msg, suggestions };
            }
            return msg;
          }));
        },
        onCaseLinked  // propagar callback al streaming
      );

      // Stream finished successfully
      setIsStreaming(false);
      setMessages(prev => prev.map(msg => {
        if (msg.id === botMessageId) {
          return { ...msg, isStreaming: false };
        }
        return msg;
      }));

      abortControllerRef.current = null;

    } catch (error) {
      // Don't show error message if request was aborted by user
      if (error.name !== 'AbortError') {
        logger.error('Error sending message:', error);
        const errorMessage = {
          id: Date.now() + 1,
          text: "Lo siento, hubo un error al procesar tu mensaje. Por favor intenta nuevamente.",
          sender: 'bot',
          timestamp: new Date(),
          isError: true
        };
        setMessages(prev => [...prev, errorMessage]);
      }
      setIsStreaming(false);
      abortControllerRef.current = null;
    } finally {
      setIsThinking(false);
      setThinkingText(null);
    }

    return userMessage;
  };

  const handleLike = (messageId) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          feedback: msg.feedback === 'like' ? null : 'like'
        };
      }
      return msg;
    }));
  };

  const handleDislike = (messageId) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          feedback: msg.feedback === 'dislike' ? null : 'dislike'
        };
      }
      return msg;
    }));
  };

  const downloadMessage = async (message) => {
    try {
      // Extraer solo el texto del mensaje
      let textToCopy = '';

      // Si el mensaje tiene contenido multimodal (array), extraer solo el texto
      if (Array.isArray(message.text)) {
        const textParts = message.text
          .filter(part => part.type === 'text')
          .map(part => part.text);
        textToCopy = textParts.join('\n');
      } else {
        textToCopy = message.text;
      }

      // Copiar al portapapeles
      await navigator.clipboard.writeText(textToCopy);

      // Opcional: mostrar una notificación visual de éxito
      // Por ahora usamos un console.log
      logger.info('Texto copiado al portapapeles');

    } catch (error) {
      logger.error('Error al copiar al portapapeles:', error);
      alert('Error al copiar la respuesta al portapapeles');
    }
  };

  const stopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsThinking(false);
      setIsStreaming(false);
    }
  };

  return {
    messages,
    isThinking,
    isStreaming,
    sendMessage,
    handleLike,
    handleDislike,
    downloadMessage,
    stopGenerating,
    sessionTitle, // Expose session title
    thinkingText, // Expose thinking text
    isLoadingHistory, // Expose loading state
    sessionId // Expose session Id
  };
}