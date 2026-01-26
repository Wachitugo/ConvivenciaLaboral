import React from 'react';
import { Activity, AlertCircle } from 'lucide-react';
import { EmptyState } from '../';
import SectionHeader from './SectionHeader';

const ProtocolosList = ({ items, emptyMessage }) => {
    if (!items || items.length === 0) {
        return (
            <EmptyState
                message={emptyMessage}
                icon={Activity}
                size="sm"
            />
        );
    }

    return (
        <div className="space-y-1.5 sm:space-y-2">
            {items.map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg text-xs sm:text-sm text-gray-700">
                    <span className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-xs font-semibold">
                        {i + 1}
                    </span>
                    <span className="flex-1">{item}</span>
                </div>
            ))}
        </div>
    );
};

const ProtocolosSection = ({ protocolosIntervencion, intervencionCrisis, onEdit }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
            <SectionHeader
                icon={Activity}
                title="Protocolo de Contención"
            />
            <ProtocolosList
                items={protocolosIntervencion}
                emptyMessage="Sin protocolos definidos"
            />
        </div>
        <div>
            <SectionHeader
                icon={AlertCircle}
                title="Intervención en Crisis"
                onEdit={onEdit}
            />
            <ProtocolosList
                items={intervencionCrisis}
                emptyMessage="Sin procedimientos definidos"
            />
        </div>
    </div>
);

export default ProtocolosSection;
