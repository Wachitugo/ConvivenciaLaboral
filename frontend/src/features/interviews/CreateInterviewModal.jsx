import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../../contexts/InterviewContext';
import { studentsService } from '../../services/api';

function CreateInterviewModal({ isOpen, onClose }) {
    const navigate = useNavigate();
    const { addInterview } = useInterview();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        studentName: '',
        grade: '',
        interviewer: '',
        gender: '',
        // Default values for other fields
        type: 'written',
        notes: '',
        transcription: '',
        status: 'Borrador'
    });

    // Autocomplete states
    const [students, setStudents] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const inputRef = useRef(null);
    const suggestionsRef = useRef(null);

    // Load students on mount
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const userStr = localStorage.getItem('usuario');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    const colegioId = user.colegios?.[0]?.id || user.colegios?.[0] || null;
                    if (colegioId) {
                        const idToUse = typeof colegioId === 'object' ? colegioId.id : colegioId;
                        const data = await studentsService.getStudents(idToUse);
                        setStudents(data || []);
                    }
                }
            } catch (error) {
                console.error("Error fetching students for autocomplete:", error);
            }
        };
        if (isOpen) {
            fetchStudents();
        }
    }, [isOpen]);

    // Get students filtered by selected grade
    const studentsInGrade = useMemo(() => {
        if (!formData.grade) return [];
        return students.filter(student => student.curso === formData.grade);
    }, [formData.grade, students]);

    // Filter students based on input AND grade
    const filteredStudents = useMemo(() => {
        if (!formData.grade) return []; // Must select grade first

        // If no search term, show all students in grade (limited)
        if (!formData.studentName || formData.studentName.length === 0) {
            return studentsInGrade.slice(0, 10); // Show first 10 when no search
        }

        // Filter by search term
        const searchTerm = formData.studentName.toLowerCase();
        return studentsInGrade.filter(student => {
            const fullName = `${student.nombres || ''} ${student.apellidos || ''}`.toLowerCase();
            return fullName.includes(searchTerm);
        }).slice(0, 10); // Limit to 10 suggestions
    }, [formData.studentName, studentsInGrade, formData.grade]);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target) &&
                inputRef.current &&
                !inputRef.current.contains(event.target)
            ) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                studentName: '',
                grade: '',
                interviewer: '',
                gender: '',
                type: 'written',
                notes: '',
                transcription: '',
                status: 'Borrador'
            });
            setSelectedStudentId(null);
            setShowSuggestions(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // If changing student name, clear selected student and show suggestions
        if (name === 'studentName') {
            setSelectedStudentId(null);
            setShowSuggestions(true); // Always show when typing
        }
    };

    const handleSelectStudent = (student) => {
        const fullName = `${student.nombres || ''} ${student.apellidos || ''}`.trim();
        setFormData(prev => ({
            ...prev,
            studentName: fullName,
            gender: student.genero || prev.gender, // Set gender from student if available
            // Keep grade as already selected (was selected first)
        }));
        setSelectedStudentId(student.id);
        setShowSuggestions(false);
    };

    // Clear student name when grade changes
    const handleGradeChange = (e) => {
        const { value } = e.target;
        setFormData(prev => ({
            ...prev,
            grade: value,
            studentName: '', // Reset student when changing grade
        }));
        setSelectedStudentId(null);
        setShowSuggestions(false);
    };

    const handleCreate = async () => {
        // Basic validation
        if (!formData.studentName || isLoading) return;

        setIsLoading(true);
        try {
            const newId = await addInterview({
                ...formData,
                date: new Date().toLocaleDateString('es-CL'),
                student_id: selectedStudentId // Include if we selected from list
            });

            onClose();
            // navigate(`/entrevistas/${newId}`);
        } catch (error) {
            console.error("Failed to create interview", error);
            // Optionally set error state to show in UI
        } finally {
            setIsLoading(false);
        }
    };


    return createPortal(
        <>
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] transition-opacity"
                onClick={onClose}
            />

            <div className="fixed right-0 top-0 h-full z-[70] flex items-center justify-end pointer-events-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
                <div className="w-[430px] h-full shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-[#0A3866]/95 backdrop-blur-3xl border-l border-[#1A71B8]/30 flex flex-col animate-slide-in overflow-hidden pointer-events-auto">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-white/10 bg-transparent flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-white">Nueva Entrevista</h2>
                            <p className="text-xs text-white/60 mt-0.5">Complete la información del trabajador para registrar la entrevista</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-transparent space-y-6">
                        {/* STEP 1: Select Grade First */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-[#1A71B8]/40 border border-[#1A71B8] text-[#34B6D8] text-xs flex items-center justify-center shadow-[0_0_8px_rgba(26,113,184,0.5)]">1</span>
                                Área de trabajo
                            </label>
                            <select
                                name="grade"
                                value={formData.grade}
                                onChange={handleGradeChange}
                                autoFocus
                                className="w-full px-4 py-3 rounded-xl border border-white/20 focus:border-[#34B6D8] focus:ring-4 focus:ring-[#34B6D8]/10 outline-none bg-white/5 text-sm font-medium text-white transition-all shadow-inner appearance-none"
                            >
                                <option value="" className="bg-[#0A3866] text-white">Seleccione un área de trabajo...</option>
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
                            {formData.grade && (
                                <p className="text-xs text-[#34B6D8] flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {studentsInGrade.length} trabajadores en esta área
                                </p>
                            )}
                        </div>

                        {/* STEP 2: Student Name with Autocomplete */}
                        <div className="space-y-2 relative">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${formData.grade ? 'bg-[#1A71B8]/40 border border-[#1A71B8] text-[#34B6D8] shadow-[0_0_8px_rgba(26,113,184,0.5)]' : 'bg-white/10 text-white/30 border border-white/10'}`}>2</span>
                                Nombre del Trabajador
                            </label>
                            <div className="relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    name="studentName"
                                    value={formData.studentName}
                                    onChange={handleInputChange}
                                    onFocus={() => formData.grade && setShowSuggestions(true)}
                                    placeholder={formData.grade ? "Click aquí o escribe para buscar..." : "Primero selecciona un área"}
                                    disabled={!formData.grade}
                                    autoComplete="off"
                                    className={`w-full px-4 py-3 rounded-xl border focus:ring-4 outline-none text-sm font-medium transition-all placeholder:text-white/30 ${formData.grade
                                        ? 'border-white/20 focus:border-[#34B6D8] focus:ring-[#34B6D8]/10 bg-white/5 text-white shadow-inner'
                                        : 'border-white/5 bg-white/5 text-white/40 cursor-not-allowed'
                                        }`}
                                />
                                {selectedStudentId && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#34B6D8]">
                                        <svg className="w-5 h-5 drop-shadow-[0_0_4px_rgba(52,182,216,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </span>
                                )}

                            </div>

                            {/* Suggestions dropdown */}
                            {showSuggestions && filteredStudents.length > 0 && (
                                <div
                                    ref={suggestionsRef}
                                    className="absolute z-50 w-full mt-1 bg-[#0A3866] border border-white/20 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] max-h-60 overflow-y-auto backdrop-blur-xl"
                                >
                                    {filteredStudents.map((student) => (
                                        <button
                                            key={student.id}
                                            type="button"
                                            onClick={() => handleSelectStudent(student)}
                                            className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/10 last:border-b-0 flex items-center gap-3"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-[#1A71B8]/40 border border-[#1A71B8] text-[#34B6D8] flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-[0_0_8px_rgba(26,113,184,0.4)]">
                                                {(student.nombres || '?')[0]?.toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-white truncate">
                                                    {student.nombres} {student.apellidos}
                                                </p>
                                                <p className="text-xs text-white/60">
                                                    RUT: {student.rut || 'N/A'}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Helper text */}
                            {formData.grade && (
                                <p className="text-xs text-white/40">
                                    Escribe al menos 2 caracteres para buscar entre los {studentsInGrade.length} trabajadores del área.
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${selectedStudentId && formData.gender ? 'bg-[#1A71B8]/40 border border-[#1A71B8] text-[#34B6D8] shadow-[0_0_8px_rgba(26,113,184,0.5)]' : 'bg-white/10 text-white/30 border border-white/10'}`}>3</span>
                                Género del Trabajador
                                <span className="text-[10px] font-normal text-white/40 normal-case">(automático)</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.gender || ''}
                                    disabled
                                    placeholder={selectedStudentId ? 'No registrado' : 'Se completará al seleccionar trabajador'}
                                    className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-sm font-medium text-white/50 cursor-not-allowed"
                                />
                                {selectedStudentId && formData.gender && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#34B6D8]">
                                        <svg className="w-5 h-5 drop-shadow-[0_0_4px_rgba(52,182,216,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-white/40">
                                Este dato se obtiene automáticamente del registro del trabajador.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${formData.gender ? 'bg-[#1A71B8]/40 border border-[#1A71B8] text-[#34B6D8] shadow-[0_0_8px_rgba(26,113,184,0.5)]' : 'bg-white/10 text-white/30 border border-white/10'}`}>4</span>
                                Nombre Entrevistador
                                <span className="text-[#34B6D8] text-lg leading-none">*</span>
                            </label>
                            <input
                                type="text"
                                name="interviewer"
                                value={formData.interviewer}
                                onChange={handleInputChange}
                                placeholder="Ej. Juan Pérez"
                                className="w-full px-4 py-3 rounded-xl border border-white/20 focus:border-[#34B6D8] focus:ring-4 focus:ring-[#34B6D8]/10 outline-none bg-white/5 text-sm font-medium text-white transition-all placeholder:text-white/30 shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/10 bg-transparent">
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-white/70 rounded-xl text-sm font-bold hover:bg-white/10 hover:text-white transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={isLoading || !formData.studentName || !formData.interviewer}
                                className="flex-1 px-4 py-2.5 bg-[#1A71B8] hover:bg-[#1A71B8]/80 text-white border border-white/10 rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creando...
                                    </>
                                ) : (
                                    'Crear Entrevista'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}

export default CreateInterviewModal;

