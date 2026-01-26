import { useState, useEffect, useRef } from 'react';
import CaseInvolved from './CaseInvolved';
import { casesService, chatService } from '../../../services/api';
import { createLogger } from '../../../utils/logger';
import { Upload, FileText, Save, Loader2, CheckCircle, Trash2 } from 'lucide-react';

const logger = createLogger('CaseDescription');

function CaseDescription({ caseData, onUpdateCase, isLoading = false, onReloadDocuments }) {
  const [description, setDescription] = useState(caseData.description || '');
  const [saveStatus, setSaveStatus] = useState('idle'); // 'saving', 'saved', 'idle'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const saveTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const [descriptionFiles, setDescriptionFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Cargar archivos de antecedentes desde el backend
  useEffect(() => {
    const loadDescriptionFiles = async () => {
      try {
        setIsLoadingFiles(true);
        const usuarioData = JSON.parse(localStorage.getItem('usuario'));
        if (!usuarioData || !caseData.id) return;

        // Obtener todos los documentos del caso
        const allDocs = await casesService.getCaseDocuments(caseData.id, usuarioData.id);

        // Filtrar solo los de tipo 'antecedente'
        const antecedentes = allDocs.filter(doc => doc.source === 'antecedente');

        logger.info(`📚 Archivos de antecedentes cargados: ${antecedentes.length}`);
        setDescriptionFiles(antecedentes);
      } catch (error) {
        logger.error("Error loading description files:", error);
      } finally {
        setIsLoadingFiles(false);
      }
    };

    loadDescriptionFiles();
  }, [caseData.id]);

  // Sincronizar descripción cuando caseData cambie (ej: al recargar desde backend)
  useEffect(() => {
    if (caseData.description !== undefined && caseData.description !== description) {
      logger.info("📝 Sincronizando descripción desde caseData:", caseData.description);
      setDescription(caseData.description);
    }
  }, [caseData.description]);

  // Auto-resize del textarea según el contenido
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset to calculate correct height
      // Set to scrollHeight but limit if needed, though flex layout handles it better now
      // textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; 
    }
  }, [description]);

  // Auto-save con debounce
  useEffect(() => {
    if (description !== caseData.description && !isAnalyzing) {
      setSaveStatus('saving');

      // Limpiar timeout anterior
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Guardar después de 1.5 segundos de inactividad
      saveTimeoutRef.current = setTimeout(() => {
        onUpdateCase({ ...caseData, description }, true); // ✅ AGREGADO true para guardar en backend
        setSaveStatus('saved');

        // Volver a idle después de 2 segundos
        setTimeout(() => setSaveStatus('idle'), 2000);
      }, 1500);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [description, caseData, onUpdateCase, isAnalyzing]);

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const handleFileChange = async (e) => {
    const uploadedFiles = Array.from(e.target.files);
    if (uploadedFiles.length === 0) return;

    // Filter out .doc and .docx files
    const invalidFiles = uploadedFiles.filter(file => {
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      return fileName.endsWith('.doc') ||
        fileName.endsWith('.docx') ||
        fileType === 'application/msword' ||
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    });

    // Get valid files only
    const validFiles = uploadedFiles.filter(file => {
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
      setErrorMessage(`Los archivos de Word (.doc, .docx) no son compatibles y fueron rechazados:\n\n${fileNames}\n\nPor favor, convierte tus documentos a PDF antes de subirlos.`);
      setShowErrorModal(true);
    }

    // Continue with valid files if any
    if (validFiles.length === 0) {
      e.target.value = ''; // Clear file input
      return;
    }

    try {
      setIsAnalyzing(true);
      logger.info(`📁 Procesando ${validFiles.length} archivo(s)...`);

      // 1. Crear sesión temporal para subir el archivo
      const sessionId = await chatService.createSession();
      logger.info(`✅ Sesión temporal creada: ${sessionId}`);

      // 2. Subir TODOS los archivos de una vez usando uploadFilesParallel
      logger.info(`📤 Subiendo ${validFiles.length} archivos...`);
      const uploadResults = await chatService.uploadFilesParallel(validFiles, sessionId, caseData.id);
      logger.info(`✅ Archivos subidos:`, uploadResults);

      // 3. Analizar los archivos subidos
      const fileUris = uploadResults.map(r => r.gcs_uri);
      logger.info(`🤖 Analizando ${fileUris.length} archivos con IA...`);

      const analysisResult = await casesService.analyzeFilesForCreate(fileUris, sessionId);
      logger.info(`📊 Resultado del análisis:`, analysisResult);

      if (analysisResult) {
        // 4. Actualizar descripción local
        if (analysisResult.description && analysisResult.description !== description) {
          logger.info(`📝 Actualizando descripción (${analysisResult.description.length} caracteres)`);
          setDescription(analysisResult.description);
        }

        // 5. Preparar datos actualizados
        const updatedCaseData = {
          ...caseData,
          description: analysisResult.description || caseData.description
        };

        // Si el backend devolvió involucrados, usarlos directamente
        if (analysisResult.involved && Array.isArray(analysisResult.involved)) {
          // Asignar IDs a los involucrados que no los tengan
          updatedCaseData.involved = analysisResult.involved.map((person, index) => ({
            ...person,
            id: person.id || `inv-${index}-${Date.now()}`
          }));
          logger.info(`👥 Involucrados actualizados (${updatedCaseData.involved.length}):`, updatedCaseData.involved);
        }

        // 6. Guardar cambios en backend
        logger.info("💾 Guardando caso actualizado en backend...");
        await onUpdateCase(updatedCaseData, true); // true = guardar en backend
        logger.info("✅ Caso actualizado exitosamente");

        // 7. Recargar archivos de antecedentes desde el backend
        logger.info("📚 Recargando archivos de antecedentes...");
        const usuarioData = JSON.parse(localStorage.getItem('usuario'));
        const allDocs = await casesService.getCaseDocuments(caseData.id, usuarioData.id);
        const antecedentes = allDocs.filter(doc => doc.source === 'antecedente');
        setDescriptionFiles(antecedentes);
        logger.info(`✅ Archivos recargados: ${antecedentes.length}`);

        // 8. Recargar documentos en el componente padre (CaseDetail)
        if (onReloadDocuments) {
          logger.info("📚 Recargando documentos en componente padre...");
          await onReloadDocuments();
        }
      } else {
        logger.warn("⚠️ No se recibió resultado del análisis");
      }

    } catch (error) {
      logger.error("❌ Error processing file:", error);
      logger.error("Detalles del error:", error.response?.data || error.message);
      alert(`Error al analizar el archivo: ${error.response?.data?.detail || error.message || "Error desconocido"}`);
    } finally {
      setIsAnalyzing(false);
      // Limpiar input
      e.target.value = '';
    }
  };

  const handleRemoveFile = async (fileId) => {
    try {
      logger.info(`🗑️ Eliminando documento: ${fileId}`);

      const usuarioData = JSON.parse(localStorage.getItem('usuario'));
      if (!usuarioData) {
        alert('Error: Usuario no encontrado');
        return;
      }

      // Eliminar del backend
      await casesService.deleteCaseDocument(caseData.id, fileId, usuarioData.id);
      logger.info(`✅ Documento eliminado del backend`);

      // Actualizar estado local
      const updatedFiles = descriptionFiles.filter(f => f.id !== fileId);
      setDescriptionFiles(updatedFiles);

    } catch (error) {
      logger.error("Error deleting file:", error);
      alert(`Error al eliminar el archivo: ${error.response?.data?.detail || error.message || "Error desconocido"}`);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }} className="h-full flex flex-col">
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

      <div className="shadow-sm p-5 bg-white h-full flex flex-col rounded-lg">

        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Descripción del Caso</h3>

          {/* Indicador de guardado discreto */}
          {saveStatus !== 'idle' && !isAnalyzing && (
            <div className="flex items-center gap-1.5 text-xs font-medium">
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 size={12} className="animate-spin text-gray-400" />
                  <span className="text-gray-400">Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={12} className="text-emerald-500" />
                  <span className="text-emerald-600">Guardado</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-end">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Contenido</label>
          </div>

          <textarea
            ref={textareaRef}
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Escribe una descripción detallada del caso... o adjunta un archivo para autocompletar."
            className={`w-full flex-1 px-4 py-3 min-h-[400px] max-h-[600px] rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-0 outline-none resize-none bg-gray-50 text-sm leading-relaxed text-gray-700 custom-scrollbar ${isAnalyzing ? 'animate-pulse' : ''}`}
            disabled={isAnalyzing}
          ></textarea>

          {/* Archivos adjuntos - Integrados visualmente */}
          {descriptionFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {descriptionFiles.map(file => (
                <div key={file.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-50 border border-blue-100/50 text-blue-700 rounded-lg text-xs font-medium transition-colors hover:bg-blue-100/50 group">
                  <FileText size={12} className="opacity-70" />
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <button
                    onClick={() => handleRemoveFile(file.id)}
                    className="ml-1 p-0.5 rounded-full hover:bg-blue-200 text-blue-500 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Footer with actions */}
          <div className="flex justify-end pt-2 border-t border-gray-100">
            <label className={`inline-block ${isAnalyzing ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                disabled={isAnalyzing}
                accept=".pdf,.txt,image/*"
              />
              <div className="flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors shadow-sm">
                {isAnalyzing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Analizando...</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    <span>Adjuntar y Analizar</span>
                  </>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Sección de Involucrados - Mantenida pero estilizada para integrar */}
        <div className="mt-5 pt-3 border-t-2 border-gray-50/50">
          <CaseInvolved
            caseData={caseData}
            onUpdateCase={onUpdateCase}
            isLoading={isLoading}
          />
        </div>

      </div>
    </div>
  );
}

export default CaseDescription;
