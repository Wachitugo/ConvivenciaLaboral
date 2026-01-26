import React from 'react';
import { Search } from 'lucide-react';

/**
 * Input de búsqueda reutilizable
 */
export default function SearchInput({ value, onChange, placeholder = 'Buscar...' }) {
    return (
        <div className="w-full sm:flex-1 max-w-md">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border-none rounded-xl bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all duration-200 text-sm font-medium"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        </div>
    );
}
