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
    <div className="mb-1">
      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc]">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1A71B8] to-[#0A3866] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
          {usuario ? getInitials(usuario.nombre) : 'U'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#0f172a] truncate leading-tight">
            {usuario ? usuario.nombre : 'Cargando...'}
          </p>
          <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wide truncate">
            {usuario ? usuario.rol : 'Usuario'}
          </p>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className="flex-shrink-0 p-1.5 rounded-lg text-[#94a3b8] hover:text-red-500 hover:bg-red-50 transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
        </button>
      </div>
    </div>
  );
}
