import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function EmptyChartState({ title, message = "No hay datos disponibles", icon: Icon = BarChart3, height = "100%" }) {
    return (
        <div className="flex flex-col items-center justify-center p-6 bg-[#0A3866]/30 rounded-2xl border border-[#34B6D8]/30 border-dashed transition-all" style={{ height }}>
            <div className="p-3 bg-[#1A71B8]/20 rounded-full shadow-sm mb-3 text-[#34B6D8] backdrop-blur-md">
                <Icon className="w-6 h-6 currentColor" />
            </div>
            {title && (
                <h5 className="text-sm font-semibold text-white mb-1">{title}</h5>
            )}
            <p className="text-xs text-white/60 text-center max-w-[200px]">{message}</p>
        </div>
    );
}
