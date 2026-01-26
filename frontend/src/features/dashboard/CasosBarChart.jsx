import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from 'recharts';

const casosPorTipoData = [
  { tipo: 'Conflictos entre compañeros', casos: 45 },
  { tipo: 'Problemas de conducta', casos: 32 },
  { tipo: 'Mediación familiar', casos: 28 },
  { tipo: 'Otros', casos: 15 }
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-3 py-2 border border-gray-200 rounded text-xs">
        <p className="font-medium text-gray-900">{payload[0].payload.tipo}</p>
        <p className="text-gray-600">{payload[0].value} casos</p>
      </div>
    );
  }
  return null;
};

export default function CasosBarChart() {
  return (
    <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm">
      <h4 className="text-sm font-medium mb-3 text-gray-700">
        Casos por Tipo
      </h4>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={casosPorTipoData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} />
          <YAxis
            type="category"
            dataKey="tipo"
            tick={{ fill: '#374151', fontSize: 11 }}
            width={150}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="casos"
            fill="#6366f1"
            radius={[0, 3, 3, 0]}
          >
            <LabelList
              dataKey="casos"
              position="right"
              style={{ fill: '#6b7280', fontSize: 11, fontWeight: 500 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
