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
                    <div className={`p-3 sm:p-4 rounded-2xl text-base font-medium leading-relaxed shadow-inner max-w-[95%] border
                        ${isAgent
                            ? 'bg-white/10 text-white border-white/30 rounded-tl-none'
                            : 'bg-[#1A71B8]/30 text-white border-[#34B6D8]/40 rounded-tl-none'
                        }`}
                    >
                        {text}
                    </div>
                </div>
            );
        }

        return (
            <div key={idx} className="p-3 sm:p-4 text-base font-medium text-white/80 italic bg-white/5 border border-white/20 rounded-lg">
                {line}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full border border-white/10 bg-white/5 shadow-inner rounded-xl overflow-hidden">
            <div className="flex p-3 border-b border-white/10 bg-transparent flex-shrink-0 items-center justify-between">
                <label className="text-sm font-bold text-white/90 uppercase tracking-wider">
                    Transcripción Automática
                </label>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-1 text-xs font-bold text-[#34B6D8] hover:text-[#34B6D8]/80 transition-colors"
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
                <div className="flex-1 min-h-0 flex flex-col gap-2 p-3 bg-transparent overflow-hidden">
                    <textarea
                        name="transcription"
                        value={transcription}
                        onChange={onTranscriptionChange}
                        placeholder="La transcripción aparecerá aquí automáticamente mientras graba..."
                        className="w-full flex-1 px-4 py-3 rounded-xl border border-white/30 outline-none resize-none bg-[#0A3866]/40 text-base font-medium text-white shadow-inner custom-scrollbar focus:ring-1 focus:ring-[#34B6D8]/50 transition-all font-mono placeholder:text-white/40"
                    ></textarea>
                    <div className="flex justify-end flex-shrink-0">
                        <button
                            onClick={onSave}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#1A71B8] hover:bg-[#1A71B8]/80 rounded-lg shadow-md transition-all"
                        >
                            <Save size={14} />
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            ) : (
                /* Modo Visualización Formateada */
                <div className="flex-1 min-h-0 p-2 bg-transparent overflow-y-auto">
                    {transcription ? (
                        <div className="flex flex-col gap-3 p-2">
                            {transcription
                                .split('\n')
                                .filter(line => line.trim() !== '' && !line.includes('Aquí tienes la transcripción'))
                                .map(parseTranscriptionLine)}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-white/60 text-base font-medium italic">
                            <p>Sin transcripción disponible</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default TranscriptionView;
