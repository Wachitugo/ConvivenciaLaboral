import React from 'react';

const StatCard = ({ label, value, icon: Icon, color, subValue }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">{value?.toLocaleString()}</h3>
                {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
            </div>
            <div className={`p-2 rounded-lg bg-${color}-50`}>
                <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
        </div>
    </div>
);

export default StatCard;
