import React, { useState } from 'react';
import { RotateCcw, CheckCircle, Sparkles, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

function InterviewSummaryTab({ formData, generateSummary }) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            await generateSummary();
        } catch (error) {
            // Error handling is done in generateSummary hook, but we catch here to stop loading
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div style={{ fontFamily: "'Poppins', sans-serif" }} className="h-full flex flex-col bg-white">
            {/* Header con estilo consistente */}
            <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 gap-2">
                <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className="truncate">Resumen Inteligente</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                        <span className="hidden sm:inline">Análisis automático generado con inteligencia artificial</span>
                        <span className="sm:hidden">Análisis con IA</span>
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-70"
                    >
                        {isGenerating ? (
                            <>
                                <RotateCcw size={14} className="animate-spin" />
                                <span className="hidden sm:inline">Analizando...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles size={14} />
                                <span className="hidden sm:inline">Generar</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="flex-1 p-3 sm:p-4 overflow-hidden flex flex-col">

                {!formData.aiSummary ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-stone-50/50 rounded-md border border-dashed border-stone-200">
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-500 mb-3 border border-stone-100">
                            <Sparkles size={20} />
                        </div>
                        <h4 className="text-gray-900 font-medium text-sm mb-1">Aún no hay resumen</h4>
                        <p className="text-gray-500 text-xs max-w-xs mb-4">
                            Genera un análisis automático de la entrevista utilizando inteligencia artificial.
                        </p>

                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
                        {(() => {
                            let parsedSummary = null;
                            try {
                                parsedSummary = JSON.parse(formData.aiSummary);
                            } catch (e) {
                                // Not JSON, render fallback
                            }

                            if (parsedSummary && typeof parsedSummary === 'object') {
                                return (
                                    <>
                                        {/* Executive Summary */}
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">

                                            <div className="text-sm text-gray-600 leading-relaxed space-y-3 text-justify">
                                                {Array.isArray(parsedSummary.resumen_ejecutivo) ? (
                                                    parsedSummary.resumen_ejecutivo.map((paragraph, i) => (
                                                        <p key={i}>{paragraph}</p>
                                                    ))
                                                ) : (
                                                    <p>{parsedSummary.resumen_ejecutivo}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Key Points */}
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                                            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2 uppercase tracking-wide">
                                                <AlertCircle size={16} className="text-amber-500" />
                                                Puntos Clave
                                            </h3>
                                            <ul className="space-y-2">
                                                {parsedSummary.puntos_clave?.map((point, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 text-justify">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></div>
                                                        <span>{point}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Conclusion */}
                                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 shadow-sm">
                                            <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2 mb-2 uppercase tracking-wide">
                                                <CheckCircle size={16} className="text-blue-600" />
                                                Conclusión
                                            </h3>
                                            <p className="text-sm text-blue-800 leading-relaxed font-medium text-justify">
                                                {parsedSummary.conclusion}
                                            </p>
                                        </div>
                                    </>
                                );
                            }

                            // Fallback for legacy markdown summaries
                            return (
                                <div className="bg-gray-50 border border-gray-200 p-5 rounded-md">
                                    <article className="prose prose-sm prose-stone max-w-none 
                                        prose-headings:font-bold prose-headings:text-gray-800 
                                        prose-p:text-gray-600 prose-p:leading-relaxed 
                                        prose-li:text-gray-600 prose-li:marker:text-blue-500 
                                        prose-strong:text-gray-900 prose-strong:font-semibold">
                                        <ReactMarkdown>{formData.aiSummary}</ReactMarkdown>
                                    </article>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
}

export default InterviewSummaryTab;

