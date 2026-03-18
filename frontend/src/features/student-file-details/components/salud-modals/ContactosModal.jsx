import React from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Plus, Trash2, Phone, User, Users } from 'lucide-react';

function ContactosModal({ tempContactos, updateContacto, addContacto, removeContacto, onClose, onSave }) {
  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full z-[70] flex items-center justify-end pointer-events-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <div className="w-[520px] h-full shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-[#0A3866]/95 backdrop-blur-3xl border-l border-[#1A71B8]/30 flex flex-col animate-slide-in overflow-hidden pointer-events-auto">
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Phone size={18} className="text-[#34B6D8]" />
                Contactos de Emergencia
              </h2>
              <p className="text-xs text-white/60 mt-0.5">Gestiona los contactos para situaciones de emergencia</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
            {/* Botón agregar */}
            <button
              onClick={addContacto}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white/5 border border-dashed border-white/20 rounded-xl text-white/70 hover:bg-white/10 hover:text-white hover:border-[#1A71B8]/50 transition-all text-sm font-medium"
            >
              <Plus size={16} />
              Agregar Contacto
            </button>

            {/* Lista de contactos */}
            {tempContactos.length === 0 ? (
              <div className="text-center py-8 bg-white/5 rounded-xl border border-dashed border-white/10">
                <Users size={32} className="mx-auto mb-2 text-white/20" />
                <p className="text-sm text-white/40">No hay contactos de emergencia</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tempContactos.map((contacto, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 bg-[#1A71B8]/40 border border-[#1A71B8] text-[#34B6D8] rounded-full flex items-center justify-center text-xs font-bold">
                        {contacto.prioridad || i + 1}
                      </div>
                      <button
                        onClick={() => removeContacto(i)}
                        className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-white/40 flex items-center gap-1">
                          <User size={10} /> Nombre
                        </label>
                        <input
                          type="text"
                          value={contacto.nombre}
                          onChange={(e) => updateContacto(i, 'nombre', e.target.value)}
                          placeholder="Nombre"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#34B6D8]/50 focus:ring-2 focus:ring-[#34B6D8]/10"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-white/40">Parentesco</label>
                        <input
                          type="text"
                          value={contacto.parentesco}
                          onChange={(e) => updateContacto(i, 'parentesco', e.target.value)}
                          placeholder="Parentesco"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#34B6D8]/50 focus:ring-2 focus:ring-[#34B6D8]/10"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-white/40 flex items-center gap-1">
                        <Phone size={10} /> Teléfono
                      </label>
                      <input
                        type="text"
                        value={contacto.telefono}
                        onChange={(e) => updateContacto(i, 'telefono', e.target.value)}
                        placeholder="Teléfono"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#34B6D8]/50 focus:ring-2 focus:ring-[#34B6D8]/10"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-white/70 rounded-xl text-sm font-bold hover:bg-white/10 hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={onSave}
                className="flex-1 px-4 py-2.5 bg-[#1A71B8] hover:bg-[#1A71B8]/80 text-white border border-white/10 rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Save size={14} />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

export default ContactosModal;
