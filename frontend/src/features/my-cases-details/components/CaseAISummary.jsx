import { useState, useEffect } from 'react';
import CaseAISummarySkeleton from '../skeletons/CaseAISummarySkeleton';
import { casesService } from '../../../services/api';
import { createLogger } from '../../../utils/logger';
import { RotateCcw, FileText, CheckCircle, Sparkles, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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

    // 2. Fallback: Generar desde descripción SOLO si no hay datos (ni persistidos ni locales)
    if (!summaryData && caseData.description) {
      const initialPoints = caseData.description
        .split('.')
        .filter(p => p.trim().length > 0)
        .slice(0, 4);

      setSummaryData({
        mainPoints: initialPoints.length > 0 ? initialPoints : ["No hay descripción disponible"],
        recommendations: [],
        riskLevel: "Calculando...", // Placeholder
        nextSteps: "Generar resumen para ver pasos siguientes"
      });
    }
  }, [caseData]); // Dependemos principalmente de caseData

  // Generar recomendaciones basadas en el tipo de caso (fallback)
  const getRecommendations = (type) => {
    const recs = {
      'Bullying': [
        "Activar protocolo de acoso escolar inmediatamente",
        "Entrevistar a los involucrados por separado",
        "Informar a los apoderados de ambas partes"
      ],
      'Conflicto': [
        "Realizar mediación escolar si las partes están dispuestas",
        "Establecer acuerdos de convivencia",
        "Seguimiento a los 15 días"
      ],
      'Vulneración de derechos': [
        "Notificar a dirección y encargada de convivencia",
        "Evaluar denuncia a tribunales o fiscalía si corresponde",
        "Resguardar la privacidad del estudiante"
      ],
      'default': [
        "Recabar más antecedentes del caso",
        "Entrevistar a los involucrados",
        "Registrar todas las acciones en la plataforma"
      ]
    };

    // Buscar coincidencia parcial
    const key = Object.keys(recs).find(k => type?.includes(k)) || 'default';
    return recs[key];
  };

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

  // Asegurar que summaryData existe para evitar errores de renderizado
  const displaySummary = summaryData || {
    mainPoints: [],
    recommendations: [],
    riskLevel: "Bajo",
    nextSteps: ""
  };

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
          {/* Puntos Clave */}
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
            <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText size={18} className="text-[#34B6D8]" />
              Puntos Clave
            </h3>
            <ul className="space-y-4">
              {displaySummary.mainPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-[#34B6D8] mt-[6px] flex-shrink-0 shadow-[0_0_8px_rgba(52,182,216,0.8)]"></div>
                  {/* Usando ReactMarkdown para renderizar negritas correctamente */}
                  <div className="prose prose-base prose-invert max-w-none text-white leading-relaxed">
                    <ReactMarkdown components={{
                      p: ({ node, ...props }) => <span {...props} />,
                      strong: ({ node, ...props }) => <strong className="text-white font-bold" {...props} />
                    }}>
                      {point}
                    </ReactMarkdown>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaseAISummary;
