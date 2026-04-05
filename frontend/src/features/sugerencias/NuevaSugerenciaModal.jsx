import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Send } from 'lucide-react';

const MAX_CHARS = 1000;

export default function NuevaSugerenciaModal({ isOpen, onClose, onSubmit }) {
  const [contenido, setContenido] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contenido.trim()) return;
    setIsSaving(true);
    try {
      await onSubmit(contenido.trim());
      setContenido('');
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" onClick={onClose} />
      <div
        className="fixed right-0 top-0 bottom-0 z-[70] w-full max-w-md flex flex-col shadow-[-8px_0_32px_rgba(0,0,0,0.3)]"
        style={{ background: 'linear-gradient(160deg, #0d3258 0%, #0A2744 100%)', fontFamily: "'Poppins', sans-serif" }}
      >
        {/* Header */}
        <div className="px-7 pt-7 pb-5 flex items-start justify-between border-b border-white/10 flex-shrink-0">
          <div>
            <h2 className="text-lg font-black text-white leading-tight">Nueva Sugerencia</h2>
            <p className="text-[11px] text-white/50 font-medium mt-1">
              Tu sugerencia será revisada por el equipo de convivencia.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all flex-shrink-0 ml-4"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-7 py-6 flex flex-col gap-2 flex-1">
            <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
              Detalle de tu sugerencia
            </label>
            <textarea
              value={contenido}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) setContenido(e.target.value);
              }}
              rows={10}
              placeholder="Describe tu idea, problema o sugerencia..."
              className="w-full flex-1 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm p-4 resize-none focus:outline-none focus:border-[#1A71B8]/60 focus:bg-white/15 transition-all custom-scrollbar"
            />
            <p className="text-xs text-white/30 text-right">
              {contenido.length} caracteres
            </p>
          </div>

          {/* Footer */}
          <div className="px-7 py-5 border-t border-white/10 flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-sm font-semibold rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !contenido.trim()}
              className="flex-1 py-3 bg-[#1A71B8] hover:bg-[#155d96] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-[#1A71B8]/30"
            >
              {isSaving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Enviando...
                </>
              ) : (
                <><Send size={15} /> Enviar</>
              )}
            </button>
          </div>
        </form>
      </div>
    </>,
    document.body
  );
}
