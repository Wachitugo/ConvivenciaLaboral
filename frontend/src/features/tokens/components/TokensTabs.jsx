import React from 'react';
import { BarChart3, School, Users, FileText } from 'lucide-react';

const TOKEN_TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'schools', label: 'Colegios', icon: School },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'logs', label: 'Historial', icon: FileText },
];

const TokensTabs = ({ activeTab, onTabChange }) => {
    return (
        <div className="border-b border-gray-200 flex px-6 overflow-x-auto">
            {TOKEN_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`py-4 px-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
};

export default TokensTabs;
