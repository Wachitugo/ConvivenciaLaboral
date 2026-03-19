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
            <div className="bg-[#0A3866]/90 px-3 py-2 border border-[#1A71B8]/30 rounded-xl text-xs shadow-xl backdrop-blur-md">
                <p className="font-bold text-white mb-1">{data.name}</p>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }}></span>
                    <p className="text-white/80 tabular-nums">
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
        <div className="bg-[#0A3866]/40 backdrop-blur-xl border border-[#1A71B8]/30 p-6 rounded-3xl h-full flex flex-col transition-all duration-500 hover:shadow-[0_0_40px_rgba(52,182,216,0.2)] hover:bg-[#0A3866]/60 hover:border-[#34B6D8]/60 group relative overflow-hidden">
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700"></div>
            
            <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="p-2 bg-emerald-500/20 rounded-xl backdrop-blur-sm">
                    <Link2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <h4 className="text-base font-bold text-white leading-tight">
                        Asignación de Entrevistas
                    </h4>
                    <span className="text-xs text-white/60 font-medium">
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
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
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
                                    className="group/card flex flex-col p-2.5 rounded-xl border border-[#1A71B8]/30 bg-[#0A3866]/50 hover:bg-[#1A71B8]/20 hover:border-[#34B6D8]/50 transition-colors backdrop-blur-sm"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`p-1 rounded-md`} style={{ backgroundColor: `${item.color}20` }}>
                                            <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                                        </div>
                                        <span className="text-xs font-semibold text-white/70">{item.name}</span>
                                    </div>
                                    <div className="flex items-end gap-1.5 pl-1">
                                        <span className="text-lg font-bold text-white leading-none">
                                            {item.value}
                                        </span>
                                        <span className="text-xs text-white/50 font-medium mb-0.5">({item.percentage}%)</span>
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
