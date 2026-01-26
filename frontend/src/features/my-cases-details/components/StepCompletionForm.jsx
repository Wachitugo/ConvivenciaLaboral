import { useState } from 'react';

function StepCompletionForm({ paso, onComplete, onCancel }) {
  const handleSubmit = () => {
    onComplete('Paso completado', []);
  };

  return (
    <div className="rounded-lg space-y-3">
      <h3 className="text-base font-semibold text-gray-800">
        {paso.titulo}
      </h3>

      <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
        ¿Confirmas que has completado este paso del protocolo?
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
        >
          Cancelar
        </button>

        <button
          onClick={handleSubmit}
          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          Confirmar y Completar
        </button>
      </div>
    </div>
  );
}

export default StepCompletionForm;
