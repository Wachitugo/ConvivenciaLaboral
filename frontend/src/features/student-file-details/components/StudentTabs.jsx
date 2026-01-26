import React from 'react';
import { FileText, Users, Heart, ClipboardList, FileWarning, BookOpen } from 'lucide-react';

const StudentTabs = ({ activeTab, setActiveTab, canViewConvivencia = true }) => {
    const allTabs = [
        { id: 'salud', label: 'Salud', icon: Heart, requiresConvivencia: false },
        { id: 'bitacora', label: 'Bitacora', icon: BookOpen, requiresConvivencia: false },
        { id: 'convivencia', label: 'Convivencia', icon: Users, requiresConvivencia: true },
        { id: 'compromisos', label: 'Compromisos', icon: FileWarning, requiresConvivencia: false },
        { id: 'paec', label: 'Ficha PAEC', icon: ClipboardList, requiresConvivencia: false }
    ];

    // Filtrar tabs según permisos
    const tabs = allTabs.filter(tab => !tab.requiresConvivencia || canViewConvivencia);

    return (
        <div className="flex border-b border-gray-200 bg-white px-2 sm:px-4 overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon }) => (
                <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all relative whitespace-nowrap ${activeTab === id
                        ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    <Icon size={16} className={`flex-shrink-0 ${activeTab === id ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className="hidden xs:inline sm:inline">{label}</span>
                    <span className="xs:hidden sm:hidden">{label.split(' ')[0]}</span>
                </button>
            ))}
        </div>
    );
};

export default StudentTabs;

