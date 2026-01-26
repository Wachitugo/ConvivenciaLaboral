import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';

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
                            {entry.value.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function TokenHistoryChart({ data, period, onPeriodChange }) {
    // Calculate total for the period
    const totalTokens = data.reduce((sum, item) => sum + (item.total_tokens || 0), 0);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full flex flex-col transition-all hover:shadow-md">
            <div className="flex flex-row justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-800 leading-tight">
                            Evolución de Consumo
                        </h2>
                        <span className="text-xs text-gray-500 font-medium">
                            Tendencia de uso de tokens
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-xs font-medium text-gray-500 mb-0.5">
                        Total en periodo
                    </span>
                    <span className="text-lg font-bold text-indigo-600 tabular-nums leading-tight">
                        {totalTokens.toLocaleString()} <span className="text-xs font-medium text-gray-400">tokens</span>
                    </span>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                    >
                        <defs>
                            <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                            tickLine={false}
                            axisLine={{ stroke: '#e2e8f0' }}
                            dy={10}
                            tickFormatter={(value) => {
                                // value is YYYY-MM-DD
                                if (!value) return '';
                                const parts = value.split('-');
                                if (parts.length < 3) return value;
                                return `${parseInt(parts[2])}/${parseInt(parts[1])}`;
                            }}
                        />
                        <YAxis
                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                            tickLine={false}
                            axisLine={{ stroke: '#e2e8f0' }}
                            tickFormatter={(value) => {
                                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                                return value;
                            }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '3 3' }} />
                        <Area
                            type="monotone"
                            dataKey="total_tokens"
                            name="Tokens Totales"
                            stroke="#6366f1"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorTokens)"
                        />
                        <Area
                            type="monotone"
                            dataKey="input_tokens"
                            name="Input"
                            stroke="#22c55e"
                            strokeWidth={2}
                            fillOpacity={0}
                            fill="transparent"
                            hide={true}
                        />
                        <Area
                            type="monotone"
                            dataKey="output_tokens"
                            name="Output"
                            stroke="#eab308"
                            strokeWidth={2}
                            fillOpacity={0}
                            fill="transparent"
                            hide={true}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
