import { createPortal } from 'react-dom';

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Estás seguro?',
  message = 'Esta acción no se puede deshacer.',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmButtonClass = 'bg-red-500 hover:bg-red-600',
  icon = 'warning', // 'warning', 'danger', 'info'
  isLoading = false,
  loadingText = 'Procesando...'
}) {
  if (!isOpen) return null;

  const icons = {
    warning: (
      <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
        <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    ),
    danger: (
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </div>
    ),
    info: (
      <div className="w-14 h-14 rounded-2xl bg-[#1A71B8]/10 border border-[#1A71B8]/20 flex items-center justify-center">
        <svg className="w-7 h-7 text-[#34B6D8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    )
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={isLoading ? undefined : onClose}
    >
      <div
        className="bg-[#0A3866]/95 backdrop-blur-3xl border border-[#1A71B8]/30 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        <div className="p-6">
          {/* Ícono */}
          <div className="flex justify-center mb-5">
            {icons[icon]}
          </div>

          {/* Título */}
          <h2 className="text-lg font-bold text-white text-center mb-2">
            {title}
          </h2>

          {/* Mensaje */}
          <p className="text-sm text-white/50 text-center mb-6 leading-relaxed">
            {message}
          </p>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className={`flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 rounded-xl font-medium transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2.5 text-white rounded-xl font-bold transition-all shadow-md border border-white/20 flex items-center justify-center gap-2 ${confirmButtonClass} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {loadingText}
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConfirmModal;
