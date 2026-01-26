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
            <div className="bg-white px-3 py-2 border border-gray-200 rounded text-xs shadow-md">
                <p className="font-bold text-gray-900 mb-1">{`Día ${label}`}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-gray-700" style={{ color: entry.color }}>
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
            <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm h-full flex flex-col items-center justify-center">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full flex flex-col transition-all hover:shadow-md">
            <div className="flex flex-row justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <Activity className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h4 className="text-base font-bold text-gray-800 leading-tight">
                            Actividad Diaria
                        </h4>
                        <span className="text-xs text-gray-500 font-medium">
                            Consultas vs Casos
                        </span>
                    </div>

                </div>
                <select
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value)}
                    className="text-xs font-medium text-gray-600 bg-gray-50 border-gray-200 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 py-1.5 px-3 outline-none transition-colors"
                >
                    <option value="month">{viewModeLabel}</option>
                    <option value="5days">Últimos 5 días</option>
                </select>
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
                            stroke="#f1f5f9"
                        />
                        <XAxis
                            dataKey="day"
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                            tickLine={false}
                            axisLine={{ stroke: '#e2e8f0' }}
                            dy={10}
                            interval={0}
                            tickFormatter={(value) => value}
                        />
                        <YAxis
                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                            allowDecimals={false}
                            tickLine={false}
                            axisLine={{ stroke: '#e2e8f0' }}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: '#f8fafc' }}
                        />
                        <Legend
                            wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                            iconType="circle"
                            iconSize={8}
                        />

                        <Bar
                            dataKey="consultations"
                            name="Consultas"
                            fill="#6366f1" // Indigo 500
                            radius={[4, 4, 4, 4]}
                            maxBarSize={40}
                        />
                        <Bar
                            dataKey="cases"
                            name="Casos Creados"
                            fill="#f43f5e" // Rose 500
                            radius={[4, 4, 4, 4]}
                            maxBarSize={40}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
