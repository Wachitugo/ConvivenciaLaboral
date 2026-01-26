import React from 'react';

const UsageBar = ({ current, limit, thresholds }) => {
    if (!limit) return <span className="text-xs text-gray-400">Sin límite</span>;

    const percent = Math.min((current / limit) * 100, 100);
    let color = 'bg-green-500';

    if (thresholds && thresholds.length > 0) {
        const sorted = [...thresholds].sort((a, b) => a - b);
        if (percent >= sorted[sorted.length - 1]) color = 'bg-red-500';
        else if (percent >= sorted[0]) color = 'bg-yellow-500';
    } else {
        if (percent > 90) color = 'bg-red-500';
        else if (percent > 75) color = 'bg-yellow-500';
    }

    return (
        <div className="w-full max-w-[140px]">
            <div className="flex justify-between text-xs mb-1">
                <span>{Math.round(percent)}%</span>
                <span className="text-gray-400">{current.toLocaleString()} / {limit.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} transition-all duration-500`}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
};

export default UsageBar;
