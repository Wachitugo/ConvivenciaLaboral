import { useState } from 'react';
import { FileText, Copy, Check, X, AlertCircle } from 'lucide-react';

const DOCUMENT_TYPE_LABELS = {
    resolucion_apertura:      'Resolución de Apertura',
    medida_resguardo:         'Medida de Resguardo',
    notificacion_denunciado:  'Notificación al Denunciado',
    notificacion_denunciante: 'Notificación al Denunciante',
    acuse_recibo:             'Acuse de Recibo',
    otro:                     'Documento Legal',
};

const DOCUMENT_TYPE_COLORS = {
    resolucion_apertura:      'text-blue-300 bg-blue-500/10 border-blue-500/30',
    medida_resguardo:         'text-amber-300 bg-amber-500/10 border-amber-500/30',
    notificacion_denunciado:  'text-orange-300 bg-orange-500/10 border-orange-500/30',
    notificacion_denunciante: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
    acuse_recibo:             'text-purple-300 bg-purple-500/10 border-purple-500/30',
    otro:                     'text-white/60 bg-white/5 border-white/20',
};

/** Convierte texto plano con convenciones formales a JSX con formato visual */
function renderDocumentContent(text) {
    if (!text) return null;

    // Eliminar markdown residual (por si el LLM lo genera igual)
    const clean = text
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/__(.+?)__/g, '$1');

    return clean.split('\n').map((line, i) => {
        const trimmed = line.trim();

        // Línea vacía → separador
        if (!trimmed) return <div key={i} className="h-3" />;

        // Título en MAYÚSCULAS seguido de dos puntos → sección destacada
        const isSectionHeader = /^[A-ZÁÉÍÓÚÑÜ\s]{3,}:/.test(trimmed);
        if (isSectionHeader) {
            return (
                <p key={i} className="text-[#34B6D8] text-xs font-black uppercase tracking-widest mt-4 mb-1">
                    {trimmed}
                </p>
            );
        }

        // Línea que empieza con número o guion → item de lista
        const isListItem = /^(\d+\.|-)/.test(trimmed);
        if (isListItem) {
            return (
                <p key={i} className="text-white/80 text-sm leading-relaxed pl-4">
                    {trimmed}
                </p>
            );
        }

        // Párrafo normal
        return (
            <p key={i} className="text-white/85 text-sm leading-relaxed">
                {trimmed}
            </p>
        );
    });
}

export default function DocumentComposer({ draft, onDismiss }) {
    const [copied, setCopied] = useState(false);

    if (!draft) return null;

    const { title, document_type, content, date, school_name } = draft;
    const typeLabel = DOCUMENT_TYPE_LABELS[document_type] || 'Documento Legal';
    const typeColor = DOCUMENT_TYPE_COLORS[document_type] || DOCUMENT_TYPE_COLORS.otro;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback silencioso
        }
    };

    return (
        <div className="w-full rounded-2xl overflow-hidden border border-white/10"
            style={{ background: 'linear-gradient(145deg, #0d3258 0%, #0A2744 100%)' }}>

            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#1A71B8]/20 border border-[#1A71B8]/30 flex items-center justify-center">
                        <FileText size={18} className="text-[#34B6D8]" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-[#34B6D8] uppercase tracking-widest mb-0.5">
                            Documento generado
                        </p>
                        <h3 className="text-sm font-bold text-white leading-snug">{title}</h3>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${typeColor}`}>
                                {typeLabel}
                            </span>
                            {school_name && (
                                <span className="text-[10px] text-white/40">{school_name}</span>
                            )}
                            {date && (
                                <span className="text-[10px] text-white/30">{date}</span>
                            )}
                        </div>
                    </div>
                </div>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="flex-shrink-0 p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                        title="Cerrar"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Document content */}
            <div className="px-6 py-5 max-h-[460px] overflow-y-auto custom-scrollbar space-y-0.5">
                {renderDocumentContent(content)}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-amber-400/70">
                    <AlertCircle size={11} />
                    <p className="text-[10px]">Revisa y ajusta antes de usar. No reemplaza asesoría legal.</p>
                </div>
                <button
                    onClick={handleCopy}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        copied
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                            : 'bg-[#1A71B8] hover:bg-[#155d96] text-white'
                    }`}
                >
                    {copied ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar texto</>}
                </button>
            </div>
        </div>
    );
}
