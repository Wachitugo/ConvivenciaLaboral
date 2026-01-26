import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import EmptyChartState from './EmptyChartState';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white px-3 py-2 border border-gray-200 rounded text-xs shadow-md">
                <p className="font-bold text-gray-900 mb-1">{payload[0].name}</p>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }}></span>
                    <p className="text-gray-700 tabular-nums">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full flex flex-col transition-all hover:shadow-md">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-fuchsia-50 rounded-lg">
                    <PieChartIcon className="w-5 h-5 text-fuchsia-600" />
                </div>
                <div>
                    <h4 className="text-base font-bold text-gray-800 leading-tight">
                        Entrevistas por Género
                    </h4>
                    <span className="text-xs text-gray-500 font-medium">
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
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                                formatter={(value) => <span className="text-gray-600 font-medium">{value}</span>}
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
