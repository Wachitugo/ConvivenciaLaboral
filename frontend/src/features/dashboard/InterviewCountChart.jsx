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
            <div className="bg-white px-3 py-2 border border-gray-200 rounded text-xs shadow-md">
                <p className="font-bold text-gray-900 mb-1">{label}</p>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill }}></span>
                    <p className="text-gray-700 tabular-nums">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full flex flex-col transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h4 className="text-base font-bold text-gray-800 leading-tight">
                            Entrevistas por Área de trabajo
                        </h4>
                        <span className="text-xs text-gray-500 font-medium">
                            Análisis por área
                        </span>
                    </div>
                </div>
                {hasData && (
                    <div className="flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-sm font-bold text-indigo-700">{total}</span>
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
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                                interval={0}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                                axisLine={{ stroke: '#e2e8f0' }}
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis
                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                                allowDecimals={false}
                                axisLine={{ stroke: '#e2e8f0' }}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                            <Bar
                                dataKey="count"
                                radius={[4, 4, 0, 0]}
                                fill="#6366f1"
                            >
                                {filteredData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
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
