import { createContext, useContext, useState, useEffect } from 'react';
import { createLogger } from '../utils/logger';

const logger = createLogger('LayoutContext');

const LayoutContext = createContext();

export function LayoutProvider({ children }) {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    // Cargar datos críticos del sidebar
    const loadInitialData = async () => {
      try {
        // Esperar un mínimo de tiempo para que se vea el skeleton
        const minLoadTime = new Promise(resolve => setTimeout(resolve, 800));

        // Cargar datos de localStorage que el sidebar necesita
        const loadLocalStorage = new Promise(resolve => {
          // Simular lectura de localStorage
          const usuario = localStorage.getItem('usuario');
          const colegios = localStorage.getItem('colegios');
          resolve({ usuario, colegios });
        });

        // Esperar ambas promesas
        await Promise.all([minLoadTime, loadLocalStorage]);

        // Datos cargados, ocultar skeleton
        setIsInitialLoading(false);
      } catch (error) {
        logger.error('Error loading initial data:', error);
        // En caso de error, ocultar skeleton después de un tiempo
        setTimeout(() => setIsInitialLoading(false), 1000);
      }
    };

    loadInitialData();
  }, []);

  return (
    <LayoutContext.Provider value={{ isInitialLoading }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
