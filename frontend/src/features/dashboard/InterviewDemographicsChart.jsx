import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import EmptyChartState from './EmptyChartState';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0A3866]/90 px-3 py-2 border border-[#1A71B8]/30 rounded-xl text-xs shadow-xl backdrop-blur-md">
                <p className="font-bold text-white mb-1">{payload[0].name}</p>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }}></span>
                    <p className="text-white/80 tabular-nums">
                        {payload[0].value} entrevistas
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

const GENDER_COLORS = {
    'Masculino': '#3b82f6',  // blue-500
    'Femenino': '#ec4899',   // pink-500
    'Otro': '#8b5cf6',       // violet-500
    'No especificado': '#9ca3af' // gray-400
};

export default function InterviewDemographicsChart({ genderData }) {
    const hasData = genderData && genderData.length > 0 && genderData.some(d => d.count > 0);
    const chartData = genderData ? genderData.filter(d => d.count > 0) : [];

    return (
        <div className="bg-[#0A3866]/40 backdrop-blur-xl border border-[#1A71B8]/30 p-6 rounded-3xl h-full flex flex-col transition-all duration-500 hover:shadow-[0_0_40px_rgba(52,182,216,0.2)] hover:bg-[#0A3866]/60 hover:border-[#34B6D8]/60 group relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-fuchsia-500/20 transition-all duration-700"></div>
            
            <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="p-2 bg-fuchsia-500/20 rounded-xl backdrop-blur-sm">
                    <PieChartIcon className="w-5 h-5 text-fuchsia-400" />
                </div>
                <div>
                    <h4 className="text-base font-bold text-white leading-tight">
                        Entrevistas por Género
                    </h4>
                    <span className="text-xs text-white/60 font-medium">
                        Distribución demográfica
                    </span>
                </div>
            </div>

            {hasData ? (
                <div className="flex-1 w-full min-h-[200px] min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={85}
                                paddingAngle={4}
                                cornerRadius={8}
                                dataKey="count"
                                stroke="none"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={GENDER_COLORS[entry.name] || GENDER_COLORS['No especificado']} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                                formatter={(value) => <span className="text-white/60 font-medium">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <EmptyChartState
                        title="Sin Datos Demográficos"
                        message="No hay entrevistas registradas"
                    />
                </div>
            )}
        </div>
    );
}
