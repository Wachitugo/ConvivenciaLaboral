import { useMemo } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

function OptionsMenu({
  isOpen,
  onGenerateCase,
  messagesCount,
  isGeneratingCase,
  hasRelatedCase
}) {
  const { current } = useTheme();

  // Verificar si el usuario es Trabajador
  const isWorker = useMemo(() => {
    try {
      const userStr = localStorage.getItem('usuario');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.rol === 'Trabajador';
      }
    } catch (error) {
      console.error('Error reading user role:', error);
    }
    return false;
  }, []);

  // No mostrar el menú si:
  // 1. No está abierto
  // 2. No hay mensajes (no se ha generado conversación)
  // 3. Ya existe un caso relacionado
  // 4. El usuario es Trabajador
  if (!isOpen || messagesCount === 0 || hasRelatedCase || isWorker) return null;

  const canGenerateCase = !isGeneratingCase;

  return (
    <div className={`absolute right-0 top-full w-52 bg-stone-50 border border-stone-200 rounded-xl shadow-lg z-50`}>
      <button
        onClick={onGenerateCase}
        disabled={!canGenerateCase}
        className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-200 rounded-xl transition-colors ${!canGenerateCase ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <svg className={`w-5 h-5 ${current.textSecondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span className={`text-sm ${current.textPrimary}`}>
          {isGeneratingCase ? 'Generando...' : 'Generar Caso'}
        </span>
      </button>
    </div>
  );
}

export default OptionsMenu;
