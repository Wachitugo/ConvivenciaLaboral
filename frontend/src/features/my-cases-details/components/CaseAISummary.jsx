import { useState, useEffect } from 'react';
import CaseAISummarySkeleton from '../skeletons/CaseAISummarySkeleton';
import { casesService } from '../../../services/api';
import { createLogger } from '../../../utils/logger';
import { RotateCcw, FileText } from 'lucide-react';

const logger = createLogger('CaseAISummary');

function CaseAISummary({ caseData, isLoading = false, onUpdateCase }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  // Generar puntos clave iniciales desde la descripción (fallback)
  // Cargar resumen persistido o generar uno inicial
  useEffect(() => {
    // 1. Prioridad: Usar siempre datos persistidos si existen (mantiene sincronía con backend)
    if (caseData.ai_summary) {
      setSummaryData(caseData.ai_summary);
      return;
    }

    // 2. Fallback: usar descripción del caso si no hay ai_summary
    if (!summaryData && caseData.description) {
      setSummaryData({
        description: caseData.description,
        riskLevel: "Calculando..."
      });
    }
  }, [caseData]); // Dependemos principalmente de caseData

  const handleGenerateSummary = async () => {
    try {
      setIsGenerating(true);
      const usuarioData = JSON.parse(localStorage.getItem('usuario'));
      if (!usuarioData) {
        alert("Error de sesión");
        return;
      }

      logger.info("🧠 Solicitando resumen IA para caso:", caseData.id);
      const result = await casesService.generateSummary(caseData.id, usuarioData.id);

      logger.info("✅ Resumen recibido:", result);
      logger.info("✅ Resumen recibido:", result);
      setSummaryData(result);

      // Actualizar el caso en el padre para persistencia local inmediata
      if (onUpdateCase) {
        onUpdateCase({
          ...caseData,
          ai_summary: result
        });
      }

    } catch (error) {
      logger.error("Error generating summary:", error);
      alert("Error al generar el resumen. Intenta nuevamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Mostrar skeleton mientras carga
  if (isLoading) {
    return <CaseAISummarySkeleton />;
  }

  const displaySummary = summaryData || { description: '', riskLevel: 'Bajo' };

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }} className="h-full flex flex-col">
      <div className="h-full flex flex-col text-white">
        {/* Header con estilo de PersonalInfoCard */}
        <div className="p-3 sm:p-4 border-b border-[#1A71B8]/30 flex items-center justify-between flex-shrink-0 gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-3">
              <FileText size={20} className="text-[#34B6D8] drop-shadow-[0_0_8px_rgba(52,182,216,0.6)] flex-shrink-0" />
              <span className="truncate">Resumen Inteligente</span>
            </h3>
            <p className="text-sm text-white/60 mt-1 truncate">
              <span className="hidden sm:inline">Análisis automático del caso con IA</span>
              <span className="sm:hidden">Análisis con IA</span>
            </p>
          </div>
          <button
            onClick={handleGenerateSummary}
            disabled={isGenerating}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#1A71B8] to-[#34B6D8] hover:from-[#34B6D8] hover:to-[#1A71B8] rounded-lg transition-all shadow-[0_4px_16px_rgba(26,113,184,0.4)] disabled:opacity-50 flex-shrink-0"
          >
            {isGenerating ? (
              <>
                <RotateCcw size={14} className="animate-spin" />
                <span className="hidden sm:inline">Analizando...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <RotateCcw size={14} />
                <span className="hidden sm:inline">Generar</span>
              </>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 custom-scrollbar">
          {/* Descripción del caso */}
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
            <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText size={18} className="text-[#34B6D8]" />
              Descripción
            </h3>
            {displaySummary.description ? (
              <div className="space-y-3">
                {displaySummary.description.split('\n\n').filter(p => p.trim()).map((paragraph, index) => (
                  <p key={index} className="text-sm text-white/85 leading-relaxed text-justify">
                    {paragraph.trim()}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40 italic">Sin descripción. Genera el resumen para analizar el caso.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaseAISummary;
