import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Inbox } from 'lucide-react';
import { SugerenciaCard, NuevaSugerenciaModal } from '../features/sugerencias';
import { suggestionsService } from '../services/api';

const SORT_OPTIONS = [
  { value: 'votos', label: 'Más votados' },
  { value: 'recientes', label: 'Más recientes' },
];

const ESTADO_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'rechazada', label: 'Rechazada' },
];

const getUserContext = () => {
  try {
    const u = JSON.parse(localStorage.getItem('usuario'));
    const colegioRaw = u?.colegios?.[0];
    const colegioId = typeof colegioRaw === 'object' ? colegioRaw?.id : colegioRaw;
    const colegios = JSON.parse(localStorage.getItem('colegios') || '[]');
    const colegioNombre = colegios.find(c => c.id === colegioId)?.nombre ?? '';
    return {
      userId: u?.uid ?? u?.id ?? '',
      autorNombre: u?.nombre ?? u?.name ?? '',
      colegioId: colegioId ?? '',
      colegioNombre,
    };
  } catch {
    return { userId: '', autorNombre: '', colegioId: '', colegioNombre: '' };
  }
};

export default function BuzonSugerenciasPage() {
  const [sugerencias, setSugerencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('votos');
  const [estado, setEstado] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const ctx = useMemo(() => getUserContext(), []);

  const load = async () => {
    try {
      const data = await suggestionsService.getAll({ colegio_id: ctx.colegioId || undefined, estado: estado || undefined });
      setSugerencias(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  const filtered = useMemo(() => {
    let list = sugerencias.filter(s =>
      s.contenido.toLowerCase().includes(search.toLowerCase()) ||
      s.autor_nombre.toLowerCase().includes(search.toLowerCase())
    );
    if (sort === 'votos') {
      list = [...list].sort((a, b) => (b.votos?.length ?? 0) - (a.votos?.length ?? 0));
    } else {
      list = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return list;
  }, [sugerencias, search, sort]);

  const handleVote = async (id) => {
    if (!ctx.userId) return;
    try {
      const updated = await suggestionsService.vote(id, ctx.userId);
      setSugerencias(prev => prev.map(s => s.id === id ? updated : s));
    } catch (e) {
      // silent
    }
  };

  const handleCreate = async (contenido) => {
    const nueva = await suggestionsService.create({
      contenido,
      user_id: ctx.userId,
      autor_nombre: ctx.autorNombre,
      colegio_id: ctx.colegioId,
      colegio_nombre: ctx.colegioNombre,
    });
    setSugerencias(prev => [nueva, ...prev]);
  };

  return (
    <div className="min-h-full p-6 md:p-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Título */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-black text-white tracking-tight">Buzón de Sugerencias</h1>
        <p className="text-white/50 text-sm mt-1">Comparte ideas y vota las que más te gusten</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar sugerencias..."
            className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#1A71B8]/60 transition-all"
          />
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#1A71B8]/60 transition-all cursor-pointer"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value} className="bg-[#0A3866] text-white">
              {o.label}
            </option>
          ))}
        </select>

        {/* Estado filter */}
        <select
          value={estado}
          onChange={e => setEstado(e.target.value)}
          className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#1A71B8]/60 transition-all cursor-pointer"
        >
          {ESTADO_OPTIONS.map(o => (
            <option key={o.value} value={o.value} className="bg-[#0A3866] text-white">
              {o.label}
            </option>
          ))}
        </select>

        {/* Nueva sugerencia */}
        <button
          onClick={() => setModalOpen(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-[#1A71B8] hover:bg-[#155d96] text-white text-sm font-bold rounded-xl shadow-lg transition-all"
        >
          <Plus size={16} />
          Nueva Sugerencia
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#0A3866]/40 border border-white/10 rounded-xl p-5 animate-pulse h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-white/30">
          <Inbox size={40} />
          <p className="text-sm font-semibold">No hay sugerencias</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(s => (
            <SugerenciaCard
              key={s.id}
              sugerencia={s}
              currentUserId={ctx.userId}
              onVote={handleVote}
            />
          ))}
        </div>
      )}

      <NuevaSugerenciaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
