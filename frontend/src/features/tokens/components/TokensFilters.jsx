import React from 'react';
import { Filter, Calendar } from 'lucide-react';
import DateRangeFilter from './DateRangeFilter';

const TokensFilters = ({
    dateRange,
    setDateRange,
    selectedSchoolId,
    setSelectedSchoolId,
    selectedUserId,
    setSelectedUserId,
    schools,
    filteredUsersForDropdown
}) => {
    return (
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtrar por:</span>
            </div>

            <div className="flex items-center gap-2 border-r border-gray-200 pr-4 mr-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div className="flex items-center gap-2">
                    <DateRangeFilter
                        range={dateRange}
                        onChange={setDateRange}
                    />
                </div>
            </div>

            {/* School Filter */}
            <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 max-w-xs"
            >
                <option value="">Todos los Colegios</option>
                {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
            </select>

            {/* User Filter */}
            <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 max-w-xs"
            >
                <option value="">Todos los Usuarios</option>
                {filteredUsersForDropdown.map(u => (
                    <option key={u.id || u.uid} value={u.id || u.uid}>{u.nombre} ({u.correo})</option>
                ))}
            </select>
        </div>
    );
};

export default TokensFilters;
