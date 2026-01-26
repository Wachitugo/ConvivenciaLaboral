import CaseCard from "./CaseCard";

function CasesGrid({ cases, onSelectCase, onEditCase, onShareCase }) {
  if (cases.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-6 pt-4 custom-scrollbar">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">
            No se encontraron casos
          </h3>
          <p className="text-sm text-gray-600">
            Intenta con otro término de búsqueda o usa el botón "Nuevo Caso" arriba
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 pt-4 custom-scrollbar ">
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2    gap-3">
        {cases.map((caseItem) => (
          <CaseCard
            key={caseItem.id}
            student={caseItem} // El prop se llama 'student' pero le pasamos un 'caseItem'
            onSelect={onSelectCase}
            onEdit={onEditCase}
            onShare={onShareCase}
          />
        ))}
      </div>
    </div>
  );
}

export default CasesGrid;