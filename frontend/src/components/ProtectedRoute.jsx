import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    // Verificar si existe el token en localStorage
    // Esta es una verificación básica del lado del cliente.
    // La seguridad real viene del backend que validará el token en cada petición.
    const token = localStorage.getItem('token');

    if (!token) {
        // Si no hay token, redirigir al login
        return <Navigate to="/" replace />;
    }

    // Si hay token, renderizar el contenido de la ruta (Outlet)
    return <Outlet />;
};

export default ProtectedRoute;
