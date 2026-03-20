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

  // Todos los roles pueden editar
  const canEdit = true;
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
    <div className={`flex-1 flex flex-col    transition-all duration-300 overflow-hidden`}>
 
      <div className="flex-1 overflow-y-auto custom-scrollbar  ">
        <div className="mx-auto space-y-3 sm:space-y-4">
          {isLoading || !student ? (
            <StudentDetailPageSkeleton />
          ) : (
            <>
        

              {/* Información Personal */}
              <PersonalInfoCard student={student} onUpdateStudent={handleUpdateStudent} canEdit={true} />

              {/* Tabs Container - Estilo CaseDetailTabs */}
              <div className="flex flex-col rounded-3xl border border-[#1A71B8]/30 bg-[#0A3866]/30 backdrop-blur-3xl overflow-hidden">
                <StudentTabs activeTab={activeTab} setActiveTab={setActiveTab} canViewConvivencia={canEdit} />
                <div className="bg-white/5 rounded-b-3xl relative z-10 backdrop-blur-md min-h-[55vh]">
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
