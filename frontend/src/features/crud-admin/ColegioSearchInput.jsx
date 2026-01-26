import { useState, useRef, useEffect } from 'react';

export default function ColegioSearchInput({ colegios, selectedColegioId, onSelect, label = "Colegio" }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Encontrar el colegio seleccionado
  const selectedColegio = colegios.find(c => c.id === selectedColegioId);

  // Filtrar colegios por búsqueda
  const filteredColegios = colegios.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cerrar el dropdown cuando se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (colegio) => {
    onSelect(colegio.id);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect('');
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      {/* Colegio seleccionado */}
      {selectedColegio && !isOpen ? (
        <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedColegio.logo_url ? (
              <img
                src={selectedColegio.logo_url}
                alt={selectedColegio.nombre}
                className="h-6 w-6 rounded object-cover"
              />
            ) : (
              <div className="h-6 w-6 rounded bg-gray-200 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
            <span className="text-sm font-medium text-gray-900">{selectedColegio.nombre}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="text-purple-600 hover:text-purple-700 text-sm"
            >
              Cambiar
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Input de búsqueda */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar colegio..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            />
            <svg
              className="absolute right-3 top-2.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Dropdown con resultados */}
          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {/* Opción "Sin colegio" */}
              <button
                type="button"
                onClick={handleClear}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 transition flex items-center gap-2 border-b border-gray-200"
              >
                <div className="h-6 w-6 rounded bg-gray-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span className="text-sm text-gray-500 italic">Sin colegio</span>
              </button>

              {/* Lista de colegios filtrados */}
              {filteredColegios.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No se encontraron colegios
                </div>
              ) : (
                filteredColegios.map((colegio) => (
                  <button
                    type="button"
                    key={colegio.id}
                    onClick={() => handleSelect(colegio)}
                    className="w-full px-4 py-2 text-left hover:bg-purple-50 transition flex items-center gap-3"
                  >
                    {colegio.logo_url ? (
                      <img
                        src={colegio.logo_url}
                        alt={colegio.nombre}
                        className="h-8 w-8 rounded object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{colegio.nombre}</p>
                      {colegio.direccion && (
                        <p className="text-xs text-gray-500 truncate">{colegio.direccion}</p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}

      <p className="text-xs text-gray-500 mt-1">
        El usuario solo puede pertenecer a un colegio
      </p>
    </div>
  );
}
