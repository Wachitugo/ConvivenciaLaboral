import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

import { API_URL } from '../../services/api';

function LoginForm() {
  const { current, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          correo: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Error al iniciar sesión');
      }

      // Guardar token y datos del usuario en localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      localStorage.setItem('colegios', JSON.stringify(data.colegios_info));

      // Disparar evento personalizado para notificar cambio de sesión
      window.dispatchEvent(new Event('auth-changed'));

      // Redirigir según el rol del usuario
      const userRole = data.usuario?.rol;
      const slugs = data.colegios_info?.map(c => c.slug).filter(Boolean) || [];
      const firstSchoolSlug = slugs[0];
      const destinationBase = firstSchoolSlug ? `/${firstSchoolSlug}` : '';

      if (userRole === 'Trabajador') {
        navigate(`${destinationBase}/chat-general`);
      } else {
        navigate(`${destinationBase}/dashboard`);
      }
    } catch (err) {

      setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const displayError = error;

  return (
    <div className={`w-full  `}>
      {/* Mensaje de error */}
      {displayError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium backdrop-blur-md shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          {displayError}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="text-left">
        <div className="mb-5">
          <label htmlFor="email" className={`block mb-2 text-sm font-semibold text-white/80 tracking-wide`}>
            Correo electrónico
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-5 py-4 text-base border border-[#1A71B8]/40 rounded-xl bg-[#0A3866]/50 text-white placeholder-white/30 focus:outline-none focus:border-[#34B6D8] focus:ring-2 focus:ring-[#34B6D8]/50 transition-all backdrop-blur-sm shadow-inner`}
            placeholder="correo@laboral.cl"
            required
          />
        </div>

        <div className="mb-2">
          <label htmlFor="password" className={`block mb-2 text-sm font-semibold text-white/80 tracking-wide`}>
            Contraseña
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-5 py-4 text-base border border-[#1A71B8]/40 rounded-xl bg-[#0A3866]/50 text-white placeholder-white/30 focus:outline-none focus:border-[#34B6D8] focus:ring-2 focus:ring-[#34B6D8]/50 transition-all backdrop-blur-sm shadow-inner`}
            placeholder="••••••••"
            required
          />
        </div>

        {/* Enlace para recuperar contraseña */}
        {/*        <div className="mb-4 text-right">
          <a href="#" className={`text-xs ${current.textSecondary} hover:underline`}>
            ¿Olvidaste tu contraseña?
          </a>
        </div> */}



        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 mt-8 border border-[#34B6D8]/50 rounded-xl bg-gradient-to-r from-[#1A71B8] to-[#34B6D8] text-white text-base font-bold hover:shadow-[0_0_20px_rgba(52,182,216,0.4)] transition-all cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          {!loading && (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          )}
        </button>
      </form>


      {/* Footer */}
      <div className={`mt-6 text-xs text-white/50 text-center leading-relaxed font-medium`}>
        Al continuar, reconoces la{' '}
        <a href="#" className={`text-[#34B6D8] hover:text-white transition-colors hover:underline`}>
          Política de Privacidad
        </a>{' '}
        y <a href="#" className={`text-[#34B6D8] hover:text-white transition-colors hover:underline`}>Términos y Condiciones</a>
      </div>
    </div>
  );
}

export default LoginForm;
