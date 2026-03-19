import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { chatService, casesService } from '../../../services/api';
import ProtocolStep from './ProtocolStep';
import CaseCreatedMilestone from './CaseCreatedMilestone';
import { PROTOCOLOS_PREDEFINIDOS } from './timelineConstants';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('CaseTimeline');

function CaseTimeline({ caseData, onUpdateCase, isLoading = false }) {
  const [protocoloAsignado, setProtocoloAsignado] = useState(caseData.protocol || caseData.protocolo || null);
  const [pasosProtocolo, setPasosProtocolo] = useState(caseData.pasosProtocolo || []);
  const [selectedStep, setSelectedStep] = useState(null);
  const [caseCreationFiles, setCaseCreationFiles] = useState(caseData.caseCreationFiles || []);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingSeconds, setGeneratingSeconds] = useState(0);
  const [generatingMessage, setGeneratingMessage] = useState('Iniciando...');

  // Actualizar contador de tiempo durante generación
  useEffect(() => {
    let interval;
    if (isGenerating) {
      setGeneratingSeconds(0);
      setGeneratingMessage('Analizando caso...');
      interval = setInterval(() => {
        setGeneratingSeconds(prev => {
          const newVal = prev + 1;
          // Actualizar mensaje según el tiempo transcurrido
          if (newVal >= 5 && newVal < 15) {
            setGeneratingMessage('Buscando protocolo adecuado...');
          } else if (newVal >= 15 && newVal < 30) {
            setGeneratingMessage('Generando pasos del protocolo...');
          } else if (newVal >= 30) {
            setGeneratingMessage('Casi listo...');
          }
          return newVal;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Cargar pasos del protocolo
  useEffect(() => {
    if (caseData.protocolSteps && caseData.protocolSteps.length > 0) {
      // Si vienen pasos dinámicos del backend (AI), usarlos
      const pasosAdaptados = caseData.protocolSteps.map((paso, index) => {
        // Determine status/estado considering both backend (status) and frontend (estado) keys
        const isCompleted = paso.status === 'completed' || paso.estado === 'completado';
        const isInProgress = paso.status === 'in_progress' || paso.estado === 'en_progreso';

        return {
          ...paso, // Preserve original fields (like status, id, etc)
          id: paso.id || `step-${index}`,
          titulo: paso.title || paso.titulo || paso,
          descripcion: paso.description || paso.title || paso.titulo || "",
          estado: isCompleted ? 'completado' : (isInProgress ? 'en_progreso' : 'pendiente'),
          status: isCompleted ? 'completed' : (isInProgress ? 'in_progress' : 'pending'), // Ensure status is kept in sync
          fecha: paso.completed_at || paso.fecha || null,
          notas: paso.notes || paso.notas || '',
          estimated_time: paso.estimated_time || null,
          files: paso.files || []
        };
      });
      setPasosProtocolo(pasosAdaptados);
      setProtocoloAsignado(caseData.protocol || 'Protocolo Inteligente');
    } else if (caseData.pasosProtocolo && caseData.pasosProtocolo.length > 0) {
      // Normalizar estado también en la rama pasosProtocolo
      const pasosNormalizados = caseData.pasosProtocolo.map((paso, index) => {
        const isCompleted = paso.status === 'completed' || paso.estado === 'completado';
        const isInProgress = paso.status === 'in_progress' || paso.estado === 'en_progreso';
        return {
          ...paso,
          id: paso.id || `step-${index}`,
          estado: isCompleted ? 'completado' : (isInProgress ? 'en_progreso' : 'pendiente'),
          status: isCompleted ? 'completed' : (isInProgress ? 'in_progress' : 'pending'),
        };
      });
      setPasosProtocolo(pasosNormalizados);
      setProtocoloAsignado(caseData.protocol || caseData.protocolo || null);
    }
    // REMOVED automatic fallback logic
  }, [caseData.protocolSteps, caseData.pasosProtocolo, isLoading]);

  const handleGenerateProtocol = async () => {
    try {
      setIsGenerating(true);
      const sessionId = location.state?.sessionId || "case-detail-generation";
      logger.info("🚀 Generating protocol for case:", caseData.id);

      // Obtener ID del usuario actual para tracking de tokens
      const usuario = JSON.parse(localStorage.getItem('usuario'));
      const userId = usuario?.id || usuario?.uid;

      const result = await chatService.generateProtocol(caseData.id, sessionId, userId);

      if (result && result.status === 'success') {
        logger.info("✅ Protocol generated:", result.protocol_name);

        // Fetch fresh case data and update state without reloading the page
        const freshCase = await casesService.getCaseById(caseData.id, userId);
        if (freshCase && onUpdateCase) {
          onUpdateCase(freshCase);
        }
      }

    } catch (error) {
      logger.error("❌ Error generating protocol:", error);
      alert("Error al generar el protocolo. Por favor intente nuevamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAsignarProtocolo = (tipoProtocolo) => {
    const protocolo = PROTOCOLOS_PREDEFINIDOS[tipoProtocolo];
    const pasosIniciales = protocolo.pasos.map((paso, index) => ({
      id: `step-${index}`,
      titulo: paso.titulo,
      descripcion: paso.descripcion,
      estado: 'pendiente',
      fecha: null,
      notas: '',
      estimated_time: paso.estimated_time || null,
      files: []
    }));

    setProtocoloAsignado(tipoProtocolo);
    setPasosProtocolo(pasosIniciales);

    onUpdateCase({
      ...caseData,
      protocolo: tipoProtocolo,
      pasosProtocolo: pasosIniciales
    });
  };

  const location = useLocation();

  const handleCompletarPaso = async (stepNotes, stepFiles) => {
    // Optimistic update logic
    const updatedPasos = pasosProtocolo.map(paso =>
      paso.id === selectedStep
        ? {
          ...paso,
          estado: 'completado',
          status: 'completed', // CRITICAL: Update source property to prevent useEffect reversion
          fecha: new Date().toISOString(),
          completed_at: new Date().toISOString(), // Update source property too
          notas: stepNotes,
          notes: stepNotes, // Sync notes
          files: stepFiles
        }
        : paso
    );

    setPasosProtocolo(updatedPasos);

    // Call backend to save strict confirmation of step completion (ONLY for dynamic protocols)
    // Dynamic protocols have numeric IDs. Predefined/Manual protocols have string IDs ("step-0").
    const isDynamicProtocol = typeof selectedStep === 'number' || (typeof selectedStep === 'string' && /^\d+$/.test(selectedStep));

    if (isDynamicProtocol) {
      try {
        const sessionId = location.state?.sessionId || "history-view";
        logger.info("💾 Saving dynamic step completion:", { sessionId, caseId: caseData.id, stepId: selectedStep });

        await chatService.completeStep(
          sessionId,
          caseData.id,
          parseInt(selectedStep), // Ensure int
          stepNotes
        );
        logger.info("✅ Dynamic Step saved to backend service");

      } catch (error) {
        logger.error("❌ Error saving dynamic step completion to backend:", error);
      }
    } else {
      logger.info("📝 Saving manual protocol step via standard case update (predefined protocol)");
      // The parent (CaseDetailPage) handles persistence for manual steps via 'pasosProtocolo' field
    }

    // Always update local state & parent for immediate UI feedback
    // For dynamic protocols, the step is already saved via completeStep API, so don't call backend again
    // For manual protocols, we need to save to backend
    // For dynamic protocols: step is already saved via completeStep API, no need to call updateCase
    // For manual protocols: we need to save via updateCase
    onUpdateCase({
      ...caseData,
      pasosProtocolo: updatedPasos,
      protocolSteps: updatedPasos
    }, !isDynamicProtocol); // Only saveToBackend for manual/predefined protocols

    setSelectedStep(null);
  };

  const handleCaseCreationFileChange = (updatedFiles) => {
    setCaseCreationFiles(updatedFiles);
    onUpdateCase({ ...caseData, caseCreationFiles: updatedFiles });
  };

  const handleRemoveCaseCreationFile = (fileId) => {
    const updatedFiles = caseCreationFiles.filter(f => f.id !== fileId);
    setCaseCreationFiles(updatedFiles);
    onUpdateCase({ ...caseData, caseCreationFiles: updatedFiles });
  };

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }} className="flex flex-col h-full overflow-hidden text-white">
      {/* Header del protocolo */}
      <div className="p-3 sm:p-4 border-b border-[#1A71B8]/30 flex items-center justify-between flex-shrink-0 gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#34B6D8] drop-shadow-[0_0_8px_rgba(52,182,216,0.6)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="truncate">Protocolo</span>
            {pasosProtocolo.length > 0 && (
              <span className="text-xs sm:text-sm text-white/50 font-normal">({pasosProtocolo.filter(p => p.estado === 'completado').length}/{pasosProtocolo.length})</span>
            )}
          </h3>
          <p className="text-xs sm:text-sm text-white/50 mt-0.5 truncate">
            <span className="hidden sm:inline">Pasos y seguimiento del protocolo</span>
            <span className="sm:hidden">Pasos del protocolo</span>
          </p>
        </div>
        <button
          onClick={handleGenerateProtocol}
          disabled={isGenerating}
          title="Regenerar protocolo"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex-shrink-0 ${
            isGenerating
              ? 'border-white/10 text-white/30 cursor-not-allowed'
              : 'border-[#1A71B8]/50 text-[#34B6D8] hover:bg-[#1A71B8]/20 hover:border-[#34B6D8]/60'
          }`}
        >
          <svg
            className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isGenerating ? generatingMessage : 'Regenerar'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4">

        {(!protocoloAsignado || pasosProtocolo.length === 0) && (
          <div className="flex flex-col items-center justify-center py-10 px-4 bg-white/5 rounded-2xl border border-dashed border-white/20 text-center backdrop-blur-md">
            <div className="w-12 h-12 mb-3 text-[#34B6D8] drop-shadow-[0_0_8px_rgba(52,182,216,0.6)]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-2">
              {protocoloAsignado ? "Protocolo sin iniciar" : "No hay protocolo asignado"}
            </h3>
            <p className="text-xs uppercase text-white/60 tracking-wider mb-5 max-w-md leading-relaxed">
              {protocoloAsignado
                ? "Este caso tiene un protocolo asignado pero no se han generado los pasos. Inicia el protocolo para comenzar."
                : "Genera un protocolo inteligente basado en los documentos del caso o selecciona uno manualmente."
              }
            </p>
            <button
              onClick={handleGenerateProtocol}
              disabled={isGenerating}
              className={`inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold text-white transition-all rounded-lg focus:outline-none shadow-[0_4px_16px_rgba(26,113,184,0.4)] ${isGenerating ? 'bg-[#1A71B8]/50 cursor-not-allowed' : 'bg-gradient-to-r from-[#1A71B8] to-[#34B6D8] hover:from-[#34B6D8] hover:to-[#1A71B8]'}`}
            >
              {isGenerating ? (
                <>
                  <svg className="w-5 h-5 mr-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{generatingMessage}</span>
                  <span className="text-[#34B6D8] ml-2 text-xs">({generatingSeconds}s)</span>
                </>
              ) : (
                <>
                  Iniciar Protocolo
                </>
              )}
            </button>
          </div>
        )}

        {protocoloAsignado && pasosProtocolo.length > 0 && (
          <div className="relative space-y-6 bg-white/5 pl-3 pr-3 pb-3 rounded-2xl border border-white/10 backdrop-blur-sm pt-4">
            {/* Línea vertical continua */}
            <div className="absolute left-[27px] top-9 bottom-3 w-0.5 bg-white/10"></div>
            {pasosProtocolo.map((paso, index) => (
              <ProtocolStep
                key={paso.id}
                paso={paso}
                index={index}
                isLastStep={index === pasosProtocolo.length - 1}
                onComplete={() => setSelectedStep(paso.id)}
                isEditing={selectedStep === paso.id}
                onCancelEdit={() => setSelectedStep(null)}
                onSubmitEdit={handleCompletarPaso}
                caseCreatedAt={caseData.createdAt}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CaseTimeline;
