import React from 'react';
import { FileText, MessageSquare } from 'lucide-react';
import { EmptyState } from '../';
import SectionHeader from './SectionHeader';

const ObservacionesSection = ({ observaciones, onEdit }) => {
    const hasObservaciones = observaciones && observaciones.length > 0;

    return (
        <div>
            <SectionHeader
                icon={FileText}
                title="Observaciones"
                onEdit={onEdit}
            />
            {hasObservaciones ? (
                <div className="space-y-1.5 sm:space-y-2">
                    {observaciones.map((obs, i) => (
                        <div key={i} className="p-2.5 sm:p-3 rounded-lg bg-gray-50 border-l-3 sm:border-l-4 border-gray-300 text-xs sm:text-sm">
                            <p className="text-gray-700 leading-relaxed">{obs}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    message="No hay observaciones registradas"
                    icon={MessageSquare}
                    size="md"
                />
            )}
        </div>
    );
};

export default ObservacionesSection;
