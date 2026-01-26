// En producción, usar proxy de Nginx (ruta relativa)
// En desarrollo local, cambiar a: "http://localhost:8000/api/v1"
// Detectar automáticamente el entorno
const isLocalhost = window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1';

window._env_ = {
    // En localhost: usar backend local en puerto 8000
    // En producción: usar proxy de Nginx (ruta relativa)
    VITE_API_URL: isLocalhost ? "http://localhost:8000/api/v1" : "/api/v1",
    VITE_GOOGLE_CLIENT_ID: "YOUR_GOOGLE_CLIENT_ID",
};
