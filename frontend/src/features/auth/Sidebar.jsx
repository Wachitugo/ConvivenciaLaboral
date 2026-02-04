import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import icon3 from '../../assets/icon3.png';
import UserProfileMenu from './UserProfileMenu';
import { createLogger } from '../../utils/logger';

const logger = createLogger('Sidebar');

function Sidebar({ isOpen, onToggle, conversations, isHidden, schoolSlug }) {
  const { current, isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [usuario, setUsuario] = useState(null);
  const [colegiosInfo, setColegiosInfo] = useState([]);

  // Obtener datos del usuario (localStorage + API refresh)
  useEffect(() => {
    // 1. Carga inicial rápida desde localStorage
    const usuarioData = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');

    if (usuarioData) {
      try {
        setUsuario(JSON.parse(usuarioData));
      } catch (error) {
        logger.error('Error al parsear datos del usuario:', error);
      }
    }

    // 2. Refresh desde API para tener datos frescos (tokens)
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
    // Poll every 10 seconds for live token updates if acceptable
    const intervalId = setInterval(fetchFreshUserData, 10000);

    // Obtener colegios desde localStorage
    const storedColegios = localStorage.getItem('colegios');
    if (storedColegios) {
      try {
        const colegios = JSON.parse(storedColegios);
        setColegiosInfo(colegios);
      } catch (error) {
        logger.error('Error al parsear datos de colegios:', error);
      }
    }

    return () => clearInterval(intervalId);
  }, []);

  const getPath = (path) => schoolSlug ? `/${schoolSlug}${path}` : path;

  const isActive = (relativePath) => {
    const path = getPath(relativePath);
    // Rutas que incluyen sub-rutas (detalle de caso, entrevista, ficha alumno)
    const routesWithSubpages = [getPath('/mis-casos'), getPath('/entrevistas'), getPath('/ficha-alumnos')];

    if (routesWithSubpages.includes(path)) {
      return location.pathname === path || location.pathname.startsWith(`${path}/`);
    }
    // Para chat-general, solo es "Nueva Consulta" si NO hay sessionId en el state
    if (path === getPath('/chat-general')) {
      return location.pathname === path && !location.state?.sessionId;
    }
    return location.pathname === path;
  };

  const isSessionActive = (sessionId) => {
    // Solo marcar como activo si:
    // 1. Estamos en la ruta /chat-general
    // 2. El sessionId del state coincide exactamente
    // 3. El sessionId no es null (para evitar conflictos con "Nueva Consulta")
    return location.pathname === getPath('/chat-general')
      && location.state?.sessionId === sessionId
      && sessionId !== null;
  };

  return (
    <aside
      className={`
        transition-all duration-300 ease-in-out
        flex flex-col bg-white
        fixed inset-y-0 left-0 z-50 h-full bg-gray-50/50 shadow-xl lg:shadow-none
        lg:static lg:h-auto
        ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 lg:w-16'}
        ${isHidden ? 'hidden' : ''}
      `}
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Header del Sidebar */}
      <div className="px-3 py-6 flex justify-between items-center">
        <div className={`flex items-center ${!isOpen ? 'justify-center' : 'gap-2'}`}>
          {isOpen ? (
            <>            <img src={icon3} alt="Convivencia Inteligente" className="h-7 w-7 object-contain" />

              <div className="flex flex-col">

                <h2 className="text-[30] font-bold text-gray-900 text-left whitespace-nowrap">Convivencia Laboral</h2>

              </div>
            </>
          ) : (
            <img src={icon3} alt="Convivencia Inteligente" className="h-7 w-7 object-contain" />
          )}
        </div>
      </div>

      {/* Menu de Navegación */}
      <nav className="flex-1 px-3 py- flex flex-col overflow-hidden">
        {/* Roles con acceso completo */}
        {usuario?.rol !== 'Trabajador' && (
          <>
            {/* Principal / Dashboard */}
            <button
              onClick={() => {
                navigate(getPath('/dashboard'));
                if (window.innerWidth < 1024) onToggle();
              }}
              className={`w-full px-2 py-2.5 rounded-xl transition-colors flex items-center text-sm font-medium mb-1 ${!isOpen ? 'justify-center' : 'gap-3'} ${isActive('/dashboard')
                ? 'bg-blue-50 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              title={!isOpen ? "Principal" : ""}
            >
              <span className={`${isActive('/dashboard') ? 'text-blue-600' : 'text-gray-500'}`}>
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </span>
              {isOpen && <span className="whitespace-nowrap">Reporte</span>}
            </button>
          </>
        )}

        {/* Nueva Consulta / Chat - Visible para todos los roles */}
        <button
          onClick={() => {
            navigate(getPath('/chat-general'), {
              state: {
                sessionId: null,
                newConsultaTimestamp: Date.now()
              },
              replace: false
            });
            if (window.innerWidth < 1024) onToggle();
          }}
          className={`w-full px-2 py-2 rounded-xl transition-colors flex items-center text-sm font-medium mb-1 ${!isOpen ? 'justify-center' : 'gap-3'} ${isActive('/chat-general')
            ? 'bg-blue-50 text-blue-700 shadow-sm'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          title={!isOpen ? "Nueva Consulta" : ""}
        >
          <span className={`${isActive('/chat-general') ? 'text-blue-600' : 'text-gray-500'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </span>
          {isOpen && <span className="whitespace-nowrap">Nueva Consulta</span>}
        </button>

        {/* Secciones solo para roles con acceso completo */}
        {usuario?.rol !== 'Trabajador' && (
          <>
            {/* Mis Casos */}
            <button
              onClick={() => {
                navigate(getPath('/mis-casos'));
                if (window.innerWidth < 1024) onToggle();
              }}
              className={`w-full px-2 py-2 rounded-xl transition-colors flex items-center text-sm font-medium mb-1 ${!isOpen ? 'justify-center' : 'gap-3'} ${isActive('/mis-casos')
                ? 'bg-blue-50 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              title={!isOpen ? "Mis Casos" : ""}
            >
              <span className={`${isActive('/mis-casos') ? 'text-blue-600' : 'text-gray-500'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
              </span>
              {isOpen && <span className="whitespace-nowrap">Mis Casos</span>}
            </button>

            {/* Entrevistas */}
            <button
              onClick={() => {
                navigate(getPath('/entrevistas'));
                if (window.innerWidth < 1024) onToggle();
              }}
              className={`w-full px-2 py-2 rounded-xl transition-colors flex items-center text-sm font-medium mb-1 ${!isOpen ? 'justify-center' : 'gap-3'} ${isActive('/entrevistas')
                ? 'bg-blue-50 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              title={!isOpen ? "Entrevistas" : ""}
            >
              <span className={`${isActive('/entrevistas') ? 'text-blue-600' : 'text-gray-500'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </span>
              {isOpen && <span className="whitespace-nowrap">Entrevistas</span>}
            </button>

            {/* Ficha de Trabajadores - Solo para roles con acceso completo */}
            <button
              onClick={() => {
                navigate(getPath('/ficha-alumnos'));
                if (window.innerWidth < 1024) onToggle();
              }}
              className={`w-full px-2 py-2 rounded-xl transition-colors flex items-center text-sm font-medium ${!isOpen ? 'justify-center' : 'gap-3'} ${isActive('/ficha-alumnos')
                ? 'bg-blue-50 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              title={!isOpen ? "Ficha de Trabajadores" : ""}
            >
              <span className={`${isActive('/ficha-alumnos') ? 'text-blue-600' : 'text-gray-500'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </span>
              {isOpen && <span className="whitespace-nowrap">Ficha de Trabajadores</span>}
            </button>

            {/* Separador - solo para roles con acceso completo */}
            <div className="my-4 h-px bg-gray-200"></div>
          </>
        )}

        {/* Sección Recientes - solo mostrar si está abierto y no es Trabajador */}
        <div className={`flex-1 flex flex-col overflow-hidden ${isOpen && usuario?.rol !== 'Trabajador' ? 'sidebar-fade-in' : 'hidden'}`}>
          <div className="px-2 mb-2 flex-shrink-0">
            <h3 className="text-[12px] font-bold text-gray-500 tracking-wide whitespace-nowrap">
              Recientes
            </h3>
          </div>

          {/* Lista de conversaciones - scrolleable */}
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  navigate(getPath('/chat-general'), { state: { sessionId: conv.id } });
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-[13px] truncate whitespace-nowrap flex items-center justify-between group transition-colors ${isSessionActive(conv.id)
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <span className="truncate">{conv.title}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
      {/* Footer del Sidebar */}
      <div className="p-3 ">
        {isOpen && (
          /* Perfil completo cuando está abierto */
          <div className="sidebar-fade-in">
            {/* Botón Panel Admin (Solo para admin) */}
            {(usuario?.email === 'admin@convivenciainteligente.com' || usuario?.correo === 'admin@convivenciainteligente.com') && (
              <button
                onClick={() => {
                  navigate('/panel-admin');
                  if (window.innerWidth < 1024) onToggle();
                }}
                className="w-full mb-2 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-xs font-semibold border border-blue-100"
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
            />

            {/* Información del Colegio */}
            {colegiosInfo && colegiosInfo.length > 0 && (
              <div className="px-3 py-2 rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-start gap-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 mb-1 whitespace-nowrap">
                      {colegiosInfo[0].nombre}
                    </p>
                    {colegiosInfo[0].direccion && (
                      <p className="text-xs text-gray-600 break-words">
                        {colegiosInfo[0].direccion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
