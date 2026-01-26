import React from 'react';
import { Activity, Clock } from 'lucide-react';

export default function TokenActivityTimeline({ data }) {
    const sortedData = [...(data || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-50 rounded-lg">
                    <Activity className="w-5 h-5 text-green-600" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-gray-800 leading-tight">
                        Actividad Reciente
                    </h2>
                    <span className="text-xs text-gray-500 font-medium">
                        Resumen diario de consumo
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {sortedData.length > 0 ? (
                    <div className="relative border-l border-gray-200 ml-3 space-y-6">
                        {sortedData.map((item, index) => (
                            <div key={index} className="mb-6 last:mb-0 ml-4 relative">
                                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white ring-1 ring-gray-100"></span>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(item.date).toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium text-gray-900">Consumo Diario</span>
                                            <span className="font-bold text-indigo-600">{item.total_tokens?.toLocaleString()} tkns</span>
                                        </div>
                                        <div className="text-xs text-gray-500 flex gap-3">
                                            <span>Input: {item.input_tokens?.toLocaleString()}</span>
                                            <span>Output: {item.output_tokens?.toLocaleString()}</span>
                                            <span>Interacciones: {item.count}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                        <Activity className="w-8 h-8 mb-2 opacity-50" />
                        No hay actividad registrada
                    </div>
                )}
            </div>
        </div>
    );
}
