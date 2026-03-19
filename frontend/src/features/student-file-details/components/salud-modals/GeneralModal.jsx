import React from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Droplet, Shield } from 'lucide-react';

function GeneralModal({ tempGeneral, setTempGeneral, onClose, onSave }) {
  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full z-[70] flex items-center justify-end pointer-events-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <div className="w-[430px] h-full shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-[#0A3866]/95 backdrop-blur-3xl border-l border-[#1A71B8]/30 flex flex-col animate-slide-in overflow-hidden pointer-events-auto">
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Droplet size={18} className="text-[#34B6D8]" />
                Editar Información General
              </h2>
              <p className="text-xs text-white/60 mt-0.5">Datos generales de salud del colaborador</p>
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
            {/* Grupo Sanguíneo */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                <Droplet size={12} className="text-[#34B6D8]" /> Grupo Sanguíneo
              </label>
              <select
                value={tempGeneral.grupoSanguineo || ''}
                onChange={(e) => setTempGeneral({ ...tempGeneral, grupoSanguineo: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-white/20 focus:border-[#34B6D8] focus:ring-4 focus:ring-[#34B6D8]/10 outline-none bg-white/5 text-sm font-medium text-white transition-all appearance-none"
              >
                <option value="" className="bg-[#0A3866]">Seleccionar...</option>
                <option value="A+" className="bg-[#0A3866]">A+</option>
                <option value="A-" className="bg-[#0A3866]">A-</option>
                <option value="B+" className="bg-[#0A3866]">B+</option>
                <option value="B-" className="bg-[#0A3866]">B-</option>
                <option value="AB+" className="bg-[#0A3866]">AB+</option>
                <option value="AB-" className="bg-[#0A3866]">AB-</option>
                <option value="O+" className="bg-[#0A3866]">O+</option>
                <option value="O-" className="bg-[#0A3866]">O-</option>
              </select>
            </div>

            {/* Previsión de Salud */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                <Shield size={12} className="text-[#34B6D8]" /> Previsión de Salud
              </label>
              <select
                value={tempGeneral.prevision || ''}
                onChange={(e) => setTempGeneral({ ...tempGeneral, prevision: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-white/20 focus:border-[#34B6D8] focus:ring-4 focus:ring-[#34B6D8]/10 outline-none bg-white/5 text-sm font-medium text-white transition-all appearance-none"
              >
                <option value="" className="bg-[#0A3866]">Seleccionar...</option>
                <option value="Fonasa" className="bg-[#0A3866]">Fonasa</option>
                <option value="Isapre" className="bg-[#0A3866]">Isapre</option>
                <option value="Particular" className="bg-[#0A3866]">Particular</option>
                <option value="Sin Previsión" className="bg-[#0A3866]">Sin Previsión</option>
              </select>
            </div>
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

export default GeneralModal;
