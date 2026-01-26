import React, { useState } from 'react';
import { Edit3, Eye, Save } from 'lucide-react';

function TranscriptionView({ transcription, onTranscriptionChange, onSave }) {
    const [isEditing, setIsEditing] = useState(false);

    const parseTranscriptionLine = (line, idx) => {
        const match = line.match(/^(\*\*?Hablante \d+:?\*\*?|Hablante \d+:?)\s*(.*)/i);

        if (match) {
            const speaker = match[1].replace(/\*/g, '');
            const text = match[2];
            const isAgent = speaker.toLowerCase().includes('1');

            return (
                <div key={idx} className={`flex flex-col ${isAgent ? 'items-start' : 'items-start'}`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1">
                        {speaker}
                    </span>
                    <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm max-w-[95%] border
                        ${isAgent
                            ? 'bg-white text-gray-700 border-gray-200 rounded-tl-none'
                            : 'bg-indigo-50 text-indigo-900 border-indigo-100 rounded-tl-none'
                        }`}
                    >
                        {text}
                    </div>
                </div>
            );
        }

        return (
            <div key={idx} className="p-3 text-sm text-gray-600 italic bg-gray-100/50 rounded-lg">
                {line}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex p-3 border-b border-gray-200 bg-white flex-shrink-0 items-center justify-between">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Transcripción Automática
                </label>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                    {isEditing ? (
                        <>
                            <Eye size={12} />
                            Ver Formato
                        </>
                    ) : (
                        <>
                            <Edit3 size={12} />
                            Editar Texto
                        </>
                    )}
                </button>
            </div>

            {/* Modo Edición */}
            {isEditing ? (
                <div className="flex-1 min-h-0 flex flex-col gap-2 p-3 bg-gray-50 overflow-hidden">
                    <textarea
                        name="transcription"
                        value={transcription}
                        onChange={onTranscriptionChange}
                        placeholder="La transcripción aparecerá aquí automáticamente mientras graba..."
                        className="w-full flex-1 px-4 py-3 rounded-xl border border-gray-200 outline-none resize-none bg-white text-sm text-gray-700 custom-scrollbar focus:ring-2 focus:ring-blue-100 transition-all font-mono"
                    ></textarea>
                    <div className="flex justify-end flex-shrink-0">
                        <button
                            onClick={onSave}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
                        >
                            <Save size={14} />
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            ) : (
                /* Modo Visualización Formateada */
                <div className="flex-1 min-h-0 p-2 bg-gray-50 overflow-y-auto">
                    {transcription ? (
                        <div className="flex flex-col gap-3 p-2">
                            {transcription
                                .split('\n')
                                .filter(line => line.trim() !== '' && !line.includes('Aquí tienes la transcripción'))
                                .map(parseTranscriptionLine)}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic">
                            <p>Sin transcripción disponible</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default TranscriptionView;
