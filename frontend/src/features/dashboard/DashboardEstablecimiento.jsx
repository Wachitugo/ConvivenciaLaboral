import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import EmptyChartState from './EmptyChartState';

// Tooltip minimalista
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-3 py-2 border border-gray-200 rounded text-xs">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-gray-600">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const CustomTooltipLine = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-3 py-2 border border-gray-200 rounded text-xs">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-gray-600">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-3 py-2 border border-gray-200 rounded text-xs">
        <p className="font-medium text-gray-900">{payload[0].name}</p>
        <p className="text-gray-600">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};


const DashboardEstablecimiento = ({ evolucionData, estadoCasosData, dailyActivityData }) => {
  // Datos fallback por si no llegan props
  const safeEvolucionData = evolucionData || [];
  const safeEstadoCasosData = estadoCasosData || [];
  const safeDailyActivityData = dailyActivityData || [];

  return (
    <div className="space-y-4">


      {/* Evolución y Estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gráfico de Línea - Evolución Mensual */}
        <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm">
          <h4 className="text-lg font-bold text-gray-800 mb-4">
            Cantidad de Casos por Mes
          </h4>
          <div style={{ height: 280 }}>
            {safeEvolucionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={safeEvolucionData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis
                    dataKey="mes"
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                  />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltipLine />} />
                  <Bar
                    dataKey="casos"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    label={{ position: 'top', fill: '#6b7280', fontSize: 10 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState
                message="No hay casos registrados en los últimos meses."
              />
            )}
          </div>
        </div>

        {/*<div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm">
          <h4 className="text-lg font-bold text-gray-800 mb-4">
            Estado de Casos
          </h4>
          <div style={{ height: 280 }}>
            {safeEstadoCasosData.length > 0 && safeEstadoCasosData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={safeEstadoCasosData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={(entry) => entry.value}
                  >
                    {safeEstadoCasosData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={30}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState
                message="No hay estados de casos para mostrar."
              />
            )}
          </div>
        </div> */}
        
      </div>

      {/* Spacer for old component structure if needed */}
      <div></div>

    </div>
  );
};



export default DashboardEstablecimiento;
