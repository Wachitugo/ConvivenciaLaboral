import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Link2, Link2Off } from 'lucide-react';
import EmptyChartState from './EmptyChartState';

const COLORS = {
    assigned: '#102fb9ff',    // emerald-500
    unassigned: '#f50b0bff'   // amber-500
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white px-3 py-2 border border-gray-200 rounded text-xs shadow-md">
                <p className="font-bold text-gray-900 mb-1">{data.name}</p>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }}></span>
                    <p className="text-gray-700 tabular-nums">
                        {data.value} entrevistas ({data.percentage}%)
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
    if (value === 0) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
            {value}
        </text>
    );
};

export default function InterviewAssignmentChart({ data }) {
    const hasData = data && (data.assigned > 0 || data.unassigned > 0);
    const total = hasData ? data.assigned + data.unassigned : 0;

    const chartData = hasData ? [
        {
            name: 'Asignadas a Caso',
            value: data.assigned,
            percentage: total > 0 ? Math.round((data.assigned / total) * 100) : 0,
            color: '#10b981', // emerald-500
            icon: Link2
        },
        {
            name: 'Sin Asignar',
            value: data.unassigned,
            percentage: total > 0 ? Math.round((data.unassigned / total) * 100) : 0,
            color: '#ef4444', // red-500
            icon: Link2Off
        }
    ] : [];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full flex flex-col transition-all hover:shadow-md">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-50 rounded-lg">
                    <Link2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                    <h4 className="text-base font-bold text-gray-800 leading-tight">
                        Asignación de Entrevistas
                    </h4>
                    <span className="text-xs text-gray-500 font-medium">
                        Cobertura de casos
                    </span>
                </div>
            </div>

            {hasData ? (
                <div className="flex flex-1 items-center gap-4 min-h-[160px]">
                    {/* Pie Chart */}
                    <div className="w-1/2 h-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={70}
                                    innerRadius={50}
                                    paddingAngle={4}
                                    cornerRadius={6}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend Cards */}
                    <div className="w-1/2 space-y-3">
                        {chartData.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={index}
                                    className="group flex flex-col p-2.5 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`p-1 rounded-md`} style={{ backgroundColor: `${item.color}15` }}>
                                            <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-600">{item.name}</span>
                                    </div>
                                    <div className="flex items-end gap-1.5 pl-1">
                                        <span className="text-lg font-bold text-gray-800 leading-none">
                                            {item.value}
                                        </span>
                                        <span className="text-xs text-gray-400 font-medium mb-0.5">({item.percentage}%)</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <EmptyChartState
                        title="Sin Asignaciones"
                        message="No hay entrevistas para analizar."
                    />
                </div>
            )}
        </div>
    );
}
