import { useTheme } from '../../contexts/ThemeContext';

function CaseListPanel({ cases, onClose, onCaseSelect }) {
  const { current } = useTheme();

  return (
    <div className={`w-64 bg-stone-50 border border-stone-200 flex flex-col h-full shadow-sm shadow-blue-600/20 rounded-lg`}>
      {/* Header */}
      <div className={`p-4 border-b ${current.cardBorder} flex items-center justify-between flex-shrink-0`}>
        <div className="flex items-center gap-2">
          
          <h3 className={`text-sm font-semibold ${current.textPrimary}`}>Asociar a un Caso Existente</h3>
        </div>
        <button
          onClick={onClose}
          className={`p-1 rounded-lg ${current.textSecondary} hover:${current.textPrimary} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
          title="Cerrar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Lista de casos */}
      <div className="flex-1 overflow-y-auto">
        {cases && cases.length > 0 ? (
          cases.map((caseItem) => (
            <button
              key={caseItem.id}
              onClick={() => onCaseSelect(caseItem)}
              className={`w-full text-left p-3 border-b ${current.cardBorder} hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group`}
            >
              <div className="flex items-start gap-3">
             
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${current.textPrimary} truncate`}>
                    {caseItem.title}
                  </p>
                  {caseItem.caseType && (
                    <p className={`text-xs ${current.textSecondary} mt-0.5`}>
                      {caseItem.caseType}
                    </p>
                  )}
         
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p className={`text-sm ${current.textSecondary}`}>No hay casos disponibles</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CaseListPanel;
