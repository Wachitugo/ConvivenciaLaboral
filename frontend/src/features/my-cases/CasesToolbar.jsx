import { useState } from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import FilterDropdown from './FilterDropdown';

function CasesToolbar({
  filters,
  onFilterChange,
  onQuickCreate,
  isSaving = false,
  viewMode,
  setViewMode,
  availableMonths = [],
  availableYears = []
}) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [showNewCasePopover, setShowNewCasePopover] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState('');

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
    { value: 'title_asc', label: 'Título (A-Z)' },
    { value: 'title_desc', label: 'Título (Z-A)' },
  ];

  const sharedOptions = [
    { value: 'all', label: 'Todos los casos' },
    { value: 'shared', label: 'Compartidos' },
    { value: 'not-shared', label: 'No compartidos' },
    { value: 'shared-with-me', label: 'Compartidos conmigo' },
  ];

  const statusOptions = [
    { value: 'all', label: 'Estado' },
    { value: 'abierto', label: 'Abiertos' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'resuelto', label: 'Resueltos' },
    { value: 'no_resuelto', label: 'No Resueltos' },
  ];

  return (
    <div className="p-3 pb-4 mb-2 border-b border-black/5 relative z-[100]" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}>
   

      <div className="relative flex flex-col gap-3 p">
        <div className="flex items-center justify-between gap-4">
          {/* Fila Principal: Search + Filtros Principales + Botón Más Filtros + Acciones */}
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <div className="relative max-w-xs min-w-[200px]">
              <input
                type="text"
                placeholder="Buscar casos..."
                name="searchTerm"
                value={filters.searchTerm}
                onChange={onFilterChange}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 text-sm rounded-full text-white placeholder-white/50 focus:outline-none focus:bg-white/20 focus:border-white/40 focus:ring-4 focus:ring-white/10 backdrop-blur-md transition-all shadow-inner"
              />
            </div>

            {/* Filtros Principales (Siempre visibles) */}
            <FilterDropdown name="sortBy" value={filters.sortBy} onChange={onFilterChange} options={sortOptions} />
            <FilterDropdown name="status" value={filters.status} onChange={onFilterChange} options={statusOptions} />
            <FilterDropdown name="sharedStatus" value={filters.sharedStatus} onChange={onFilterChange} options={sharedOptions} />

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

              {/* Dropdown Flotante Anclado al Botón */}
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

          <div className="flex items-center gap-1 relative">
            {/* Nuevo Caso - El botón base */}
            <button
              onClick={() => setShowNewCasePopover(!showNewCasePopover)}
              className={` px-6 py-2.5 shadow-md rounded-full font-bold text-sm flex items-center gap-2 transition-all active:scale-[0.98] whitespace-nowrap z-50 ${showNewCasePopover
                ? 'bg-white text-[#0A3866] text-lg shadow-[0_0_30px_rgba(255,255,255,0.3)] ring-4 ring-white/20'
                : 'bg-[#1A71B8] hover:bg-[#1A71B8]/80 text-white shadow-[#1A71B8]/40 border border-white/20'
                }`}
            >
              <svg className={`w-5 h-5 transition-transform duration-300 ${showNewCasePopover ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nuevo Caso
            </button>

            {/* Popover Invertido (Azul Oscuro) */}
            {showNewCasePopover && (
              <div className="absolute top-full right-0 z-40 mt-3 p-5 bg-[#0A3866] rounded-2xl shadow-[0_20px_40px_rgba(10,56,102,0.4)] border border-[#1A71B8]/50 animate-fade-in-down w-80">
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-2">
                      Título del nuevo caso
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Conflicto entre estudiantes..."
                      value={newCaseTitle}
                      onChange={(e) => setNewCaseTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newCaseTitle.trim() && !isSaving) {
                          onQuickCreate(newCaseTitle.trim());
                          setNewCaseTitle('');
                          setShowNewCasePopover(false);
                        }
                      }}
                      className="w-full px-3 py-2.5 bg-[#1A71B8]/30 border border-[#1A71B8]/50 text-sm rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/60 focus:ring-4 focus:ring-white/10 transition-all"
                      autoFocus
                    />
                  </div>

                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => {
                        setShowNewCasePopover(false);
                        setNewCaseTitle('');
                      }}
                      className="px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-xl font-medium transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (newCaseTitle.trim() && !isSaving) {
                          onQuickCreate(newCaseTitle.trim());
                          setNewCaseTitle('');
                          setShowNewCasePopover(false);
                        }
                      }}
                      disabled={!newCaseTitle.trim() || isSaving}
                      className="px-5 py-2 bg-white text-[#0A3866] hover:bg-gray-100 disabled:bg-white/20 disabled:text-white/40 disabled:shadow-none disabled:active:scale-100 text-sm rounded-xl font-bold transition-all shadow-lg shadow-black/10 active:scale-[0.98]"
                    >
                      {isSaving ? 'Creando...' : 'Crear caso'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CasesToolbar;