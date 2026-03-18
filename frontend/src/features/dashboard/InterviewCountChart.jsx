import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { GraduationCap, TrendingUp } from 'lucide-react';
import EmptyChartState from './EmptyChartState';

// Orden de áreas de trabajo
const AREA_ORDER = [
    'Administración',
    'Operaciones',
    'Recursos Humanos',
    'Finanzas',
    'Tecnología',
    'Ventas',
    'Marketing',
    'Producción',
    'Logística',
    'Atención al Cliente'
];

// Función para obtener el índice de orden de un área
const getAreaIndex = (areaName) => {
    // Buscar coincidencia exacta primero
    const exactIndex = AREA_ORDER.findIndex(a =>
        a.toLowerCase() === areaName.toLowerCase()
    );
    if (exactIndex !== -1) return exactIndex;

    // Buscar coincidencia parcial
    const partialIndex = AREA_ORDER.findIndex(a =>
        areaName.toLowerCase().includes(a.toLowerCase()) ||
        a.toLowerCase().includes(areaName.toLowerCase())
    );
    if (partialIndex !== -1) return partialIndex;

    // Si no se encuentra, poner al final
    return 999;
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0A3866]/90 px-3 py-2 border border-[#1A71B8]/30 rounded-xl text-xs shadow-xl backdrop-blur-md">
                <p className="font-bold text-white mb-1">{label}</p>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill }}></span>
                    <p className="text-white/80 tabular-nums">
                        {payload[0].value} entrevistas
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export default function InterviewCountChart({ data }) {
    // Calcular total
    const total = data ? data.reduce((sum, item) => sum + item.count, 0) : 0;
    const hasData = data && data.length > 0 && data.some(d => d.count > 0);

    // Filtrar solo áreas con entrevistas y ordenar
    const filteredData = hasData
        ? data.filter(d => d.count > 0).sort((a, b) => getAreaIndex(a.name) - getAreaIndex(b.name))
        : [];

    // Colors for bars - gradient from indigo to purple
    const colors = ['#6366f1'];

    return (
        <div className="bg-[#0A3866]/40 backdrop-blur-xl border border-[#1A71B8]/30 p-6 rounded-3xl h-full flex flex-col transition-all duration-500 hover:shadow-[0_0_40px_rgba(52,182,216,0.2)] hover:bg-[#0A3866]/60 hover:border-[#34B6D8]/60 group relative overflow-hidden">
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700"></div>
            
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-xl backdrop-blur-sm">
                        <GraduationCap className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-base font-bold text-white leading-tight">
                            Entrevistas por Área de trabajo
                        </h4>
                        <span className="text-xs text-white/60 font-medium">
                            Análisis por área
                        </span>
                    </div>
                </div>
                {hasData && (
                    <div className="flex items-center gap-1.5 bg-indigo-500/20 px-2.5 py-1 rounded-full border border-indigo-500/30">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-sm font-bold text-indigo-300">{total}</span>
                    </div>
                )}
            </div>

            {hasData ? (
                <div className="flex-1 w-full min-h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={filteredData}
                            margin={{ top: 10, right: 10, left: -25, bottom: 45 }}
                            barSize={32}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 500 }}
                                interval={0}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis
                                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 500 }}
                                allowDecimals={false}
                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={1}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                </linearGradient>
                            </defs>
                            <Bar
                                dataKey="count"
                                radius={[6, 6, 0, 0]}
                                maxBarSize={32}
                            >
                                {filteredData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill="url(#colorCount)" />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <EmptyChartState
                        title="Sin Registros"
                        message="No hay entrevistas registradas."
                    />
                </div>
            )}
        </div>
    );
}
