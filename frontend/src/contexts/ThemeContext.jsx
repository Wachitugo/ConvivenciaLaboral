import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const theme = {
    isDark,
    toggleTheme,
    // Colores para modo oscuro
    dark: {
      bg: 'bg-gray-900',
      cardBg: 'bg-gray-800',                   // Cambié a gray-800 para que se vea sobre gray-900
      cardBorder: 'border-gray-700',           // Borde visible en modo oscuro
      formBg: 'bg-gray-700',
      formBorder: 'border-gray-600',
      inputBg: 'bg-gray-800',
      inputBorder: 'border-gray-600',
      textPrimary: 'text-white',
      textSecondary: 'text-gray-300',
      textMuted: 'text-gray-400',
      linkHover: 'hover:text-white',
    },
    // Colores para modo claro - Paleta minimalista azul/beige/menta
    light: {
      bg: 'bg-gray-50',                          // Fondo blanco puro
      cardBg: 'bg-white',                 // Azul muy suave para tarjetas
      cardBorder: 'border-gray-100',           // Borde azul claro
      formBg: 'bg-stone-50',                   // Beige/crema suave para formularios
      formBorder: 'border-stone-200',          // Borde beige claro
      inputBg: 'bg-white',                     // Inputs blancos
      inputBorder: 'border-gray-400',          // Borde azul claro para inputs
      textPrimary: 'text-slate-800',           // Texto principal oscuro pero suave
      textSecondary: 'text-gray-600',         // Texto secundario
      textMuted: 'text-slate-400',             // Texto apagado
      linkHover: 'hover:text-blue-600',        // Hover azul
    }
  };

  const current = isDark ? theme.dark : theme.light;

  return (
    <ThemeContext.Provider value={{ ...theme, current, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
