import React, { useState } from 'react';
import FilterDropdown from '../my-cases/FilterDropdown'; // Reusing components from my-cases if permissible, or better copy/adapt.
import Breadcrumb from '../../components/Breadcrumb';
// Note: reusing FilterDropdown might require it to be exported or accessible. 
// Assuming FilterDropdown is in ../my-cases/FilterDropdown and accessible.
// If FilterDropdown is generic, it should be in `components/common` but for now we'll import relative or recreate.
// Let's check imports in CasesToolbar: import FilterDropdown from './FilterDropdown';
// So it is in features/my-cases. I will import it from there.

function InterviewToolbar({
    filters,
    onFilterChange,
    onOpenModal,
    viewMode,
    setViewMode,
    availableMonths = [],
    availableYears = []
}) {
    const [showMoreFilters, setShowMoreFilters] = useState(false);

    const monthOptions = [
        { value: 'all', label: 'Mes' },
        ...availableMonths
    ];

    const yearOptions = [
        { value: 'all', label: 'Año' },
        ...availableYears
    ];

    const sortOptions = [
        { value: 'date_desc', label: 'Más recientes' },
        { value: 'date_asc', label: 'Más antiguos' },
        { value: 'name_asc', label: 'Nombre (A-Z)' },
        { value: 'name_desc', label: 'Nombre (Z-A)' },
    ];

    const statusOptions = [
        { value: 'all', label: 'Estado' },
        { value: 'Borrador', label: 'Borrador' },
        { value: 'En Progreso', label: 'En Progreso' },
        { value: 'Firmado', label: 'Firmado' },
    ];

    return (
        <div style={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Breadcrumb */}
            <div className="px-6 pt-5 pb-2">
                <Breadcrumb />
            </div>

            <div className="relative flex flex-col gap-3 px-6 pt-3 pb-4">
                <div className="flex items-center justify-between gap-4">
                    {/* Filters Section */}
                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                        {/* Search */}
                        <div className="relative max-w-xs min-w-[200px]">
                            <input
                                type="text"
                                name="searchTerm"
                                value={filters.searchTerm}
                                onChange={onFilterChange}
                                placeholder="Buscar entrevistas..."
                                className="w-full px-3 py-1.5 pl-4 bg-gray-50 border border-gray-300 text-sm rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                        </div>

                        {/* Main Filters */}
                        <FilterDropdown name="sortBy" value={filters.sortBy} onChange={onFilterChange} options={sortOptions} />
                        <FilterDropdown
                            name="grade"
                            value={filters.grade || 'all'}
                            onChange={onFilterChange}
                            options={[
                                { value: 'all', label: 'Área de trabajo' },
                                { value: '1° Básico', label: '1° Básico' },
                                { value: '2° Básico', label: '2° Básico' },
                                { value: '3° Básico', label: '3° Básico' },
                                { value: '4° Básico', label: '4° Básico' },
                                { value: '5° Básico', label: '5° Básico' },
                                { value: '6° Básico', label: '6° Básico' },
                                { value: '7° Básico', label: '7° Básico' },
                                { value: '8° Básico', label: '8° Básico' },
                                { value: '1° Medio', label: '1° Medio' },
                                { value: '2° Medio', label: '2° Medio' },
                                { value: '3° Medio', label: '3° Medio' },
                                { value: '4° Medio', label: '4° Medio' },
                            ]}
                        />
                        <FilterDropdown
                            name="status"
                            value={filters.status}
                            onChange={onFilterChange}
                            options={[
                                { value: 'all', label: 'Estado' },
                                { value: 'Borrador', label: 'Borrador' },
                                { value: 'Autorizada', label: 'Autorizada' },
                            ]}
                        />
                        <FilterDropdown
                            name="gender"
                            value={filters.gender || 'all'}
                            onChange={onFilterChange}
                            options={[
                                { value: 'all', label: 'Género' },
                                { value: 'Masculino', label: 'Masculino' },
                                { value: 'Femenino', label: 'Femenino' },
                                { value: 'Otro', label: 'Otro' },
                            ]}
                        />

                        {/* More Filters Toggle */}
                        <div className="relative">
                            <button
                                onClick={() => setShowMoreFilters(!showMoreFilters)}
                                className={`px-3 bg-gray-50 py-1.5 border border-stone-300 shadow-sm rounded-lg text-gray-600 text-sm  flex items-center gap-2 transition-all ${showMoreFilters || filters.year !== 'all' || filters.month !== 'all'
                                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                                    : 'bg-gray-50 text-gray-800 hover:bg-gray-100'
                                    }`}
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                <span>{showMoreFilters ? 'Cerrar' : 'Más filtros'}</span>
                                {(filters.year !== 'all' || filters.month !== 'all') && (
                                    <span className="w-2 h-2 rounded-full bg-blue-500 ml-1"></span>
                                )}
                            </button>

                            {/* Collapsible Filters */}
                            {showMoreFilters && (
                                <div className="absolute top-full left-0 z-50 mt-2 p-3 bg-white rounded-xl border border-gray-200 shadow-xl flex items-center gap-2 animate-fade-in-down w-max min-w-[300px]">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mr-2 whitespace-nowrap">Filtrar por fecha:</span>
                                    <div className="flex items-center gap-2">
                                        <FilterDropdown name="year" value={filters.year} onChange={onFilterChange} options={yearOptions} />
                                        <FilterDropdown name="month" value={filters.month} onChange={onFilterChange} options={monthOptions} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions Section */}
                    <div className="flex items-center gap-2">
                        {/* New Interview Button */}
                        <button
                            onClick={onOpenModal}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm transition-all whitespace-nowrap"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Nueva Entrevista
                        </button>


                    </div>
                </div>
            </div>
        </div>
    );
}

export default InterviewToolbar;
