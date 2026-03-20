import React from 'react';

function InterviewRow({ interview, onSelect, onAssociate, isSelected, onToggleSelect }) {
    // Helper to get status colors
    const getStatusConfig = (status) => {
        const configs = {
            'Borrador': {
                label: 'Borrador',
                bgColor: 'bg-white/10 text-white/70 border border-white/20',
                textColor: '',
                dotColor: 'bg-white/40',
            },
            'En Progreso': {
                label: 'En Progreso',
                bgColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
                textColor: '',
                dotColor: 'bg-amber-400',
            },
            'Firmado': {
                label: 'Firmado',
                bgColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
                textColor: '',
                dotColor: 'bg-blue-400',
            },
            'Autorizada': {
                label: 'Autorizada',
                bgColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
                textColor: '',
                dotColor: 'bg-emerald-400',
            }
        };
        return configs[status] || configs['Borrador'];
    };

    const statusConfig = getStatusConfig(interview.status);

    return (
        <tr className={`border-b border-white/5 hover:bg-white/5 transition-colors duration-150 group ${isSelected ? 'bg-[#34B6D8]/10' : ''}`}>
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
                    className="w-4 h-4 text-[#34B6D8] bg-white/10 border-white/20 rounded focus:ring-[#34B6D8] focus:ring-2 cursor-pointer pointer-events-none"
                />
            </td>
            {/* Alumno */}
            <td onClick={() => onSelect(interview)} className="px-3 sm:px-5 py-4 whitespace-nowrap cursor-pointer">
                <div className="text-sm font-bold text-white group-hover:text-[#34B6D8] transition-colors">
                    {interview.studentName}
                </div>
            </td>
            {/* Género — oculto en móvil, visible desde lg */}
            <td onClick={() => onSelect(interview)} className="hidden lg:table-cell px-3 sm:px-5 py-4 whitespace-nowrap text-sm cursor-pointer">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${interview.gender === 'Masculino' ? 'bg-[#1A71B8]/20 text-[#34B6D8] border-[#1A71B8]/30' :
                    interview.gender === 'Femenino' ? 'bg-pink-500/20 text-pink-300 border-pink-500/30' :
                        'bg-white/10 text-white/70 border-white/20'
                    }`}>
                    {interview.gender || 'N/A'}
                </span>
            </td>
            {/* Área — oculto en móvil, visible desde md */}
            <td onClick={() => onSelect(interview)} className="hidden md:table-cell px-3 sm:px-5 py-4 whitespace-nowrap text-sm cursor-pointer">
                <span className="font-mono bg-white/10 text-white/80 px-2.5 py-1 rounded-lg text-xs border border-white/20">
                    {interview.grade}
                </span>
            </td>



            {/* Fecha */}
            <td onClick={() => onSelect(interview)} className="px-3 sm:px-5 py-4 whitespace-nowrap text-sm text-white/70 cursor-pointer">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#34B6D8] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {interview.date}
                </div>
            </td>

            {/* Entrevistador — oculto en móvil, visible desde lg */}
            <td onClick={() => onSelect(interview)} className="hidden lg:table-cell px-3 sm:px-5 py-4 whitespace-nowrap text-sm text-white/70 cursor-pointer">
                <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#34B6D8] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {interview.interviewer || 'N/A'}
                </div>
            </td>

            {/* Estado */}
            <td onClick={() => onSelect(interview)} className="px-3 sm:px-5 py-4 whitespace-nowrap cursor-pointer">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                    {statusConfig.label}
                </span>
            </td>

            {/* Acciones */}
            <td className="px-3 sm:px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-1">
                    {interview.status === 'Autorizada' && (
                        <button
                            data-tour="interview-associate-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAssociate(interview);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
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
