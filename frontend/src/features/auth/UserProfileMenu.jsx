import { useState, useRef, useEffect } from 'react';

export default function UserProfileMenu({ current, usuario, navigate, schoolSlug, dark = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const getInitials = (nombre) => {
    if (!nombre) return 'U';
    return nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getPath = (path) => schoolSlug ? `/${schoolSlug}${path}` : path;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('colegios');
    window.dispatchEvent(new Event('auth-changed'));
    navigate('/');
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div className="relative mb-1" ref={menuRef}>

      {/* Dropdown panel — mounts above the trigger */}
      {isOpen && (
        <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_8px_32px_rgba(10,56,102,0.14)] z-50 overflow-hidden">
          {/* User header */}
          <div className="px-4 py-3.5 border-b border-[#f1f5f9]">
            <p className="text-sm font-bold text-[#0f172a] leading-tight">{usuario?.nombre || 'Usuario'}</p>
            <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wide mt-0.5">{usuario?.rol || 'Rol'}</p>
          </div>

          {/* Menu items */}
          <div className="p-1.5 space-y-0.5">
            <button
              onClick={() => { setIsOpen(false); navigate(getPath('/buzon-sugerencias')); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#334155] hover:bg-[#f0f4f8] transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#64748b] flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1014.25 7.5v1.5H9.75V7.5A2.625 2.625 0 0012 4.875zM12 7.5H8.25A2.25 2.25 0 006 9.75v1.5h12v-1.5A2.25 2.25 0 0015.75 7.5H12z" />
              </svg>
              Buzón de Sugerencias
            </button>

          </div>

          {/* Logout */}
          <div className="border-t border-[#f1f5f9] p-1.5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all ${
          isOpen
            ? 'border-[#1A71B8]/30 bg-[#f0f7ff] shadow-sm'
            : 'border-[#e2e8f0] bg-[#f8fafc] hover:border-[#1A71B8]/20 hover:bg-[#f0f4f8]'
        }`}
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1A71B8] to-[#0A3866] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
          {usuario ? getInitials(usuario.nombre) : 'U'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-bold text-[#0f172a] truncate leading-tight">
            {usuario ? usuario.nombre : 'Cargando...'}
          </p>
          <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wide truncate">
            {usuario ? usuario.rol : 'Usuario'}
          </p>
        </div>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-[#94a3b8] flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}
