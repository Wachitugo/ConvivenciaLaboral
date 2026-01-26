import React from 'react';

function InterviewRow({ interview, onSelect, onAssociate, isSelected, onToggleSelect }) {
    // Helper to get status colors
    const getStatusConfig = (status) => {
        const configs = {
            'Borrador': {
                label: 'Borrador',
                bgColor: 'bg-gray-100',
                textColor: 'text-gray-700',
                dotColor: 'bg-gray-500',
            },
            'En Progreso': {
                label: 'En Progreso',
                bgColor: 'bg-blue-100',
                textColor: 'text-blue-700',
                dotColor: 'bg-blue-500',
            },
            'Firmado': {
                label: 'Firmado',
                bgColor: 'bg-green-100',
                textColor: 'text-green-700',
                dotColor: 'bg-green-500',
            },
            'Autorizada': {
                label: 'Autorizada',
                bgColor: 'bg-green-100',
                textColor: 'text-green-700',
                dotColor: 'bg-green-500',
            }
        };
        return configs[status] || configs['Borrador'];
    };

    const statusConfig = getStatusConfig(interview.status);

    return (
        <tr className={`hover:bg-gray-50/50 transition-colors duration-150 group ${isSelected ? 'bg-blue-50/50' : ''}`}>
            {/* Checkbox */}
            <td
                className="px-3 py-4 w-10 cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect(interview.id);
                }}
            >
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => { }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer pointer-events-none"
                />
            </td>
            {/* Alumno */}
            <td onClick={() => onSelect(interview)} className="px-6 py-4 whitespace-nowrap cursor-pointer">
                <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                    {interview.studentName}
                </div>
            </td>
            {/* Género */}
            <td onClick={() => onSelect(interview)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${interview.gender === 'Masculino' ? 'bg-blue-100 text-blue-700' :
                    interview.gender === 'Femenino' ? 'bg-pink-100 text-pink-700' :
                        'bg-gray-100 text-gray-700'
                    }`}>
                    {interview.gender || 'N/A'}
                </span>
            </td>
            {/* Curso */}
            <td onClick={() => onSelect(interview)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer">
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs border border-gray-200">
                    {interview.grade}
                </span>
            </td>



            {/* Fecha */}
            <td onClick={() => onSelect(interview)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer">
                <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {interview.date}
                </div>
            </td>

            {/* Entrevistador */}
            <td onClick={() => onSelect(interview)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer">
                <div className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {interview.interviewer || 'N/A'}
                </div>
            </td>

            {/* Estado */}
            <td onClick={() => onSelect(interview)} className="px-6 py-4 whitespace-nowrap cursor-pointer">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                    {statusConfig.label}
                </span>
            </td>

            {/* Acciones */}
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-1">
                    {interview.status === 'Autorizada' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onAssociate(interview);
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 transition-colors"
                            title="Asociar a Caso"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <span>Asociar caso</span>
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}

export default InterviewRow;
