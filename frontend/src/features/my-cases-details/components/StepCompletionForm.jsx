import { useState } from 'react';

function StepCompletionForm({ paso, onComplete, onCancel }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onComplete('Paso completado', []);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-4 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.2)] mt-2">
      <h3 className="text-sm font-bold text-white">
        {paso.titulo}
      </h3>

      <div className="p-3 bg-[#1A71B8]/20 border border-[#34B6D8]/30 rounded-lg text-xs text-[#34B6D8] font-bold tracking-wide">
        ¿Confirmas que has completado este paso del protocolo?
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-3 py-1.5 text-white/50 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 rounded-lg transition-all text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white rounded-lg hover:from-emerald-400 hover:to-emerald-300 transition-all text-xs font-bold shadow-[0_4px_16px_rgba(16,185,129,0.3)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Guardando...
            </>
          ) : (
            'Confirmar y Completar'
          )}
        </button>
      </div>
    </div>
  );
}

export default StepCompletionForm;
