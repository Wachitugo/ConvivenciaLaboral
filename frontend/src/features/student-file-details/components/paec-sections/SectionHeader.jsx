import React from 'react';
import { Edit } from 'lucide-react';

const SectionHeader = ({ icon: Icon, title, onEdit, editLabel = 'Editar' }) => (
    <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
        <h4 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Icon size={14} className="text-blue-500 flex-shrink-0 sm:w-4 sm:h-4" />
            <span className="truncate">{title}</span>
        </h4>
        {onEdit && (
            <button
                onClick={onEdit}
                className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-1 text-xs sm:text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
            >
                <Edit size={14} />
                <span className="hidden sm:inline">{editLabel}</span>
            </button>
        )}
    </div>
);

export default SectionHeader;
