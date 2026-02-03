import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

function Header() {
  const { current, isDark, toggleTheme } = useTheme();

  return (
    <header className="pb-8">
      <div className={`${current.cardBg} rounded-3xl shadow-md border ${current.cardBorder} p-5 flex items-center justify-between`}>
        {/* Logo - Izquierda */}
        <Link to="/">
          <img
            src={logoSavia}
            alt="Logo Savia"
            className="h-10 cursor-pointer"
          />
        </Link>

        {/* Navigation Links - Centro */}
        <nav className="flex gap-8 items-center">
          <Link to="/" className={`${current.textSecondary} ${current.linkHover} text-base font-medium`}>
            Chat IA
          </Link>
          <Link to="/login" className={`${current.textSecondary} ${current.linkHover} text-base font-medium`}>
            Login
          </Link>
          <Link to="/contact" className={`${current.textSecondary} ${current.linkHover} text-base font-medium`}>
            Contacto
          </Link>
        </nav>

        {/* Botones de acciones - Derecha */}
        <div className="flex items-center gap-4">
          {/* Botón de tema */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg ${current.formBg} border ${current.formBorder} ${current.textSecondary} hover:${current.textPrimary} transition-colors`}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>

          {/* Contacto */}
          <Link to="/contact" className="px-4 py-2 border-none rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer">
            Contáctanos
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
