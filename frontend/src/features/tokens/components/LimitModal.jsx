import React, { useState, useEffect } from 'react';

const LimitModal = ({ isOpen, onClose, target, type, onSave }) => {
    const [inputLimit, setInputLimit] = useState('');
    const [outputLimit, setOutputLimit] = useState('');
    const [warnings, setWarnings] = useState('');

    useEffect(() => {
        if (target) {
            setInputLimit(target.input_token_limit || '');
            setOutputLimit(target.output_token_limit || '');
            setWarnings(target.warning_thresholds?.join(', ') || '');
        }
    }, [target]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const thresholds = warnings.split(',')
            .map(s => parseInt(s.trim()))
            .filter(n => !isNaN(n));

        // Construct update object - handling the API capability
        // API expects different args depending on implementation, but onSave usually takes raw values.
        // We'll update the onSave signature invocation in the parent or pass an object.
        // Looking at LimitModal usage (inferred), onSave likely takes (id, type, limit, thresholds).
        // I need to change how onSave is called to pass both limits.
        // Let's assume I need to pass an object or modify the signature.
        // Since I can't see the parent right now, I'll update onSave to pass an object 
        // OR pass the two limits.
        // The previous call was: onSave(target.id, type, parseInt(limit), thresholds)
        // I will change it to: onSave(target.id, type, { input: ..., output: ... }, thresholds)
        // and handle it in the parent.

        onSave(
            target.id || target.uid,
            type,
            {
                input: parseInt(inputLimit) || null,
                output: parseInt(outputLimit) || null
            },
            thresholds
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">Configurar Límites - {target.nombre || target.name}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Límite de Tokens de Entrada (Input)</label>
                        <input
                            type="number"
                            value={inputLimit}
                            onChange={e => setInputLimit(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="Ej: 1000000"
                        />
                        <p className="text-xs text-gray-500 mt-1">Tokens que envían los usuarios.</p>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Límite de Tokens de Salida (Output)</label>
                        <input
                            type="number"
                            value={outputLimit}
                            onChange={e => setOutputLimit(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="Ej: 500000"
                        />
                        <p className="text-xs text-gray-500 mt-1">Tokens que genera la IA.</p>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Advertencias (%)</label>
                        <input
                            type="text"
                            value={warnings}
                            onChange={e => setWarnings(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="Ej: 80, 90"
                        />
                        <p className="text-xs text-gray-500 mt-1">Porcentajes de uso para generar alertas (separados por coma).</p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LimitModal;
