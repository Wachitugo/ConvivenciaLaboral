import { History as HistoryIcon, FileText, RotateCcw, Calendar } from 'lucide-react';

const PlanningHistoryCard = ({ history, onRestore, isLoading, previewId }) => {
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            return new Intl.DateTimeFormat('es-CL', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
            }).format(new Date(dateStr));
        } catch {
            return dateStr;
        }
    };

    const filteredHistory = history?.reduce((acc, current, index) => {
        if (index === 0) return [current];
        const last = acc[acc.length - 1];
        const currentTS = new Date(current.updated_at || current.created_at).getTime();
        const lastTS = new Date(last.updated_at || last.created_at).getTime();
        if (Math.abs(currentTS - lastTS) < 2000 && current.task_count === last.task_count) return acc;
        return [...acc, current];
    }, []) || [];

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100 flex flex-col h-[280px]">
            <div className="flex items-center gap-2 mb-4 shrink-0">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <HistoryIcon size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">Historial de Planificaciones</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Versiones guardadas</p>
                </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <div className="w-6 h-6 border-2 border-[#1A71B8] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs text-gray-400 font-medium">Cargando historial...</p>
                    </div>
                ) : filteredHistory.length > 0 ? (
                    filteredHistory.map((item, index) => {
                        const isCurrent = index === 0;
                        const isPreviewing = previewId === item.id;
                        return (
                            <div
                                key={item.id || index}
                                onClick={() => onRestore(item)}
                                className={`group p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                                    isPreviewing
                                        ? 'bg-amber-50 border-amber-200 shadow-md ring-1 ring-amber-100'
                                        : isCurrent
                                            ? 'bg-blue-50/20 border-blue-100 hover:bg-blue-50/40'
                                            : 'bg-gray-50 border-gray-100 hover:border-blue-200 hover:bg-blue-50/30'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`text-xs font-bold truncate pr-2 flex-1 ${isPreviewing ? 'text-amber-900' : 'text-gray-800'}`} title={item.title}>
                                        {item.title}
                                    </h4>
                                    <div className="flex gap-1">
                                        {isPreviewing && <span className="text-[8px] px-1.5 py-0.5 bg-amber-500 text-white rounded-md font-black uppercase tracking-tighter">VIENDO</span>}
                                        {isCurrent && <span className="text-[8px] px-1.5 py-0.5 bg-[#1A71B8] text-white rounded-md font-black uppercase tracking-tighter">ACTIVO</span>}
                                    </div>
                                </div>

                                <div className={`flex items-center gap-3 text-[10px] font-medium ${isPreviewing ? 'text-amber-700' : 'text-gray-500'}`}>
                                    <div className="flex items-center gap-1">
                                        <Calendar size={12} className={isPreviewing ? 'text-amber-400' : 'text-gray-400'} />
                                        {formatDate(item.updated_at || item.created_at)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <FileText size={12} className={isPreviewing ? 'text-amber-400' : 'text-gray-400'} />
                                        {item.task_count || 0} tareas
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => { e.stopPropagation(); onRestore(item); }}
                                    className={`mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 border rounded-lg text-[10px] font-bold transition-all shadow-sm ${
                                        isPreviewing
                                            ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700'
                                            : isCurrent
                                                ? 'bg-white text-[#1A71B8] border-blue-200 hover:bg-[#1A71B8] hover:text-white hover:border-[#1A71B8]'
                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-[#1A71B8] hover:text-white hover:border-[#1A71B8]'
                                    }`}
                                >
                                    <RotateCcw size={12} />
                                    {isCurrent ? 'RECARGAR VERSIÓN ACTUAL' : isPreviewing ? 'CARGAR ESTA VERSIÓN' : 'VER / RESTAURAR'}
                                </button>

                                {isPreviewing && <div className="absolute top-0 right-0 w-1 h-full bg-amber-500" />}
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-2 text-gray-300">
                            <FileText size={24} />
                        </div>
                        <p className="text-xs font-bold text-gray-400">Sin versiones previas</p>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tight">Las versiones aparecerán después de guardar.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlanningHistoryCard;
