import FilterDropdown from '../../my-cases/FilterDropdown';
import Breadcrumb from '../../../components/Breadcrumb';
import { SORT_OPTIONS, CHARACTERISTIC_OPTIONS, CURSO_OPTIONS } from '../constants';

function StudentToolbar({ filters, onFilterChange, totalStudents, filteredCount }) {
    const isFiltered = filters.searchTerm || filters.characteristic !== 'all' || filters.curso !== 'all';

    return (
        <div style={{ fontFamily: "'Poppins', sans-serif" }} className="flex flex-col p-4 gap-3 flex-shrink-0">
            {/* Breadcrumb Row */}
            <div className="w-full flex items-center justify-between gap-4">
                <Breadcrumb />
                {/* Contador de alumnos */}
                <div className="text-xs sm:text-sm text-gray-500 font-medium whitespace-nowrap">
                    {isFiltered ? (
                        <>
                            <span className="font-semibold text-blue-600">{filteredCount}</span>
                            <span className="text-gray-400"> / </span>
                            <span>{totalStudents}</span>
                        </>
                    ) : (
                        <>
                            <span className="font-semibold">{totalStudents}</span> trabajador{totalStudents !== 1 ? 'es' : ''}
                        </>
                    )}
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
                {/* Búsqueda */}
                <div className="flex-1 min-w-0">
                    <input
                        type="text"
                        name="searchTerm"
                        value={filters.searchTerm}
                        onChange={onFilterChange}
                        placeholder="Buscar por nombre o RUT..."
                        className="w-full px-3 py-2 sm:py-1.5 bg-gray-50 border border-gray-200 text-sm rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all"
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
            </div>
        </div>
    );
}

export default StudentToolbar;
