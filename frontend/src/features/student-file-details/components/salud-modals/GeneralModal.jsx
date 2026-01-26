import React from 'react';
import { X, Save, Droplet, Shield } from 'lucide-react';

function GeneralModal({ tempGeneral, setTempGeneral, onClose, onSave }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 m-4 border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Droplet size={20} className="text-blue-600" />
              Editar Información General
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Datos generales de salud del estudiante
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
          {/* Grupo Sanguíneo */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mb-2">
              <Droplet size={10} className="text-blue-500" /> Grupo Sanguíneo
            </label>
            <select
              value={tempGeneral.grupoSanguineo || ''}
              onChange={(e) => setTempGeneral({ ...tempGeneral, grupoSanguineo: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar...</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          {/* Previsión de Salud */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mb-2">
              <Shield size={10} className="text-blue-500" /> Previsión de Salud
            </label>
            <select
              value={tempGeneral.prevision || ''}
              onChange={(e) => setTempGeneral({ ...tempGeneral, prevision: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar...</option>
              <option value="Fonasa">Fonasa</option>
              <option value="Isapre">Isapre</option>
              <option value="Particular">Particular</option>
              <option value="Sin Previsión">Sin Previsión</option>
            </select>
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

export default GeneralModal;

