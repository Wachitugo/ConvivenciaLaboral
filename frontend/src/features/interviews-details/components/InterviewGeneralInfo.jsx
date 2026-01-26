import React, { useState, useEffect } from 'react';

function InterviewGeneralInfo({ interview, onUpdate }) {
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
        <div className="flex flex-col bg-white overflow-hidden rounded-xl border-2 border-gray-300 shadow-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 gap-2">
                <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="truncate">Información General</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                        <span className="hidden sm:inline">Datos del estudiante y detalles de la entrevista</span>
                        <span className="sm:hidden">Datos del estudiante</span>
                    </p>
                </div>
                {!isEditing ? (
                    <button
                        onClick={handleEdit}
                        className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm flex-shrink-0"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="hidden sm:inline">Editar</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCancel}
                            disabled={isSaving}
                            className="px-2 sm:px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-2 sm:px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Nombre del Estudiante</label>
                            <input
                                type="text"
                                name="studentName"
                                value={editedData.studentName}
                                onChange={handleInputChange}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                                disabled={isSaving}
                            />
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Curso</label>
                            <select
                                name="grade"
                                value={editedData.grade}
                                onChange={handleInputChange}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                                disabled={isSaving}
                            >
                                <option value="">Seleccione un curso...</option>
                                <option value="1° Básico">1° Básico</option>
                                <option value="2° Básico">2° Básico</option>
                                <option value="3° Básico">3° Básico</option>
                                <option value="4° Básico">4° Básico</option>
                                <option value="5° Básico">5° Básico</option>
                                <option value="6° Básico">6° Básico</option>
                                <option value="7° Básico">7° Básico</option>
                                <option value="8° Básico">8° Básico</option>
                                <option value="1° Medio">1° Medio</option>
                                <option value="2° Medio">2° Medio</option>
                                <option value="3° Medio">3° Medio</option>
                                <option value="4° Medio">4° Medio</option>
                            </select>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Género</label>
                            <select
                                name="gender"
                                value={editedData.gender}
                                onChange={handleInputChange}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                                disabled={isSaving}
                            >
                                <option value="">Seleccione género...</option>
                                <option value="Masculino">Masculino</option>
                                <option value="Femenino">Femenino</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <span className="text-xs font-medium text-gray-500 uppercase mb-2 block">Fecha de Entrevista</span>
                            <span className="font-medium text-gray-900 text-sm">{interview?.date || '...'}</span>
                        </div>
                    </div>
                ) : (
                    // Modo visualización
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
                        {/* Nombre del Estudiante */}
                        <div className="bg-gray-50 p-2.5 sm:p-3 rounded-lg">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1 flex items-center gap-1">
                                <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Nombre
                            </p>
                            <p className="font-semibold text-gray-900 text-sm sm:text-base">{interview?.studentName || 'Cargando...'}</p>
                        </div>

                        {/* Estado */}
                        <div className="bg-gray-50 p-2.5 sm:p-3 rounded-lg">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Estado</p>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${interview?.status === 'Autorizada' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${interview?.status === 'Autorizada' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                                {interview?.status || 'Pendiente'}
                            </span>
                        </div>

                        {/* Curso */}
                        <div className="bg-gray-50 p-2.5 sm:p-3 rounded-lg">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1 flex items-center gap-1">
                                <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                Curso
                            </p>
                            <p className="font-medium text-gray-900 text-sm">{interview?.grade || 'Por definir'}</p>
                        </div>

                        {/* Género */}
                        <div className="bg-gray-50 p-2.5 sm:p-3 rounded-lg">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Género</p>
                            <p className="font-medium text-gray-900 text-sm">{getGenderLabel(interview?.gender)}</p>
                        </div>

                        {/* Fecha de Entrevista */}
                        <div className="bg-gray-50 p-2.5 sm:p-3 rounded-lg">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1 flex items-center gap-1">
                                <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Fecha
                            </p>
                            <p className="font-medium text-gray-900 text-sm">{interview?.date || '...'}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default InterviewGeneralInfo;
