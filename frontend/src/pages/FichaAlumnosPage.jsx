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

function FichaAlumnosPage() {
  const { current } = useTheme();
  const { isSidebarOpen, toggleSidebar } = useOutletContext();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { filteredStudents, filters, handleFilterChange, handleClearFilters, isFiltered } = useStudentFilters(students);

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

  if (isLoading) {
    return <FichaAlumnosPageSkeleton />;
  }

  return (
    <div className={`flex-1 flex flex-col rounded-lg shadow-sm shadow-cyan-600/20 ${current.cardBg} border border-gray-300 transition-all duration-300 overflow-hidden`}>
      <StudentHeader isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} textPrimary={current.textPrimary} />
      <StudentToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        totalStudents={students.length}
        filteredCount={filteredStudents.length}
      />
      <div className="flex-1 px-3 sm:px-6 pb-4 sm:pb-6 overflow-y-auto">
        {filteredStudents.length === 0 && students.length === 0 ? (
          <StudentEmptyState type="empty" />
        ) : filteredStudents.length === 0 ? (
          <StudentEmptyState type="no-results" onClearFilters={handleClearFilters} />
        ) : (
          <StudentCards students={filteredStudents} />
        )}
      </div>
    </div>
  );
}

export default FichaAlumnosPage;
