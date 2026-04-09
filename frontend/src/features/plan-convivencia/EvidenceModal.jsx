import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { addWorkingDays, getWorkingDaysBetween, formatDate } from '../../utils/dateUtils';

const CATEGORIZED_RESPONSIBLES = {
    'Dirección': ['Gerente de Relaciones Laborales', 'Subgerente de RRHH', 'Director/a de Personas', 'Jefe/a de Área'],
    'Convivencia Laboral': ['Encargado/a de Relaciones Laborales', 'Investigador/a Designado/a', 'Comité de Convivencia', 'Mediador/a Laboral'],
    'Otros': ['Trabajador/a Social', 'Psicólogo/a Laboral', 'Inspector/a del Trabajo'],
};

const buildEditedFields = (task) => {
    const start = task.startDate || new Date().toISOString().split('T')[0];
    const duration = task.durationDays || 5;
    return {
        title: task.title || '',
        assignedTo: Array.isArray(task.assignedTo) ? task.assignedTo : (task.assignedTo ? [task.assignedTo] : []),
        description: task.description || '',
        startDate: start,
        durationDays: duration,
        endDate: formatDate(addWorkingDays(start, duration)),
        requiredEvidenceTypes: task.requiredEvidenceTypes || ['Documento'],
    };
};

const EvidenceModal = ({
    task,
    isOpen,
    onClose,
    onUpdateTask,
    onDeleteTask,
    startInEditMode = false,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedFields, setEditedFields] = useState(() => task ? buildEditedFields(task) : {});
    const [isUploading, setIsUploading] = useState(false);
    const [selectKey, setSelectKey] = useState(0); // force-reset select
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const fileInputRef = useRef(null);
    const prevTaskIdRef = useRef(null);

    // Reset form only when a DIFFERENT task is opened or modal opens/closes.
    // Avoids resetting edit mode when the same task is updated (e.g. status change).
    useEffect(() => {
        if (!isOpen) {
            setIsEditing(false);
            setShowDeleteConfirm(false);
            prevTaskIdRef.current = null;
            return;
        }
        if (!task) return;

        const isNewTask = task.id !== prevTaskIdRef.current;
        if (isNewTask) {
            prevTaskIdRef.current = task.id;
            setEditedFields(buildEditedFields(task));
            setIsEditing(startInEditMode);
            setShowDeleteConfirm(false);
            setSelectKey(k => k + 1);
        }
        // If same task updated → keep editedFields and isEditing as-is
    }, [task?.id, isOpen, startInEditMode]);

    if (!isOpen || !task) return null;

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleSaveEdits = () => {
        onUpdateTask({
            ...task,
            title: editedFields.title,
            assignedTo: editedFields.assignedTo,
            description: editedFields.description,
            startDate: editedFields.startDate,
            durationDays: editedFields.durationDays,
            requiredEvidenceTypes: editedFields.requiredEvidenceTypes,
        });
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditedFields(buildEditedFields(task));
        setIsEditing(false);
    };

    const handleStatusChange = (newStatus) => {
        onUpdateTask({ ...task, status: newStatus });
    };

    const handleStartDateChange = (e) => {
        const newStart = e.target.value;
        setEditedFields(prev => ({
            ...prev,
            startDate: newStart,
            endDate: formatDate(addWorkingDays(newStart, prev.durationDays)),
        }));
    };

    const handleDurationChange = (e) => {
        const val = Math.max(1, parseInt(e.target.value) || 1);
        setEditedFields(prev => ({
            ...prev,
            durationDays: val,
            endDate: formatDate(addWorkingDays(prev.startDate, val)),
        }));
    };

    const handleEndDateChange = (e) => {
        const newEnd = e.target.value;
        const days = getWorkingDaysBetween(editedFields.startDate, newEnd);
        if (days < 1) {
            setEditedFields(prev => ({
                ...prev,
                endDate: formatDate(addWorkingDays(prev.startDate, 1)),
                durationDays: 1,
            }));
        } else {
            setEditedFields(prev => ({ ...prev, endDate: newEnd, durationDays: days }));
        }
    };

    const removeResponsible = (idx) => {
        setEditedFields(prev => ({
            ...prev,
            assignedTo: prev.assignedTo.filter((_, i) => i !== idx),
        }));
    };

    const addResponsible = (e) => {
        const val = e.target.value;
        if (!val) return;
        setEditedFields(prev => ({
            ...prev,
            assignedTo: prev.assignedTo.includes(val) ? prev.assignedTo : [...prev.assignedTo, val],
        }));
        setSelectKey(k => k + 1); // reset select to placeholder
    };

    const handleFileUpload = (e) => {
        if (!e.target.files?.[0]) return;
        setIsUploading(true);
        const file = e.target.files[0];
        setTimeout(() => {
            const newEvidence = {
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                type: 'Documento',
                url: URL.createObjectURL(file),
                dateUploaded: new Date().toLocaleDateString('es-CL'),
            };
            onUpdateTask({
                ...task,
                evidence: [...(task.evidence || []), newEvidence],
                status: task.status === 'pending' || task.status === 'delayed' ? 'in_progress' : task.status,
            });
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }, 1000);
    };

    const statusClass = {
        pending: 'bg-gray-50 border-gray-200 text-gray-700',
        in_progress: 'bg-blue-50 border-blue-200 text-blue-700',
        completed: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        delayed: 'bg-amber-50 border-amber-200 text-amber-700',
    };

    return createPortal(
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]" onClick={onClose} />

            {/* Panel */}
            <div
                className="fixed right-0 top-0 h-full z-[70] w-[480px] max-w-full bg-white border-l border-gray-100 shadow-2xl flex flex-col overflow-hidden"
                style={{ fontFamily: "'Poppins', sans-serif" }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Actividad</p>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editedFields.title}
                                onChange={e => setEditedFields(p => ({ ...p, title: e.target.value }))}
                                className="w-full text-lg font-semibold text-gray-800 border-b-2 border-[#1A71B8] focus:outline-none bg-blue-50/30 px-1 py-0.5"
                                autoFocus
                            />
                        ) : (
                            <h2 className="text-lg font-semibold text-gray-800 truncate">{task.title}</h2>
                        )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 mt-1">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleSaveEdits}
                                    className="p-2 rounded-full bg-green-600 text-white hover:bg-green-700 transition-all"
                                    title="Guardar cambios"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                                    title="Cancelar edición"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                                title="Editar actividad"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-5">

                    {/* Estado — siempre editable sin entrar a modo edición */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Estado</label>
                        <div className="relative">
                            <select
                                value={task.status}
                                onChange={e => handleStatusChange(e.target.value)}
                                className={`w-full appearance-none p-3 pr-10 rounded-xl text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-[#1A71B8]/30 transition-all cursor-pointer ${statusClass[task.status] || statusClass.pending}`}
                            >
                                <option value="pending">Pendiente</option>
                                <option value="in_progress">En curso</option>
                                <option value="completed">Completado</option>
                                <option value="delayed">Atrasado</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Descripción */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Descripción</label>
                        {isEditing ? (
                            <textarea
                                value={editedFields.description}
                                onChange={e => setEditedFields(p => ({ ...p, description: e.target.value }))}
                                rows={4}
                                className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#1A71B8]/30 focus:outline-none resize-none"
                                placeholder="Describe la actividad..."
                            />
                        ) : (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 min-h-[72px]">
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{task.description || <span className="italic text-gray-400">Sin descripción</span>}</p>
                            </div>
                        )}
                    </div>

                    {/* Responsables */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Responsables</label>
                        {isEditing ? (
                            <div className="space-y-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                <div className="flex flex-wrap gap-2 min-h-[28px]">
                                    {editedFields.assignedTo.map((r, i) => (
                                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1A71B8]/10 text-[#1A71B8] rounded-lg text-xs font-bold border border-[#1A71B8]/20">
                                            {r}
                                            <button onClick={() => removeResponsible(i)} className="hover:text-red-500 transition-colors ml-0.5">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </span>
                                    ))}
                                    {editedFields.assignedTo.length === 0 && <span className="text-xs text-gray-400 italic">Selecciona responsables abajo</span>}
                                </div>
                                <select key={selectKey} onChange={addResponsible} className="w-full text-sm border border-gray-200 rounded-lg p-2 bg-white focus:ring-2 focus:ring-[#1A71B8]/30 focus:outline-none">
                                    <option value="">— Agregar responsable —</option>
                                    {Object.entries(CATEGORIZED_RESPONSIBLES).map(([cat, opts]) => (
                                        <optgroup key={cat} label={cat}>
                                            {opts.map(o => <option key={o} value={o}>{o}</option>)}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex flex-wrap gap-2 min-h-[44px]">
                                {(Array.isArray(task.assignedTo) ? task.assignedTo : task.assignedTo ? [task.assignedTo] : []).map((r, i) => (
                                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold border border-gray-200">{r}</span>
                                ))}
                                {(!task.assignedTo || (Array.isArray(task.assignedTo) && task.assignedTo.length === 0)) && (
                                    <span className="text-sm text-gray-400 italic">No definido</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Inicio</label>
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                {isEditing ? (
                                    <input type="date" value={editedFields.startDate} onChange={handleStartDateChange} className="w-full text-sm font-medium text-gray-800 border-b border-[#1A71B8]/30 focus:outline-none bg-transparent" />
                                ) : (
                                    <p className="text-sm font-medium text-gray-800">{task.startDate ? new Date(task.startDate + 'T12:00:00').toLocaleDateString('es-CL') : '—'}</p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Término</label>
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                {isEditing ? (
                                    <input type="date" value={editedFields.endDate} onChange={handleEndDateChange} className="w-full text-sm font-medium text-gray-800 border-b border-[#1A71B8]/30 focus:outline-none bg-transparent" />
                                ) : (
                                    <p className="text-sm font-medium text-gray-800">{task.startDate && task.durationDays ? addWorkingDays(task.startDate, task.durationDays).toLocaleDateString('es-CL') : '—'}</p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2 col-span-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Duración (días hábiles)</label>
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                {isEditing ? (
                                    <input type="number" min="1" value={editedFields.durationDays} onChange={handleDurationChange} className="w-full text-sm font-medium text-gray-800 border-b border-[#1A71B8]/30 focus:outline-none bg-transparent" />
                                ) : (
                                    <p className="text-sm font-medium text-gray-800">{task.durationDays ?? 1} {task.durationDays === 1 ? 'día' : 'días'}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Evidencias */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Evidencias ({task.evidence?.length || 0})</label>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="flex items-center gap-1.5 text-xs font-semibold text-[#1A71B8] hover:text-[#155d96] disabled:opacity-40 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Adjuntar
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        </div>

                        {isUploading && (
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="w-5 h-5 border-2 border-[#1A71B8] border-t-transparent rounded-full animate-spin shrink-0" />
                                <span className="text-xs font-medium text-blue-700">Subiendo archivo...</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            {task.evidence?.map((ev, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl hover:border-blue-200 transition-all">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{ev.name}</p>
                                        <p className="text-xs text-gray-400">{ev.dateUploaded}</p>
                                    </div>
                                    <a href={ev.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-[#1A71B8] transition-colors" title="Ver / Descargar">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    </a>
                                </div>
                            ))}
                            {(!task.evidence || task.evidence.length === 0) && !isUploading && (
                                <div className="py-8 flex flex-col items-center gap-2 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
                                    <p className="text-xs text-gray-400 font-medium">Sin evidencias cargadas aún</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Delete confirmation */}
                {showDeleteConfirm && (
                    <div className="mx-5 mb-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-rose-800">¿Eliminar esta actividad?</p>
                                <p className="text-xs text-rose-600 mt-0.5">Esta acción no se puede deshacer. Se eliminarán también las evidencias asociadas.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => { setShowDeleteConfirm(false); onDeleteTask?.(task.id); }}
                                className="flex-1 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all"
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex-1 py-2.5 border border-rose-200 text-rose-600 rounded-xl text-sm font-semibold hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Eliminar
                    </button>
                    <button
                        onClick={isEditing ? handleSaveEdits : onClose}
                        className="flex-1 py-2.5 bg-[#1A71B8] hover:bg-[#155d96] text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                    >
                        {isEditing ? 'Guardar' : 'Listo'}
                    </button>
                </div>
            </div>
        </>,
        document.body
    );
};

export default EvidenceModal;
