import { useState, useEffect, useCallback } from 'react';
import { GanttChart, EvidenceModal, PlanningHistoryCard } from '../features/plan-convivencia';
import { planService } from '../services/api';
import { Save, Plus, CheckCircle, Eye } from 'lucide-react';
import { createLogger } from '../utils/logger';

const logger = createLogger('PlanConvivenciaPage');

const getSchoolId = () => {
    try {
        const u = JSON.parse(localStorage.getItem('usuario'));
        const id = u?.colegios?.[0];
        return typeof id === 'object' ? id?.id : id;
    } catch { return null; }
};

export default function PlanConvivenciaPage() {
    const [plan, setPlan] = useState({
        id: null,
        year: new Date().getFullYear(),
        title: `Plan de Gestión de Convivencia Laboral ${new Date().getFullYear()}`,
        tasks: [],
        period: { weeks: 26, title: 'Plan Semestral' },
    });

    const [selectedTask, setSelectedTask] = useState(null);
    const [isNewTask, setIsNewTask] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [planHistory, setPlanHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isHistoryPreview, setIsHistoryPreview] = useState(false);
    const [previewVersionId, setPreviewVersionId] = useState(null);
    const [error, setError] = useState(null);

    const schoolId = getSchoolId();

    const fetchHistory = useCallback(async () => {
        if (!schoolId) return;
        setIsLoadingHistory(true);
        try {
            const response = await planService.getHistory(schoolId);
            if (response?.status === 'success') {
                setPlanHistory(response.history || []);
            }
        } catch (err) {
            logger.error('Error fetching history', err);
        } finally {
            setIsLoadingHistory(false);
        }
    }, [schoolId]);

    useEffect(() => {
        const loadPlan = async () => {
            if (!schoolId) {
                setIsLoading(false);
                return;
            }
            try {
                const response = await planService.getPlan(schoolId);
                if (response?.status === 'success' && response.plan) {
                    const raw = response.plan;
                    const tasks = raw.tasks || [];
                    if (tasks.length > 0) {
                        setPlan({ ...raw, tasks });
                        logger.info(`Plan recovered with ${tasks.length} tasks`);
                    }
                }
            } catch (err) {
                logger.error('Error loading plan', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadPlan();
        fetchHistory();
    }, [schoolId, fetchHistory]);

    const savePlan = async (updatedPlan, forceNew = false) => {
        if (isHistoryPreview && !forceNew) return;
        if (!schoolId) { setError('No se encontró el ID de la empresa.'); return; }
        setIsSaving(true);
        try {
            await planService.save(schoolId, updatedPlan, forceNew);
            setError(null);
            setSaveSuccess(true);
            fetchHistory();
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            logger.error('Error saving plan', err);
            setError('Error al guardar el plan. Verifica tu conexión.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTaskUpdate = (updatedTask) => {
        const updatedTasks = plan.tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
        const updatedPlan = { ...plan, tasks: updatedTasks };
        setPlan(updatedPlan);
        setSelectedTask(updatedTask);
        savePlan(updatedPlan);
    };

    const handleTaskDelete = (taskId) => {
        const updatedTasks = plan.tasks.filter(t => t.id !== taskId);
        const updatedPlan = { ...plan, tasks: updatedTasks };
        setPlan(updatedPlan);
        setSelectedTask(null);
        savePlan(updatedPlan);
    };

    const handleAddActivity = () => {
        const today = new Date().toISOString().split('T')[0];
        const newTask = {
            id: `task-${Date.now()}`,
            title: 'Nueva Actividad',
            description: 'Descripción de la actividad',
            startDate: today,
            durationDays: 5,
            status: 'pending',
            assignedTo: [],
            requiredEvidenceTypes: ['Documento'],
            evidence: [],
        };
        const updatedPlan = { ...plan, tasks: [...plan.tasks, newTask] };
        setPlan(updatedPlan);
        setSelectedTask(newTask);
        setIsNewTask(true);
        savePlan(updatedPlan);
    };

    const handleSaveSnapshot = () => {
        savePlan(plan, true);
    };

    const handleRestoreVersion = async (item) => {
        if (!schoolId) return;
        const isCurrent = item.id === planHistory[0]?.id;

        if (isCurrent || (isHistoryPreview && previewVersionId === item.id)) {
            // Reload current
            try {
                const response = await planService.getPlan(schoolId);
                if (response?.status === 'success' && response.plan) {
                    setPlan({ ...response.plan, tasks: response.plan.tasks || [] });
                }
            } catch { }
            setIsHistoryPreview(false);
            setPreviewVersionId(null);
            return;
        }

        // Load historical version for preview
        try {
            const response = await planService.getVersion(item.id);
            if (response?.status === 'success' && response.plan) {
                setPlan({ ...response.plan, tasks: response.plan.tasks || [] });
                setIsHistoryPreview(true);
                setPreviewVersionId(item.id);
            }
        } catch (err) {
            logger.error('Error loading version', err);
        }
    };

    const handleRestoreAndSave = () => {
        savePlan(plan, true);
        setIsHistoryPreview(false);
        setPreviewVersionId(null);
    };

    // Cumplimiento
    const totalTasks = plan.tasks.length;
    const completedTasks = plan.tasks.filter(t => t.status === 'completed').length;
    const compliancePercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Evidencias recientes
    const recentEvidences = plan.tasks
        .flatMap(t => (t.evidence || []).map(ev => ({ ...ev, taskTitle: t.title })))
        .slice(0, 6);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-[#1A71B8]/30 border-t-[#1A71B8] rounded-full animate-spin" />
                    <p className="text-sm font-medium text-white/60">Cargando plan...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-4" style={{ fontFamily: "'Poppins', sans-serif" }}>

            {/* Preview Banner */}
            {isHistoryPreview && (
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-500/20 border border-amber-400/40 rounded-xl text-amber-200 text-sm font-medium">
                    <div className="flex items-center gap-2">
                        <Eye size={16} />
                        <span>MODO VISTA PREVIA — Mostrando versión histórica del plan</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { setIsHistoryPreview(false); setPreviewVersionId(null); fetchHistory(); }}
                            className="px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                        >
                            Volver al actual
                        </button>
                        <button
                            onClick={handleRestoreAndSave}
                            className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all"
                        >
                            Restaurar esta versión
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white">{plan.title}</h1>
                    <p className="text-sm text-white/50 mt-0.5">Cronograma de actividades y seguimiento de cumplimiento</p>
                </div>
                <div className="flex items-center gap-2">
                    {saveSuccess && (
                        <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
                            <CheckCircle size={16} />
                            Guardado
                        </div>
                    )}
                    {error && <p className="text-red-400 text-xs font-medium">{error}</p>}
                    <button
                        onClick={handleSaveSnapshot}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1A71B8] hover:bg-[#155d96] text-white text-sm font-bold rounded-xl shadow-lg transition-all disabled:opacity-60"
                    >
                        {isSaving ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                        ) : <Save size={15} />}
                        {isSaving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>

            {/* Gantt */}
            <GanttChart
                tasks={plan.tasks}
                onTaskClick={(t) => { setIsNewTask(false); setSelectedTask(t); }}
                planPeriod={plan.period}
            />

            {/* Add Activity */}
            <button
                onClick={handleAddActivity}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-white/20 hover:border-[#34B6D8]/50 text-white/50 hover:text-[#34B6D8] text-sm font-semibold rounded-xl transition-all"
            >
                <Plus size={18} />
                Agregar Nueva Actividad al Plan
            </button>

            {/* Bottom: Cumplimiento | Evidencias | Historial */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Cumplimiento */}
                <div className="bg-[#0A3866]/60 backdrop-blur-md border border-[#1A71B8]/30 rounded-2xl p-6 flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-[#1A71B8]/20 rounded-xl flex items-center justify-center">
                            <CheckCircle size={20} className="text-[#34B6D8]" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm">Cumplimiento del Plan</h3>
                        </div>
                    </div>
                    <div>
                        <p className="text-6xl font-black text-white leading-none">{compliancePercent}%</p>
                        <p className="text-white/50 text-sm mt-2 font-medium">Actividades finalizadas satisfactoriamente.</p>
                        <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-xs text-white/40 font-semibold uppercase tracking-widest">
                                <span>Progreso</span>
                                <span>{completedTasks} / {totalTasks} tareas</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#1A71B8] rounded-full transition-all duration-500"
                                    style={{ width: `${compliancePercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Evidencias Recientes */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-[280px]">
                    <h3 className="font-bold text-gray-800 mb-1">Evidencias Recientes</h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 mt-3">
                        {recentEvidences.length > 0 ? (
                            recentEvidences.map((ev, i) => (
                                <a key={i} href={ev.url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-100 rounded-xl hover:border-blue-200 transition-all group">
                                    <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-gray-100 shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-gray-800 truncate">{ev.name}</p>
                                        <p className="text-[10px] text-gray-400 truncate">{ev.taskTitle}</p>
                                    </div>
                                </a>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-300">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                                </svg>
                                <p className="text-xs font-semibold text-gray-400">Sin archivos aún</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Historial */}
                <PlanningHistoryCard
                    history={planHistory}
                    onRestore={handleRestoreVersion}
                    isLoading={isLoadingHistory}
                    previewId={previewVersionId}
                />
            </div>

            {/* Task Detail Modal */}
            <EvidenceModal
                task={selectedTask}
                isOpen={!!selectedTask}
                onClose={() => { setSelectedTask(null); setIsNewTask(false); }}
                onUpdateTask={handleTaskUpdate}
                onDeleteTask={handleTaskDelete}
                startInEditMode={isNewTask}
            />
        </div>
    );
}
