import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';
import EmptyChartState from './EmptyChartState';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-3 py-2 border border-gray-200 rounded-lg shadow-sm text-xs">
        <p className="font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-0.5 last:mb-0">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-600 capitalize">{entry.name}:</span>
            <span className="font-medium text-gray-900 tabular-nums">
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full flex flex-col transition-all hover:shadow-md">
      <div className="flex flex-row justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800 leading-tight">
              {isComparison ? 'Comparativa de Casos' : 'Evolución de Casos'}
            </h2>
            <span className="text-xs text-gray-500 font-medium">
              {isComparison ? 'Año actual vs anterior' : 'Tendencia mensual'}
            </span>
          </div>
        </div>

        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
          className="text-xs font-medium text-gray-600 bg-gray-50 border-gray-200 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 py-1.5 px-3 outline-none transition-colors"
        >
          <option value="6months">Últimos 6 meses</option>
          <option value="12months">Todo el año</option>
        </select>
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
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="mes"
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
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
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />

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
                    fill="#cbd5e1"
                    radius={[4, 4, 4, 4]}
                    maxBarSize={30}
                  />
                  <Bar
                    dataKey="current"
                    name={`${curYear}`}
                    fill="#6366f1"
                    radius={[4, 4, 4, 4]}
                    maxBarSize={30}
                  />
                </>
              ) : (
                <Bar
                  dataKey="casos"
                  name="Casos"
                  radius={[4, 4, 4, 4]}
                  maxBarSize={50}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={(entry.year && entry.year !== currentYear) ? '#cbd5e1' : '#6366f1'}
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
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          {isComparison ? (
            <div className="flex gap-4 w-full justify-between px-1">
              <span>{prevYear}: <strong className="text-gray-700 font-semibold">{chartData.reduce((sum, item) => sum + (item.previous || 0), 0)}</strong></span>
              <span>{curYear}: <strong className="text-indigo-600 font-semibold">{chartData.reduce((sum, item) => sum + (item.current || 0), 0)}</strong></span>
            </div>
          ) : (
            <>
              <span className="font-medium">
                {viewMode === '6months' ? 'Últimos 6 meses' : 'Total anual'}
              </span>
              <span className="font-semibold text-indigo-600 tabular-nums px-1">
                Total: {chartData.reduce((sum, item) => sum + (item.casos || 0), 0)} casos
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
