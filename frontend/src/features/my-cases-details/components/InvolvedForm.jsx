import { useState, useEffect, useRef, useMemo } from 'react';
import { studentsService } from '../../../services/api';
import { GRADE_OPTIONS } from '../constants/gradeOptions';

const ROLE_OPTIONS = [
  { value: 'afectado', label: 'Afectado/Víctima' },
  { value: 'agresor', label: 'Agresor' },
  { value: 'testigo', label: 'Testigo' },
  { value: 'apoderado', label: 'Apoderado' },
  { value: 'otro', label: 'Otro' }
];

function InvolvedForm({ onAddParticipant, onCancel }) {
  const [formData, setFormData] = useState({
    grade: '',
    studentName: '',
    rut: '',
    gender: '',
    role: ''
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
    fetchStudents();
  }, []);

  // Get students filtered by selected grade
  const studentsInGrade = useMemo(() => {
    if (!formData.grade) return [];
    return students.filter(student => student.curso === formData.grade);
  }, [formData.grade, students]);

  // Filter students based on input AND grade
  const filteredStudents = useMemo(() => {
    if (!formData.grade) return [];

    if (!formData.studentName || formData.studentName.length === 0) {
      return studentsInGrade.slice(0, 10);
    }

    const searchTerm = formData.studentName.toLowerCase();
    return studentsInGrade.filter(student => {
      const fullName = `${student.nombres || ''} ${student.apellidos || ''}`.toLowerCase();
      return fullName.includes(searchTerm);
    }).slice(0, 10);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'studentName') {
      setSelectedStudentId(null);
      setShowSuggestions(true);
    }
  };

  const handleSelectStudent = (student) => {
    const fullName = `${student.nombres || ''} ${student.apellidos || ''}`.trim();
    setFormData(prev => ({
      ...prev,
      studentName: fullName,
      rut: student.rut || '',
      gender: student.genero || ''
    }));
    setSelectedStudentId(student.id);
    setShowSuggestions(false);
  };

  const handleGradeChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      grade: value,
      studentName: '',
      rut: '',
      gender: ''
    }));
    setSelectedStudentId(null);
    setShowSuggestions(false);
  };

  const handleSubmit = () => {
    if (!formData.studentName || !formData.role) return;

    onAddParticipant({
      name: formData.studentName,
      grade: formData.grade,
      rut: formData.rut,
      gender: formData.gender,
      role: formData.role,
      studentId: selectedStudentId
    });

    setFormData({ grade: '', studentName: '', rut: '', gender: '', role: '' });
    setSelectedStudentId(null);
  };

  const isFormValid = formData.studentName && formData.role;

  return (
    <div className="p-3 rounded-lg space-y-4 animate-fade-in">
      {/* Step 1: Curso */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">1</span>
          Área de trabajo
        </label>
        <select
          name="grade"
          value={formData.grade}
          onChange={handleGradeChange}
          autoFocus
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
        >
          <option value="">Seleccione un área de trabajo...</option>
          {GRADE_OPTIONS.map((grade) => (
            <option key={grade} value={grade}>{grade}</option>
          ))}
        </select>
        {formData.grade && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {studentsInGrade.length} estudiantes en esta área de trabajo
          </p>
        )}
      </div>

      {/* Step 2: Estudiante con autocomplete */}
      <div className="space-y-1.5 relative">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${formData.grade ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'}`}>2</span>
          Estudiante
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            name="studentName"
            value={formData.studentName}
            onChange={handleInputChange}
            onFocus={() => formData.grade && setShowSuggestions(true)}
            placeholder={formData.grade ? "Click o escribe para buscar..." : "Primero selecciona un área de trabajo"}
            disabled={!formData.grade}
            autoComplete="off"
            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all ${formData.grade
              ? 'border-gray-200 bg-white text-gray-800'
              : 'border-gray-100 bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
          />
          {selectedStudentId && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && filteredStudents.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          >
            {filteredStudents.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => handleSelectStudent(student)}
                className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {(student.nombres || '?')[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {student.nombres} {student.apellidos}
                  </p>
                  <p className="text-xs text-gray-500">RUT: {student.rut || 'N/A'}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Auto-filled info */}
        {selectedStudentId && formData.rut && (
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
            <span>RUT: {formData.rut}</span>
            {formData.gender && <span>• {formData.gender}</span>}
          </div>
        )}
      </div>

      {/* Step 3: Rol */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${selectedStudentId ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'}`}>3</span>
          Rol en el Caso
        </label>
        <select
          name="role"
          value={formData.role}
          onChange={handleInputChange}
          disabled={!selectedStudentId}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${selectedStudentId
            ? 'border-gray-200 bg-white text-gray-800'
            : 'border-gray-100 bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
        >
          <option value="">Seleccione un rol...</option>
          {ROLE_OPTIONS.map((role) => (
            <option key={role.value} value={role.value}>{role.label}</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isFormValid}
          className="flex-1 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Agregar involucrado
        </button>
      </div>
    </div>
  );
}

export default InvolvedForm;
