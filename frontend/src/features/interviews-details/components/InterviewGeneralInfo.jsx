import React, { useState, useEffect } from 'react';
import { Trash2, Link as LinkIcon } from 'lucide-react';

function InterviewGeneralInfo({ interview, onUpdate, onDelete, onAssociate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editedData, setEditedData] = useState({
        studentName: interview?.studentName || '',
        grade: interview?.grade || '',
        gender: interview?.gender || ''
    });

    // Sincronizar editedData cuando interview cambie (fetch async completado)
    useEffect(() => {
        if (!isEditing && interview) {
            setEditedData({
                studentName: interview?.studentName || '',
                grade: interview?.grade || '',
                gender: interview?.gender || ''
            });
        }
    }, [interview, isEditing]);

    const handleEdit = () => {
        setEditedData({
            studentName: interview?.studentName || '',
            grade: interview?.grade || '',
            gender: interview?.gender || ''
        });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedData({
            studentName: interview?.studentName || '',
            grade: interview?.grade || '',
            gender: interview?.gender || ''
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (onUpdate) {
                await onUpdate({
                    studentName: editedData.studentName,
                    grade: editedData.grade,
                    gender: editedData.gender
                });
            }
            setIsEditing(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedData(prev => ({ ...prev, [name]: value }));
    };

    const getGenderLabel = (gender) => {
        switch (gender) {
            case 'Masculino': return 'Masculino';
            case 'Femenino': return 'Femenino';
            case 'Otro': return 'Otro';
            default: return 'Por definir';
        }
    };

    return (
        <div className="flex flex-col bg-[#0A3866]/40 backdrop-blur-md overflow-hidden rounded-xl border border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.2)]" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0 gap-2">
                <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#34B6D8] flex-shrink-0 drop-shadow-[0_0_8px_rgba(52,182,216,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="truncate">Información General</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-white/60 mt-0.5 truncate border-white/10">
                        <span className="hidden sm:inline">Datos del trabajador y detalles de la entrevista</span>
                        <span className="sm:hidden">Datos del trabajador</span>
                    </p>
                </div>
                {!isEditing ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {onDelete && (
                            <button
                                onClick={onDelete}
                                className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors"
                            >
                                <Trash2 size={14} />
                                <span className="hidden sm:inline">Eliminar</span>
                            </button>
                        )}
                        {onAssociate && (
                            <button
                                onClick={onAssociate}
                                className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-bold text-white bg-[#1A71B8] hover:bg-[#1A71B8]/80 border border-white/10 rounded-lg transition-colors shadow-md"
                            >
                                <LinkIcon size={14} className="text-[#34B6D8]" />
                                <span className="hidden sm:inline">Asociar Caso</span>
                            </button>
                        )}
                        <button
                            onClick={handleEdit}
                            className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-bold text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors shadow-sm flex-shrink-0"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="hidden sm:inline">Editar</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCancel}
                            disabled={isSaving}
                            className="px-2 sm:px-3 py-1.5 text-xs font-bold text-white/60 hover:text-white rounded-lg hover:bg-white/5 border border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-2 sm:px-3 py-1.5 text-xs font-bold text-white bg-[#1A71B8] hover:bg-[#1A71B8]/80 border border-white/10 rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                )}
            </div>

            {/* Contenido */}
            <div className="p-3 sm:p-4">
                {isEditing ? (
                    // Modo edición
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="bg-white/5 border border-white/10 p-3 rounded-lg shadow-inner">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2 block">Nombre del Trabajador</label>
                            <input
                                type="text"
                                name="studentName"
                                value={editedData.studentName}
                                onChange={handleInputChange}
                                className="w-full px-3 py-1.5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34B6D8] text-sm bg-white/5 text-white transition-all shadow-inner"
                                disabled={isSaving}
                            />
                        </div>
                        <div className="bg-white/5 border border-white/10 p-3 rounded-lg shadow-inner">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2 block">Área de trabajo</label>
                            <select
                                name="grade"
                                value={editedData.grade}
                                onChange={handleInputChange}
                                className="w-full px-3 py-1.5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34B6D8] text-sm bg-white/5 text-white transition-all shadow-inner appearance-none"
                                disabled={isSaving}
                            >
                                <option value="" className="bg-[#0A3866] text-white">Seleccione un área...</option>
                                <option value="Administración" className="bg-[#0A3866] text-white">Administración</option>
                                <option value="Operaciones" className="bg-[#0A3866] text-white">Operaciones</option>
                                <option value="Recursos Humanos" className="bg-[#0A3866] text-white">Recursos Humanos</option>
                                <option value="Finanzas" className="bg-[#0A3866] text-white">Finanzas</option>
                                <option value="Tecnología" className="bg-[#0A3866] text-white">Tecnología</option>
                                <option value="Ventas" className="bg-[#0A3866] text-white">Ventas</option>
                                <option value="Marketing" className="bg-[#0A3866] text-white">Marketing</option>
                                <option value="Producción" className="bg-[#0A3866] text-white">Producción</option>
                                <option value="Logística" className="bg-[#0A3866] text-white">Logística</option>
                                <option value="Atención al Cliente" className="bg-[#0A3866] text-white">Atención al Cliente</option>
                            </select>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-3 rounded-lg shadow-inner">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2 block">
                                Género <span className="text-[10px] font-normal text-white/30 normal-case ml-1">(No modificable)</span>
                            </label>
                            <input
                                type="text"
                                value={editedData.gender || 'No registrado'}
                                disabled
                                className="w-full px-3 py-1.5 border border-white/5 rounded-lg bg-white/5 text-white/50 text-sm cursor-not-allowed focus:outline-none"
                            />
                        </div>
                        <div className="bg-white/5 border border-white/10 p-3 rounded-lg shadow-inner flex flex-col justify-center">
                            <span className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2 block">Fecha de Entrevista</span>
                            <span className="font-bold text-white text-sm">{interview?.date || '...'}</span>
                        </div>
                    </div>
                ) : (
                    // Modo visualización
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
                        {/* Nombre del Trabajador */}
                        <div className="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-lg shadow-inner">
                            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-[#34B6D8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Nombre
                            </p>
                            <p className="font-bold text-white text-sm sm:text-base">{interview?.studentName || 'Cargando...'}</p>
                        </div>

                        {/* Estado */}
                        <div className="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-lg shadow-inner flex flex-col justify-center items-start">
                            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Estado</p>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${interview?.status === 'Autorizada' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${interview?.status === 'Autorizada' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                                {interview?.status || 'Pendiente'}
                            </span>
                        </div>

                        {/* Curso */}
                        <div className="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-lg shadow-inner">
                            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-[#34B6D8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                Área de trabajo
                            </p>
                            <p className="font-bold text-white text-sm">{interview?.grade || 'Por definir'}</p>
                        </div>

                        {/* Género */}
                        <div className="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-lg shadow-inner">
                            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Género</p>
                            <p className="font-bold text-white text-sm">{getGenderLabel(interview?.gender)}</p>
                        </div>

                        {/* Fecha de Entrevista */}
                        <div className="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-lg shadow-inner">
                            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-[#34B6D8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Fecha
                            </p>
                            <p className="font-bold text-white text-sm">{interview?.date || '...'}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default InterviewGeneralInfo;
