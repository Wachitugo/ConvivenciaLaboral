import { useTheme } from '../../../contexts/ThemeContext';

function HeaderButtons({
  chatFiles,
  showFileList,
  relatedCase,
  toggleFileList,
  onGenerateCase,
  messagesCount,
  isGeneratingCase
}) {
  const { current } = useTheme();

  // Mostrar botón "Generar Caso" solo si:
  // - Hay mensajes (conversación iniciada)
  // - No hay caso relacionado ya
  // - No se está generando un caso
  const showGenerateCaseButton = messagesCount > 0 && !relatedCase && !isGeneratingCase;

  // Filtrar archivos internos (protocol_*) para el contador
  const safeFilesCount = chatFiles.filter(f => {
    const name = (f.name || '').toLowerCase();
    return !name.startsWith('protocol_');
  }).length;

  return (
    <div className="flex items-center gap-2 justify-end">
      {/* Botón de archivos con contador */}
      {safeFilesCount > 0 && (
        <button
          onClick={toggleFileList}
          className={`p-2 rounded-lg ${showFileList ? 'text-blue-600' : current.textSecondary} hover:${current.textPrimary} hover:bg-opacity-10 hover:bg-gray-500 transition-all relative`}
          title="Ver archivos del chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
            {safeFilesCount}
          </span>
        </button>
      )}

      {/* Botón "Generar Caso" */}
      {showGenerateCaseButton && (
        <button
          onClick={onGenerateCase}
          className={`px-3 py-2 rounded-xl ${current.textPrimary} bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center gap-2`}
          title="Generar Caso"
        >
       
          <span className="text-sm font-medium">Generar Caso</span>
        </button>
      )}
    </div>
  );
}

export default HeaderButtons;
