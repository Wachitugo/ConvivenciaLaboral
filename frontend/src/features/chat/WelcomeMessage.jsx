import { useTheme } from '../../contexts/ThemeContext';
import iconChat from '../../assets/iconchat.svg';

function WelcomeMessage() {
  const { current } = useTheme();

  return (
    <div className="flex flex-col items-center justify-center w-full px-4 py-4">
      {/* Ícono educativo */}
      <div className="flex justify-center mb-8">
        <div className="w-30 h-30 rounded-full flex items-center justify-center shadow-xl shadow-teal-500/30 transform hover:scale-105 transition-transform duration-300" style={{ backgroundColor: '#579991' }}>
          <img
            src={iconChat}
            alt="Logo Savia"
            className="h-48 cursor-pointer"
          />
        </div>
      </div>

      <h2 className={`text-3xl font-bold ${current.textPrimary} mb- text-center`}>
        ¿En qué puedo ayudarte hoy?
      </h2>
    </div>
  );
}

export default WelcomeMessage;
