import { useState } from 'react';

function StepCompletionForm({ paso, onComplete, onCancel }) {
  const handleSubmit = () => {
    onComplete('Paso completado', []);
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
          className="px-3 py-1.5 text-white/50 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 rounded-lg transition-all text-xs font-bold"
        >
          Cancelar
        </button>

        <button
          onClick={handleSubmit}
          className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white rounded-lg hover:from-emerald-400 hover:to-emerald-300 transition-all text-xs font-bold shadow-[0_4px_16px_rgba(16,185,129,0.3)]"
        >
          Confirmar y Completar
        </button>
      </div>
    </div>
  );
}

export default StepCompletionForm;
