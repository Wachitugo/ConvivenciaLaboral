import React from 'react';
import { Save } from 'lucide-react';

function NotesEditor({ notes, onNotesChange, onSave }) {
    return (
        <div className="flex flex-col h-full border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex p-3 border-b border-gray-200 bg-white flex-shrink-0 items-center justify-between">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Contenido
                </label>
            </div>
            <div className="flex-1 min-h-0 flex flex-col p-3 bg-gray-50 overflow-hidden">
                <textarea
                    name="notes"
                    value={notes}
                    onChange={onNotesChange}
                    placeholder="Escriba aquí los antecedentes o notas de la entrevista..."
                    className="w-full flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-0 outline-none resize-none bg-white text-sm leading-relaxed text-gray-700 custom-scrollbar"
                ></textarea>
            </div>

            <div className="flex justify-end p-2 border-t border-gray-200 bg-white flex-shrink-0">
                <button
                    onClick={onSave}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
                >
                    <Save size={12} />
                    Guardar Notas
                </button>
            </div>
        </div>
    );
}

export default NotesEditor;
