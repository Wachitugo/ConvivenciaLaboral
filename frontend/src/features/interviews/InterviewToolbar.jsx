import React, { useState } from 'react';
import FilterDropdown from '../my-cases/FilterDropdown';

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
        <div className="p-3 mb-2 border-b border-white/10 relative z-[100]" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}>
            <div className="relative flex flex-col gap-3 ">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Filters Section */}
                    <div className="flex items-center gap-2 flex-1 flex-wrap min-w-0">
                        {/* Search */}
                        <div className="relative max-w-xs min-w-[200px]">
                            <input
                                type="text"
                                name="searchTerm"
                                value={filters.searchTerm}
                                onChange={onFilterChange}
                                placeholder="Buscar entrevistas..."
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 text-sm rounded-full text-white placeholder-white/50 focus:outline-none focus:bg-white/20 focus:border-white/40 focus:ring-4 focus:ring-white/10 backdrop-blur-md transition-all shadow-inner"
                            />
                        </div>

                        {/* Main Filters */}
                        <FilterDropdown name="sortBy" value={filters.sortBy} onChange={onFilterChange} options={sortOptions} />
                        <div className="hidden md:block">
                            <FilterDropdown
                                name="grade"
                                value={filters.grade || 'all'}
                                onChange={onFilterChange}
                                options={[
                                    { value: 'all', label: 'Área de trabajo' },
                                    { value: 'Administración', label: 'Administración' },
                                    { value: 'Operaciones', label: 'Operaciones' },
                                    { value: 'Recursos Humanos', label: 'Recursos Humanos' },
                                    { value: 'Finanzas', label: 'Finanzas' },
                                    { value: 'Tecnología', label: 'Tecnología' },
                                    { value: 'Ventas', label: 'Ventas' },
                                    { value: 'Marketing', label: 'Marketing' },
                                    { value: 'Producción', label: 'Producción' },
                                    { value: 'Logística', label: 'Logística' },
                                    { value: 'Atención al Cliente', label: 'Atención al Cliente' },
                                ]}
                            />
                        </div>
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
                        <div className="hidden sm:block">
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
                        </div>

                        {/* More Filters Toggle */}
                        <div className="relative">
                            <button
                                onClick={() => setShowMoreFilters(!showMoreFilters)}
                                className={`px-4 py-2 border rounded-full text-sm font-medium flex items-center gap-2 transition-all shadow-sm ${showMoreFilters || filters.year !== 'all' || filters.month !== 'all'
                                    ? 'bg-white/20 text-white border-white/40 backdrop-blur-md'
                                    : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white backdrop-blur-md'
                                    }`}
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                <span>{showMoreFilters ? 'Cerrar' : 'Más filtros'}</span>
                                {(filters.year !== 'all' || filters.month !== 'all') && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#34B6D8] ml-1 shadow-[0_0_8px_rgba(52,182,216,0.6)]"></span>
                                )}
                            </button>

                            {/* Collapsible Filters */}
                            {showMoreFilters && (
                                <div className="absolute top-full left-0 z-50 mt-2 p-3 bg-[#0A3866]/90 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center gap-2 animate-fade-in-down w-max min-w-[300px]">
                                    <span className="text-xs font-black text-white/50 uppercase tracking-widest mr-2 whitespace-nowrap">Filtrar por fecha:</span>
                                    <div className="flex items-center gap-2">
                                        <FilterDropdown name="year" value={filters.year} onChange={onFilterChange} options={yearOptions} />
                                        <FilterDropdown name="month" value={filters.month} onChange={onFilterChange} options={monthOptions} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions Section */}
                    <div className="flex items-center gap-1 relative flex-shrink-0">
                        {/* New Interview Button */}
                        <button
                            onClick={onOpenModal}
                            className="px-4 sm:px-6 py-2.5 shadow-lg rounded-full font-bold text-sm flex items-center gap-2 transition-all active:scale-[0.98] whitespace-nowrap z-50 bg-[#1A71B8] hover:bg-[#1A71B8]/80 text-white border border-white/10"
                        >
                            <svg className="w-5 h-5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
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
