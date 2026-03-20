import { useState, useEffect, useRef, useMemo } from 'react';
import { studentsService } from '../../../services/api';
import { GRADE_OPTIONS } from '../constants/gradeOptions';

const ROLE_OPTIONS = [
  { value: 'afectado', label: 'Denunciante' },
  { value: 'agresor', label: 'Denunciado' },
  { value: 'testigo', label: 'Testigo' },
  { value: 'otro', label: 'Otro' }
];

function InvolvedForm({ onAddParticipant, onCancel }) {
  const [formData, setFormData] = useState({
    grade: '',
    studentName: '',
    rut: '',
    gender: '',
    role: '',
    cargo: '',
    antiguedad: ''
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

    let antiguedad = '';
    if (student.fecha_ingreso) {
      const ingreso = new Date(student.fecha_ingreso);
      const now = new Date();
      const years = Math.floor((now - ingreso) / (1000 * 60 * 60 * 24 * 365));
      antiguedad = years > 0 ? `${years} año${years !== 1 ? 's' : ''}` : 'Menos de 1 año';
    }

    setFormData(prev => ({
      ...prev,
      studentName: fullName,
      rut: student.rut || '',
      gender: student.genero || '',
      cargo: student.cargo || '',
      antiguedad
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
      cargo: formData.cargo,
      antiguedad: formData.antiguedad,
      studentId: selectedStudentId
    });

    setFormData({ grade: '', studentName: '', rut: '', gender: '', role: '', cargo: '', antiguedad: '' });
    setSelectedStudentId(null);
  };

  const isFormValid = formData.studentName && formData.role;

  return (
    <div className="p-3 space-y-4 animate-fade-in text-white">
      {/* Step 1: Curso */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[#1A71B8] text-white shadow-[0_0_8px_rgba(26,113,184,0.6)] text-xs flex items-center justify-center">1</span>
          Área de trabajo
        </label>
        <select
          name="grade"
          value={formData.grade}
          onChange={handleGradeChange}
          autoFocus
          className="w-full px-3 py-2 border border-white/20 bg-white/5 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#34B6D8] focus:border-[#34B6D8] focus:bg-[#0A3866]/80 text-sm transition-all"
        >
          <option value="" className="text-gray-400">Seleccione un área de trabajo...</option>
          {GRADE_OPTIONS.map((grade) => (
            <option key={grade} value={grade} className="text-gray-800">{grade}</option>
          ))}
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

      {/* Step 2: Estudiante con autocomplete */}
      <div className="space-y-1.5 relative">
        <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${formData.grade ? 'bg-[#1A71B8] text-white shadow-[0_0_8px_rgba(26,113,184,0.6)]' : 'bg-white/5 text-white/30'}`}>2</span>
          Trabajador
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            name="studentName"
            value={formData.studentName}
            onChange={handleInputChange}
            onFocus={() => formData.grade && setShowSuggestions(true)}
            placeholder={formData.grade ? "Click o escribe para buscar..." : "Primero selecciona un área"}
            disabled={!formData.grade}
            autoComplete="off"
            className={`w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-[#34B6D8] focus:border-[#34B6D8] outline-none text-sm transition-all ${formData.grade
              ? 'border-white/20 bg-white/5 text-white placeholder-white/40 focus:bg-[#0A3866]/80'
              : 'border-transparent bg-white/5 text-white/30 cursor-not-allowed placeholder-white/20'
              }`}
          />
          {selectedStudentId && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#34B6D8]">
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
            className="absolute z-50 w-full mt-1 bg-[#0A3866]/95 border border-[#1A71B8]/40 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] max-h-48 overflow-y-auto backdrop-blur-3xl"
          >
            {filteredStudents.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => handleSelectStudent(student)}
                className="w-full px-3 py-2 text-left hover:bg-white/10 transition-colors border-b border-white/10 last:border-b-0 flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-full bg-[#1A71B8]/30 border border-[#34B6D8]/30 text-[#34B6D8] flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {(student.nombres || '?')[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {student.nombres} {student.apellidos}
                  </p>
                  <p className="text-[10px] text-white/50 font-mono tracking-wider">RUT: {student.rut || 'N/A'}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Auto-filled info */}
        {selectedStudentId && formData.rut && (
          <div className="flex items-center gap-3 text-[10px] text-[#34B6D8] mt-1 font-mono tracking-wider">
            <span>RUT: {formData.rut}</span>
            {formData.gender && <span>• {formData.gender}</span>}
          </div>
        )}
      </div>

      {/* Step 3: Cargo y Antigüedad */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${selectedStudentId ? 'bg-[#1A71B8] text-white shadow-[0_0_8px_rgba(26,113,184,0.6)]' : 'bg-white/5 text-white/30'}`}>3</span>
            Cargo
          </label>
          <input
            type="text"
            name="cargo"
            value={formData.cargo}
            onChange={handleInputChange}
            disabled={!selectedStudentId}
            placeholder="Ej: Supervisor"
            className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#34B6D8] focus:border-[#34B6D8] text-sm transition-all ${selectedStudentId
              ? 'border-white/20 bg-white/5 text-white placeholder-white/40 focus:bg-[#0A3866]/80'
              : 'border-transparent bg-white/5 text-white/30 cursor-not-allowed placeholder-white/20'
              }`}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${selectedStudentId ? 'bg-[#1A71B8] text-white shadow-[0_0_8px_rgba(26,113,184,0.6)]' : 'bg-white/5 text-white/30'}`}>4</span>
            Antigüedad
          </label>
          <input
            type="text"
            name="antiguedad"
            value={formData.antiguedad}
            onChange={handleInputChange}
            disabled={!selectedStudentId}
            placeholder="Ej: 3 años"
            className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#34B6D8] focus:border-[#34B6D8] text-sm transition-all ${selectedStudentId
              ? 'border-white/20 bg-white/5 text-white placeholder-white/40 focus:bg-[#0A3866]/80'
              : 'border-transparent bg-white/5 text-white/30 cursor-not-allowed placeholder-white/20'
              }`}
          />
        </div>
      </div>

      {/* Step 5: Rol */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${selectedStudentId ? 'bg-[#1A71B8] text-white shadow-[0_0_8px_rgba(26,113,184,0.6)]' : 'bg-white/5 text-white/30'}`}>5</span>
          Rol en el Caso
        </label>
        <select
          name="role"
          value={formData.role}
          onChange={handleInputChange}
          disabled={!selectedStudentId}
          className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#34B6D8] focus:border-[#34B6D8] text-sm transition-all ${selectedStudentId
            ? 'border-white/20 bg-[#0A3866]/80 text-white'
            : 'border-transparent bg-white/5 text-white/30 cursor-not-allowed'
            }`}
        >
          <option value="" className="text-gray-400">Seleccione un rol...</option>
          {ROLE_OPTIONS.map((role) => (
            <option key={role.value} value={role.value} className="text-gray-800">{role.label}</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-red-400 bg-transparent hover:bg-red-400/10 border border-transparent hover:border-red-400/30 rounded-lg font-bold transition-colors text-sm"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isFormValid}
          className="flex-1 px-4 py-1.5 bg-gradient-to-r from-[#1A71B8] to-[#34B6D8] hover:from-[#34B6D8] hover:to-[#1A71B8] text-white shadow-[0_4px_16px_rgba(26,113,184,0.4)] rounded-lg transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Agregar involucrado
        </button>
      </div>
    </div>
  );
}

export default InvolvedForm;
