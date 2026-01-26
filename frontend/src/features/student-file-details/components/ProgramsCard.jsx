import React from 'react';

function ProgramsCard({ student }) {
    const programs = [
        { key: 'tea', name: 'TEA', fullName: 'Trastorno del Espectro Autista', color: 'purple', value: student.tea },
        { key: 'pie', name: 'PIE', fullName: 'Programa de Integración Escolar', color: 'blue', value: student.pie },
        { key: 'paec', name: 'PAEC', fullName: 'Plan de Acompañamiento Emocional Conductual', color: 'green', value: student.paec }
    ];

    const activeProgramsCount = programs.filter(p => p.value).length;

    const colorMap = {
        purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600', text: 'text-purple-700' },
        blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', text: 'text-blue-700' },
        green: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', text: 'text-green-700' }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Características y Programas
                </h2>
            </div>
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {programs.map(p => {
                        const c = colorMap[p.color];
                        return (
                            <div key={p.key} className={`p-4 rounded-lg border-2 ${p.value ? `${c.bg} ${c.border}` : 'bg-gray-50 border-gray-200'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900">{p.name}</h3>
                                    <svg className={`w-6 h-6 ${p.value ? c.icon : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                        {p.value ? <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            : <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />}
                                    </svg>
                                </div>
                                <p className="text-sm text-gray-600">{p.fullName}</p>
                                <p className={`text-xs mt-2 font-medium ${p.value ? c.text : 'text-gray-500'}`}>{p.value ? 'Sí participa' : 'No participa'}</p>
                            </div>
                        );
                    })}
                </div>
                {activeProgramsCount > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                        <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <div><p className="text-sm font-medium text-blue-900 mb-1">Este alumno participa en {activeProgramsCount} programa(s)</p><p className="text-xs text-blue-700">Requiere atención especializada y seguimiento continuo.</p></div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProgramsCard;
