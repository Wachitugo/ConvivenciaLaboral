import React from 'react';
import { User, Users } from 'lucide-react';

/**
 * Toggle para alternar entre modo masivo e individual
 */
export default function ModeToggle({ mode, onModeChange }) {
    return (
        <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                    onClick={() => onModeChange('bulk')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'bulk'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Users size={16} />
                    Masiva
                </button>
                <button
                    onClick={() => onModeChange('individual')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'individual'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <User size={16} />
                    Individual
                </button>
            </div>
        </div>
    );
}
