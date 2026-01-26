import { useRef, useEffect } from 'react';

export default function useAutoScroll(dependencies = []) {
  const endRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    // Usar setTimeout para asegurar que el DOM esté renderizado
    // Especialmente importante para listas grandes
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      try {
        endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      } catch (error) {
        console.warn('Error scrolling to bottom:', error);
        // Fallback: scroll directo sin smooth
        endRef.current?.scrollIntoView();
      }
    }, 0);
  };

  useEffect(() => {
    scrollToBottom();
    
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, dependencies);

  return { endRef, scrollToBottom };
}

