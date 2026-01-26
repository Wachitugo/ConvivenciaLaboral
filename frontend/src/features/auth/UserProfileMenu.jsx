export default function UserProfileMenu({ current, usuario, navigate }) {
  // Generar iniciales del usuario
  const getInitials = (nombre) => {
    if (!nombre) return 'U';
    return nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    // Cerrando sesión...
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('colegios');

    // Disparar evento personalizado para notificar cambio de sesión
    window.dispatchEvent(new Event('auth-changed'));

    // Redirigir al login
    navigate('/');
  };

  return (
    <div className="mb-3">
      {/* Botón de Usuario con Cerrar Sesión */}
      <button
        onClick={handleLogout}
        className={`w-full py-2 px-1 rounded-lg bg-gray-100 hover:bg-opacity-80 transition-all`}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
            {usuario ? getInitials(usuario.nombre) : 'U'}
          </div>
          <div className="flex-1 text-left">
            <p className={`text-sm font-medium ${current.textPrimary}`}>
              {usuario ? usuario.nombre : 'Cargando...'}
            </p>
            <p className={`text-[11px] ${current.textSecondary}`}>
              {usuario ? usuario.rol : 'Usuario'}
            </p>
          
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 text-red-500 flex-shrink-0"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
        </div>
      </button>
    </div>
  );
}