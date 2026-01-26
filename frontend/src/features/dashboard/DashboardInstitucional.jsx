import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Datos para el gráfico de pie
const establecimientosData = [
  { name: 'Establecimiento A', value: 40, color: '#3b82f6' },
  { name: 'Establecimiento B', value: 25, color: '#8b5cf6' },
  { name: 'Establecimiento C', value: 15, color: '#f59e0b' },
  { name: 'Establecimiento D', value: 20, color: '#6b7280' }
];

// Datos para el gráfico de barras
const consultasData = [
  { tipo: 'Consultas RICE', cantidad: 35 },
  { tipo: 'Protocolos', cantidad: 28 },
  { tipo: 'Denuncias Super.', cantidad: 12 },
  { tipo: 'Soporte', cantidad: 18 },
  { tipo: 'Capacitación', cantidad: 22 }
];

// Tooltip simple
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow-sm">
        <p className="text-sm font-medium text-gray-700">{payload[0].name}</p>
        <p className="text-sm text-gray-600">
          {payload[0].value}%
        </p>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow-sm">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-sm text-gray-600">
          Consultas: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const DashboardInstitucional = () => {
  return (
    <div>
      <h3 className="text-xl font-semibold text-neutral-800 mb-2">
        Dashboard: Sostenedor / Red de Colegios
      </h3>
      <p className="text-neutral-600 mb-4">
        Enfocado en métricas administrativas, resultados y brechas de habilidades.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de Pie - Distribución por Establecimiento */}
        <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
          <h4 className="font-semibold mb-4 text-gray-800">
            Distribución de Conflictos por Establecimiento
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={establecimientosData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={(entry) => `${entry.value}%`}
              >
                {establecimientosData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Barras - Tipos de Consultas */}
        <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
          <h4 className="font-semibold mb-4 text-gray-800">
            Tipos de Consultas de Encargados
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={consultasData}
              margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="tipo"
                angle={-20}
                textAnchor="end"
                height={80}
                tick={{ fill: '#6b7280', fontSize: 11 }}
              />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar
                dataKey="cantidad"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardInstitucional;
