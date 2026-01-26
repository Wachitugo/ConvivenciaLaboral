import React from 'react';
import { X, Save, Stethoscope } from 'lucide-react';

function DiagnosticoModal({ tempData, setTempData, onClose, onSave }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 m-4 border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Stethoscope size={20} className="text-blue-600" />
              Editar Diagnóstico
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Diagnóstico clínico del estudiante
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div>
          <label className="text-sm font-semibold text-gray-700">
            Diagnóstico Clínico
          </label>
          <textarea
            value={tempData.diagnostico || ''}
            onChange={(e) => setTempData({ ...tempData, diagnostico: e.target.value })}
            placeholder="Ingresa el diagnóstico clínico..."
            className="w-full mt-2 px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
            rows={4}
          />
        </div>

        {/* Divider */}
        <hr className="border-gray-200 my-5" />

        {/* Botones de acción */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            <Save size={14} />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}

export default DiagnosticoModal;

