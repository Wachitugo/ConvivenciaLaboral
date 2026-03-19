import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';
import EmptyChartState from './EmptyChartState';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0A3866]/90 px-3 py-2 border border-[#1A71B8]/30 rounded-xl shadow-xl text-xs backdrop-blur-md">
        <p className="font-semibold text-white mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-0.5 last:mb-0">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-white/60 capitalize">{entry.name}:</span>
            <span className="font-medium text-white/90 tabular-nums">
              {entry.value} {entry.value === 1 ? 'caso' : 'casos'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function MonthlyCasesChart({ data, rollingData, selectedYear }) {
  const [viewMode, setViewMode] = useState('6months');

  // Validar si estamos en el año actual para filtrar meses futuros
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthIndex = today.getMonth();

  // Si selectedYear es 'all', asumimos año actual
  const isCurrentYearContext = selectedYear === 'all' || parseInt(selectedYear) === currentYear;

  // Efecto para vista por defecto
  React.useEffect(() => {
    setViewMode('6months');
  }, [selectedYear]);

  // Selección de dataset según viewMode
  // si es 6months y tenemos rollingData, usamos eso. Sino fallback a lo normal.
  let chartData = [];
  let isComparison = false;

  if (viewMode === '6months' && rollingData && rollingData.length > 0) {
    // Modo Rolling - Simplificado a una sola serie con colores dinámicos
    chartData = rollingData.map(d => ({ ...d, casos: d.current }));
    isComparison = false;
  } else {
    // Modo Normal (Año completo o mes especifico)
    // Logica previa de slice si es current year
    chartData = data || [];

    // SOLO si queriamos cortar futuros:
    if (isCurrentYearContext && viewMode === '12months') {
      // chartData = chartData.slice(0, currentMonthIndex + 1); // Descomentar si se quiere cortar
    }

    if (chartData.length > 0) {
      isComparison = chartData[0].isComparison || 'current' in chartData[0];
    }
  }

  const hasData = chartData && chartData.length > 0 && chartData.some(d => {
    if (d.isRolling) return (d.current || 0) > 0 || (d.previous || 0) > 0;
    if (isComparison) return (d.current || 0) > 0 || (d.previous || 0) > 0;
    return (d.casos || 0) > 0;
  });

  // Obtener años para la leyenda
  let curYear = 'Actual';
  let prevYear = 'Anterior';

  if (viewMode === '6months') {
    curYear = 'Periodo Actual';
    prevYear = 'Periodo Anterior';
  } else if (chartData && chartData.length > 0) {
    curYear = chartData[0].yearCurrent ? chartData[0].yearCurrent : 'Actual';
    prevYear = chartData[0].yearPrevious ? chartData[0].yearPrevious : 'Anterior';
  }

  return (
    <div className="bg-[#0A3866]/40 backdrop-blur-xl border border-[#1A71B8]/30 p-6 rounded-3xl h-full flex flex-col transition-all duration-500 hover:shadow-[0_0_40px_rgba(52,182,216,0.2)] hover:bg-[#0A3866]/60 hover:border-[#34B6D8]/60 group relative overflow-hidden">
      {/* Background Decorator */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700"></div>

      <div className="flex flex-row justify-between items-center mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-xl backdrop-blur-sm">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white leading-tight">
              {isComparison ? 'Comparativa de Casos' : 'Evolución de Casos'}
            </h2>
            <span className="text-xs text-white/60 font-medium">
              {isComparison ? 'Año actual vs anterior' : 'Tendencia mensual'}
            </span>
          </div>
        </div>

      </div>

      {hasData ? (
        <div className="h-64 w-full min-w-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              barGap={4}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="mes"
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                dy={10}
                tickFormatter={(value, index) => {
                  // Mostrar el año si es diferente al actual en la vista rolling
                  if (chartData && chartData[index]) {
                    const itemYear = chartData[index].year || chartData[index].yearCurrent;
                    if (itemYear && itemYear !== currentYear) {
                      return `${value} '${itemYear.toString().slice(-2)}`;
                    }
                  }
                  return value;
                }}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />

              {isComparison && (
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', fontWeight: 500 }}
                />
              )}

              {isComparison ? (
                <>
                  <Bar
                    dataKey="previous"
                    name={`${prevYear}`}
                    fill="url(#colorPrevious)"
                    radius={[6, 6, 6, 6]}
                    maxBarSize={30}
                  />
                  <Bar
                    dataKey="current"
                    name={`${curYear}`}
                    fill="url(#colorCurrent)"
                    radius={[6, 6, 6, 6]}
                    maxBarSize={30}
                  />
                </>
              ) : (
                <Bar
                  dataKey="casos"
                  name="Casos"
                  radius={[6, 6, 6, 6]}
                  maxBarSize={50}
                >
                  <defs>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    </linearGradient>
                    <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#475569" stopOpacity={1}/>
                      <stop offset="95%" stopColor="#1e293b" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={(entry.year && entry.year !== currentYear) ? 'url(#colorPrevious)' : 'url(#colorCurrent)'}
                    />
                  ))}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center flex-1">
          <EmptyChartState message="No hay casos registrados en el periodo" />
        </div>
      )}

      {/* Resumen - Se adapta dinámicamente a la data mostrada */}
      {hasData && (
        <div className="mt-4 pt-4 border-t border-[#1A71B8]/30 flex items-center justify-between text-xs text-white/60">
          {isComparison ? (
            <div className="flex gap-4 w-full justify-between px-1">
              <span>{prevYear}: <strong className="text-white/80 font-semibold">{chartData.reduce((sum, item) => sum + (item.previous || 0), 0)}</strong></span>
              <span>{curYear}: <strong className="text-[#34B6D8] font-semibold">{chartData.reduce((sum, item) => sum + (item.current || 0), 0)}</strong></span>
            </div>
          ) : (
            <>
              <span className="font-medium">
                {viewMode === '6months' ? 'Últimos 6 meses' : 'Total anual'}
              </span>
              <span className="font-semibold text-[#34B6D8] tabular-nums px-1">
                Total: {chartData.reduce((sum, item) => sum + (item.casos || 0), 0)} casos
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
