import React from 'react';
import { School, Edit2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import UsageBar from './UsageBar';

const SchoolRow = ({ school, onEditLimit }) => (
    <tr className="hover:bg-gray-50">
        <td className="py-4 pl-4">
            <div className="flex items-center gap-3">
                {school.logo_url ? (
                    <img
                        src={school.logo_url}
                        alt={school.nombre}
                        className="w-10 h-10 rounded-lg object-contain bg-white border border-gray-100 p-1"
                    />
                ) : (
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <School className="w-4 h-4 text-blue-600" />
                    </div>
                )}
                <div>
                    <p className="font-medium text-gray-900">{school.nombre}</p>
                    <p className="text-xs text-gray-500">ID: {school.id?.substring(0, 8)}...</p>
                </div>
            </div>
        </td>
        <td className="py-4 text-right">
            <span className="font-medium text-green-600 text-sm">
                {school.token_usage?.input_tokens?.toLocaleString() || 0}
            </span>
        </td>
        <td className="py-4 text-right">
            <span className="font-medium text-yellow-600 text-sm">
                {school.token_usage?.output_tokens?.toLocaleString() || 0}
            </span>
        </td>
        <td className="py-4 text-right">
            <span className="font-medium text-indigo-600 text-sm">
                {school.token_usage?.total_tokens?.toLocaleString() || 0}
            </span>
        </td>
        <td className="py-4">
            <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 w-full max-w-[180px]">
                    <span className="text-[10px] uppercase text-gray-400 font-bold w-6 text-right">In</span>
                    <UsageBar
                        current={school.token_usage?.input_tokens || 0}
                        limit={school.input_token_limit}
                        thresholds={school.warning_thresholds}
                    />
                </div>
                <div className="flex items-center gap-2 w-full max-w-[180px]">
                    <span className="text-[10px] uppercase text-gray-400 font-bold w-6 text-right">Out</span>
                    <UsageBar
                        current={school.token_usage?.output_tokens || 0}
                        limit={school.output_token_limit}
                        thresholds={school.warning_thresholds}
                    />
                </div>
            </div>
        </td>
        <td className="py-4 text-right pr-4">
            <button
                onClick={() => onEditLimit(school, 'school')}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Editar Límites"
            >
                <Edit2 className="w-4 h-4" />
            </button>
        </td>
    </tr>
);

const UserRow = ({ user, getSchoolName, onEditLimit }) => (
    <tr className="hover:bg-gray-50">
        <td className="py-4 pl-4">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-purple-600 font-bold text-sm border-2 border-white shadow-sm">
                    {user.nombre?.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="font-medium text-gray-900">{user.nombre}</p>
                    <p className="text-xs text-gray-500">{user.correo}</p>
                </div>
            </div>
        </td>
        <td className="py-4">
            {user.colegios?.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                    {user.colegios.map(schoolId => {
                        const name = getSchoolName(schoolId);
                        return name ? (
                            <span key={schoolId} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                {name}
                            </span>
                        ) : null;
                    })}
                </div>
            ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                    Sin asignar
                </span>
            )}
        </td>
        <td className="py-4 text-right">
            <span className="font-medium text-green-600 text-sm">
                {user.token_usage?.input_tokens?.toLocaleString() || 0}
            </span>
        </td>
        <td className="py-4 text-right">
            <span className="font-medium text-yellow-600 text-sm">
                {user.token_usage?.output_tokens?.toLocaleString() || 0}
            </span>
        </td>
        <td className="py-4 text-right">
            <span className="font-medium text-indigo-600 text-sm">
                {user.token_usage?.total_tokens?.toLocaleString() || 0}
            </span>
        </td>
        <td className="py-4">
            <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 w-full max-w-[180px]">
                    <span className="text-[10px] uppercase text-gray-400 font-bold w-6 text-right">In</span>
                    <UsageBar
                        current={user.token_usage?.input_tokens || 0}
                        limit={user.input_token_limit}
                        thresholds={user.warning_thresholds}
                    />
                </div>
                <div className="flex items-center gap-2 w-full max-w-[180px]">
                    <span className="text-[10px] uppercase text-gray-400 font-bold w-6 text-right">Out</span>
                    <UsageBar
                        current={user.token_usage?.output_tokens || 0}
                        limit={user.output_token_limit}
                        thresholds={user.warning_thresholds}
                    />
                </div>
            </div>
        </td>
        <td className="py-4 text-right pr-4">
            <button
                onClick={() => onEditLimit(user, 'user')}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Editar Límites"
            >
                <Edit2 className="w-4 h-4" />
            </button>
        </td>
    </tr>
);

const TokensTable = ({
    activeTab,
    sortedSchools,
    sortedUsers,
    sortConfig,
    onSort,
    onEditLimit,
    getSchoolName
}) => {
    const RenderSortIcon = ({ column }) => {
        if (sortConfig.key !== column) {
            return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
        }
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="w-3 h-3 text-blue-600" />
            : <ArrowDown className="w-3 h-3 text-blue-600" />;
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        <th className="pb-3 pl-4">Nombre</th>
                        {activeTab === 'users' && <th className="pb-3">Colegio</th>}
                        <th className="pb-3 cursor-pointer hover:text-gray-700 text-right group" onClick={() => onSort('input_tokens')}>
                            <div className="flex items-center justify-end gap-1">
                                Input
                                <RenderSortIcon column="input_tokens" />
                            </div>
                        </th>
                        <th className="pb-3 cursor-pointer hover:text-gray-700 text-right group" onClick={() => onSort('output_tokens')}>
                            <div className="flex items-center justify-end gap-1">
                                Output
                                <RenderSortIcon column="output_tokens" />
                            </div>
                        </th>
                        <th className="pb-3 cursor-pointer hover:text-gray-700 text-right group" onClick={() => onSort('total_tokens')}>
                            <div className="flex items-center justify-end gap-1">
                                Consumo Total
                                <RenderSortIcon column="total_tokens" />
                            </div>
                        </th>
                        <th className="pb-3 text-center">Uso vs Límite</th>
                        <th className="pb-3 text-right pr-4">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {activeTab === 'schools' && sortedSchools.map((school) => (
                        <SchoolRow
                            key={school.id}
                            school={school}
                            onEditLimit={onEditLimit}
                        />
                    ))}
                    {activeTab === 'users' && sortedUsers.map((user) => (
                        <UserRow
                            key={user.id}
                            user={user}
                            getSchoolName={getSchoolName}
                            onEditLimit={onEditLimit}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TokensTable;
