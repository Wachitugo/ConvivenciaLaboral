import { useTheme } from '../../contexts/ThemeContext';
import iconLogin from '../../assets/icon-login-new.svg';
import icon3 from '../../assets/icon3.svg';
import LoginForm from './LoginForm';

function LoginContainer({ onClose }) {
  const { current } = useTheme();

  return (
    <div className="flex items-center justify-center w-full h-full bg-gray-50 overflow-hidden">
      <div className="flex flex-col lg:flex-row w-full h-full bg-white overflow-hidden">

        {/* Imagen a la izquierda */}
        <div className="hidden lg:flex lg:w-2/3 bg-blue-600 relative">

          <img
            src={iconLogin}
            alt="Convivencia Inteligente"
            className="w-full h-full object-cover"
          />

          {/* Logo en la esquina inferior izquierda del panel izquierdo */}
          <div className="absolute bottom-8 left-8 flex items-center justify-start gap-1 z-20">
            <img src={icon3} alt="Convivencia Inteligente" className="h-12 w-12 object-contain" />
            <div className="flex flex-col items-start">
              <h2 className="text-base font-bold text-white text-left whitespace-nowrap">Convivencia Inteligente</h2>
              <h2 className="text-[10px] font-bold text-gray-100 text-left whitespace-nowrap">Armonizando la convivencia laboral</h2>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/3 flex flex-col items-center justify-center bg-white relative h-full">
          <div className="max-w-lg w-full bg-white p-10">
            <div className="mb-10 text-center">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Bienvenido</h1>
              <p className="text-gray-500 text-sm mt-5">Ingresa con tus credenciales para acceder al sistema de gestión.</p>
            </div>

            <LoginForm />

            <div className="mt-12 text-center">
              <p className="text-xs text-gray-400">© 2025 Convivencia Inteligente</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default LoginContainer;
