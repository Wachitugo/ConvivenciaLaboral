import { useState } from 'react';
import { saveStudentsToLocalStorage } from '../utils';

export function useStudentActions(initialStudents = []) {
  const [students, setStudents] = useState(initialStudents);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteSelected = async (selectedIds) => {
    setIsDeleting(true);
    try {
      const remainingStudents = students.filter(s => !selectedIds.has(s.id));
      saveStudentsToLocalStorage(remainingStudents);
      setStudents(remainingStudents);
      return { success: true, remainingStudents };
    } catch (error) {
      console.error('Error deleting students:', error);
      return { success: false, error };
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    students,
    setStudents,
    handleDeleteSelected,
    isDeleting
  };
}
