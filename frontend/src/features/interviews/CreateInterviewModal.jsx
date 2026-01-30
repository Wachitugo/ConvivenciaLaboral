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
                <div className="w-[430px] h-full shadow-2xl bg-white border-l border-gray-100 flex flex-col animate-slide-in overflow-hidden pointer-events-auto">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-100 bg-white flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Nueva Entrevista</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Complete la información del trabajador para registrar la entrevista</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white space-y-6">
                        {/* STEP 1: Select Grade First */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">1</span>
                                Área de trabajo
                            </label>
                            <select
                                name="grade"
                                value={formData.grade}
                                onChange={handleGradeChange}
                                autoFocus
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-0 outline-none bg-gray-50 text-sm font-medium text-gray-800 transition-all"
                            >
                                <option value="">Seleccione un área de trabajo...</option>
                                <option value="Administración">Administración</option>
                                <option value="Operaciones">Operaciones</option>
                                <option value="Recursos Humanos">Recursos Humanos</option>
                                <option value="Finanzas">Finanzas</option>
                                <option value="Tecnología">Tecnología</option>
                                <option value="Ventas">Ventas</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Producción">Producción</option>
                                <option value="Logística">Logística</option>
                                <option value="Atención al Cliente">Atención al Cliente</option>
                            </select>
                            {formData.grade && (
                                <p className="text-xs text-green-600 flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {studentsInGrade.length} trabajadores en esta área
                                </p>
                            )}
                        </div>

                        {/* STEP 2: Student Name with Autocomplete */}
                        <div className="space-y-2 relative">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${formData.grade ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'}`}>2</span>
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
                                    className={`w-full px-4 py-3 rounded-xl border focus:ring-0 outline-none text-sm font-medium transition-all placeholder:text-gray-400 ${formData.grade
                                        ? 'border-gray-200 focus:border-blue-300 bg-gray-50 text-gray-800'
                                        : 'border-gray-100 bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                />
                                {selectedStudentId && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </span>
                                )}
                            </div>

                            {/* Suggestions dropdown */}
                            {showSuggestions && filteredStudents.length > 0 && (
                                <div
                                    ref={suggestionsRef}
                                    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                                >
                                    {filteredStudents.map((student) => (
                                        <button
                                            key={student.id}
                                            type="button"
                                            onClick={() => handleSelectStudent(student)}
                                            className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                                                {(student.nombres || '?')[0]?.toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">
                                                    {student.nombres} {student.apellidos}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    RUT: {student.rut || 'N/A'}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Helper text */}
                            {formData.grade && (
                                <p className="text-xs text-gray-400">
                                    Escribe al menos 2 caracteres para buscar entre los {studentsInGrade.length} trabajadores del área.
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${selectedStudentId && formData.gender ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'}`}>3</span>
                                Género del Trabajador
                                <span className="text-xs font-normal text-gray-400 normal-case">(automático)</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.gender || ''}
                                    disabled
                                    placeholder={selectedStudentId ? 'No registrado' : 'Se completará al seleccionar trabajador'}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-sm font-medium text-gray-600 cursor-not-allowed"
                                />
                                {selectedStudentId && formData.gender && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-400">
                                Este dato se obtiene automáticamente del registro del trabajador.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${formData.gender ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'}`}>4</span>
                                Nombre Entrevistador
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="interviewer"
                                value={formData.interviewer}
                                onChange={handleInputChange}
                                placeholder="Ej. Juan Pérez"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-0 outline-none bg-gray-50 text-sm font-medium text-gray-800 transition-all placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100 bg-white">
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={isLoading || !formData.studentName || !formData.interviewer}
                                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

