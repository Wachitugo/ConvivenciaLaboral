import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useLayout } from '../contexts/LayoutContext';
import Sidebar from '../features/auth/Sidebar';
import SidebarSkeleton from '../features/auth/SidebarSkeleton';
import { chatService } from '../services/api';
import { createLogger } from '../utils/logger';

const logger = createLogger('MainLayout');

function MainLayout() {
  const { current } = useTheme();
  const { isInitialLoading } = useLayout();
  const location = useLocation();
  const { schoolSlug } = useParams(); // Get slug from URL
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [conversations, setConversations] = useState([]);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false); // Forzar ocultar sidebar

  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  const loadSessions = useCallback(async () => {
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario'));
      const userId = usuario?.id;
      const sessions = await chatService.getSessions(userId);
      if (Array.isArray(sessions)) {
        setConversations(sessions);
      } else {
        logger.error("Sessions response is not an array:", sessions);
        setConversations([]);
      }
    } catch (error) {
      logger.error("Error loading sessions:", error);
      setConversations([]);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Cerrar sidebar automáticamente al redimensionar a móvil
  // Verificar tamaño al montar (por si carga en móvil con preferencia guardada 'true')
  useEffect(() => {
    if (window.innerWidth < 1280) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Cerrar sidebar automáticamente al redimensionar
  useEffect(() => {
    const handleResize = () => {
      // 1280px es el breakpoint 'xl' - ahora usamos este para el sidebar persistente
      if (window.innerWidth < 1280 && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={`h-screen bg-white w-full flex overflow-hidden`}>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => toggleSidebar()}
        />
      )}

      {/* Sidebar - se carga una sola vez */}
      {isInitialLoading ? (
        <SidebarSkeleton isOpen={isSidebarOpen} />
      ) : (
        <Sidebar
          isOpen={isSidebarOpen}
          isHidden={isSidebarHidden}
          onToggle={toggleSidebar}
          conversations={conversations}
          schoolSlug={schoolSlug}
        />
      )}

      {/* Contenedor principal - aquí se renderiza el contenido de cada página */}
      <main className={`flex-1 flex flex-col relative pl-2 lg:pl-0 pt-2 pb-2 pr-2 overflow-hidden`}>
        {/* Mobile Header */}
        <Outlet
          key={
            location.pathname === '/chat-general'
              ? `chat-${location.state?.sessionId || 'new'}-${location.state?.newConsultaTimestamp || ''}`
              : location.pathname
          }
          context={{
            isSidebarOpen,
            toggleSidebar,
            isInitialLoading,
            refreshConversations: loadSessions,
            closeSidebar: () => setIsSidebarOpen(false),
            setSidebarHidden: setIsSidebarHidden
          }}
        />
      </main>
    </div>
  );
}

export default MainLayout;
