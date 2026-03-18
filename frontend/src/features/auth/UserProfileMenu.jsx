export default function UserProfileMenu({ current, usuario, navigate, dark = false }) {
  const getInitials = (nombre) => {
    if (!nombre) return 'U';
    return nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('colegios');
    window.dispatchEvent(new Event('auth-changed'));
    navigate('/');
  };

  return (
    <div className="mb-3">
      <button
        onClick={handleLogout}
        className={`w-full py-2 px-1 rounded-lg transition-all ${
          dark
            ? 'bg-white/10 hover:bg-white/20'
            : 'bg-[#f0f4f8] hover:bg-[#e2e8f0]'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {usuario ? getInitials(usuario.nombre) : 'U'}
          </div>
          <div className="flex-1 text-left">
            <p className={`text-sm font-medium ${dark ? 'text-white' : current.textPrimary}`}>
              {usuario ? usuario.nombre : 'Cargando...'}
            </p>
            <p className={`text-[11px] ${dark ? 'text-white/50' : current.textSecondary}`}>
              {usuario ? usuario.rol : 'Usuario'}
            </p>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 text-red-400 flex-shrink-0"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
        </div>
      </button>
    </div>
  );
}
