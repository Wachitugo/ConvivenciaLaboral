import React from 'react';
import { X, CheckCircle } from 'lucide-react';

/**
 * Componente de alertas para mensajes de error y éxito
 */
export function ErrorAlert({ message }) {
    if (!message) return null;

    return (
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <X size={18} className="text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800 font-medium">{message}</p>
        </div>
    );
}

export function SuccessAlert({ message }) {
    if (!message) return null;

    return (
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
            <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800 font-medium">{message}</p>
        </div>
    );
}

export default function MessageAlert({ error, success }) {
    return (
        <>
            <ErrorAlert message={error} />
            <SuccessAlert message={success} />
        </>
    );
}
