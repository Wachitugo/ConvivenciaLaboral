import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ searchTerm, setSearchTerm, activeTab }) => {
    return (
        <div className="flex gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
                <input
                    type="text"
                    placeholder={`Buscar ${activeTab === 'users' ? 'usuario' : 'colegio'}...`}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
        </div>
    );
};

export default SearchBar;
