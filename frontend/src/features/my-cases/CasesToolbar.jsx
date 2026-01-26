import { useState } from 'react'; // Import useState
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
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Breadcrumb */}
      <div className="px-6 pt-5 pb-2">
        <Breadcrumb />
      </div>

      <div className="relative flex flex-col gap-3 px-6 pt-3">
        <div className="flex items-center justify-between gap-4">
          {/* Fila Principal: Search + Filtros Principales + Botón Más Filtros + Acciones */}
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            {/* Search */}
            <div className="relative max-w-xs min-w-[200px]">
              <input
                type="text"
                placeholder="Buscar casos..."
                name="searchTerm"
                value={filters.searchTerm}
                onChange={onFilterChange}
                className="w-full px-3 py-1.5 pl-4 bg-gray-50/50 border-2 border-gray-200 text-sm rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>

            {/* Filtros Principales (Siempre visibles) */}
            <FilterDropdown name="sortBy" value={filters.sortBy} onChange={onFilterChange} options={sortOptions} />
            <FilterDropdown name="status" value={filters.status} onChange={onFilterChange} options={statusOptions} />
            <FilterDropdown name="sharedStatus" value={filters.sharedStatus} onChange={onFilterChange} options={sharedOptions} />

            {/* Botón Toggle Más Filtros con Dropdown anclado */}
            <div className="relative">
              <button
                onClick={() => setShowMoreFilters(!showMoreFilters)}
                className={`px-3 bg-gray-50 py-1.5 border-2 border-stone-200 shadow-sm rounded-lg text-gray-600 text-sm  flex items-center gap-2 transition-all ${showMoreFilters || filters.year !== 'all' || filters.month !== 'all'
                  ? 'bg-blue-50 text-gray-500 border-blue-200'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
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

              {/* Dropdown Flotante Anclado al Botón */}
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

          <div className="flex items-center gap-1 relative">
            {/* Nuevo Caso */}
            <button
              onClick={() => setShowNewCasePopover(!showNewCasePopover)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm transition-all whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nuevo Caso
            </button>

            {/* Popover para crear caso rápido */}
            {showNewCasePopover && (
              <div className="absolute top-full right-0 z-50 mt-2 p-4 bg-white rounded-xl border border-gray-200 shadow-xl animate-fade-in-down w-72">
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium text-gray-700">
                    Título del caso
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
                    className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 text-sm rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowNewCasePopover(false);
                        setNewCaseTitle('');
                      }}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
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
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm rounded-lg font-medium transition-colors"
                    >
                      {isSaving ? 'Creando...' : 'Crear'}
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