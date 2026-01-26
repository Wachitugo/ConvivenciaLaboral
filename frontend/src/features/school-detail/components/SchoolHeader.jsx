import React from 'react';
import { ArrowLeft, Building2 } from 'lucide-react';

/**
 * Header con info del colegio y botón de volver
 */
export default function SchoolHeader({ school, onBack }) {
    return (
        <div className="flex items-center gap-4">
            <button
                onClick={onBack}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            >
                <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-4">
                {school.logo_url ? (
                    <img
                        src={school.logo_url}
                        alt={`Logo ${school.nombre}`}
                        className="h-12 w-12 rounded-xl object-cover shadow-sm border border-gray-100"
                    />
                ) : (
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center border border-purple-200">
                        <Building2 size={22} className="text-purple-600" />
                    </div>
                )}
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{school.nombre}</h2>
                    {school.direccion && (
                        <p className="text-sm text-gray-500">{school.direccion}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
