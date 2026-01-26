import React, { useRef } from 'react';
import { CheckCircle, PenTool, Trash2, Save } from 'lucide-react';
import { SignaturePad } from '../../interviews';

function InterviewConsentTab({ formData, handleSignatureEnd, onUploadSignature, studentSignatureUrl, guardianSignatureUrl, onDeleteSignature }) {
    const studentPadRef = useRef(null);
    const guardianPadRef = useRef(null);

    const handleSave = async () => {
        const toUpload = [];

        // Estudiante
        if (studentPadRef.current && typeof studentPadRef.current.isEmpty === 'function' && !studentPadRef.current.isEmpty()) {
            const blob = await studentPadRef.current.getBlob();
            if (blob) {
                const file = new File([blob], `firma_estudiante_${Date.now()}.png`, { type: 'image/png' });
                toUpload.push(onUploadSignature?.('student', file));
            }
        }
        // Apoderado
        if (guardianPadRef.current && typeof guardianPadRef.current.isEmpty === 'function' && !guardianPadRef.current.isEmpty()) {
            const blob = await guardianPadRef.current.getBlob();
            if (blob) {
                const file = new File([blob], `firma_apoderado_${Date.now()}.png`, { type: 'image/png' });
                toUpload.push(onUploadSignature?.('guardian', file));
            }
        }

        if (toUpload.length === 0) {
            alert('No hay firmas para guardar');
            return;
        }

        try {
            await Promise.all(toUpload);
            // Opcional: limpiar después de guardar
            // studentPadRef.current?.clear();
            // guardianPadRef.current?.clear();
        } catch (e) {
            console.error('Error subiendo firmas', e);
        }
    };

    return (
        <div style={{ fontFamily: "'Poppins', sans-serif" }} className="h-full flex flex-col bg-white">
            {/* Header con estilo consistente */}
            <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 gap-2">
                <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="truncate">Firma de Conformidad</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                        <span className="hidden sm:inline">La firma del estudiante es obligatoria para autorizar la entrevista. La firma del apoderado es opcional.</span>
                        <span className="sm:hidden">Firmas de autorización</span>
                    </p>
                </div>
            </div>

            <div className="flex-1 p-3 sm:p-4 overflow-y-auto custom-scrollbar">

                <div className="space-y pb-4">
                    <div className="grid grid-cols-1 gap-8">
                        {/* Student Signature */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                                    <PenTool size={14} />
                                    Firma del Estudiante
                                    <span className="text-red-500 ml-1">*</span>
                                    <span className="text-[10px] font-normal text-gray-400 ml-1">(Obligatoria)</span>
                                </label>
                                {formData.studentSignature && (
                                    <span className="text-emerald-600 text-xs font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                        <CheckCircle size={12} /> Firmado
                                    </span>
                                )}
                            </div>
                            <div className="border border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 relative shadow-inner group hover:border-blue-300 transition-colors h-40">
                                <SignaturePad
                                    ref={studentPadRef}
                                    backgroundUrl={studentSignatureUrl}
                                    onEnd={(isEmpty) => handleSignatureEnd('student', isEmpty)}
                                    onClear={() => onDeleteSignature && onDeleteSignature('student')}
                                />
                            </div>
                        </div>

                        {/* Guardian Signature */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                                    <PenTool size={14} />
                                    Firma del Apoderado
                                    <span className="text-[10px] font-normal text-gray-400 ml-1">(Opcional)</span>
                                </label>
                                {formData.guardianSignature && (
                                    <span className="text-emerald-600 text-xs font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                        <CheckCircle size={12} /> Firmado
                                    </span>
                                )}
                            </div>
                            <div className="border border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 relative shadow-inner group hover:border-blue-300 transition-colors h-40">
                                <SignaturePad
                                    ref={guardianPadRef}
                                    backgroundUrl={guardianSignatureUrl}
                                    onEnd={(isEmpty) => handleSignatureEnd('guardian', isEmpty)}
                                    onClear={() => onDeleteSignature && onDeleteSignature('guardian')}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={async () => {
                            studentPadRef.current?.clear?.();
                            guardianPadRef.current?.clear?.();
                            if (onDeleteSignature) {
                                await onDeleteSignature('student');
                                await onDeleteSignature('guardian');
                            }
                        }}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center gap-2"
                    >
                        <Trash2 size={16} />
                        Limpiar Todo
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Save size={16} />
                        Guardar Firmas
                    </button>
                </div>
            </div>
        </div>
    );
}

export default InterviewConsentTab;
