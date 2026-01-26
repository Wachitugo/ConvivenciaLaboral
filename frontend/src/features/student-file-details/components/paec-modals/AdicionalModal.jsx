import React, { useState } from 'react';
import { X, Save, Plus, Trash2, Info } from 'lucide-react';

function AdicionalModal({ tempData, setTempData, removeItemFromList, onClose, onSave }) {
  const [newItems, setNewItems] = useState({
    gatillantes: '',
    senalesEstres: '',
    medidasRespuesta: '',
    actividadesInteres: ''
  });

  const sections = [
    { key: 'gatillantes', label: 'Gatillantes', placeholder: 'Agregar gatillante...' },
    { key: 'senalesEstres', label: 'Señales de Estrés', placeholder: 'Agregar señal...' },
    { key: 'medidasRespuesta', label: 'Medidas de Respuesta', placeholder: 'Agregar medida...' },
    { key: 'actividadesInteres', label: 'Actividades de Interés', placeholder: 'Agregar actividad...' }
  ];

  const addItem = (key) => {
    if (newItems[key].trim()) {
      setTempData(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), newItems[key].trim()]
      }));
      setNewItems(prev => ({ ...prev, [key]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 m-4 border border-gray-200 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Info size={20} className="text-blue-600" />
              Editar Información Adicional
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Gestiona gatillantes, señales, medidas y actividades
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          {sections.map(({ key, label, placeholder }) => {
            const items = tempData[key] || [];
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">{label}</label>
                  <span className="text-xs text-gray-400">{items.length} items</span>
                </div>

                {/* Input agregar */}
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newItems[key]}
                    onChange={(e) => setNewItems(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="flex-1 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    onKeyDown={(e) => e.key === 'Enter' && addItem(key)}
                  />
                  <button
                    onClick={() => addItem(key)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    <Plus size={16} />
                    <span className="text-sm font-medium">Agregar</span>
                  </button>
                </div>

                {/* Tabla */}
                {items.length === 0 ? (
                  <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <p className="text-sm text-gray-400">Sin items</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <tbody className="divide-y divide-gray-100">
                        {items.map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-3 py-2 w-10">
                              <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {i + 1}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-700">{item}</td>
                            <td className="px-3 py-2 w-10 text-center">
                              <button
                                onClick={() => removeItemFromList(key, i)}
                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
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

export default AdicionalModal;

