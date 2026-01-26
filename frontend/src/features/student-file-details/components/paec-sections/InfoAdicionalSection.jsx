import React from 'react';
import { AlertTriangle, AlertCircle, Target, Lightbulb, FileText } from 'lucide-react';
import SectionHeader from './SectionHeader';

const InfoAdicionalCard = ({ icon: Icon, title, items, emptyMessage }) => {
    const hasItems = items && items.length > 0;

    return (
        <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3 min-h-[80px] sm:min-h-[100px]">
            <h5 className="text-xs font-semibold text-gray-600 uppercase mb-1.5 sm:mb-2 flex items-center gap-1.5">
                <Icon size={12} className="text-blue-500 flex-shrink-0 sm:w-3.5 sm:h-3.5" />
                <span className="truncate">{title}</span>
            </h5>
            {hasItems ? (
                <div className="space-y-1">
                    {items.map((item, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                            <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></span>
                            <span className="line-clamp-2">{item}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-10 sm:h-12 text-gray-400">
                    <span className="text-xs text-center">{emptyMessage}</span>
                </div>
            )}
        </div>
    );
};

const InfoAdicionalSection = ({ gatillantes, senalesEstres, medidasRespuesta, actividadesInteres, onEdit }) => (
    <div className="mb-4">
        <SectionHeader
            icon={FileText}
            title="Información Adicional"
            onEdit={onEdit}
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <InfoAdicionalCard
                icon={AlertTriangle}
                title="Gatillantes"
                items={gatillantes}
                emptyMessage="Sin definir"
            />
            <InfoAdicionalCard
                icon={AlertCircle}
                title="Señales de Estrés"
                items={senalesEstres}
                emptyMessage="Sin definir"
            />
            <InfoAdicionalCard
                icon={Target}
                title="Medidas de Respuesta"
                items={medidasRespuesta}
                emptyMessage="Sin definir"
            />
            <InfoAdicionalCard
                icon={Lightbulb}
                title="Act. de Interés"
                items={actividadesInteres}
                emptyMessage="Sin registrar"
            />
        </div>
    </div>
);

export default InfoAdicionalSection;
