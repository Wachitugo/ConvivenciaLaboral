import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useClickOutside } from './hooks';
import { createLogger } from '../../utils/logger';

const logger = createLogger('ProtocolView');

const ProtocolView = ({ protocol, onCompleteStep }) => {
    const { current } = useTheme();
    const [showMenu, setShowMenu] = useState(false);

    useClickOutside(showMenu, () => setShowMenu(false), '.protocol-actions-menu');

    if (!protocol) return null;

    return (
        <div style={{ fontFamily: "'Open Sans', sans-serif" }}>
            <div className={`mt-2 mb-4 rounded-lg   overflow-hidden `}>
                {/* Header */}
                <div className={` py-3 border-b ${current.borderColor} flex items-center justify-between`}>
                    <h3 className={`text-xl font-semibold ${current.textPrimary}`}>
                        {protocol.protocol_name}
                    </h3>


                    {/* Actions Menu */}
                    {/* <div className="relative protocol-actions-menu">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className={`px-3 py-2 text-sm rounded flex items-center gap-1.5 transition-colors ${current.textSecondary} hover:bg-gray-100 dark:hover:bg-gray-700`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Agregar a caso
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {showMenu && (
                        <div className={`absolute right-0 mt-1 w-64 rounded-md shadow-lg ${current.cardBg} border ${current.borderColor} z-10`}>
                            <div className="py-1">
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        // TODO: Implementar crear caso con protocolo
                                        logger.info('Crear caso con protocolo');
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm ${current.textPrimary} hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Crear caso con protocolo
                                </button>
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        // TODO: Implementar anexar a caso existente
                                        logger.info('Anexar a caso existente');
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm ${current.textPrimary} hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                    Anexar a caso existente
                                </button>
                            </div>
                        </div>
                    )}
                </div> */}


                </div>

                {/* Steps List */}
                <div className="p-3">
                    <div className="space-y-4">
                        {protocol.steps.map((step, index) => {
                            const isFirstStep = index === 0;

                            return (
                                <div
                                    key={step.id}
                                    className="flex gap-4"
                                >
                                    {/* Status Icon */}
                                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium
                                    ${isFirstStep
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-stone-50 border border-gray-200 text-gray-600'}`}
                                    >
                                        {step.id}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`text-base font-medium ${current.textPrimary}`}>
                                            {step.title}
                                        </h4>
                                        <p className={`text-sm mt-1 leading-relaxed ${current.textSecondary}`}>
                                            {step.description}
                                        </p>

                                        {step.estimated_time && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className={`text-xs px-2 py-0.5 rounded-full border ${current.borderColor} bg-stone-50  ${current.textSecondary}`}>
                                                    ⏱️ Plazo: {step.estimated_time}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>


            </div>

            {/* Next Step Instruction */}
            {protocol.next_step_instruction && protocol.next_step_instruction !== "Proceder con el siguiente paso" && (
                <div className={`px-5 py-3 mt-2 rounded-lg border ${current.borderColor} bg-blue-50/50 dark:bg-blue-900/10`}>
                    <p className={`text-sm leading-relaxed ${current.textSecondary}`}>
                        <span className="font-semibold">Paso a seguir: </span>
                        {protocol.next_step_instruction}
                    </p>
                </div>
            )}
            {/* Fallback if generic instruction: Show Step 1 as next step */}
            {(!protocol.next_step_instruction || protocol.next_step_instruction === "Proceder con el siguiente paso") && protocol.steps && protocol.steps.length > 0 && (
                <div className={`px-5 py-3 mt-2 rounded-lg border ${current.borderColor} bg-blue-50/50 dark:bg-blue-900/10`}>
                    <p className={`text-sm leading-relaxed ${current.textSecondary}`}>
                        <span className="font-semibold">Siguiente paso: </span>
                        {protocol.steps[0].title}
                    </p>
                </div>
            )}
        </div>
    );
};

export default ProtocolView;
