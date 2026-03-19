import FilterDropdown from '../../my-cases/FilterDropdown';
import { SORT_OPTIONS, CHARACTERISTIC_OPTIONS, CURSO_OPTIONS } from '../constants';

function StudentToolbar({ filters, onFilterChange, totalStudents, filteredCount }) {
    const isFiltered = filters.searchTerm || filters.characteristic !== 'all' || filters.curso !== 'all';

    return (
        <div style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }} className="p-3 pb-4 mb-2 border-b border-black/5 relative z-[100]">
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
                {/* Búsqueda */}
                <div className="relative max-w-xs min-w-[200px]">
                    <input
                        type="text"
                        name="searchTerm"
                        value={filters.searchTerm}
                        onChange={onFilterChange}
                        placeholder="Buscar por nombre o RUT..."
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 text-sm rounded-full text-white placeholder-white/50 focus:outline-none focus:bg-white/20 focus:border-white/40 focus:ring-4 focus:ring-white/10 backdrop-blur-md transition-all shadow-inner"
                    />
                </div>

                {/* Filtros en fila */}
                <div className="flex flex-wrap gap-2">
                    <FilterDropdown
                        name="sortBy"
                        value={filters.sortBy}
                        onChange={onFilterChange}
                        options={SORT_OPTIONS}
                        className="w-auto"
                    />
                    <FilterDropdown
                        name="curso"
                        value={filters.curso}
                        onChange={onFilterChange}
                        options={CURSO_OPTIONS}
                        className="w-auto"
                    />
                    <FilterDropdown
                        name="characteristic"
                        value={filters.characteristic}
                        onChange={onFilterChange}
                        options={CHARACTERISTIC_OPTIONS}
                        className="w-auto"
                    />
                </div>

                {/* Contador al final */}
                <div className="ml-auto text-xs sm:text-sm text-white/50 font-medium whitespace-nowrap">
                    {isFiltered ? (
                        <>
                            <span className="font-semibold text-[#34B6D8]">{filteredCount}</span>
                            <span className="text-white/30"> / </span>
                            <span>{totalStudents}</span>
                        </>
                    ) : (
                        <>
                            <span className="font-semibold text-white">{totalStudents}</span> trabajador{totalStudents !== 1 ? 'es' : ''}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StudentToolbar;
