import { useState, useEffect, useRef } from 'react';
import InvolvedForm from './InvolvedForm';
import InvolvedTable from './InvolvedTable';
import EmptyInvolvedState from './EmptyInvolvedState';
import { Users, Plus, Loader2 } from 'lucide-react';
import { casesService, studentsService } from '../../../services/api';

function CaseInvolved({ caseData, onUpdateCase, isLoading = false }) {
  // Ensure every person has a stable unique id (may be missing for Firestore-loaded data)
  const normalizeInvolved = (list) =>
    (list || []).map((p, i) => p.id != null ? p : { ...p, id: `person-${i}-${Date.now()}` });

  const [involved, setInvolved] = useState(() => normalizeInvolved(caseData.involved));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const formPopupRef = useRef(null);
  const buttonRef = useRef(null);
  const suggestRanRef = useRef(false);

  // Enriquecer involucrados con cargo/antigüedad desde la base de trabajadores
  useEffect(() => {
    const enrich = async () => {
      const raw = caseData.involved || [];
      if (raw.length === 0) return;
      // Si todos ya tienen ambos campos, no es necesario enriquecer
      if (raw.every(p => p.cargo && p.antiguedad)) {
        setInvolved(raw);
        return;
      }
      try {
        const userStr = localStorage.getItem('usuario');
        const user = userStr ? JSON.parse(userStr) : null;
        const colegioId = user?.colegios?.[0]?.id || user?.colegios?.[0] || null;
        const idToUse = typeof colegioId === 'object' ? colegioId?.id : colegioId;
        if (!idToUse) { setInvolved(raw); return; }

        const workers = await studentsService.getStudents(idToUse) || [];

        const enriched = raw.map((person, i) => {
          if (person.id == null) person = { ...person, id: `person-${i}-${Date.now()}` };
          // Si ya tiene cargo Y antigüedad, no sobreescribir
          if (person.cargo && person.antiguedad) return person;

          // Buscar trabajador: 1) por studentId, 2) nombre exacto, 3) nombre parcial
          let worker = null;
          if (person.studentId) {
            worker = workers.find(w => w.id === person.studentId);
          }
          if (!worker && person.name) {
            const nameLower = person.name.toLowerCase().trim();
            const nameParts = nameLower.split(/\s+/);

            // Exacto
            worker = workers.find(w => {
              const full = `${w.nombres || ''} ${w.apellidos || ''}`.toLowerCase().trim();
              return full === nameLower;
            });

            // Parcial: todos los tokens del nombre buscado aparecen en el nombre completo del trabajador
            if (!worker) {
              worker = workers.find(w => {
                const full = `${w.nombres || ''} ${w.apellidos || ''}`.toLowerCase();
                return nameParts.every(part => full.includes(part));
              });
            }
          }
          if (!worker) return person;

          let antiguedad = person.antiguedad || '';
          if (!antiguedad && worker.fecha_ingreso) {
            // fecha_ingreso está en formato YYYY-MM-DD; parsear con hora fija para evitar offset UTC
            const parts = worker.fecha_ingreso.split('T')[0].split('-');
            const ingreso = parts.length === 3
              ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
              : new Date(worker.fecha_ingreso);
            if (!isNaN(ingreso.getTime())) {
              const years = Math.floor((Date.now() - ingreso.getTime()) / (1000 * 60 * 60 * 24 * 365));
              antiguedad = years > 0 ? `${years} año${years !== 1 ? 's' : ''}` : 'Menos de 1 año';
            }
          }

          return {
            ...person,
            cargo: person.cargo || worker.cargo || '',
            antiguedad,
            rut: person.rut || worker.rut || '',
            grade: person.grade || worker.curso || '',
          };
        });

        setInvolved(enriched);
      } catch (e) {
        setInvolved(raw);
      }
    };
    enrich();
  }, [caseData.involved]);

  // Auto-cargar involucrados si la lista está vacía
  useEffect(() => {
    if (suggestRanRef.current) return;
    if (!caseData.id) return;
    if ((caseData.involved || []).length > 0) return;

    suggestRanRef.current = true;
    const autoSuggest = async () => {
      setIsSuggesting(true);
      try {
        const suggestions = await casesService.suggestInvolved(caseData.id);
        if (suggestions.length > 0) {
          // Asignar IDs únicos basados en timestamp
          const withIds = suggestions.map((p, i) => ({ ...p, id: Date.now() + i }));
          setInvolved(withIds);
          onUpdateCase({ ...caseData, involved: withIds }, true);
        }
      } catch (e) {
        // Fallo silencioso — el usuario puede agregar manualmente
      } finally {
        setIsSuggesting(false);
      }
    };
    autoSuggest();
  }, [caseData.id]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isFormOpen &&
        formPopupRef.current &&
        !formPopupRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsFormOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFormOpen]);

  const handleAddParticipant = ({ name, grade, rut, gender, role, cargo, antiguedad, studentId }) => {
    const participant = {
      id: Date.now(),
      name,
      grade,
      rut,
      gender,
      role,
      cargo,
      antiguedad,
      studentId // Reference to the student in the system
    };

    const updatedInvolved = [...involved, participant];
    setInvolved(updatedInvolved);
    onUpdateCase({ ...caseData, involved: updatedInvolved }, true);
    setIsFormOpen(false);
  };

  const handleRemoveParticipants = (participantIds) => {
    const updatedInvolved = involved.filter(p => !participantIds.includes(p.id));
    setInvolved(updatedInvolved);
    onUpdateCase({ ...caseData, involved: updatedInvolved }, true);
  };

  const handleUpdateParticipant = (personId, updatedFields) => {
    const updatedInvolved = involved.map(person =>
      person.id === personId ? { ...person, ...updatedFields } : person
    );
    setInvolved(updatedInvolved);
    onUpdateCase({ ...caseData, involved: updatedInvolved }, true);
  };

  const toggleForm = () => {
    setIsFormOpen(!isFormOpen);
  };

  if (isLoading) {
    return null;
  }

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }} className="h-full flex flex-col text-white">
      <div className="h-full flex flex-col">
        {/* Header con estilo consistente */}
        <div className="p-3 sm:p-4 border-b border-[#1A71B8]/30 flex items-center justify-between flex-shrink-0 gap-2" data-tour="involucrados-header">
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Users size={18} className="text-[#34B6D8] drop-shadow-[0_0_8px_rgba(52,182,216,0.6)] flex-shrink-0 sm:w-5 sm:h-5" />
              <span className="truncate">Personas Involucradas</span>
              {involved.length > 0 && (
                <span className="text-xs sm:text-sm text-white/50 font-normal">({involved.length})</span>
              )}
            </h3>
            <p className="text-xs sm:text-sm text-white/50 mt-0.5 truncate">
              <span className="hidden sm:inline">Trabajadores y personas relacionadas al caso</span>
              <span className="sm:hidden">Relacionados al caso</span>
            </p>
          </div>
          {/* Container relativo para el botón y el popup */}
          <div className="relative flex-shrink-0" data-tour="involucrados-add-btn">
            <button
              ref={buttonRef}
              onClick={toggleForm}
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm ${isFormOpen
                  ? 'text-white/70 bg-white/10 hover:bg-white/20 hover:text-white backdrop-blur-sm border border-white/10'
                  : 'text-white bg-gradient-to-r from-[#1A71B8] to-[#34B6D8] hover:from-[#34B6D8] hover:to-[#1A71B8] shadow-[0_4px_16px_rgba(26,113,184,0.4)]'
                }`}
            >
              <Plus size={14} className={isFormOpen ? 'rotate-45 transition-transform' : 'transition-transform'} />
              <span className="hidden sm:inline">{isFormOpen ? 'Cerrar' : 'Agregar'}</span>
            </button>

            {/* Popup del formulario */}
            {isFormOpen && (
              <div
                ref={formPopupRef}
                className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-[#0A3866]/95 border border-[#1A71B8]/40 shadow-[0_8px_32px_rgba(0,0,0,0.6)] rounded-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-3xl"
              >
                {/* Flecha del popup */}
                <div className="absolute -top-2 right-4 w-4 h-4 bg-[#0A3866] border-l border-t border-[#1A71B8]/40 transform rotate-45"></div>

                <div className="p-4 relative z-10">
                  <h4 className="text-[10px] font-bold text-[#34B6D8] mb-4 flex items-center gap-2 uppercase tracking-widest">
                    <Users size={16} />
                    Agregar Involucrado
                  </h4>
                  <InvolvedForm
                    onAddParticipant={handleAddParticipant}
                    onCancel={() => setIsFormOpen(false)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contenido - ya no muestra el formulario aquí */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar" data-tour="involucrados-content">
          {isSuggesting ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-white/50">
              <Loader2 size={24} className="animate-spin text-[#34B6D8]" />
              <p className="text-sm">Detectando personas involucradas...</p>
            </div>
          ) : involved.length > 0 ? (
            <InvolvedTable
              involved={involved}
              onRemoveParticipants={handleRemoveParticipants}
              onUpdateParticipant={handleUpdateParticipant}
            />
          ) : (
            <EmptyInvolvedState />
          )}
        </div>
      </div>
    </div>
  );
}

export default CaseInvolved;
