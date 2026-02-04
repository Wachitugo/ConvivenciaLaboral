import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { getStudentsFromLocalStorage } from '../features/student-file';
import { studentsService } from '../services/api';
import Breadcrumb from '../components/Breadcrumb';
import {
  StudentDetailHeader,
  PersonalInfoCard,
  StudentTabs,
  ConvivenciaTab,
  CompromisosTab,
  SaludFamiliaTab,
  BitacoraTab,
  StudentDetailPageSkeleton
} from '../features/student-file-details';

function StudentDetailPage() {
  const { id, schoolSlug } = useParams();
  const navigate = useNavigate();
  const { current } = useTheme();
  const { isSidebarOpen, toggleSidebar } = useOutletContext();
  const [student, setStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('salud');

  // Determinar si el usuario puede editar (todos menos Trabajador)
  const canEdit = useMemo(() => {
    try {
      const userStr = localStorage.getItem('usuario');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.rol !== 'Trabajador';
      }
    } catch (error) {
      console.error('Error reading user role:', error);
    }
    return true; // Por defecto permitir edición si no se puede leer el rol
  }, []);

  // Los Trabajadores SÍ pueden agregar a la bitácora
  const canEditBitacora = true;


  useEffect(() => {
    const fetchStudent = async () => {
      setIsLoading(true);
      try {
        // Since we don't have a direct getById endpoint yet, we might need to fetch all and find, 
        // OR better, implement getById in backend/frontend.
        // For quick fix: fetch all from colegio (if we have colegioId context).
        // BUT wait, we don't have the colegioId easily accessible here without user context.

        const userStr = localStorage.getItem('usuario');
        if (userStr) {
          const user = JSON.parse(userStr);
          const colegioId = user.colegios?.[0]?.id || user.colegios?.[0];

          if (colegioId) {
            const idToUse = typeof colegioId === 'object' ? colegioId.id : colegioId;
            const students = await studentsService.getStudents(idToUse);
            const foundStudent = students.find(s => s.id.toString() === id);

            if (foundStudent) {
              setStudent(foundStudent);
            } else {
              console.error("Student not found in school list");
              const basePath = schoolSlug ? `/${schoolSlug}` : '';
              navigate(`${basePath}/ficha-alumnos`);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching student detail:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudent();
  }, [id, navigate]);

  const handleUpdateStudent = async (updatedStudentData) => {
    try {
      // Optimistic update
      setStudent(updatedStudentData);

      if (updatedStudentData.id) {
        const updated = await studentsService.updateStudent(updatedStudentData.id, updatedStudentData);
        setStudent(updated);
      }
    } catch (error) {
      console.error("Error updating student:", error);
      // TODO: Add toast notification
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'bitacora':
        return <BitacoraTab student={student} canEdit={canEditBitacora} />;
      case 'convivencia':
        return <ConvivenciaTab student={student} canEdit={canEdit} />;
      case 'compromisos':
        return <CompromisosTab student={student} canEdit={canEdit} />;
      case 'salud':
      default:
        return <SaludFamiliaTab student={student} onUpdateStudent={canEdit ? handleUpdateStudent : undefined} canEdit={canEdit} />;
    }
  };

  // Nombre completo del trabajador para el breadcrumb
  const studentName = student ? `${student.nombres} ${student.apellidos}` : '';

  return (
    <div className={`flex-1 flex flex-col rounded-lg shadow-sm shadow-cyan-600/20 ${current.cardBg} border border-gray-300 transition-all duration-300 overflow-hidden`}>
      <StudentDetailHeader
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        textPrimary={current.textPrimary}
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 pl-4 sm:pl-4">
        <div className="mx-auto space-y-3 sm:space-y-4">
          {isLoading || !student ? (
            <StudentDetailPageSkeleton />
          ) : (
            <>
              {/* Breadcrumb */}
              <Breadcrumb caseName={studentName} />

              {/* Información Personal */}
              <PersonalInfoCard student={student} onUpdateStudent={handleUpdateStudent} canEdit={true} />

              {/* Tabs Container */}
              <div className="bg-white rounded-xl border-2 border-gray-300 shadow-md overflow-hidden">
                <StudentTabs activeTab={activeTab} setActiveTab={setActiveTab} canViewConvivencia={canEdit} />
                <div>
                  {renderTabContent()}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDetailPage;
