import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import iconLogin from '../assets/icon-login-new.svg';
import icon3 from '../assets/icon3.png';

function NavigateToSchoolDefault({ dest = 'dashboard' }) {
    const navigate = useNavigate();
    const [sinOrganizacion, setSinOrganizacion] = useState(false);

    useEffect(() => {
        try {
            const storedColegios = localStorage.getItem('colegios');
            if (storedColegios) {
                const colegios = JSON.parse(storedColegios);
                if (colegios && colegios.length > 0) {
                    const slug = colegios[0].slug;
                    if (slug) {
                        navigate(`/${slug}/${dest}`, { replace: true });
                        return;
                    }
                }
            }
            console.warn("No school slug found for redirect.");
            setSinOrganizacion(true);
        } catch (e) {
            console.error("Error in NavigateToSchoolDefault", e);
            setSinOrganizacion(true);
        }
    }, [navigate, dest]);

    if (sinOrganizacion) {
        const usuario = (() => {
            try { return JSON.parse(localStorage.getItem('usuario')); } catch { return null; }
        })();

        const initials = usuario?.nombre
            ? usuario.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
            : '?';

        return (
            <div className="flex w-full h-screen overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>

                {/* Panel izquierdo — imagen (igual que login) */}
                <div className="hidden lg:flex lg:w-2/3 bg-blue-600 relative flex-shrink-0">
                    <img
                        src={iconLogin}
                        alt="Convivencia Laboral"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-8 left-8 flex items-center gap-2 z-20">
                        <img src={icon3} alt="Convivencia Laboral" className="h-12 w-12 object-contain" />
                        <div className="flex flex-col">
                            <span className="text-base font-bold text-white whitespace-nowrap">Convivencia Laboral</span>
                            <span className="text-[10px] font-bold text-gray-100 whitespace-nowrap">Armonizando la convivencia en tu ambiente laboral</span>
                        </div>
                    </div>
                </div>

                {/* Panel derecho — mensaje */}
                <div className="w-full lg:w-1/3 flex flex-col items-center justify-center bg-white px-8">
                    <div className="w-full max-w-sm">

                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-5 text-blue-600 font-bold text-xl shadow-sm">
                            {initials}
                        </div>

                        {/* Nombre y rol */}
                        <div className="text-center mb-6">
                            {usuario?.nombre && (
                                <p className="text-xs text-gray-400 mb-0.5">Bienvenido/a,</p>
                            )}
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                {usuario?.nombre || 'Usuario'}
                            </h2>
                            {usuario?.rol && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                    {usuario.rol}
                                </span>
                            )}
                        </div>

                        <div className="h-px bg-gray-100 mb-6" />

                        {/* Mensaje */}
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6 text-center">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                            </div>
                            <h3 className="text-sm font-bold text-amber-800 mb-1">Sin organización asignada</h3>
                            <p className="text-xs text-amber-700 leading-relaxed">
                                Tu cuenta está activa pero aún no tiene una organización asociada. Comunícate con el administrador para completar tu configuración.
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                localStorage.clear();
                                navigate('/', { replace: true });
                            }}
                            className="w-full py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors shadow-sm"
                        >
                            Volver al inicio de sesión
                        </button>

                        <p className="text-xs text-gray-400 text-center mt-8">© 2025 Convivencia Laboral</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Redirigiendo...</p>
            </div>
        </div>
    );
}

export default NavigateToSchoolDefault;
