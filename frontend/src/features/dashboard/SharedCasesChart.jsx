import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Share2 } from 'lucide-react';
import EmptyChartState from './EmptyChartState';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0A3866]/90 px-3 py-2 border border-[#1A71B8]/30 rounded-xl text-xs shadow-xl backdrop-blur-md">
        <p className="font-bold text-white mb-1">{payload[0].name}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.color }}></span>
          <p className="text-white/80 tabular-nums">
            {payload[0].value} casos ({payload[0].payload.percentage}%)
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function SharedCasesChart({ data }) {
  // Datos con colores predefinidos (Updated for better differentiation)
  const chartData = [
    {
      name: 'Compartidos por ti',
      value: data?.sharedByMe || 0,
      color: '#f43f5e', // rose-500
      percentage: 0
    },
    {
      name: 'Compartidos',
      value: data?.sharedWithMe || 0,
      color: '#0ea5e9', // sky-500
      percentage: 0
    },
    {
      name: 'No compartidos',
      value: data?.notShared || 0,
      color: '#334155', // slate-700 for dark mode
      percentage: 0
    }
  ];

  // Calcular porcentajes
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  chartData.forEach(item => {
    item.percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
  });

  // Filtrar items con valor 0 para el gráfico
  const filteredData = chartData.filter(item => item.value > 0);

  const hasData = total > 0;

  return (
    <div className="bg-[#0A3866]/40 backdrop-blur-xl border border-[#1A71B8]/30 p-6 rounded-3xl h-full flex flex-col transition-all duration-500 hover:shadow-[0_0_40px_rgba(52,182,216,0.2)] hover:bg-[#0A3866]/60 hover:border-[#34B6D8]/60 group relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-violet-500/20 transition-all duration-700"></div>
      
      <div className="flex items-center gap-3 mb-8 relative z-10">
        <div className="p-2 bg-violet-500/20 rounded-xl backdrop-blur-sm">
          <Share2 className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h4 className="text-base font-bold text-white leading-tight">
            Casos Compartidos
          </h4>
          <span className="text-xs text-white/60 font-medium">
            Estado de colaboración
          </span>
        </div>
      </div>

      {hasData ? (
        <>
          <div className="flex-1 w-full min-h-0 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  cornerRadius={10}
                  dataKey="value"
                  stroke="none"
                >
                  {filteredData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  formatter={(value, entry) => (
                    <span className="text-white/80 font-medium">
                      {value} <span className="text-white/50">({entry.payload.percentage}%)</span>
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Resumen compacto - Refined */}
  
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <EmptyChartState
            title="Casos Compartidos"
            message="No hay casos compartidos aún"
          />
        </div>
      )}
    </div>
  );
}
