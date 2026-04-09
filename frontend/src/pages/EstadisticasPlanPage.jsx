import { useState, useEffect, useMemo } from 'react';
import { planService } from '../services/api';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Label } from 'recharts';
import { BarChart2, TrendingUp, TrendingDown, Minus, ShieldAlert, AlertTriangle, Layers } from 'lucide-react';

const COLORS = ['#1A71B8', '#34B6D8', '#569991', '#0A3866', '#D9E37D', '#B3D0C8', '#E8815C', '#9B8EC4'];

const SEVERITY_COLORS = {
    4: '#ef4444',
    3: '#f59e0b',
    2: '#3b82f6',
    1: '#22c55e',
    0: '#6b7280',
};

const getSchoolId = () => {
    try {
        const u = JSON.parse(localStorage.getItem('usuario'));
        const id = u?.colegios?.[0];
        return typeof id === 'object' ? id?.id : id;
    } catch { return null; }
};

/* ────────── Custom center label renderer for donut ────────── */
function renderCenterLabel({ viewBox }, total) {
    const { cx, cy } = viewBox || {};
    if (!cx || !cy) return null;
    return (
        <g>
            <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="central"
                style={{ fontSize: 32, fontWeight: 900, fill: '#1f2937', fontFamily: "'Poppins', sans-serif" }}>
                {total}
            </text>
            <text x={cx} y={cy + 20} textAnchor="middle" dominantBaseline="central"
                style={{ fontSize: 9, fontWeight: 700, fill: '#9ca3af', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Poppins', sans-serif" }}>
                PROTOCOLOS
            </text>
        </g>
    );
}

/* ────────── Trend badge (visual only — stable for now) ────────── */
function TrendBadge({ trend = 'stable' }) {
    const map = {
        up: { icon: TrendingUp, text: 'Aumento', bg: 'bg-red-50', text_color: 'text-red-500', border: 'border-red-100' },
        down: { icon: TrendingDown, text: 'Baja', bg: 'bg-emerald-50', text_color: 'text-emerald-500', border: 'border-emerald-100' },
        stable: { icon: Minus, text: 'Estable', bg: 'bg-gray-50', text_color: 'text-gray-400', border: 'border-gray-200' },
    };
    const config = map[trend] || map.stable;
    const Icon = config.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${config.bg} ${config.text_color} border ${config.border}`}>
            <Icon size={12} />
            {config.text}
        </span>
    );
}

export default function EstadisticasPlanPage() {
    const [stats, setStats] = useState([]);
    const [total, setTotal] = useState(0);
    const [maxSeverity, setMaxSeverity] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const schoolId = getSchoolId();

    useEffect(() => {
        const load = async () => {
            if (!schoolId) { setIsLoading(false); return; }
            try {
                const response = await planService.getCaseStats(schoolId);
                if (response?.status === 'success') {
                    setStats(response.stats || []);
                    setTotal(response.total || 0);
                    setMaxSeverity(response.max_severity || null);
                }
            } catch {
                // silent
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [schoolId]);

    const mainStat = useMemo(() => {
        if (!stats.length) return null;
        return stats.reduce((max, s) => (s.count > max.count ? s : max), stats[0]);
    }, [stats]);

    const protocolCount = stats.length;

    /* ────── Loading ────── */
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-[#1A71B8]/30 border-t-[#1A71B8] rounded-full animate-spin" />
                    <p className="text-sm font-medium text-white/60">Cargando estadísticas...</p>
                </div>
            </div>
        );
    }

    /* ────── Empty ────── */
    if (!stats.length) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-white/40">
                <BarChart2 size={48} />
                <div className="text-center">
                    <p className="font-bold text-lg text-white/60">Sin datos disponibles</p>
                    <p className="text-sm mt-1">No hay expedientes registrados aún para esta empresa.</p>
                </div>
            </div>
        );
    }

    const severityLevel = maxSeverity?.level || 0;
    const severityColor = SEVERITY_COLORS[severityLevel] || SEVERITY_COLORS[0];

    return (
        <div className="h-full overflow-y-auto custom-scrollbar">
        <div className="p-4 md:p-6 space-y-6" style={{ fontFamily: "'Poppins', sans-serif" }}>

            {/* ═══════════════ TOP SECTION ═══════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                {/* Left column — KPI cards */}
                <div className="lg:col-span-4 flex flex-col gap-3">

                    {/* Expedientes Registrados */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-start gap-4">
                        <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                            <BarChart2 size={22} className="text-[#1A71B8]" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Casos Registrados</p>
                            <p className="text-4xl font-black text-gray-800 leading-none mt-1">{total}</p>
                            <p className="text-xs text-gray-400 mt-1">en {protocolCount} protocolo{protocolCount !== 1 ? 's' : ''} activos</p>
                        </div>
                    </div>

                    {/* Protocolo con más casos */}
                    {mainStat && (
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-start gap-4">
                            <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                                <AlertTriangle size={22} className="text-red-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Protocolo con más Casos</p>
                                <p className="text-base font-black text-gray-800 mt-1 leading-tight">{mainStat.name}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{mainStat.count} caso{mainStat.count !== 1 ? 's' : ''} · {mainStat.percentage}% del total</p>
                            </div>
                        </div>
                    )}

                    {/* Gravedad máxima */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${severityColor}15` }}>
                            <ShieldAlert size={22} style={{ color: severityColor }} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gravedad Máxima Detectada</p>
                            <p className="text-base font-black mt-1 leading-tight flex items-center gap-2" style={{ color: severityColor }}>
                                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: severityColor }} />
                                {maxSeverity?.label || 'Sin datos'}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{maxSeverity?.description || 'No hay expedientes registrados'}</p>
                        </div>
                    </div>
                </div>

                {/* Right — Donut chart + Distribution legend (unified card) */}
                <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
                    {/* Donut chart */}
                    <div className="w-full md:w-1/2 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={stats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={72}
                                    outerRadius={105}
                                    dataKey="count"
                                    nameKey="name"
                                    paddingAngle={2}
                                    stroke="none"
                                >
                                    {stats.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                    <Label content={(props) => renderCenterLabel(props, protocolCount)} position="center" />
                                </Pie>
                                <Tooltip
                                    formatter={(value, name) => [`${value} caso${value !== 1 ? 's' : ''}`, name]}
                                    contentStyle={{ borderRadius: '12px', fontSize: '12px', fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Distribution legend */}
                    <div className="w-full md:w-1/2 flex flex-col justify-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Distribución por Protocolo</p>
                        <div className="space-y-2.5 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
                            {stats.map((stat, i) => (
                                <div key={stat.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <span className="text-sm text-gray-600 font-medium truncate">{stat.name}</span>
                                    </div>
                                    <span className="font-bold text-gray-700 text-sm shrink-0 ml-3">{stat.percentage}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════ DETALLE POR PROTOCOLO ═══════════════ */}
            <div>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Detalle por Protocolo</p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {stats.map((stat, i) => (
                        <div
                            key={stat.name}
                            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200"
                        >
                            {/* Header row — category + trend */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{stat.category || 'OTROS'}</span>
                                <TrendBadge trend="stable" />
                            </div>

                            {/* Title + count row */}
                            <div className="flex items-start justify-between mb-3">
                                <p className="font-bold text-gray-800 text-sm leading-tight pr-3 flex-1">{stat.name}</p>
                                <div className="text-right shrink-0">
                                    <p className="text-3xl font-black text-gray-800 leading-none">{stat.count}</p>
                                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Casos</p>
                                </div>
                            </div>

                            {/* Prevalence bar */}
                            <div className="space-y-1 mb-4">
                                <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
                                    <span>Prevalencia</span>
                                    <span className="font-bold text-gray-600">{stat.percentage}%</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700 ease-out"
                                        style={{ width: `${stat.percentage}%`, backgroundColor: COLORS[i % COLORS.length] }}
                                    />
                                </div>
                            </div>

                            {/* Subtypes / Protocols */}
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Subtipos</p>
                                {stat.subcategories?.length > 0 ? (
                                    <div className="space-y-1">
                                        {stat.subcategories.map((sub, j) => (
                                            <div key={j} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                    <span className="text-gray-500 truncate">{sub.name}</span>
                                                </div>
                                                <span className="font-bold text-gray-600 shrink-0 ml-2">{sub.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-300 italic">Sin subtipos registrados</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        </div>
    );
}
