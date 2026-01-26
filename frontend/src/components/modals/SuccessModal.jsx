import { useEffect } from 'react';

function SuccessModal({
  isOpen,
  onClose,
  title = '¡Éxito!',
  message = 'La operación se completó correctamente.',
  autoClose = true,
  autoCloseDelay = 3000,
  buttonText = 'Aceptar'
}) {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {/* Body */}
        <div className="p-6">
          {/* Icono de éxito con animación */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="absolute inset-0 bg-green-500 rounded-full opacity-20 animate-ping"></div>
            </div>
          </div>

          {/* Título */}
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
            {title}
          </h2>

          {/* Mensaje */}
          <p className="text-sm text-gray-600 text-center mb-6">
            {message}
          </p>

          {/* Botón */}
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all shadow-lg"
          >
            {buttonText}
          </button>

          {/* Indicador de auto-close */}
          {autoClose && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Se cerrará automáticamente en {autoCloseDelay / 1000}s</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SuccessModal;
