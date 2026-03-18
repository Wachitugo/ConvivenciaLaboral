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
        <div style={{ fontFamily: "'Poppins', sans-serif" }} className="h-full flex flex-col bg-transparent">
            {/* Header con estilo consistente */}
            <div className="p-3 sm:p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0 gap-2">
                <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#34B6D8] flex-shrink-0 drop-shadow-[0_0_8px_rgba(52,182,216,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className="truncate">Resumen Inteligente</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-white/60 mt-0.5 truncate">
                        <span className="hidden sm:inline">Análisis automático generado con inteligencia artificial</span>
                        <span className="sm:hidden">Análisis con IA</span>
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#1A71B8] hover:bg-[#1A71B8]/80 border border-white/10 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-colors disabled:opacity-50"
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
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white/5 rounded-xl border border-dashed border-white/20">
                        <div className="w-12 h-12 rounded-full bg-[#0A3866] flex items-center justify-center text-[#34B6D8] mb-3 border border-white/10 shadow-inner">
                            <Sparkles size={20} />
                        </div>
                        <h4 className="text-white font-bold text-sm mb-1">Aún no hay resumen</h4>
                        <p className="text-white/60 text-xs max-w-xs mb-4">
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
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-5 sm:p-6 shadow-inner">

                                            <div className="text-base sm:text-lg text-white/90 leading-relaxed font-medium space-y-4 text-justify">
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
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-5 sm:p-6 shadow-inner">
                                            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 mb-4 uppercase tracking-wider">
                                                <AlertCircle size={18} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                                                Puntos Clave
                                            </h3>
                                            <ul className="space-y-3">
                                                {parsedSummary.puntos_clave?.map((point, idx) => (
                                                    <li key={idx} className="flex items-start gap-3 text-base sm:text-lg text-white/90 font-medium text-justify">
                                                        <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 flex-shrink-0 shadow-[0_0_6px_rgba(251,191,36,0.8)]"></div>
                                                        <span>{point}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Conclusion */}
                                        <div className="bg-[#1A71B8]/20 border border-[#34B6D8]/30 rounded-xl p-5 sm:p-6 shadow-inner">
                                            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 mb-3 uppercase tracking-wider">
                                                <CheckCircle size={18} className="text-[#34B6D8] drop-shadow-[0_0_8px_rgba(52,182,216,0.6)]" />
                                                Conclusión
                                            </h3>
                                            <p className="text-base sm:text-lg text-white leading-relaxed font-bold text-justify">
                                                {parsedSummary.conclusion}
                                            </p>
                                        </div>
                                    </>
                                );
                            }

                            // Fallback for legacy markdown summaries
                            return (
                                <div className="bg-white/5 border border-white/10 p-5 rounded-xl shadow-inner">
                                    <article className="prose prose-sm prose-invert max-w-none 
                                        prose-headings:font-bold prose-headings:text-white 
                                        prose-p:text-white/80 prose-p:leading-relaxed 
                                        prose-li:text-white/80 prose-li:marker:text-[#34B6D8] 
                                        prose-strong:text-white prose-strong:font-bold">
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

