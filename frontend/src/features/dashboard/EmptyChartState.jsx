import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function EmptyChartState({ title, message = "No hay datos disponibles", icon: Icon = BarChart3, height = "100%" }) {
    return (
        <div className="flex flex-col items-center justify-center p-6 bg-stone-50/50 rounded-lg border border-stone-200 border-dashed" style={{ height }}>
            <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                <Icon className="w-6 h-6 text-stone-400" />
            </div>
            {title && (
                <h5 className="text-sm font-semibold text-stone-600 mb-1">{title}</h5>
            )}
            <p className="text-xs text-stone-500 text-center max-w-[200px]">{message}</p>
        </div>
    );
}
