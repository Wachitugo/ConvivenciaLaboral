import { useState } from 'react';

export function useStudentSelection() {
  const [selectedIds, setSelectedIds] = useState(new Set());

  const handleToggleSelectAll = (checked, filteredStudents) => {
    if (checked) {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  return {
    selectedIds,
    handleToggleSelectAll,
    handleToggleSelect,
    clearSelection
  };
}
