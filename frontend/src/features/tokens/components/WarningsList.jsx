import React from 'react';
import { AlertTriangle } from 'lucide-react';

const WarningsList = ({ schools, users }) => {
    const getWarnings = (entities, type) => {
        const warnings = [];

        entities.forEach(entity => {
            const thresholds = entity.warning_thresholds && entity.warning_thresholds.length > 0
                ? entity.warning_thresholds.sort((a, b) => a - b)
                : [80]; // Default threshold if not set, consistent with logic elsewhere

            const minThreshold = thresholds[0];

            // Check Input Limit
            if (entity.input_token_limit) {
                const inputUsage = entity.token_usage?.input_tokens || 0;
                const inputPercent = (inputUsage / entity.input_token_limit) * 100;

                if (inputPercent >= minThreshold) {
                    warnings.push({
                        id: entity.id,
                        name: entity.nombre,
                        type: type,
                        limitType: 'Input',
                        percent: inputPercent,
                        usage: inputUsage,
                        limit: entity.input_token_limit,
                        threshold: minThreshold
                    });
                }
            }

            // Check Output Limit
            if (entity.output_token_limit) {
                const outputUsage = entity.token_usage?.output_tokens || 0;
                const outputPercent = (outputUsage / entity.output_token_limit) * 100;

                if (outputPercent >= minThreshold) {
                    warnings.push({
                        id: entity.id,
                        name: entity.nombre,
                        type: type,
                        limitType: 'Output',
                        percent: outputPercent,
                        usage: outputUsage,
                        limit: entity.output_token_limit,
                        threshold: minThreshold
                    });
                }
            }
        });

        return warnings;
    };

    const schoolWarnings = getWarnings(schools, 'Colegio');
    const userWarnings = getWarnings(users, 'Usuario');
    const allWarnings = [...schoolWarnings, ...userWarnings];

    if (allWarnings.length === 0) return null;

    return (
        <div className="mb-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Alertas de Consumo</h3>
                    <p className="text-sm text-gray-500 font-medium">Atención prioritaria - Límites excedidos</p>
                </div>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {allWarnings.map((w, idx) => (
                    <div key={`${w.type}-${w.id}-${w.limitType}-${idx}`} className="bg-white p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors group flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-800 text-sm truncate mb-1" title={w.name}>
                                {w.name}
                            </h4>
                            <div className="flex items-center gap-2">
                                <span className="flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 uppercase tracking-wider border border-gray-200">
                                    {w.type === 'Usuario' ? w.id.substring(0, 6) : 'Colegio'}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {w.limitType === 'Input' ? 'In' : 'Out'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-xs font-bold whitespace-nowrap">
                                        {Math.round(w.percent)}% Usado
                                    </span>
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1 font-medium">
                                    {w.usage.toLocaleString()} / {w.limit.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #e5e7eb;
                    border-radius: 20px;
                }
            `}</style>
        </div>
    );
};

export default WarningsList;
