import { ThumbsUp, Clock } from 'lucide-react';

const ESTADO_BADGE = {
  pendiente: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  aprobada: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  rechazada: 'bg-red-500/15 text-red-400 border border-red-500/30',
};

const ESTADO_LABEL = {
  pendiente: 'PENDIENTE',
  aprobada: 'APROBADA',
  rechazada: 'RECHAZADA',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SugerenciaCard({ sugerencia, currentUserId, onVote }) {
  const isOwn = sugerencia.user_id === currentUserId;
  const hasVoted = sugerencia.votos?.includes(currentUserId);
  const voteCount = sugerencia.votos?.length ?? 0;

  return (
    <div
      className={`bg-[#0A3866]/40 backdrop-blur-md border rounded-xl p-5 flex flex-col gap-3 shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all ${
        isOwn ? 'border-[#1A71B8]/50' : 'border-white/10'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-black text-white text-sm uppercase tracking-wide leading-tight truncate">
            {sugerencia.autor_nombre}
          </p>
          <p className="text-[11px] text-white/50 font-medium mt-0.5 truncate">
            {sugerencia.colegio_nombre}
          </p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${ESTADO_BADGE[sugerencia.estado] ?? ESTADO_BADGE.pendiente}`}>
          {ESTADO_LABEL[sugerencia.estado] ?? sugerencia.estado.toUpperCase()}
        </span>
      </div>

      {/* Contenido */}
      <p className="text-white/80 text-sm leading-relaxed flex-1">
        {sugerencia.contenido}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <span className="flex items-center gap-1.5 text-white/40 text-xs">
          <Clock size={12} />
          {formatDate(sugerencia.created_at)}
        </span>
        <button
          onClick={() => onVote(sugerencia.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            hasVoted
              ? 'bg-[#1A71B8] text-white shadow-md'
              : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10'
          }`}
        >
          <ThumbsUp size={13} />
          {voteCount}
        </button>
      </div>
    </div>
  );
}
