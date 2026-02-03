import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Advertencia mostrada en modo masivo
 */
export default function BulkWarning({ uploadType }) {
    return (
        <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
            <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-800 leading-relaxed">
                {uploadType === 'trabajadores'
                    ? 'Esta información es confidencial. Asegúrese de cumplir con los protocolos de manejo de datos.'
                    : 'Los usuarios tendrán contraseña temporal "temporal123". Deben cambiarla en el primer inicio.'}
            </p>
        </div>
    );
}
