import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import icon3 from '../../assets/icon3.png';
import UserProfileMenu from './UserProfileMenu';
import { createLogger } from '../../utils/logger';

const logger = createLogger('Sidebar');

function Sidebar({ isOpen, onToggle, conversations, isHidden, schoolSlug }) {
  const { current } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [usuario, setUsuario] = useState(null);
  const [colegiosInfo, setColegiosInfo] = useState([]);

  useEffect(() => {
    const usuarioData = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');

    if (usuarioData) {
      try {
        setUsuario(JSON.parse(usuarioData));
      } catch (error) {
        logger.error('Error al parsear datos del usuario:', error);
      }
    }

    const fetchFreshUserData = async () => {
      if (!token) return;
      try {
        const module = await import('../../services/api');
        const freshUser = await module.authService.getCurrentUser(token);
        if (freshUser) {
          setUsuario(freshUser);
          localStorage.setItem('usuario', JSON.stringify(freshUser));
        }
      } catch (error) {
        logger.error('Error refreshing user data:', error);
      }
    };

    fetchFreshUserData();
    const intervalId = setInterval(fetchFreshUserData, 10000);

    const storedColegios = localStorage.getItem('colegios');
    if (storedColegios) {
      try {
        setColegiosInfo(JSON.parse(storedColegios));
      } catch (error) {
        logger.error('Error al parsear datos de colegios:', error);
      }
    }

    return () => clearInterval(intervalId);
  }, []);

  const getPath = (path) => schoolSlug ? `/${schoolSlug}${path}` : path;

  const isActive = (relativePath) => {
    const path = getPath(relativePath);
    const routesWithSubpages = [getPath('/mis-casos'), getPath('/entrevistas'), getPath('/ficha-alumnos')];
    if (routesWithSubpages.includes(path)) {
      return location.pathname === path || location.pathname.startsWith(`${path}/`);
    }
    if (path === getPath('/chat-general')) {
      return location.pathname === path && !location.state?.sessionId;
    }
    return location.pathname === path;
  };

  const isSessionActive = (sessionId) => {
    return location.pathname === getPath('/chat-general')
      && location.state?.sessionId === sessionId
      && sessionId !== null;
  };

  const navBtnClass = (route) =>
    `w-full px-3 py-2.5 rounded-xl transition-all flex items-center text-sm font-semibold mb-1 ${!isOpen ? 'justify-center' : 'gap-3'} ${
      isActive(route)
        ? 'bg-[#1A71B8]/10 text-[#1A71B8] border border-[#1A71B8]/20 shadow-sm'
        : 'text-[#475569] hover:bg-[#f0f4f8] hover:text-[#0A3866] border border-transparent'
    }`;

  const iconClass = (route) =>
    isActive(route) ? 'text-[#1A71B8]' : 'text-[#64748b]';

  const handleNewConsulta = () => {
    navigate(getPath('/chat-general'), { state: { sessionId: null, newConsultaTimestamp: Date.now() }, replace: false });
    if (window.innerWidth < 1024) onToggle();
  };

  return (
    <aside
      className={`
        transition-all duration-300 ease-in-out
        flex flex-col
        fixed left-4 top-4 bottom-4 z-50
        rounded-[28px]
        shadow-[0_8px_32px_rgba(10,56,102,0.16),0_2px_8px_rgba(26,113,184,0.10),0_0_0_1px_rgba(226,232,240,0.8)]
        bg-white/90 backdrop-blur-xl
        border border-white/60
        ${isOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0 lg:w-[68px]'}
        ${isHidden ? 'hidden' : ''}
      `}
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Header con Brand */}
      <div className={`px-4 pt-5 pb-4 flex items-center ${!isOpen ? 'flex-col gap-2.5' : 'gap-3'}`}>
        <img src={icon3} alt="Convivencia Inteligente" className="h-7 w-7 object-contain flex-shrink-0" />
        {isOpen && (
          <div className="sidebar-fade-in min-w-0 flex-1">
            <h2 className="text-sm font-black text-[#0A3866] whitespace-nowrap leading-tight">
              Convivencia Laboral
            </h2>
            <p className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-widest whitespace-nowrap">
              Panel de Gestión
            </p>
          </div>
        )}
        {/* Botón toggle */}
        <button
          onClick={onToggle}
          className="flex-shrink-0 p-1.5 rounded-xl text-[#64748b] hover:text-[#0A3866] hover:bg-[#f0f4f8] transition-all"
          title={isOpen ? 'Cerrar sidebar' : 'Abrir sidebar'}
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Botón Nueva Consulta — destacado */}
      {usuario?.rol !== 'Investigador' && (
        <div className={`${isOpen ? 'px-4 mb-5' : 'px-2.5 mb-4'}`}>
          {isOpen ? (
            <button
              onClick={handleNewConsulta}
              className="sidebar-fade-in w-full flex items-center justify-center gap-2 bg-[#0A3866] hover:bg-[#1A71B8] text-white font-bold text-sm py-3 px-4 rounded-2xl transition-all shadow-md shadow-[#1A71B8]/20 active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nueva Consulta
            </button>
          ) : (
            <button
              onClick={handleNewConsulta}
              title="Nueva Consulta"
              className="w-full flex items-center justify-center p-2.5 rounded-xl bg-[#1A71B8]/10 hover:bg-[#1A71B8]/20 text-[#1A71B8] transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Navegación */}
      <nav className="flex-1 px-3 flex flex-col overflow-hidden">

        {/* Dashboard — solo roles con acceso completo (no Investigador) */}
        {usuario?.rol !== 'Investigador' && (
          <button
            onClick={() => { navigate(getPath('/dashboard')); if (window.innerWidth < 1024) onToggle(); }}
            className={navBtnClass('/dashboard')}
            title={!isOpen ? 'Reporte' : ''}
          >
            <span className={`flex-shrink-0 ${iconClass('/dashboard')}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </span>
            {isOpen && <span className="whitespace-nowrap">Reporte</span>}
          </button>
        )}


        {/* Secciones para todos los roles */}
        {(
          <>
            <button
              onClick={() => { navigate(getPath('/mis-casos')); if (window.innerWidth < 1024) onToggle(); }}
              className={navBtnClass('/mis-casos')}
              title={!isOpen ? 'Expedientes' : ''}
            >
              <span className={`flex-shrink-0 ${iconClass('/mis-casos')}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
              </span>
              {isOpen && <span className="whitespace-nowrap">Expedientes</span>}
            </button>

            <button
              onClick={() => { navigate(getPath('/entrevistas')); if (window.innerWidth < 1024) onToggle(); }}
              className={navBtnClass('/entrevistas')}
              title={!isOpen ? 'Entrevistas' : ''}
            >
              <span className={`flex-shrink-0 ${iconClass('/entrevistas')}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </span>
              {isOpen && <span className="whitespace-nowrap">Entrevistas</span>}
            </button>

            <button
              onClick={() => { navigate(getPath('/ficha-alumnos')); if (window.innerWidth < 1024) onToggle(); }}
              className={navBtnClass('/ficha-alumnos')}
              title={!isOpen ? 'Colaboradores' : ''}
            >
              <span className={`flex-shrink-0 ${iconClass('/ficha-alumnos')}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </span>
              {isOpen && <span className="whitespace-nowrap">Colaboradores</span>}
            </button>

            <div className="my-3 h-px bg-[#e2e8f0]"></div>
          </>
        )}

        {/* Sección Historial */}
        <div className={`flex-1 flex flex-col overflow-hidden ${isOpen && usuario?.rol !== 'Investigador' ? 'sidebar-fade-in' : 'hidden'}`}>
          <div className="px-2 mb-2 flex items-center justify-between flex-shrink-0">
            <h3 className="text-[10px] font-black text-[#94a3b8] tracking-widest uppercase whitespace-nowrap">
              Historial
            </h3>
            <svg className="w-3 h-3 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div className="overflow-y-auto flex-1 custom-scrollbar space-y-0.5 pr-0.5">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  navigate(getPath('/chat-general'), { state: { sessionId: conv.id } });
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={`group w-full text-left px-3 py-2 rounded-xl transition-all flex flex-col gap-0.5 border ${
                  isSessionActive(conv.id)
                    ? 'bg-white border-[#1A71B8]/20 shadow-sm'
                    : 'border-transparent hover:bg-[#f8fafc] hover:border-[#e2e8f0]'
                }`}
              >
                <span className={`text-[13px] font-semibold truncate leading-tight ${
                  isSessionActive(conv.id) ? 'text-[#1A71B8]' : 'text-[#0f172a]'
                }`}>
                  {conv.title}
                </span>
                <span className="text-[10px] text-[#94a3b8] font-medium flex items-center gap-1">
                  <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {conv.date
                    ? (() => {
                        const [d, m, y] = conv.date.split('/');
                        return new Date(`${y}-${m}-${d}`).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
                      })()
                    : 'Reciente'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 pt-2">
        {isOpen && (
          <div className="sidebar-fade-in space-y-2">
            {/* Botón Panel Admin */}
            {(usuario?.email === 'admin@convivenciainteligente.com' || usuario?.correo === 'admin@convivenciainteligente.com') && (
              <button
                onClick={() => { navigate('/panel-admin'); if (window.innerWidth < 1024) onToggle(); }}
                className="w-full px-3 py-2 rounded-xl bg-[#1A71B8]/8 text-[#1A71B8] hover:bg-[#1A71B8]/15 transition-colors flex items-center justify-center gap-2 text-xs font-bold border border-[#1A71B8]/15"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                Panel Admin
              </button>
            )}

            <UserProfileMenu
              current={current}
              usuario={usuario}
              navigate={navigate}
              dark
            />

            {/* Info Empresa */}
            {colegiosInfo && colegiosInfo.length > 0 && (
              <div className="px-3 py-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc]">
                <p className="text-xs font-bold text-[#0f172a] truncate mb-0.5">
                  {colegiosInfo[0].nombre}
                </p>
                {colegiosInfo[0].direccion && (
                  <p className="text-[10px] text-[#64748b] break-words leading-tight">
                    {colegiosInfo[0].direccion}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
