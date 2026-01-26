import React from 'react';
import { Upload } from 'lucide-react';

/**
 * Barra de tabs para SchoolDetailSection
 */
export default function SchoolTabs({ tabs, activeTab, onTabChange, counts, onUploadClick, uploadLabel }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const count = counts[tab.id];
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Icon size={18} />
                            {tab.label}
                            {count !== null && count !== undefined && (
                                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-gray-100 text-gray-700' : 'bg-gray-200/50 text-gray-500'
                                    }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Botón de cargar datos */}
            <button
                onClick={onUploadClick}
                className="flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
            >
                <Upload size={18} />
                {uploadLabel}
            </button>
        </div>
    );
}
