import { Navigate, Outlet, useLocation, useParams, useOutletContext } from 'react-router-dom';

/**
 * Roles con acceso completo al sistema
 */
const FULL_ACCESS_ROLES = ['Encargado de Convivencia', 'Directivo'];

/**
 * Rutas permitidas para rol Trabajador (y sus subrutas)
 */
const TRABAJADOR_ALLOWED_PATHS = ['/chat-general'];

/**
 * Página por defecto para Trabajadores
 */
const TRABAJADOR_DEFAULT_PATH = '/chat-general';

/**
 * Componente de ruta protegida con control de roles.
 * 
 * @param {Object} props
 * @param {boolean} props.requireFullAccess - Si true, solo permite roles con acceso completo
 */
const RoleProtectedRoute = ({ requireFullAccess = false }) => {
    const location = useLocation();
    const context = useOutletContext(); // Capture context from parent (MainLayout)

    const { schoolSlug } = useParams();

    // Verificación de token y usuario...
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/" replace />;

    const usuarioStr = localStorage.getItem('usuario');
    if (!usuarioStr) return <Navigate to="/" replace />;

    let usuario;
    try { usuario = JSON.parse(usuarioStr); } catch { return <Navigate to="/" replace />; }

    const userRole = usuario?.rol;

    // Si el usuario tiene acceso completo, permitir todo
    if (FULL_ACCESS_ROLES.includes(userRole)) {
        return <Outlet context={context} />;
    }

    // Para Trabajadores: verificar si la ruta está permitida
    if (userRole === 'Trabajador') {
        // Ajustar paths permitidos con el slug si existe
        const adjustPath = (path) => schoolSlug ? `/${schoolSlug}${path}` : path;

        const defaultPath = adjustPath(TRABAJADOR_DEFAULT_PATH);

        // Si la ruta requiere acceso completo, redirigir
        if (requireFullAccess) {
            return <Navigate to={defaultPath} replace />;
        }

        // Verificar si la ruta actual está en las permitidas
        // Nota: TRABAJADOR_ALLOWED_PATHS contiene rutas base como '/chat-general'
        const isAllowed = TRABAJADOR_ALLOWED_PATHS.some(basePath => {
            const pathToCheck = adjustPath(basePath);
            return location.pathname === pathToCheck || location.pathname.startsWith(`${pathToCheck}/`);
        });

        if (!isAllowed) {
            return <Navigate to={defaultPath} replace />;
        }

        return <Outlet context={context} />;
    }

    // Para otros roles no reconocidos, redirigir al login
    return <Navigate to="/" replace />;
};

export default RoleProtectedRoute;
