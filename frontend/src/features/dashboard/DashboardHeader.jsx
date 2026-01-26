import { useTheme } from '../../contexts/ThemeContext';

export default function DashboardHeader({ isSidebarOpen, toggleSidebar }) {
  const { current } = useTheme();

  return (
    <div className={`px-6 py-4 border-b border-gray-200 flex-shrink-0`}>
      <div className="grid grid-cols-3 items-center">
        {/* Toggle a la izquierda */}
        <div className="flex justify-start">
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-lg ${current.textSecondary} hover:${current.textPrimary} hover:bg-opacity-10 hover:bg-gray-500 transition-all`}
            title={isSidebarOpen ? "Cerrar sidebar" : "Abrir sidebar"}
          >
            {isSidebarOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Título centrado */}
        <div className="flex justify-center">
          <h1
            className={`text-lg font-semibold ${current.textPrimary}`}
            style={{ fontFamily: "'Stack Sans Notch', sans-serif" }}
          >
            Resumen General
          </h1>
        </div>

        {/* Fecha a la derecha */}
        <div className="flex justify-end">
          <span className={`text-sm ${current.textSecondary}`}>
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  );
}
