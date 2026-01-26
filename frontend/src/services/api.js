import axios from 'axios';
import { createLogger } from '../utils/logger';

const logger = createLogger('api');

// En producción, si tenemos proxy de nginx, usamos ruta relativa
// De lo contrario, usamos la URL completa desde las variables de entorno
// frontend/src/services/api.js

const getApiUrl = () => {
  // En producción (no localhost), SIEMPRE usar proxy de Nginx
  // Esto evita problemas de Mixed Content (HTTP/HTTPS)
  if (!window.location.hostname.includes('localhost') &&
    window.location.hostname !== '127.0.0.1') {
    return '/api/v1';
  }

  // En desarrollo, usar variable de entorno o fallback a localhost
  const envUrl = (window._env_ && window._env_.VITE_API_URL) ||
    import.meta.env.VITE_API_URL;

  // Si la URL de entorno es absoluta y estamos en producción, ignorarla
  if (envUrl && envUrl.startsWith('http') && window.location.protocol === 'https:') {
    logger.warn('⚠️ Ignorando VITE_API_URL absoluta en HTTPS - usando proxy');
    return '/api/v1';
  }

  return envUrl || 'http://localhost:8000/api/v1';
};

export const API_URL = getApiUrl();

logger.debug(' API_URL actual es:', API_URL);


