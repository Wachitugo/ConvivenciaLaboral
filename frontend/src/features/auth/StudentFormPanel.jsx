export default function StudentFormPanel({ isOpen, onClose, formData, setFormData, onSubmit }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel lateral */}
      <div className="fixed right-0 top-0 h-full z-50 flex items-center justify-end pointer-events-none">
        <div className="w-[480px] h-full rounded-l-lg shadow-2xl bg-white border-l border-gray-200 flex flex-col animate-slide-in overflow-hidden pointer-events-auto">
          {/* Header del panel */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                Nuevo Caso
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Cerrar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Completa los datos para crear un nuevo caso de convivencia.
            </p>
          </div>

          {/* Formulario */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-50/30">
            <form id="student-form" onSubmit={onSubmit} className="space-y-5">
              {/* Nombre completo */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Título del caso
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="Ej: Pelea en el recreo"
                  />
                </div>

              {/* Tipo de caso */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de caso
                </label>
                <input
                  type="text"
                  required
                  value={formData.caseType}
                  onChange={(e) => setFormData({ ...formData, caseType: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="Ej: Conflicto entre pares"
                />
              </div>
            </form>
          </div>

          {/* Footer con botones */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="student-form"
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/30"
              >
                Crear Caso
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
