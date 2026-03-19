import React from 'react';
import { FileText, Users, Heart, ClipboardList, FileWarning, BookOpen } from 'lucide-react';

const StudentTabs = ({ activeTab, setActiveTab, canViewConvivencia = true }) => {
    const allTabs = [
        { id: 'salud', label: 'Salud', icon: Heart, requiresConvivencia: false },
        { id: 'convivencia', label: 'Convivencia Laboral', icon: Users, requiresConvivencia: true },
        { id: 'compromisos', label: 'Sanciones', icon: FileWarning, requiresConvivencia: false }
    ];

    // Filtrar tabs según permisos
    const tabs = allTabs.filter(tab => !tab.requiresConvivencia || canViewConvivencia);

    return (
        <div className="flex border-b border-[#1A71B8]/30 bg-black/10 px-2 sm:px-4 overflow-x-auto scrollbar-hide relative z-10">
            {tabs.map(({ id, label, icon: Icon }) => (
                <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === id
                        ? 'text-white border-b-2 border-[#34B6D8] -mb-px bg-white/5 drop-shadow-[0_0_8px_rgba(52,182,216,0.6)]'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                        }`}
                >
                    <Icon size={16} className={`flex-shrink-0 ${activeTab === id ? 'text-[#34B6D8]' : 'text-white/40'}`} />
                    <span className="hidden xs:inline sm:inline">{label}</span>
                    <span className="xs:hidden sm:hidden">{label.split(' ')[0]}</span>
                </button>
            ))}
        </div>
    );
};

export default StudentTabs;