// Interceptor global para inyectar token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const chatService = {
  createSession: async () => {
    const response = await axios.post(`${API_URL}/chat/session`);
    return response.data.session_id;
  },

  getSessions: async (userId = null) => {
    const url = userId ? `${API_URL}/chat/sessions?user_id=${userId}` : `${API_URL}/chat/sessions`;
    const response = await axios.get(url);
    return response.data;
  },

  getHistory: async (sessionId, userId) => {
    logger.debug(`[API] getHistory called with sessionId=${sessionId}, userId=${userId}`);
    const url = userId
      ? `${API_URL}/chat/history/${sessionId}?user_id=${userId}`
      : `${API_URL}/chat/history/${sessionId}`;
    const response = await axios.get(url);
    return response.data;
  },

  sendMessage: async (message, sessionId, schoolName, files = [], caseId = null, userId = null) => {
    const response = await axios.post(`${API_URL}/chat/`, {
      message,
      session_id: sessionId,
      school_name: schoolName,
      files,
      case_id: caseId,
      user_id: userId
    });
    return response.data;
  },

  streamMessage: async (message, sessionId, schoolName, files = [], caseId = null, userId = null, onChunk, signal = null, title = null, onThinking, onSuggestions) => {
    try {
      const requestBody = {
        message,
        session_id: sessionId,
        school_name: schoolName,
        files,
        case_id: caseId,
        user_id: userId,
        title: title
      };

      // Log para diagnosticar el envío del case_id (sin exponer el ID)
      logger.info(caseId ? '🌐 [API] Sending request with case context' : '⚠️ [API] Sending request without case context');

      const response = await fetch(`${API_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();

        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          buffer += chunk;

          const lines = buffer.split('\n');
          // Keep the last part in the buffer, it might be incomplete
          buffer = lines.pop(); // Removes the last element (potential partial line)

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const data = JSON.parse(line);

              if (data.type === 'thinking' && onThinking) {
                onThinking(data.content);
              } else if (data.type === 'content') {
                onChunk(data.content);
              } else if (data.type === 'suggestions') {
                if (onSuggestions) {
                  onSuggestions(data.content);
                }
              } else {
                onChunk(data.content || data.response || '');
              }
            } catch (e) {
              logger.warn("Error parsing stream line:", line, e);
              // Fallback: If it's not valid JSON, we treat it as raw text 
              // ONLY if it doesn't look like a JSON object structure trying to be parsed.
              // This is a safety net, but usually with proper buffering we shouldn't hit this
              // unless the backend sends non-JSON lines.
              if (!line.trim().startsWith('{')) {
                onChunk(line);
              }
            }
          }
        }

        if (done) {
          // Process any remaining buffer content
          if (buffer.trim()) {
            try {
              const data = JSON.parse(buffer);
              // Handle as above
              if (data.type === 'content') onChunk(data.content);
            } catch (e) {
              if (!buffer.trim().startsWith('{')) onChunk(buffer);
            }
          }
          break;
        }
      }

      return true;
    } catch (error) {
      logger.error('Error in streamMessage:', error);
      throw error;
    }
  },

  uploadFile: async (file, sessionId, caseId = null) => {
    // Check if file is larger than 30MB (Cloud Run Limit)
    const MAX_DIRECT_UPLOAD_SIZE = 30 * 1024 * 1024; // 30MB

    if (file.size > MAX_DIRECT_UPLOAD_SIZE) {
      logger.info(`📦 File ${file.name} is larger than 30MB (${(file.size / 1024 / 1024).toFixed(2)}MB). Using Chunked Upload strategy.`);
      try {
        // Signed URL Strategy (Direct to GCS)
        logger.info(`🔄 Starting direct upload with Signed URL for ${file.name}`);

        // 1. Get Signed URL
        const signedUrlResponse = await axios.post(`${API_URL}/chat/upload/signed-url`, {
          filename: file.name,
          content_type: file.type || 'application/octet-stream',
          session_id: sessionId,
          case_id: caseId
        });

        const { upload_url, gcs_uri, session_id: finalSessionId } = signedUrlResponse.data;

        // 2. Upload directly to GCS (bypass backend)
        await axios.put(upload_url, file, {
          headers: {
            'Content-Type': file.type || 'application/octet-stream'
          },
          timeout: 600000, // 10 minutes timeout for large files
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            if (percentCompleted % 10 === 0) {
              logger.info(`📤 Direct Upload: ${percentCompleted}%`);
            }
          }
        });

        // 3. Register file in backend (Firestore)
        const registerResponse = await axios.post(`${API_URL}/chat/upload/register`, {
          session_id: finalSessionId,
          filename: file.name,
          gcs_uri: gcs_uri,
          content_type: file.type || 'application/octet-stream',
          size: file.size,
          case_id: caseId
        });

        logger.info(`✅ Direct upload registered for ${file.name}`);

        return {
          filename: file.name,
          status: 'uploaded',
          gcs_uri: gcs_uri,
          session_id: finalSessionId,
          size: file.size,
          id: registerResponse.data.doc_id // Return doc_id if needed
        };

      } catch (error) {
        logger.error('Error in chunked upload:', error);
        throw error;
      }
    }

    // Standard Direct Upload for smaller files
    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_id', sessionId);
    if (caseId) {
      formData.append('case_id', caseId);
    }

    const response = await axios.post(`${API_URL}/chat/upload`, formData);
    return response.data;
  },

  // Upload multiple files in parallel for better performance
  uploadFilesParallel: async (files, sessionId, caseId = null) => {
    try {
      // 🔍 DIAGNOSTIC LOGGING
      logger.info(`📤 [UPLOAD_PARALLEL] Received ${files.length} files, sessionId=${sessionId}`);
      files.forEach((f, i) => {
        logger.info(`📤 [UPLOAD_PARALLEL] File ${i}: name=${f.name}, size=${f.size}, type=${f.type}`);
      });

      // We will map over files and call uploadFile (which now handles the hybrid logic)
      // This is simpler and robust given we already put the logic in uploadFile.
      // However, the original implementation used a BATCH endpoint for small files.
      // We should preserve batching for small files if possible, or just reuse uploadFile for simplicity given
      // that "parallel" on client side is also fine.

      // Let's optimize: Group small files for batch upload, process large files individually
      const MAX_DIRECT_UPLOAD_SIZE = 30 * 1024 * 1024;

      const smallFiles = files.filter(f => f.size <= MAX_DIRECT_UPLOAD_SIZE);
      const largeFiles = files.filter(f => f.size > MAX_DIRECT_UPLOAD_SIZE);

      logger.info(`📤 [UPLOAD_PARALLEL] Small files (<=30MB): ${smallFiles.length}, Large files (>30MB): ${largeFiles.length}`);

      const uploadPromises = [];

      // Batch upload small files
      if (smallFiles.length > 0) {
        const batchPromise = (async () => {
          const formData = new FormData();
          smallFiles.forEach(file => {
            formData.append('files', file);
          });
          formData.append('session_id', sessionId);
          if (caseId) formData.append('case_id', caseId);

          const response = await axios.post(`${API_URL}/chat/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          if (response.data.results) {
            return response.data.results
              .filter(r => r.status === 'uploaded')
              .map(r => ({ gcs_uri: r.gcs_uri, filename: r.filename }));
          } else {
            return [response.data];
          }
        })();
        uploadPromises.push(batchPromise);
      }

      // Individual upload large files (using Signed URL logic in uploadFile)
      largeFiles.forEach(file => {
        uploadPromises.push(
          chatService.uploadFile(file, sessionId, caseId).then(res => [res]) // Wrap in array to match structure
        );
      });

      // Wait for all
      const resultsArrays = await Promise.all(uploadPromises);

      // Flatten results
      const allResults = resultsArrays.flat();
      return allResults;

    } catch (error) {
      logger.error('Error in parallel file upload:', error);
      throw error;
    }
  },

  checkHealth: async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      return response.data;
    } catch (error) {
      logger.error('Health check failed:', error);
      return { status: 'error' };
    }
  },

  updateSessionTitle: async (sessionId, userId, title) => {
    try {
      const response = await axios.post(`${API_URL}/chat/update-title`, {
        session_id: sessionId,
        user_id: userId,
        title: title
      });
      return response.data;
    } catch (error) {
      logger.error('Error updating session title:', error);
      throw error;
    }
  },

  getSessionMetadata: async (sessionId) => {
    try {
      const response = await axios.get(`${API_URL}/chat/session/${sessionId}/metadata`);
      return response.data;
    } catch (error) {
      logger.error('Error getting session metadata:', error);
      return null;
    }
  },

  getUploadLimits: async () => {
    try {
      const response = await axios.get(`${API_URL}/chat/upload-limits`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching upload limits:', error);
      // Fallback defaults
      return { max_files: 20, max_file_size_mb: 500, max_total_size_mb: 1000 };
    }
  },

  // Obtener protocolo dinámico
  getProtocol: async (sessionId, caseId) => {
    try {
      const response = await axios.get(`${API_URL}/chat/protocol/${sessionId}/${caseId}`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching protocol:', error);
      throw error;
    }
  },

  // Generar protocolo automáticamente (Trigger backend generation)
  generateProtocol: async (caseId, sessionId, userId) => {
    try {
      const formData = new FormData();
      formData.append('case_id', caseId);
      formData.append('session_id', sessionId);
      if (userId) {
        formData.append('user_id', userId);
      }

      const response = await axios.post(`${API_URL}/chat/protocol/generate`, formData);
      return response.data;
    } catch (error) {
      logger.error('Error generating protocol:', error);
      throw error;
    }
  },

  // Completar paso del protocolo
  completeStep: async (sessionId, caseId, stepId, notes = null) => {
    try {
      const response = await axios.post(`${API_URL}/chat/complete-step`, null, {
        params: {
          session_id: sessionId,
          case_id: caseId,
          step_id: stepId,
          notes: notes
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error completing step:', error);
      throw error;
    }
  },

  // Vincular sesión a caso inmediatamente al abrir chat
  linkSessionToCase: async (sessionId, caseId) => {
    try {
      const response = await axios.post(`${API_URL}/chat/link-session-to-case`, {
        session_id: sessionId,
        case_id: caseId
      });
      return response.data;
    } catch (error) {
      logger.error('Error linking session to case:', error);
      throw error;
    }
  }
};

export const casesService = {
  // Obtener todos los casos del usuario
  getCases: async (userId, colegioId) => {
    try {
      const response = await axios.get(`${API_URL}/cases/`, {
        params: {
          user_id: userId,
          colegio_id: colegioId
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching cases:', error);
      throw error;
    }
  },

  // Obtener TODOS los casos de un colegio (para Directivos)
  getAllCasesBySchool: async (colegioId) => {
    try {
      const response = await axios.get(`${API_URL}/cases/school/${colegioId}`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching school cases:', error);
      throw error;
    }
  },

  // Obtener caso por ID
  getCaseById: async (caseId, userId) => {
    try {
      const response = await axios.get(`${API_URL}/cases/${caseId}`, {
        params: {
          user_id: userId
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching case:', error);
      throw error;
    }
  },

  // Crear caso nuevo
  createCase: async (caseData) => {
    try {
      const response = await axios.post(`${API_URL}/cases/create`, caseData);
      return response.data;
    } catch (error) {
      logger.error('Error creating case:', error);
      throw error;
    }
  },

  // Actualizar caso (title y status)
  updateCase: async (caseId, userId, updateData) => {
    try {
      const response = await axios.patch(
        `${API_URL}/cases/${caseId}`,
        updateData,
        {
          params: { user_id: userId }
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Error updating case:', error);
      throw error;
    }
  },

  // Eliminar caso
  deleteCase: async (caseId, userId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/cases/${caseId}`,
        {
          params: { user_id: userId }
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Error deleting case:', error);
      throw error;
    }
  },

  // Generar caso desde sesión de chat
  generateCase: async (sessionId, ownerId, colegioId) => {
    try {
      const response = await axios.post(`${API_URL}/cases/generate`, null, {
        params: {
          session_id: sessionId,
          owner_id: ownerId,
          colegio_id: colegioId
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error generating case:', error);
      throw error;
    }
  },

  // ============ PERMISOS DE CASOS ============

  // Compartir caso con usuarios
  shareCase: async (caseId, ownerId, userIds, permissionType) => {
    try {
      const response = await axios.post(
        `${API_URL}/cases/${caseId}/share`,
        {
          user_ids: userIds,
          permission_type: permissionType
        },
        {
          params: { owner_id: ownerId }
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Error sharing case:', error);
      throw error;
    }
  },

  // Revocar permiso de un usuario
  revokePermission: async (caseId, ownerId, targetUserId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/cases/${caseId}/permissions/${targetUserId}`,
        {
          params: { owner_id: ownerId }
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Error revoking permission:', error);
      throw error;
    }
  },

  // Obtener permisos de un caso
  getCasePermissions: async (caseId, userId) => {
    try {
      const response = await axios.get(
        `${API_URL}/cases/${caseId}/permissions`,
        {
          params: { user_id: userId }
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Error fetching permissions:', error);
      throw error;
    }
  },

  // Obtener usuarios disponibles para compartir
  getAvailableUsers: async (caseId, userId) => {
    try {
      const response = await axios.get(
        `${API_URL}/cases/${caseId}/available-users`,
        {
          params: { user_id: userId }
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Error fetching available users:', error);
      throw error;
    }
  },



  // Obtener documentos de un caso
  getCaseBySession: async (sessionId) => {
    const response = await axios.get(`${API_URL}/cases/by-session/${sessionId}`);
    return response.data;
  },

  getCaseDocuments: async (caseId, userId) => {
    try {
      const response = await axios.get(`${API_URL}/cases/${caseId}/documents`, {
        params: {
          user_id: userId
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching case documents:', error);
      throw error;
    }
  },

  // Obtener cronología del caso (documentos, correos, agendamientos)
  getCaseTimeline: async (caseId, userId) => {
    try {
      const response = await axios.get(`${API_URL}/cases/${caseId}/timeline`, {
        params: {
          user_id: userId
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching case timeline:', error);
      throw error;
    }
  },

  // Analizar archivo para actualizar caso
  analyzeFileForUpdate: async (caseId, fileUri, sessionId) => {
    try {
      const response = await axios.post(`${API_URL}/cases/${caseId}/analyze-file`, null, {
        params: {
          file_uri: fileUri,
          session_id: sessionId
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error analyzing file:', error);
      throw error;
    }
  },

  // Analizar archivo para crear nuevo caso
  analyzeFileForCreate: async (fileUri, sessionId) => {
    try {
      const response = await axios.post(`${API_URL}/cases/analyze-file`, null, {
        params: {
          file_uri: fileUri,
          session_id: sessionId
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error analyzing file for new case:', error);
      throw error;
    }
  },

  // Analizar MULTIPLES archivos para crear nuevo caso
  analyzeFilesForCreate: async (fileUris, sessionId, onProgress = null) => {
    try {
      // Validación básica
      if (!fileUris || fileUris.length === 0) {
        throw new Error('No se proporcionaron archivos para analizar');
      }
      if (fileUris.length > 30) {
        throw new Error('Máximo 30 archivos por solicitud');
      }

      // Notificar progreso
      if (onProgress) {
        onProgress({
          stage: 'analyzing',
          message: `Analizando ${fileUris.length} archivo${fileUris.length > 1 ? 's' : ''}...`,
          total: fileUris.length
        });
      }

      const response = await axios.post(`${API_URL}/cases/analyze-files`, {
        file_uris: fileUris
      }, {
        params: {
          session_id: sessionId
        },
        timeout: 300000, // 5 minutos = 300000ms
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({
              stage: 'uploading',
              message: `Enviando archivos... ${percentCompleted}%`,
              percent: percentCompleted
            });
          }
        }
      });

      // Notificar éxito
      if (onProgress) {
        onProgress({
          stage: 'complete',
          message: 'Análisis completado',
          total: fileUris.length,
          successful: response.data.results?.filter(r => r.status === 'success').length || 0
        });
      }

      return response.data;
    } catch (error) {
      logger.error('Error analyzing files for new case:', error);

      // Mejorar mensajes de error
      if (error.code === 'ECONNABORTED') {
        throw new Error('⏱️ El análisis tomó demasiado tiempo. Por favor intenta con menos archivos o en lotes más pequeños.');
      }

      if (error.response) {
        // Error del servidor
        const message = error.response.data?.detail || error.response.data?.message || 'Error del servidor';
        throw new Error(`❌ ${message}`);
      }

      if (error.request) {
        // No hubo respuesta del servidor
        throw new Error('🔌 No se pudo conectar con el servidor. Verifica tu conexión.');
      }

      // Otro tipo de error
      throw error;
    }
  },

  // Guardar documento en un caso
  saveCaseDocument: async (caseId, fileData) => {
    try {
      const response = await axios.post(`${API_URL}/cases/${caseId}/documents`, null, {
        params: {
          file_name: fileData.name,
          gcs_uri: fileData.gcs_uri,
          size: fileData.size || 0,
          content_type: fileData.content_type || 'application/octet-stream',
          session_id: fileData.session_id || null,
          source: fileData.source || 'antecedente'
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error saving case document:', error);
      throw error;
    }
  },

  // Guardar MÚLTIPLES documentos en un caso (BATCH)
  saveCaseDocumentsBatch: async (caseId, filesData) => {
    try {
      const documents = filesData.map(fileData => ({
        name: fileData.name,
        gcs_uri: fileData.gcs_uri,
        size: fileData.size || 0,
        content_type: fileData.content_type || 'application/octet-stream',
        session_id: fileData.session_id || null,
        source: fileData.source || 'antecedente'
      }));

      const response = await axios.post(`${API_URL}/cases/${caseId}/documents/batch`, {
        documents
      });

      return response.data;
    } catch (error) {
      logger.error('Error saving case documents batch:', error);
      throw error;
    }
  },

  // Eliminar documento de un caso
  deleteCaseDocument: async (caseId, documentId, userId) => {
    try {
      const response = await axios.delete(`${API_URL}/cases/${caseId}/documents/${documentId}`, {
        params: {
          user_id: userId
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error deleting document:', error);
      throw error;
    }
  },

  // Renombrar documento de un caso
  renameCaseDocument: async (caseId, documentId, newName, userId) => {
    try {
      const response = await axios.put(
        `${API_URL}/cases/${caseId}/documents/${documentId}/rename`,
        { new_name: newName },
        {
          params: { user_id: userId }
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Error renaming document:', error);
      throw error;
    }
  },

  // Obtener URL de descarga del documento
  getDocumentDownloadUrl: async (caseId, documentId, userId, inline = false) => {
    try {
      const response = await axios.get(
        `${API_URL}/cases/${caseId}/documents/${documentId}/download`,
        {
          params: { user_id: userId, inline: inline }
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Error getting download URL:', error);
      throw error;
    }
  },

  // Generar resumen inteligente
  generateSummary: async (caseId, userId) => {
    try {
      const response = await axios.post(`${API_URL}/cases/${caseId}/summary`, null, {
        params: { user_id: userId }
      });
      return response.data;
    } catch (error) {
      logger.error('Error generating summary:', error);
      throw error;
    }
  }
};

// ============ AUTENTICACIÓN ============
export const authService = {
  // Registrar nuevo usuario
  register: async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      return response.data;
    } catch (error) {
      logger.error('Error en registro:', error);
      throw error;
    }
  },

  // Verificar token (mock - sin Firebase por ahora)
  verifyToken: async (token) => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/verify-token`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Error verificando token:', error);
      throw error;
    }
  },

  // Obtener usuario actual
  getCurrentUser: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error obteniendo usuario actual:', error);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/logout`);
      return response.data;
    } catch (error) {
      logger.error('Error en logout:', error);
      throw error;
    }
  }
};

// ============ USUARIOS ============
export const usersService = {
  // Obtener todos los usuarios
  getAll: async (includeInactive = false) => {
    try {
      const response = await axios.get(`${API_URL}/users/`, {
        params: { include_inactive: includeInactive }
      });
      return response.data;
    } catch (error) {
      logger.error('Error obteniendo usuarios:', error);
      throw error;
    }
  },


  // Obtener usuario por ID
  getById: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/users/${userId}`);
      return response.data;
    } catch (error) {
      logger.error('Error obteniendo usuario:', error);
      throw error;
    }
  },

  // Actualizar usuario
  update: async (userId, updateData) => {
    try {
      const response = await axios.patch(`${API_URL}/users/${userId}`, updateData);
      return response.data;
    } catch (error) {
      logger.error('Error actualizando usuario:', error);
      throw error;
    }
  },

  // Eliminar usuario
  delete: async (userId) => {
    try {
      const response = await axios.delete(`${API_URL}/users/${userId}`);
      return response.data;
    } catch (error) {
      logger.error('Error eliminando usuario:', error);
      throw error;
    }
  },

  // Asociar usuario a colegio
  asociarColegio: async (usuarioId, colegioId) => {
    try {
      const response = await axios.post(`${API_URL}/users/asociar-colegio`, {
        usuario_id: usuarioId,
        colegio_id: colegioId
      });
      return response.data;
    } catch (error) {
      logger.error('Error asociando colegio:', error);
      throw error;
    }
  },

  // Desasociar usuario de colegio
  desasociarColegio: async (usuarioId, colegioId) => {
    try {
      const response = await axios.post(`${API_URL}/users/desasociar-colegio`, {
        usuario_id: usuarioId,
        colegio_id: colegioId
      });
      return response.data;
    } catch (error) {
      logger.error('Error desasociando colegio:', error);
      throw error;
    }
  },

  // Obtener usuarios por colegio
  getByColegio: async (colegioId) => {
    try {
      const response = await axios.get(`${API_URL}/users/by-colegio/${colegioId}`);
      return response.data;
    } catch (error) {
      logger.error('Error obteniendo usuarios por colegio:', error);
      throw error;
    }
  },

  // Obtener usuarios por rol
  getByRol: async (rol, colegioId = null) => {
    try {
      const params = colegioId ? { colegio_id: colegioId } : {};
      const response = await axios.get(`${API_URL}/users/by-rol/${rol}`, { params });
      return response.data;
    } catch (error) {
      logger.error('Error obteniendo usuarios por rol:', error);
      throw error;
    }
  }
};

// ============ COLEGIOS ============
export const schoolsService = {
  // Crear colegio
  create: async (colegioData) => {
    try {
      const response = await axios.post(`${API_URL}/schools/`, colegioData);
      return response.data;
    } catch (error) {
      logger.error('Error creando colegio:', error);
      throw error;
    }
  },

  // Crear colegio con logo
  createWithLogo: async (nombre, direccion, logoFile) => {
    try {
      const formData = new FormData();
      formData.append('nombre', nombre);
      if (direccion) {
        formData.append('direccion', direccion);
      }
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const response = await axios.post(`${API_URL}/schools/with-logo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error creando colegio con logo:', error);
      throw error;
    }
  },

  // Obtener todos los colegios
  getAll: async () => {
    try {
      const response = await axios.get(`${API_URL}/schools/`);
      return response.data;
    } catch (error) {
      logger.error('Error obteniendo colegios:', error);
      throw error;
    }
  },

  // Buscar colegios por nombre
  search: async (nombre) => {
    try {
      const response = await axios.get(`${API_URL}/schools/search`, {
        params: { nombre }
      });
      return response.data;
    } catch (error) {
      logger.error('Error buscando colegios:', error);
      throw error;
    }
  },

  // Obtener colegio por ID
  getById: async (colegioId) => {
    try {
      const response = await axios.get(`${API_URL}/schools/${colegioId}`);
      return response.data;
    } catch (error) {
      logger.error('Error obteniendo colegio:', error);
      throw error;
    }
  },

  // Actualizar colegio
  update: async (colegioId, updateData) => {
    try {
      const response = await axios.patch(`${API_URL}/schools/${colegioId}`, updateData);
      return response.data;
    } catch (error) {
      logger.error('Error actualizando colegio:', error);
      throw error;
    }
  },

  // Actualizar colegio con logo
  updateWithLogo: async (colegioId, nombre, direccion, logoFile) => {
    try {
      const formData = new FormData();
      formData.append('nombre', nombre);
      if (direccion) {
        formData.append('direccion', direccion);
      }
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const response = await axios.patch(`${API_URL}/schools/${colegioId}/update-with-logo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error actualizando colegio con logo:', error);
      throw error;
    }
  },

  // Eliminar colegio
  delete: async (colegioId) => {
    try {
      const response = await axios.delete(`${API_URL}/schools/${colegioId}`);
      return response.data;
    } catch (error) {
      logger.error('Error eliminando colegio:', error);
      throw error;
    }
  },

  getProxyImage: async (url) => {
    try {
      const response = await axios.get(`${API_URL}/schools/proxy-image/`, {
        params: { url },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      logger.error('Error obteniendo imagen vía proxy:', error);
      throw error;
    }
  },

  // Documentos
  uploadDocument: async (colegioId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post(`${API_URL}/schools/${colegioId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error subiendo documento:', error);
      throw error;
    }
  },

  listDocuments: async (colegioId) => {
    try {
      const response = await axios.get(`${API_URL}/schools/${colegioId}/documents`);
      return response.data;
    } catch (error) {
      logger.error('Error listando documentos:', error);
      throw error;
    }
  },

  deleteDocument: async (colegioId, filename) => {
    try {
      const response = await axios.delete(`${API_URL}/schools/${colegioId}/documents/${filename}`);
      return response.data;
    } catch (error) {
      logger.error('Error eliminando documento:', error);
      throw error;
    }
  }
};

// ============ DASHBOARD ============
export const dashboardService = {
  getDailyStats: async (userId, colegioId, month = null, year = null) => {
    try {
      const params = { user_id: userId, colegio_id: colegioId };
      if (month) params.month = month;
      if (year) params.year = year;

      const response = await axios.get(`${API_URL}/dashboard/daily-stats`, { params });
      return response.data;
    } catch (error) {
      logger.error('Error fetching daily stats:', error);
      throw error;
    }
  }
};

// Updated: 2025-12-12 02:08:07

// ============ ENTREVISTAS ============
export const interviewsService = {
  // Crear entrevista
  create: async (interviewData) => {
    try {
      const response = await axios.post(`${API_URL}/interviews/`, interviewData);
      return response.data;
    } catch (error) {
      logger.error('Error creating interview:', error);
      throw error;
    }
  },

  // Actualizar entrevista (PATCH)
  update: async (id, updateData) => {
    try {
      const response = await axios.patch(`${API_URL}/interviews/${id}`, updateData);
      return response.data;
    } catch (error) {
      logger.error('Error updating interview:', error);
      throw error;
    }
  },

  // Listar entrevistas del usuario
  list: async (schoolId, course = null) => {
    try {
      const params = { school_id: schoolId };
      if (course) params.course = course;

      const response = await axios.get(`${API_URL}/interviews/`, { params });
      return response.data;
    } catch (error) {
      logger.error('Error listing interviews:', error);
      throw error;
    }
  },

  // Listar TODAS las entrevistas del colegio (para Directivos)
  listAllBySchool: async (schoolId, course = null) => {
    try {
      const params = {};
      if (course) params.course = course;

      const response = await axios.get(`${API_URL}/interviews/school/${schoolId}`, { params });
      return response.data;
    } catch (error) {
      logger.error('Error listing all school interviews:', error);
      throw error;
    }
  },

  // Obtener entrevista
  getById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/interviews/${id}`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching interview:', error);
      throw error;
    }
  },

  // Subir audio
  uploadAudio: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post(`${API_URL}/interviews/${id}/audio`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      logger.error('Error uploading interview audio:', error);
      throw error;
    }
  },

  // Subir firma
  uploadSignature: async (id, signerType, file, signerName = null) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('signer_type', signerType);
    if (signerName) formData.append('signer_name', signerName);

    // Convert base64/blob if needed, assuming 'file' is Blob/File
    try {
      const response = await axios.post(`${API_URL}/interviews/${id}/signature`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      logger.error('Error uploading signature:', error);
      throw error;
    }
  },

  // Subir adjunto
  uploadAttachment: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post(`${API_URL}/interviews/${id}/attachment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      logger.error('Error uploading attachment:', error);
      throw error;
    }
  },

  generateSummary: async (schoolId, course = null) => {
    try {
      const params = { school_id: schoolId };
      if (course) params.course = course;
      const response = await axios.get(`${API_URL}/interviews/summary`, { params });
      return response.data;
    } catch (error) {
      logger.error('Error generating summary:', error);
      throw error;
    }
  },

  // Generar resumen de entrevista individual
  generateInterviewSummary: async (id) => {
    try {
      const response = await axios.post(`${API_URL}/interviews/${id}/summary`);
      return response.data;
    } catch (error) {
      logger.error('Error generating interview summary:', error);
      throw error;
    }
  },

  deleteAudio: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/interviews/${id}/audio`);
      return response.data;
    } catch (error) {
      logger.error('Error deleting audio:', error);
      throw error;
    }
  },

  deleteAttachment: async (id, attachmentId) => {
    try {
      const response = await axios.delete(`${API_URL}/interviews/${id}/attachment/${attachmentId}`);
      return response.data;
    } catch (error) {
      logger.error('Error deleting attachment:', error);
      throw error;
    }
  },

  deleteSignature: async (id, signerType = null, signatureId = null) => {
    try {
      const params = {};
      if (signerType) params.signer_type = signerType;
      if (signatureId) params.signature_id = signatureId;
      const response = await axios.delete(`${API_URL}/interviews/${id}/signature`, { params });
      return response.data;
    } catch (error) {
      logger.error('Error deleting signature:', error);
      throw error;
    }
  },

  // Asociar entrevista a un caso
  associateToCase: async (interviewId, caseId) => {
    try {
      const response = await axios.post(
        `${API_URL}/interviews/${interviewId}/associate-case`,
        null,
        {
          params: { case_id: caseId }
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Error associating interview to case:', error);
      throw error;
    }
  },

  // Eliminar entrevista
  delete: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/interviews/${id}`);
      return response.data;
    } catch (error) {
      logger.error('Error deleting interview:', error);
      throw error;
    }
  }
};

export const studentsService = {
  uploadStudents: async (students) => {
    try {
      const response = await axios.post(`${API_URL}/students/batch`, students);
      return response.data;
    } catch (error) {
      logger.error('Error uploading students:', error);
      throw error;
    }
  },

  getStudents: async (schoolId) => {
    try {
      const response = await axios.get(`${API_URL}/students/by-colegio/${schoolId}`);
      return response.data;
    } catch (error) {
      logger.error("Error getting students", error);
      return [];
    }
  },

  updateStudent: async (studentId, studentData) => {
    try {
      const response = await axios.put(`${API_URL}/students/${studentId}`, studentData);
      return response.data;
    } catch (error) {
      logger.error('Error updating student:', error);
      throw error;
    }
  },

  deleteStudent: async (studentId) => {
    try {
      const response = await axios.delete(`${API_URL}/students/${studentId}`);
      return response.data;
    } catch (error) {
      logger.error('Error deleting student:', error);
      throw error;
    }
  },

  getStudentStats: async (studentId) => {
    try {
      const response = await axios.get(`${API_URL}/students/${studentId}/stats`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching student stats:', error);
      return { casosActivos: 0, casosCerrados: 0, entrevistas: 0, compromisosActivos: 0 };
    }
  },

  getStudentCases: async (studentId) => {
    try {
      const response = await axios.get(`${API_URL}/students/${studentId}/cases`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching student cases:', error);
      throw error;
    }
  },

  getStudentInterviews: async (studentId) => {
    try {
      const response = await axios.get(`${API_URL}/students/${studentId}/interviews`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching student interviews:', error);
      throw error;
    }
  }
};

export const commitmentsService = {
  createCommitment: async (commitmentData) => {
    try {
      const response = await axios.post(`${API_URL}/commitments/`, commitmentData);
      return response.data;
    } catch (error) {
      logger.error('Error creating commitment:', error);
      throw error;
    }
  },

  getStudentCommitments: async (studentId) => {
    try {
      const response = await axios.get(`${API_URL}/commitments/student/${studentId}`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching student commitments:', error);
      throw error;
    }
  },

  updateCommitment: async (id, data) => {
    try {
      const response = await axios.patch(`${API_URL}/commitments/${id}`, data);
      return response.data;
    } catch (error) {
      logger.error('Error updating commitment:', error);
      throw error;
    }
  },

  deleteCommitment: async (id) => {
    try {
      await axios.delete(`${API_URL}/commitments/${id}`);
    } catch (error) {
      logger.error('Error deleting commitment:', error);
      throw error;
    }
  }
};

export const tokensService = {
  getGlobalStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/tokens/stats/global`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching global token stats:', error);
      throw error;
    }
  },
  getSchoolsStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/tokens/stats/schools`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching schools token stats:', error);
      throw error;
    }
  },
  getHistory: async (period = '7d', filters = {}) => {
    try {
      const { userId, schoolId, startDate, endDate } = filters;
      const params = {};
      if (period) params.period = period;
      if (userId) params.user_id = userId;
      if (schoolId) params.school_id = schoolId;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await axios.get(`${API_URL}/tokens/stats/history`, {
        params
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching token history:', error);
      throw error;
    }
  },
  getLogs: async (filters = {}) => {
    try {
      const { userId, schoolId, startDate, endDate, limit } = filters;
      const params = {};
      if (userId) params.user_id = userId;
      if (schoolId) params.school_id = schoolId;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (limit) params.limit = limit;

      const response = await axios.get(`${API_URL}/tokens/stats/logs`, {
        params
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching token logs:', error);
      throw error;
    }
  },
  getUsersStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/tokens/stats/users`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching users token stats:', error);
      throw error;
    }
  },
  updateLimit: async (id, type, limits, warningThresholds) => {
    try {
      const response = await axios.post(`${API_URL}/tokens/limits`, {
        id,
        type,
        input_token_limit: limits.input,
        output_token_limit: limits.output,
        warning_thresholds: warningThresholds
      });
      return response.data;
    } catch (error) {
      logger.error('Error updating token limit:', error);
      throw error;
    }
  }
};
