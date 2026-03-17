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
    <div className={`h-screen bg-gray-700 w-full overflow-hidden relative`}>

      {/* Escena decorativa de escritorio — fondo de página */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 1200 380"
          preserveAspectRatio="xMidYMax meet"
          fill="none"
          opacity="0.6"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* ── MESA ── */}
          <rect x="0" y="304" width="1200" height="76" fill="#dde8f4"/>
          <rect x="0" y="300" width="1200" height="6" rx="1" fill="#1A71B8" opacity="0.35"/>
          <rect x="0" y="356" width="1200" height="24" fill="#0A3866" opacity="0.14"/>
          <rect x="60"   y="364" width="14" height="16" rx="3" fill="#0A3866" opacity="0.12"/>
          <rect x="1126" y="364" width="14" height="16" rx="3" fill="#0A3866" opacity="0.12"/>

          {/* ── SOMBRAS ── */}
          <ellipse cx="198"  cy="306" rx="96"  ry="5" fill="#0A3866" opacity="0.07"/>
          <ellipse cx="583"  cy="306" rx="130" ry="6" fill="#0A3866" opacity="0.06"/>
          <ellipse cx="872"  cy="306" rx="56"  ry="5" fill="#0A3866" opacity="0.07"/>
          <ellipse cx="1025" cy="306" rx="52"  ry="5" fill="#0A3866" opacity="0.06"/>

          {/* ══════════════════════════════════════ */}
          {/* ── LIBROS (x: 100–285) ── */}
          {/* ══════════════════════════════════════ */}

          {/* Libro 1 — Azul marino, el más alto */}
          <rect x="108" y="156" width="52" height="148" rx="4" fill="#0A3866"/>
          <rect x="108" y="156" width="15" height="148" rx="4" fill="#1A71B8"/>
          <rect x="110" y="159" width="4"  height="142" rx="2" fill="#fff" opacity="0.3"/>
          <rect x="110" y="156" width="50" height="4"   rx="1" fill="#e0edf8" opacity="0.9"/>
          <rect x="158" y="159" width="4"  height="142" rx="1" fill="#e0edf8" opacity="0.85"/>
          <rect x="127" y="188" width="27" height="7"   rx="2" fill="#34B6D8" opacity="0.95"/>
          <rect x="127" y="202" width="21" height="5"   rx="2" fill="#34B6D8" opacity="0.7"/>
          <rect x="127" y="213" width="24" height="5"   rx="2" fill="#34B6D8" opacity="0.6"/>
          <rect x="128" y="258" width="24" height="18"  rx="3" fill="#34B6D8" opacity="0.7"/>

          {/* Libro 2 — Rojo, mediano */}
          <rect x="164" y="178" width="48" height="126" rx="4" fill="#7f1d1d"/>
          <rect x="164" y="178" width="13" height="126" rx="4" fill="#ef4444"/>
          <rect x="166" y="181" width="4"  height="120" rx="2" fill="#fff" opacity="0.3"/>
          <rect x="166" y="178" width="46" height="4"   rx="1" fill="#fef2f2" opacity="0.9"/>
          <rect x="210" y="181" width="4"  height="120" rx="1" fill="#fef2f2" opacity="0.85"/>
          <rect x="181" y="207" width="25" height="7"   rx="2" fill="#fca5a5" opacity="0.95"/>
          <rect x="181" y="220" width="19" height="5"   rx="2" fill="#fca5a5" opacity="0.7"/>
          <rect x="181" y="252" width="22" height="17"  rx="3" fill="#dc2626" opacity="0.7"/>

          {/* Libro 3 — Teal, alto-mediano */}
          <rect x="216" y="166" width="50" height="138" rx="4" fill="#0e4155"/>
          <rect x="216" y="166" width="14" height="138" rx="4" fill="#34B6D8"/>
          <rect x="218" y="169" width="4"  height="132" rx="2" fill="#fff" opacity="0.3"/>
          <rect x="218" y="166" width="48" height="4"   rx="1" fill="#e0f7fa" opacity="0.9"/>
          <rect x="264" y="169" width="4"  height="132" rx="1" fill="#e0f7fa" opacity="0.85"/>
          <rect x="235" y="196" width="26" height="7"   rx="2" fill="#fff" opacity="0.9"/>
          <rect x="235" y="209" width="19" height="5"   rx="2" fill="#fff" opacity="0.65"/>
          <rect x="235" y="250" width="24" height="17"  rx="3" fill="#0891b2" opacity="0.7"/>

          {/* Separador / marcador */}
          <rect x="272" y="180" width="7" height="124" rx="3" fill="#34B6D8" opacity="0.85"/>

        

          {/* ══════════════════════════════════════ */}
          {/* ── TAZA DE CAFÉ (cx: 872) ── */}
          {/* ══════════════════════════════════════ */}

          {/* Platillo */}
          <ellipse cx="872" cy="301" rx="60" ry="8"   fill="#fde68a"/>
          <ellipse cx="872" cy="299" rx="46" ry="5.5" fill="#fbbf24"/>

          {/* Cuerpo de la taza (trapezoide) */}
          <path d="M 836 299 L 841 220 L 903 220 L 908 299 Z" fill="#fef3c7"/>
          <path d="M 835 299 L 840 218 L 904 218 L 909 299" stroke="#d97706" strokeWidth="2" fill="none" strokeLinejoin="round"/>

          {/* Café en el interior */}
          <ellipse cx="872" cy="221" rx="31" ry="8" fill="#431407"/>
          <ellipse cx="864" cy="219" rx="10" ry="4" fill="#78350f" opacity="0.7"/>
          {/* Rim superior de la taza */}
          <ellipse cx="872" cy="219" rx="33" ry="8.5" fill="none" stroke="#d97706" strokeWidth="2.5"/>

          {/* Línea decorativa en el cuerpo */}
          <path d="M 841 262 Q 872 268 903 262" stroke="#d97706" strokeWidth="1.5" fill="none" opacity="0.5"/>

          {/* Asa */}
          <path d="M 907 246 Q 942 246 942 264 Q 942 282 907 282" stroke="#d97706" strokeWidth="6" strokeLinecap="round" fill="none"/>
          <path d="M 907 247 Q 936 247 936 264 Q 936 281 907 281" stroke="#fef3c7" strokeWidth="3" strokeLinecap="round" fill="none"/>

          {/* Vapor / steam */}
          <path d="M 854 212 Q 849 198 854 184 Q 859 170 854 156" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4"/>
          <path d="M 872 209 Q 867 194 872 179 Q 877 164 872 149" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4"/>
          <path d="M 890 212 Q 885 198 890 184 Q 895 170 890 156" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4"/>

          {/* ══════════════════════════════════════ */}
          {/* ── PLANTA (cx: 1025) ── */}
          {/* ══════════════════════════════════════ */}

          {/* Maceta */}
          <path d="M 987 304 L 992 252 L 1058 252 L 1063 304 Z" fill="#ea580c"/>
          <path d="M 988 290 L 1062 290" stroke="#c2410c" strokeWidth="2" opacity="0.6"/>
          {/* Borde superior maceta */}
          <rect x="985" y="248" width="80" height="8" rx="3" fill="#c2410c"/>
          {/* Tierra */}
          <ellipse cx="1025" cy="252" rx="35" ry="7"   fill="#1c1917"/>
          <ellipse cx="1025" cy="250" rx="28" ry="4.5" fill="#292524" opacity="0.7"/>

          {/* Hoja izquierda grande */}
          <path d="M 1024 247 Q 975 228 960 192 Q 954 164 978 168 Q 1004 173 1024 247" fill="#15803d"/>
          <path d="M 1024 247 Q 968 212 971 175" stroke="#166534" strokeWidth="1.5" fill="none" opacity="0.7"/>

          {/* Hoja derecha grande */}
          <path d="M 1026 247 Q 1075 226 1090 190 Q 1096 162 1072 166 Q 1046 171 1026 247" fill="#16a34a"/>
          <path d="M 1026 247 Q 1082 210 1079 173" stroke="#15803d" strokeWidth="1.5" fill="none" opacity="0.7"/>

          {/* Hoja central (hacia arriba) */}
          <path d="M 1025 247 Q 1015 207 1021 166 Q 1023 142 1025 126 Q 1027 142 1029 166 Q 1035 207 1025 247" fill="#22c55e"/>
          <line x1="1025" y1="247" x2="1025" y2="130" stroke="#16a34a" strokeWidth="1.5" opacity="0.6"/>

          {/* Hoja izquierda media */}
          <path d="M 1019 234 Q 988 217 978 191 Q 973 171 991 175 Q 1009 179 1019 234" fill="#4ade80" opacity="0.9"/>

          {/* Hoja derecha media */}
          <path d="M 1031 231 Q 1062 213 1072 187 Q 1077 167 1059 171 Q 1041 175 1031 231" fill="#4ade80" opacity="0.9"/>

          {/* Brillos en hojas */}
          <path d="M 994 197 Q 997 191 1007 207" stroke="#bbf7d0" strokeWidth="1.5" opacity="0.7" fill="none"/>
          <path d="M 1056 193 Q 1053 187 1043 203" stroke="#bbf7d0" strokeWidth="1.5" opacity="0.7" fill="none"/>
        </svg>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => toggleSidebar()}
        />
      )}

      {/* Sidebar flotante - siempre fixed, no ocupa espacio en el flujo */}
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

      {/* Contenedor principal con margen izquierdo para no quedar bajo el sidebar flotante */}
      <main className={`
        h-full flex flex-col relative
    
        transition-all duration-300 ease-in-out
        overflow-hidden
        ${isSidebarOpen ? 'lg:pl-[320px]' : 'lg:pl-[100px]'}
        p-4
      `}>
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
