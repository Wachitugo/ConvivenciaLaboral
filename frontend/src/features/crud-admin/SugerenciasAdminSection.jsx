import { useState, useEffect, useMemo } from 'react';
import { Search, ThumbsUp, Clock, Trash2, ChevronDown, Inbox } from 'lucide-react';
import { suggestionsService } from '../../services/api';

const ESTADO_BADGE = {
  pendiente: 'bg-amber-100 text-amber-700 border border-amber-200',
  aprobada: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  rechazada: 'bg-red-100 text-red-700 border border-red-200',
};

const ESTADO_LABEL = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
};

const ESTADO_OPTIONS = ['pendiente', 'aprobada', 'rechazada'];

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-CL', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function EstadoDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${ESTADO_BADGE[value] ?? ESTADO_BADGE.pendiente}`}
      >
        {ESTADO_LABEL[value] ?? value}
        <ChevronDown size={11} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[130px]">
            {ESTADO_OPTIONS.map(e => (
              <button
                key={e}
                onClick={() => { onChange(e); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-gray-50 transition-colors ${value === e ? 'text-blue-600' : 'text-gray-700'}`}
              >
                {ESTADO_LABEL[e]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function SugerenciasAdminSection() {
  const [sugerencias, setSugerencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await suggestionsService.getAll({});
      setSugerencias(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return sugerencias
      .filter(s => {
        const matchesSearch =
          s.contenido.toLowerCase().includes(search.toLowerCase()) ||
          s.autor_nombre.toLowerCase().includes(search.toLowerCase()) ||
          s.colegio_nombre.toLowerCase().includes(search.toLowerCase());
        const matchesEstado = filterEstado ? s.estado === filterEstado : true;
        return matchesSearch && matchesEstado;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [sugerencias, search, filterEstado]);

  const handleEstadoChange = async (id, nuevoEstado) => {
    try {
      const updated = await suggestionsService.update(id, { estado: nuevoEstado });
      setSugerencias(prev => prev.map(s => s.id === id ? updated : s));
    } catch {
      // silent
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta sugerencia?')) return;
    setDeleting(id);
    try {
      await suggestionsService.delete(id);
      setSugerencias(prev => prev.filter(s => s.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const counts = useMemo(() => ({
    total: sugerencias.length,
    pendiente: sugerencias.filter(s => s.estado === 'pendiente').length,
    aprobada: sugerencias.filter(s => s.estado === 'aprobada').length,
    rechazada: sugerencias.filter(s => s.estado === 'rechazada').length,
  }), [sugerencias]);

  return (
    <div className="p-6 md:p-8 space-y-6" style={{ fontFamily: "'Poppins', sans-serif" }}>

      {/* Spinner de carga inicial */}
      {loading && (
        <div className="flex flex-col items-center justify-center p-12 text-center py-32">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">Cargando sugerencias...</p>
        </div>
      )}

      {/* Contenido principal — solo cuando no está cargando */}
      {!loading && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: counts.total, color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
              { label: 'Pendientes', value: counts.pendiente, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
              { label: 'Aprobadas', value: counts.aprobada, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
              { label: 'Rechazadas', value: counts.rechazada, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
            ].map(stat => (
              <div key={stat.label} className={`border rounded-xl p-4 ${stat.bg}`}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{stat.label}</p>
                <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por contenido, autor u organización..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all bg-gray-50"
              />
            </div>
            <select
              value={filterEstado}
              onChange={e => setFilterEstado(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 focus:outline-none focus:border-blue-400 transition-all cursor-pointer"
            >
              <option value="">Todos los estados</option>
              {ESTADO_OPTIONS.map(e => (
                <option key={e} value={e}>{ESTADO_LABEL[e]}</option>
              ))}
            </select>
          </div>

          {/* Lista */}
          {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-300">
          <Inbox size={40} />
          <p className="text-sm font-semibold text-gray-400">No hay sugerencias</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3 hover:border-gray-300 transition-all shadow-sm">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 text-sm uppercase tracking-wide truncate">
                    {s.autor_nombre}
                  </p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5 truncate">{s.colegio_nombre}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <EstadoDropdown
                    value={s.estado}
                    onChange={(estado) => handleEstadoChange(s.id, estado)}
                  />
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deleting === s.id}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-40"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Contenido */}
              <p className="text-sm text-gray-700 leading-relaxed">{s.contenido}</p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <Clock size={12} />
                  {formatDate(s.created_at)}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                  <ThumbsUp size={13} />
                  {s.votos?.length ?? 0} votos
                </span>
              </div>
            </div>
          ))}
        </div>
        )}
        </>
      )}
    </div>
  );
}
