import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Plus, Trash2, AlertCircle } from 'lucide-react';

function AlergiasModal({ tempAlergias, setTempAlergias, removeItemFromList, onClose, onSave }) {
  const [newItems, setNewItems] = useState({
    alergias: '',
    condiciones: '',
    alergiasMedicamentos: ''
  });

  const sections = [
    { key: 'alergias', label: 'Alergias', placeholder: 'Agregar alergia...' },
    { key: 'condiciones', label: 'Condiciones Médicas', placeholder: 'Agregar condición...' },
    { key: 'alergiasMedicamentos', label: 'Alergias a Medicamentos', placeholder: 'Agregar medicamento...' }
  ];

  const addItem = (key) => {
    if (newItems[key].trim()) {
      setTempAlergias(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), newItems[key].trim()]
      }));
      setNewItems(prev => ({ ...prev, [key]: '' }));
    }
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full z-[70] flex items-center justify-end pointer-events-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <div className="w-[480px] h-full shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-[#0A3866]/95 backdrop-blur-3xl border-l border-[#1A71B8]/30 flex flex-col animate-slide-in overflow-hidden pointer-events-auto">
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertCircle size={18} className="text-[#34B6D8]" />
                Editar Alergias y Condiciones
              </h2>
              <p className="text-xs text-white/60 mt-0.5">Gestiona alergias, condiciones médicas y alergias a medicamentos</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
            {sections.map(({ key, label, placeholder }) => {
              const items = tempAlergias[key] || [];
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest">{label}</label>
                    <span className="text-xs text-white/30">{items.length} items</span>
                  </div>

                  {/* Input agregar */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newItems[key]}
                      onChange={(e) => setNewItems(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-white/20 focus:border-[#34B6D8] focus:ring-4 focus:ring-[#34B6D8]/10 outline-none bg-white/5 text-sm font-medium text-white placeholder:text-white/30 transition-all"
                      onKeyDown={(e) => e.key === 'Enter' && addItem(key)}
                    />
                    <button
                      onClick={() => addItem(key)}
                      className="px-3 py-2.5 bg-[#1A71B8] hover:bg-[#1A71B8]/80 text-white rounded-xl transition-colors flex items-center gap-1 border border-white/10"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Lista */}
                  {items.length === 0 ? (
                    <div className="text-center py-4 bg-white/5 rounded-xl border border-dashed border-white/10">
                      <p className="text-sm text-white/30">Sin items</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
                          <div className="w-5 h-5 bg-[#1A71B8]/40 border border-[#1A71B8] text-[#34B6D8] rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {i + 1}
                          </div>
                          <span className="flex-1 text-sm text-white">{item}</span>
                          <button
                            onClick={() => removeItemFromList(key, i)}
                            className="p-1 text-white/30 hover:text-red-400 hover:bg-red-500/20 rounded transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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

export default AlergiasModal;
