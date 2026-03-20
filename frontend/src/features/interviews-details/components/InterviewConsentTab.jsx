import React, { useRef, useState } from 'react';
import { CheckCircle, PenTool, Trash2, Save } from 'lucide-react';
import { SignaturePad } from '../../interviews';

function InterviewConsentTab({ formData, handleSignatureEnd, onUploadSignature, studentSignatureUrl, onDeleteSignature }) {
    const studentPadRef = useRef(null);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    const handleSave = async () => {
        setErrorMsg(null);

        const toUpload = [];

        // Colaborador
        if (studentPadRef.current && typeof studentPadRef.current.isEmpty === 'function' && !studentPadRef.current.isEmpty()) {
            const blob = await studentPadRef.current.getBlob();
            if (blob) {
                const file = new File([blob], `firma_colaborador_${Date.now()}.png`, { type: 'image/png' });
                toUpload.push(onUploadSignature?.('student', file));
            }
        }

        if (toUpload.length === 0) {
            setErrorMsg('Dibuja la firma del colaborador antes de guardar');
            return;
        }

        setIsSaving(true);
        try {
            await Promise.all(toUpload);
        } catch (e) {
            console.error('Error subiendo firmas', e);
            setErrorMsg('Ocurrió un error al guardar la firma. Intenta nuevamente.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ fontFamily: "'Poppins', sans-serif" }} className="h-full flex flex-col bg-transparent">
            {/* Header con estilo consistente */}
            <div className="p-3 sm:p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0 gap-2">
                <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#34B6D8] flex-shrink-0 drop-shadow-[0_0_8px_rgba(52,182,216,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="truncate">Firma de Conformidad</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-white/60 mt-0.5 truncate border-white/10">
                        <span className="hidden sm:inline">La firma del colaborador es obligatoria para autorizar la entrevista.</span>
                        <span className="sm:hidden">Firmas de autorización</span>
                    </p>
                </div>
            </div>

            <div className="flex-1 p-3 sm:p-4 overflow-y-auto custom-scrollbar">

                <div className="space-y pb-4">
                    <div className="grid grid-cols-1 gap-8">
                        {/* Worker Signature */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-sm font-bold text-white/90 uppercase tracking-wider flex items-center gap-1.5">
                                    <PenTool size={14} />
                                    Firma del Colaborador
                                    <span className="text-red-400 ml-1">*</span>
                                    <span className="text-xs font-normal text-white/60 ml-1">(Obligatoria)</span>
                                </label>
                                {formData.studentSignature && (
                                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                        <CheckCircle size={12} /> Firmado
                                    </span>
                                )}
                            </div>
                            <div className="border border-dashed border-white/20 rounded-xl overflow-hidden bg-white/5 relative shadow-inner group hover:border-[#34B6D8]/50 transition-colors h-40">
                                <SignaturePad
                                    ref={studentPadRef}
                                    backgroundUrl={studentSignatureUrl}
                                    onEnd={(isEmpty) => handleSignatureEnd('student', isEmpty)}
                                    onClear={() => onDeleteSignature && onDeleteSignature('student')}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mensajes de feedback */}
                {errorMsg && (
                    <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-xl flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-red-200">{errorMsg}</p>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="mt-auto pt-4 border-t border-white/10 flex justify-end gap-3">
                    <button
                        onClick={async () => {
                            studentPadRef.current?.clear?.();
                            if (onDeleteSignature) {
                                await onDeleteSignature('student');
                            }
                        }}
                        disabled={isSaving}
                        className="px-4 py-2 rounded-lg text-sm font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 size={16} />
                        Limpiar Todo
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#1A71B8] hover:bg-[#1A71B8]/80 transition-colors flex items-center gap-2 shadow-[0_4px_12px_rgba(26,113,184,0.3)] disabled:opacity-70 disabled:cursor-not-allowed min-w-[148px] justify-center"
                    >
                        {isSaving ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Guardar Firmas
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default InterviewConsentTab;
