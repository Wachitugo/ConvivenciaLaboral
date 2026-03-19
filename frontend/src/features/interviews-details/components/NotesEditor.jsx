import React from 'react';
import { Save } from 'lucide-react';

function NotesEditor({ notes, onNotesChange, onSave }) {
    return (
        <div className="flex flex-col h-full border border-white/10 rounded-xl overflow-hidden shadow-inner bg-white/5">
            <div className="flex p-3 border-b border-white/10 bg-transparent flex-shrink-0 items-center justify-between">
                <label className="text-sm font-bold text-white/90 uppercase tracking-wider">
                    Contenido
                </label>
            </div>
            <div className="flex-1 min-h-0 flex flex-col p-3 bg-transparent overflow-hidden">
                <textarea
                    name="notes"
                    value={notes}
                    onChange={onNotesChange}
                    placeholder="Escriba aquí los antecedentes o notas de la entrevista..."
                    className="w-full flex-1 px-4 py-3 rounded-xl border border-white/30 focus:border-[#34B6D8]/50 focus:ring-1 focus:ring-[#34B6D8]/50 outline-none resize-none bg-[#0A3866]/40 text-base font-medium leading-relaxed text-white placeholder:text-white/40 shadow-inner custom-scrollbar"
                ></textarea>
            </div>

            <div className="flex justify-end p-2 border-t border-white/10 bg-transparent flex-shrink-0">
                <button
                    onClick={onSave}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1A71B8] hover:bg-[#1A71B8]/80 text-white rounded-xl text-sm font-bold transition-colors shadow-md"
                >
                    <Save size={12} />
                    Guardar Notas
                </button>
            </div>
        </div>
    );
}

export default NotesEditor;
