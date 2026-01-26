import { useState, useMemo } from 'react';

export function useStudentFilters(students) {
  const [filters, setFilters] = useState({
    searchTerm: '',
    sortBy: 'name_asc',
    characteristic: 'all',
    curso: 'all'
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredStudents = useMemo(() => {
    let result = [...students];

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      result = result.filter(student =>
        student.nombres.toLowerCase().includes(searchLower) ||
        student.apellidos.toLowerCase().includes(searchLower) ||
        student.rut.toLowerCase().includes(searchLower) ||
        (student.email && student.email.toLowerCase().includes(searchLower))
      );
    }

    if (filters.characteristic !== 'all') {
      result = result.filter(student => student[filters.characteristic] === true);
    }

    if (filters.curso !== 'all') {
      result = result.filter(student => student.curso === filters.curso);
    }

    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name_asc': return `${a.nombres} ${a.apellidos}`.localeCompare(`${b.nombres} ${b.apellidos}`);
        case 'name_desc': return `${b.nombres} ${b.apellidos}`.localeCompare(`${a.nombres} ${a.apellidos}`);
        case 'recent': return new Date(b.fechaRegistro) - new Date(a.fechaRegistro);
        case 'oldest': return new Date(a.fechaRegistro) - new Date(b.fechaRegistro);
        default: return 0;
      }
    });

    return result;
  }, [students, filters]);

  const handleClearFilters = () => {
    setFilters({ searchTerm: '', sortBy: 'name_asc', characteristic: 'all', curso: 'all' });
  };

  const isFiltered = filters.searchTerm || filters.characteristic !== 'all' || filters.curso !== 'all';

  return {
    filteredStudents,
    filters,
    handleFilterChange,
    handleClearFilters,
    isFiltered
  };
}
