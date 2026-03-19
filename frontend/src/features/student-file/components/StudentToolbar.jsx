import { UserPlus } from 'lucide-react';
import FilterDropdown from '../../my-cases/FilterDropdown';
import { SORT_OPTIONS, CHARACTERISTIC_OPTIONS, CURSO_OPTIONS } from '../constants';

function StudentToolbar({ filters, onFilterChange, totalStudents, filteredCount, onCreateStudent }) {
    const isFiltered = filters.searchTerm || filters.characteristic !== 'all' || filters.curso !== 'all';

    return (
        <div style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }} className="p-3 pb-4 mb-2 border-b border-black/5 relative z-[100]">
            {/* Filters Row */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 flex-wrap">
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

                    {/* Filtros */}
                    <FilterDropdown name="sortBy" value={filters.sortBy} onChange={onFilterChange} options={SORT_OPTIONS} className="w-auto" />
                    <FilterDropdown name="curso" value={filters.curso} onChange={onFilterChange} options={CURSO_OPTIONS} className="w-auto" />
                    <FilterDropdown name="characteristic" value={filters.characteristic} onChange={onFilterChange} options={CHARACTERISTIC_OPTIONS} className="w-auto" />

                    {/* Contador */}
                    <span className="text-xs sm:text-sm text-white/50 font-medium whitespace-nowrap">
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
                    </span>
                </div>

                {/* Botón Nuevo Colaborador — solo roles autorizados */}
                {onCreateStudent && (
                    <button
                        onClick={onCreateStudent}
                        className="px-6 py-2.5 bg-[#1A71B8] hover:bg-[#155d96] text-white text-sm font-bold rounded-full shadow-xl border border-white/20 flex items-center gap-2 transition-colors active:scale-[0.98] whitespace-nowrap"
                    >
                        <UserPlus size={16} />
                        Nuevo Colaborador
                    </button>
                )}
            </div>
        </div>
    );
}

export default StudentToolbar;
