import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { chatService, casesService } from '../../services/api';
import { createLogger } from '../../utils/logger';
import { X, Upload, FileText, Loader2, Save, Trash2, User } from 'lucide-react';

const logger = createLogger('StudentFormPanel');

export default function StudentFormPanel({ isOpen, onClose, formData, setFormData, onSubmit, isSaving = false }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file types - reject .doc and .docx
    const invalidFiles = files.filter(file => {
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      return fileName.endsWith('.doc') ||
        fileName.endsWith('.docx') ||
        fileType === 'application/msword' ||
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    });

    if (invalidFiles.length > 0) {
      const fileNames = invalidFiles.map(f => f.name).join(', ');
      setErrorMessage(`Los archivos de Word (.doc, .docx) no son compatibles y fueron rechazados:\n\n${fileNames}\n\nPor favor, convierte tus documentos a PDF antes de subirlos.`);
      setShowErrorModal(true);
    }

    // Get valid files only
    const validFiles = files.filter(file => {
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      return !(fileName.endsWith('.doc') ||
        fileName.endsWith('.docx') ||
        fileType === 'application/msword' ||
        fileType === 'application/vnd.openxmlformats-oficedocument.wordprocessingml.document');
    });

    // Continue with valid files if any
    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = ''; // Clear file input
      return;
    }

    // Convertir a objetos de archivo
    const newFiles = validFiles.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: `${(file.size / 1024).toFixed(0)} KB`,
      file: file
    }));

    // Agregar a los existentes
    const currentFiles = formData.initialFiles || [];
    const updatedFiles = [...currentFiles, ...newFiles];

    setFormData({
      ...formData,
      initialFiles: updatedFiles
    });

    // Analizar nuevos archivos + existentes
    try {
      setIsAnalyzing(true);
      logger.info(`__ Analizando ${newFiles.length} nuevos archivos + ${currentFiles.length} existentes...`);

      // Crear sesión temporal si no existe
      const sessionId = formData.initialFiles[0]?.session_id || await chatService.createSession();

      // Subir nuevos archivos EN BATCH (una sola petición)
      logger.info(`📤 Subiendo ${newFiles.length} archivos en batch...`);
      const uploadResults = await chatService.uploadFilesParallel(
        newFiles.map(f => f.file),
        sessionId
      );

      // Mapear resultados con metadatos
      const uploadedNewFiles = newFiles.map((f, index) => ({
        ...f,
        gcs_uri: uploadResults[index]?.gcs_uri,
        session_id: sessionId
      }));

      // Combinar con existentes que ya tengan URI
      const allFilesWithUri = [
        ...currentFiles, // Ya deben tener URI si estaban antes
        ...uploadedNewFiles
      ];

      // Filtrar validos
      const validUris = allFilesWithUri.filter(f => f.gcs_uri).map(f => f.gcs_uri);

      // Actualizar estado con los nuevos archivos ya subidos (con URI)
      setFormData(prev => ({
        ...prev,
        initialFiles: allFilesWithUri
      }));

      if (validUris.length > 0) {
        logger.info(`🤖 Enviando ${validUris.length} URIs para análisis combinado...`);

        // 2. Analizar TODOS los archivos juntos
        const analysisResult = await casesService.analyzeFilesForCreate(validUris, sessionId);
        logger.info(`📊 Resultado del análisis combinado:`, analysisResult);

        if (analysisResult) {
          const updatedFormData = {
            ...formData,
            initialFiles: allFilesWithUri
          };

          if (analysisResult.title) updatedFormData.title = analysisResult.title;
          if (analysisResult.description) updatedFormData.description = analysisResult.description;

          if (analysisResult.involved && Array.isArray(analysisResult.involved)) {
            updatedFormData.involved = analysisResult.involved.map((person, index) => ({
              id: person.id || `inv-${index}-${Date.now()}`,
              name: person.name,
              role: person.role || null
            }));
          }

          if (analysisResult.case_type) updatedFormData.caseType = analysisResult.case_type;

          setFormData(updatedFormData);
          logger.info("✅ Formulario actualizado con análisis combinado");
        }
      }

    } catch (error) {
      logger.error("❌ Error analizando archivos:", error);
      alert(`Error al analizar archivos: ${error.message}`);
      setFormData(prev => ({
        ...prev,
        initialFiles: [...currentFiles, ...newFiles]
      }));
    } finally {
      setIsAnalyzing(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (id) => {
    setFormData({
      ...formData,
      initialFiles: formData.initialFiles.filter(f => f.id !== id)
    });
  };

  return createPortal(
    <>
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

      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 h-full z-[70] flex items-center justify-end pointer-events-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <div className="w-[430px] h-full shadow-2xl bg-white border-l border-gray-100 flex flex-col animate-slide-in overflow-hidden pointer-events-auto">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 bg-white flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Nuevo Caso</h2>
              <p className="text-xs text-gray-500 mt-0.5">Complete la información para registrar el caso</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
            <form id="student-form" onSubmit={onSubmit} className="space-y-6">

              {/* Título */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Título del caso
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-0 outline-none bg-gray-50 text-sm font-medium text-gray-800 transition-all placeholder:text-gray-400"
                  placeholder="Ej: Incidente en aula de 1° Básico"
                />
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Descripción
                  </label>
                  {isAnalyzing && (
                    <span className="text-xs text-blue-600 flex items-center gap-1 animate-pulse font-medium">
                      <Loader2 size={12} className="animate-spin" />
                      Analizando contenido...
                    </span>
                  )}
                </div>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-0 outline-none resize-none bg-gray-50 text-sm leading-relaxed text-gray-700 transition-all placeholder:text-gray-400 custom-scrollbar ${isAnalyzing ? 'bg-blue-50/30' : ''}`}
                  placeholder="Describa el incidente o suba archivos para autocompletar..."
                  rows="4"
                  disabled={isAnalyzing}
                />
              </div>

              {/* Archivos Adjuntos */}
              <div className="space-y-3">


                <div
                  onClick={() => !isAnalyzing && fileInputRef.current?.click()}
                  className={`relative group border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/30 rounded-xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                    accept=".pdf,.txt,image/*"
                    disabled={isAnalyzing}
                  />
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Upload size={18} className="text-gray-400 group-hover:text-blue-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 group-hover:text-blue-600">
                      Haga clic para subir archivos
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      La IA analizará el contenido automáticamente
                    </p>
                  </div>
                </div>

                {/* Lista de archivos */}
                {formData.initialFiles && formData.initialFiles.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {formData.initialFiles.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl group hover:border-gray-200 transition-all">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                            <FileText size={14} className="text-gray-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                            <p className="text-xs text-gray-400">{file.size}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Involucrados Detectados */}
              {formData.involved && formData.involved.length > 0 && (
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                    Involucrados
                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">
                      IA Detectado
                    </span>
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {formData.involved.map((person, index) => (
                      <div key={person.id || index} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                          {person.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{person.name}</p>
                          {person.role && <p className="text-xs text-gray-500">{person.role}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updatedInvolved = formData.involved.filter((_, i) => i !== index);
                            setFormData({ ...formData, involved: updatedInvolved });
                          }}
                          className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-white">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="student-form"
                disabled={isAnalyzing || isSaving}
                className={`flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2 ${(isAnalyzing || isSaving) ? 'opacity-80 cursor-not-allowed' : ''}`}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Analizando...</span>
                  </>
                ) : isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Crear Caso</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
