import { useTheme } from '../../contexts/ThemeContext';

function ThinkingIndicator({ text }) {
  const { current } = useTheme();

  return (
    <div className="flex items-center gap-3 py-3 px-2 animate-fade-in select-none">
      {/* Animated Filled Isotype */}
      {/* Animated Swirl Logo (4-Color, Symmetric) */}
      <div className="relative w-8 h-8 flex items-center justify-center animate-sparkle-pulse">
        <svg
          className="w-full h-full drop-shadow-sm animate-spin-slow"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g transform="translate(12,12)">
            {/* Blade Path Definition: Starts near center, curves out, sharp outer edge */}
            {/* Top Right (0 deg) - Blue-600 */}
            <path
              d="M1.5 -1.5 Q 6 -8 11 -5 L 11 0 Q 6 1 1.5 -1.5 Z"
              fill="#2563EB"
              transform="rotate(0)"
            />
            {/* Bottom Right (90 deg) - Lime-500 */}
            <path
              d="M1.5 -1.5 Q 6 -8 11 -5 L 11 0 Q 6 1 1.5 -1.5 Z"
              fill="#84CC16"
              transform="rotate(90)"
            />
            {/* Bottom Left (180 deg) - Teal-400 */}
            <path
              d="M1.5 -1.5 Q 6 -8 11 -5 L 11 0 Q 6 1 1.5 -1.5 Z"
              fill="#2DD4BF"
              transform="rotate(180)"
            />
            {/* Top Left (270 deg) - Blue-400 */}
            <path
              d="M1.5 -1.5 Q 6 -8 11 -5 L 11 0 Q 6 1 1.5 -1.5 Z"
              fill="#60A5FA"
              transform="rotate(270)"
            />
          </g>
        </svg>
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