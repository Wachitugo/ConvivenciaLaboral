import React from 'react';
import { X, Save, Plus, Trash2, FileText } from 'lucide-react';

function ObservacionesModal({ tempData, setTempData, updateListItem, removeItemFromList, onClose, onSave }) {
  const observaciones = tempData.observaciones || [];

  const addObservacion = () => {
    setTempData(prev => ({
      ...prev,
      observaciones: [...(prev.observaciones || []), '']
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 m-4 border border-gray-200 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" />
              Editar Observaciones
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Notas y observaciones importantes del estudiante
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Botón agregar */}
        <button
          onClick={addObservacion}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 mb-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-100 hover:border-blue-300 transition-all"
        >
          <Plus size={16} />
          <span className="font-medium text-sm">Agregar Observación</span>
        </button>

        {/* Lista de observaciones */}
        {observaciones.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <FileText size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">No hay observaciones</p>
          </div>
        ) : (
          <div className="space-y-3">
            {observaciones.map((obs, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">
                  {i + 1}
                </div>
                <textarea
                  value={obs}
                  onChange={(e) => updateListItem('observaciones', i, e.target.value)}
                  placeholder="Escribe una observación..."
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                />
                <button
                  onClick={() => removeItemFromList('observaciones', i)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all flex-shrink-0 mt-1"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

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

export default ObservacionesModal;

