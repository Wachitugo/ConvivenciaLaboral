import React, { useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { Activity } from 'lucide-react';
import EmptyChartState from './EmptyChartState';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0A3866]/90 px-3 py-2 border border-[#1A71B8]/30 rounded-xl text-xs shadow-xl backdrop-blur-md">
                <p className="font-bold text-white mb-1">{`Día ${label}`}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-white/80" style={{ color: entry.color }}>
                        {`${entry.name}: ${entry.value}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function DailyActivityChart({ data, selectedMonth, selectedYear }) {
    const [viewMode, setViewMode] = useState('5days');

    // Detectar si estamos en modo "Rolling Window" (filtro global, mostrando últimos días)
    const isRollingWindow = selectedMonth === 'all' && selectedYear === 'all';

    // Efecto para ajustar la vista por defecto según el filtro seleccionado
    React.useEffect(() => {
        if (isRollingWindow) {
            setViewMode('5days');
        } else {
            setViewMode('month');
        }
    }, [isRollingWindow, selectedMonth, selectedYear]);

    // Validar si estamos viendo el mes actual (para filtrar días futuros)
    const todayDate = new Date();
    const currentYear = todayDate.getFullYear();
    const currentMonth = todayDate.getMonth();

    // Solo filtramos dias futuros si estamos viendo un MES ESPECÍFICO que coincide con el actual.
    const isCurrentMonthSpecific = (parseInt(selectedMonth) === currentMonth)
        && (parseInt(selectedYear) === currentYear);

    if (!data || data.length === 0) {
        return (
            <div className="bg-[#0A3866]/40 p-4 rounded-xl border border-[#1A71B8]/30 shadow-sm h-full flex flex-col items-center justify-center backdrop-blur-md">
                <EmptyChartState
                    title="Actividad Diaria"
                    message="No hay actividad registrada."
                />
            </div>
        );
    }

    // Lógica de filtrado
    const todayDay = todayDate.getDate();

    // 1. Filtrar días futuros SOLO si estamos en el mes actual ESPECÍFICO
    const pastAndCurrentDays = isCurrentMonthSpecific
        ? data.filter(d => d.day <= todayDay)
        : data;

    //    Fallback
    const validData = pastAndCurrentDays.length > 0 ? pastAndCurrentDays : data;

    // 2. Aplicar el filtro de vista (Semana vs Mes)
    const chartData = viewMode === '5days'
        ? validData.slice(-5) // Últimos 5 días del set de datos
        : validData;          // Todo el data set

    const viewModeLabel = isRollingWindow ? 'Últimos 30 días' : 'Todo el mes';

    return (
        <div className="bg-[#0A3866]/40 backdrop-blur-xl border border-[#1A71B8]/30 p-6 rounded-3xl h-full flex flex-col transition-all duration-500 hover:shadow-[0_0_40px_rgba(52,182,216,0.2)] hover:bg-[#0A3866]/60 hover:border-[#34B6D8]/60 group relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-fuchsia-500/20 transition-all duration-700"></div>
            
            <div className="flex flex-row justify-between items-center mb-8 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-xl backdrop-blur-sm">
                        <Activity className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-base font-bold text-white leading-tight">
                            Actividad Diaria
                        </h4>
                        <span className="text-xs text-white/60 font-medium">
                            Consultas vs Casos
                        </span>
                    </div>

                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        barGap={4}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="rgba(255,255,255,0.05)"
                        />
                        <XAxis
                            dataKey="day"
                            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 500 }}
                            tickLine={false}
                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            dy={10}
                            interval={0}
                            tickFormatter={(value) => value}
                        />
                        <YAxis
                            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 500 }}
                            allowDecimals={false}
                            tickLine={false}
                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        />
                        <Legend
                            wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                            iconType="circle"
                            iconSize={8}
                            formatter={(value) => <span className="text-white/70 font-medium">{value}</span>}
                        />

                        <defs>
                            <linearGradient id="colorConsultas" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#d946ef" stopOpacity={1}/>
                                <stop offset="95%" stopColor="#c026d3" stopOpacity={0.8}/>
                            </linearGradient>
                            <linearGradient id="colorCasos" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={1}/>
                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                            </linearGradient>
                        </defs>
                        <Bar
                            dataKey="consultations"
                            name="Consultas"
                            fill="url(#colorConsultas)" 
                            radius={[6, 6, 6, 6]}
                            maxBarSize={40}
                        />
                        <Bar
                            dataKey="cases"
                            name="Casos Creados"
                            fill="url(#colorCasos)" 
                            radius={[6, 6, 6, 6]}
                            maxBarSize={40}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
