import React from 'react';
import { X, Save, Plus, Trash2, Phone, User, Users } from 'lucide-react';

function ContactosModal({ tempContactos, updateContacto, addContacto, removeContacto, onClose, onSave }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 m-4 border border-gray-200 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Phone size={20} className="text-blue-600" />
              Editar Contactos de Emergencia
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Gestiona los contactos para situaciones de emergencia
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
          onClick={addContacto}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 mb-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-100 hover:border-blue-300 transition-all"
        >
          <Plus size={16} />
          <span className="font-medium text-sm">Agregar Contacto</span>
        </button>

        {/* Lista de contactos */}
        {tempContactos.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <Users size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">No hay contactos de emergencia</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-14 px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Prior.</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                    <span className="flex items-center gap-1">
                      <User size={10} className="text-blue-500" /> Nombre
                    </span>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Parentesco</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                    <span className="flex items-center gap-1">
                      <Phone size={10} className="text-blue-500" /> Teléfono
                    </span>
                  </th>
                  <th className="w-12 px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tempContactos.map((contacto, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-3 py-2">
                      <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {contacto.prioridad || i + 1}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={contacto.nombre}
                        onChange={(e) => updateContacto(i, 'nombre', e.target.value)}
                        placeholder="Nombre"
                        className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={contacto.parentesco}
                        onChange={(e) => updateContacto(i, 'parentesco', e.target.value)}
                        placeholder="Parentesco"
                        className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={contacto.telefono}
                        onChange={(e) => updateContacto(i, 'telefono', e.target.value)}
                        placeholder="Teléfono"
                        className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => removeContacto(i)}
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

export default ContactosModal;

