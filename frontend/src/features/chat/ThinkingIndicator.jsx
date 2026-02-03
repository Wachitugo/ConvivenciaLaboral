import iconLoading from '../../assets/icon3.png';
import { useTheme } from '../../contexts/ThemeContext';

function ThinkingIndicator({ text }) {
  const { current } = useTheme();

  return (
    <div className="flex items-center gap-3 py-3 px-2 animate-fade-in select-none">
      {/* Animated Filled Isotype */}
      {/* Animated Swirl Logo (4-Color, Symmetric) */}
      <div className="relative w-8 h-8 flex items-center justify-center animate-sparkle-pulse">
        <img
          src={iconLoading}
          alt="Thinking..."
          className="w-full h-full drop-shadow-sm animate-spin"
        />
        {/* Soft Glow */}
        <div className="absolute w-5 h-5 bg-blue-400/30 rounded-full blur-md animate-pulse"></div>
      </div>

      {/* Text with Shimmer Effect (Grayscale) */}
      <div className="flex items-center gap-2">
        <span
          className="text-sm font-medium bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600 dark:from-gray-400 dark:via-gray-300 dark:to-gray-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {text || "Generando respuesta"}
        </span>

      </div>
    </div>
  );
}

export default ThinkingIndicator;