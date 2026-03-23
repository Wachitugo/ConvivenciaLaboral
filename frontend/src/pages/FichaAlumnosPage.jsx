import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import {
  StudentHeader,
  StudentToolbar,
  StudentCards,
  StudentEmptyState,
  FichaAlumnosPageSkeleton
} from '../features/student-file';
import {
  useStudentFilters
} from '../features/student-file';
import { studentsService } from '../services/api';
import CreateStudentModal from '../features/student-file-details/components/CreateStudentModal';
import ColaboradoresTour from '../features/student-file/components/ColaboradoresTour';

function FichaAlumnosPage() {
  const { current } = useTheme();
  const { isSidebarOpen, toggleSidebar } = useOutletContext();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const { filteredStudents, filters, handleFilterChange, handleClearFilters, isFiltered } = useStudentFilters(students);

  const userRol = (() => {
    try { return JSON.parse(localStorage.getItem('usuario'))?.rol || ''; }
    catch { return ''; }
  })();

  const canCreateStudent = [
    'Gerente Relaciones Laborales',
    'Encargado de Relaciones Laborales',
    'Investigador'
  ].includes(userRol);

  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const userStr = localStorage.getItem('usuario');
        console.log("FichaAlumnosPage: User from localStorage (usuario):", userStr);

        if (userStr) {
          const user = JSON.parse(userStr);
          const colegioId = user.colegios?.[0]?.id || user.colegios?.[0] || null;
          console.log("FichaAlumnosPage: Detected colegioId:", colegioId);

          if (colegioId) {
            // Check if colegioId is an object or string, API expects ID string.
            // Assuming structure is like {id: '...'} or just '...'.
            const idToUse = typeof colegioId === 'object' ? colegioId.id : colegioId;
            console.log("FichaAlumnosPage: Fetching students for ID:", idToUse);

            const data = await studentsService.getStudents(idToUse);
            console.log("FichaAlumnosPage: Students fetched:", data);
            setStudents(data);
          } else {
            console.warn("FichaAlumnosPage: No colegioId found for user");
          }
        } else {
          console.warn("FichaAlumnosPage: No user found in localStorage");
        }
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const handleCreateStudent = async (studentData) => {
    try {
      setIsSaving(true);
      const userStr = localStorage.getItem('usuario');
      const user = JSON.parse(userStr);
      const colegioId = typeof user.colegios?.[0] === 'object' ? user.colegios[0].id : user.colegios?.[0];

      await studentsService.createStudent({ ...studentData, colegio_id: colegioId });

      // Recargar lista
      const data = await studentsService.getStudents(colegioId);
      setStudents(data);
      setShowCreateModal(false);
      setSuccessMessage(`${studentData.nombres} ${studentData.apellidos} fue agregado correctamente.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      console.error('Error creating student:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <FichaAlumnosPageSkeleton />;
  }

  return (
    <div className={`flex-1 flex flex-col bg-[#0A3866]/20 backdrop-blur-3xl border border-[#1A71B8]/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] rounded-[32px] overflow-hidden transition-all duration-300`}>
      <StudentToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        totalStudents={students.length}
        filteredCount={filteredStudents.length}
        onCreateStudent={canCreateStudent ? () => setShowCreateModal(true) : null}
      />
      <div className="flex-1 px-4  pb-4 sm:pb-6 overflow-y-auto">
        {filteredStudents.length === 0 && students.length === 0 ? (
          <StudentEmptyState type="empty" />
        ) : filteredStudents.length === 0 ? (
          <StudentEmptyState type="no-results" onClearFilters={handleClearFilters} />
        ) : (
          <StudentCards students={filteredStudents} />
        )}
      </div>
      {/* Toast de éxito */}
      {successMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-down">
          <div className="bg-white border border-green-100 rounded-2xl shadow-xl px-5 py-4 flex items-center gap-3 min-w-[320px]">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Colaborador creado</p>
              <p className="text-xs text-gray-500">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      <CreateStudentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateStudent}
        isSaving={isSaving}
        schoolId={(() => {
          try {
            const u = JSON.parse(localStorage.getItem('usuario'));
            const id = u?.colegios?.[0];
            return typeof id === 'object' ? id?.id : id;
          } catch { return null; }
        })()}
      />
      <ColaboradoresTour />
    </div>
  );
}

export default FichaAlumnosPage;
