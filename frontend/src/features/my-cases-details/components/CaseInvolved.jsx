import { useState, useEffect, useRef } from 'react';
import InvolvedForm from './InvolvedForm';
import InvolvedTable from './InvolvedTable';
import EmptyInvolvedState from './EmptyInvolvedState';
import { Users, Plus } from 'lucide-react';

function CaseInvolved({ caseData, onUpdateCase, isLoading = false }) {
  const [involved, setInvolved] = useState(caseData.involved || []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const formPopupRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    setInvolved(caseData.involved || []);
  }, [caseData.involved]);

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

  const handleAddParticipant = ({ name, grade, rut, gender, role, studentId }) => {
    const participant = {
      id: Date.now(),
      name,
      grade,
      rut,
      gender,
      role,
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
    <div style={{ fontFamily: "'Poppins', sans-serif" }} className="h-full flex flex-col">
      <div className="bg-white h-full flex flex-col">
        {/* Header con estilo consistente */}
        <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Users size={18} className="text-blue-600 flex-shrink-0 sm:w-5 sm:h-5" />
              <span className="truncate">Personas Involucradas</span>
              {involved.length > 0 && (
                <span className="text-xs sm:text-sm text-gray-500 font-normal">({involved.length})</span>
              )}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
              <span className="hidden sm:inline">Trabajadores y personas relacionadas al caso</span>
              <span className="sm:hidden">Relacionados al caso</span>
            </p>
          </div>
          {/* Container relativo para el botón y el popup */}
          <div className="relative flex-shrink-0">
            <button
              ref={buttonRef}
              onClick={toggleForm}
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shadow-sm ${isFormOpen
                  ? 'text-gray-600 bg-gray-200 hover:bg-gray-300'
                  : 'text-white bg-blue-600 hover:bg-blue-700'
                }`}
            >
              <Plus size={14} className={isFormOpen ? 'rotate-45 transition-transform' : 'transition-transform'} />
              <span className="hidden sm:inline">{isFormOpen ? 'Cerrar' : 'Agregar'}</span>
            </button>

            {/* Popup del formulario */}
            {isFormOpen && (
              <div
                ref={formPopupRef}
                className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-gray-200 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                {/* Flecha del popup */}
                <div className="absolute -top-2 right-4 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>

                <div className="p-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Users size={16} className="text-blue-600" />
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
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar">
          {involved.length > 0 ? (
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
