import React from 'react';

const TokenLogsTable = ({ logs, schools }) => {
    const getSchoolName = (log) => {
        return schools.find(s => log.school_ids?.includes(s.id))?.nombre || log.school_id || 'N/A';
    };

    return (
        <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-800">Registros de Uso Reciente</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">Fecha</th>
                            <th className="px-6 py-3">Usuario</th>
                            <th className="px-6 py-3">Colegio</th>
                            <th className="px-6 py-3">Modelo</th>
                            <th className="px-6 py-3 text-right">Input</th>
                            <th className="px-6 py-3 text-right">Output</th>
                            <th className="px-6 py-3 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.length > 0 ? (
                            logs.map((log, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 whitespace-nowrap text-gray-600">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-3 font-medium text-gray-900">
                                        {log.user_name || log.user_email || 'N/A'}
                                    </td>
                                    <td className="px-6 py-3 text-gray-600">
                                        {getSchoolName(log)}
                                    </td>
                                    <td className="px-6 py-3 text-gray-600">
                                        {log.model || 'Unknown'}
                                    </td>
                                    <td className="px-6 py-3 text-right text-green-600 tabular-nums">
                                        {log.input_tokens?.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-3 text-right text-yellow-600 tabular-nums">
                                        {log.output_tokens?.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-3 text-right font-medium text-indigo-600 tabular-nums">
                                        {log.total_tokens?.toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                    No hay registros de uso en este periodo.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TokenLogsTable;
