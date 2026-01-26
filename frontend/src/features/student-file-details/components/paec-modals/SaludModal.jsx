import React from 'react';
import { X, Save, Heart, User, Calendar, FileText, Users } from 'lucide-react';

function SaludModal({ tempData, setTempData, onClose, onSave }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 m-4 border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Heart size={20} className="text-blue-600" />
              Editar Antecedentes de Salud
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Información médica y de tratamiento
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
        <div className="space-y-4">
          {/* Médico Tratante */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mb-2">
                <User size={10} className="text-blue-500" /> Médico Tratante
              </label>
              <input
                type="text"
                value={tempData.medicoTratante?.nombre || ''}
                onChange={(e) =>
                  setTempData({
                    ...tempData,
                    medicoTratante: { ...tempData.medicoTratante, nombre: e.target.value }
                  })
                }
                placeholder="Nombre del médico"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mb-2">
                <Calendar size={10} className="text-blue-500" /> Frecuencia de Visita
              </label>
              <input
                type="text"
                value={tempData.medicoTratante?.frecuencia || ''}
                onChange={(e) =>
                  setTempData({
                    ...tempData,
                    medicoTratante: { ...tempData.medicoTratante, frecuencia: e.target.value }
                  })
                }
                placeholder="Ej: Mensual, Trimestral"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Indicaciones Médicas */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mb-2">
              <FileText size={10} className="text-blue-500" /> Indicaciones Médicas
            </label>
            <textarea
              value={tempData.indicacionesMedicas || ''}
              onChange={(e) => setTempData({ ...tempData, indicacionesMedicas: e.target.value })}
              placeholder="Indicaciones especiales del médico..."
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
            />
          </div>

          {/* Otros Especialistas */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mb-2">
              <Users size={10} className="text-blue-500" /> Otros Especialistas
            </label>
            <input
              type="text"
              value={tempData.otrosEspecialistas || ''}
              onChange={(e) => setTempData({ ...tempData, otrosEspecialistas: e.target.value })}
              placeholder="Ej: Neurólogo, Psicólogo, Fonoaudiólogo"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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

export default SaludModal;

