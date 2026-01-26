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

      if (userRole === 'Docente') {
        navigate(`${destinationBase}/ficha-alumnos`);
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
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {displayError}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="text-left">
        <div className="mb-3">
          <label htmlFor="email" className={`block mb-1.5 text-sm font-medium ${current.textPrimary}`}>
            Correo electrónico
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-4 py-3.5 text-base border ${current.formBorder} rounded-xl ${current.inputBg} ${current.textSecondary} placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500`}
            placeholder="correo@educacional.cl"
            required
          />
        </div>

        <div className="mb-2">
          <label htmlFor="password" className={`block mb-1.5 text-sm font-medium ${current.textPrimary}`}>
            Contraseña
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-4 py-3.5 text-base border ${current.formBorder} rounded-xl ${current.inputBg} ${current.textSecondary} placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500`}
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
          className="w-full flex items-center justify-center gap-2 px-6 py-4 mt-8 border-none rounded-xl bg-blue-600 text-white text-base font-semibold hover:bg-blue-700 transition-all cursor-pointer shadow-md hover:shadow-lg disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          {!loading && (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          )}
        </button>
      </form>


      {/* Footer */}
      <div className={`mt-4 text-xs ${current.textMuted} text-center`}>
        Al continuar, reconoces la{' '}
        <a href="#" className={`${current.textSecondary} hover:underline`}>
          Política de Privacidad
        </a>{' '}
        y Términos y Condiciones
      </div>
    </div>
  );
}

export default LoginForm;
