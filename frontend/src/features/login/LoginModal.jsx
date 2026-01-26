import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import LoginContainer from './LoginContainer';

function LoginModal({ isOpen, onClose }) {
  const { current } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Pequeño delay para que la animación se vea
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí iría la lógica de autenticación
    // Login attempt
    // Por ahora solo cerramos el modal
    handleClose();
  };

  const handleClose = () => {
    setIsAnimating(false);
    // Esperar a que termine la animación antes de cerrar
    setTimeout(() => {
      onClose();
    }, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
    >
      {/* Overlay con blur y oscurecimiento */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-all duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'
          }`}
        onClick={handleClose}
      />

      {/* Contenedor del LoginContainer con animación */}
      <div
        className={`relative z-10 transition-all duration-300 transform ${isAnimating
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-95 opacity-0 translate-y-4'
          }`}
      >
        <LoginContainer onClose={handleClose} />
      </div>
    </div>
  );
}

export default LoginModal;
