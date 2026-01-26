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
      <div className="bg-white h-full flex flex-col">
        {/* Header con estilo de PersonalInfoCard */}
        <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText size={18} className="text-blue-600 flex-shrink-0 sm:w-5 sm:h-5" />
              <span className="truncate">Resumen Inteligente</span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
              <span className="hidden sm:inline">Análisis automático del caso con IA</span>
              <span className="sm:hidden">Análisis con IA</span>
            </p>
          </div>
          <button
            onClick={handleGenerateSummary}
            disabled={isGenerating}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm flex-shrink-0 disabled:opacity-70"
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
          <div className="bg-gray-50 border border-gray-200 p-3 rounded-md">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <FileText size={16} className="text-slate-500" />
              Puntos Clave
            </h3>
            <ul className="space-y-2">
              {displaySummary.mainPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                  {/* Usando ReactMarkdown para renderizar negritas correctamente */}
                  <div className="prose prose-sm prose-stone max-w-none text-gray-700">
                    <ReactMarkdown components={{
                      p: ({ node, ...props }) => <span {...props} />
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
