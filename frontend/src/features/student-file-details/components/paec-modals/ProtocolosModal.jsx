import React, { useState } from 'react';
import { X, Save, Plus, Trash2, Shield, AlertTriangle } from 'lucide-react';

function ProtocolosModal({ tempData, setTempData, updateListItem, removeItemFromList, onClose, onSave }) {
  const [newContencion, setNewContencion] = useState('');
  const [newCrisis, setNewCrisis] = useState('');

  const protocolos = tempData.protocolosIntervencion || [];
  const crisis = tempData.intervencionCrisis || [];

  const addContencion = () => {
    if (newContencion.trim()) {
      setTempData(prev => ({
        ...prev,
        protocolosIntervencion: [...(prev.protocolosIntervencion || []), newContencion.trim()]
      }));
      setNewContencion('');
    }
  };

  const addCrisis = () => {
    if (newCrisis.trim()) {
      setTempData(prev => ({
        ...prev,
        intervencionCrisis: [...(prev.intervencionCrisis || []), newCrisis.trim()]
      }));
      setNewCrisis('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 m-4 border border-gray-200 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Shield size={20} className="text-blue-600" />
              Editar Protocolos
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Gestiona los protocolos de contención e intervención en crisis
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Protocolo de Contención */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Shield size={14} className="text-green-600" />
                Protocolo de Contención
              </label>
              <span className="text-xs text-gray-400">{protocolos.length} pasos</span>
            </div>

            {/* Añadir nuevo */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newContencion}
                onChange={(e) => setNewContencion(e.target.value)}
                placeholder="Agregar nuevo paso..."
                className="flex-1 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder-blue-400"
                onKeyDown={(e) => e.key === 'Enter' && addContencion()}
              />
              <button
                onClick={addContencion}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <Plus size={16} />
                <span className="text-sm font-medium">Agregar</span>
              </button>
            </div>

            {/* Tabla */}
            {protocolos.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <Shield size={24} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">No hay pasos definidos</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="w-12 px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Paso</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Descripción</th>
                      <th className="w-12 px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {protocolos.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-2">
                          <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => updateListItem('protocolosIntervencion', i, e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => removeItemFromList('protocolosIntervencion', i)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Intervención en Crisis */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <AlertTriangle size={14} className="text-orange-500" />
                Intervención en Crisis
              </label>
              <span className="text-xs text-gray-400">{crisis.length} pasos</span>
            </div>

            {/* Añadir nuevo */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newCrisis}
                onChange={(e) => setNewCrisis(e.target.value)}
                placeholder="Agregar nuevo paso..."
                className="flex-1 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white placeholder-orange-400"
                onKeyDown={(e) => e.key === 'Enter' && addCrisis()}
              />
              <button
                onClick={addCrisis}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1"
              >
                <Plus size={16} />
                <span className="text-sm font-medium">Agregar</span>
              </button>
            </div>

            {/* Tabla */}
            {crisis.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <AlertTriangle size={24} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">No hay pasos definidos</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="w-12 px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Paso</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Descripción</th>
                      <th className="w-12 px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {crisis.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-2">
                          <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => updateListItem('intervencionCrisis', i, e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => removeItemFromList('intervencionCrisis', i)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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

export default ProtocolosModal;

