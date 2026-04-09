import { useState } from 'react';
import { addWorkingDays } from '../../utils/dateUtils';
import { Paperclip } from 'lucide-react';

const GanttRow = ({ activity, responsible, startDate, durationDays, colorClass, gridDistribution, isLast, hasEvidence }) => {
    let leftOffset = '0%';
    let width = '100%';

    if (startDate && durationDays !== undefined) {
        const taskStart = new Date(startDate);
        taskStart.setHours(0, 0, 0, 0);
        const taskEnd = addWorkingDays(taskStart, durationDays);
        taskEnd.setHours(23, 59, 59, 999);

        const totalColumns = gridDistribution.length;

        let startColIndex = gridDistribution.findIndex(col => taskStart >= col.startDate && taskStart <= col.endDate);
        if (startColIndex === -1 && taskStart < gridDistribution[0].startDate) startColIndex = 0;
        if (startColIndex === -1 && taskStart > gridDistribution[gridDistribution.length - 1].endDate) startColIndex = totalColumns - 1;

        let endColIndex = gridDistribution.findIndex(col => taskEnd >= col.startDate && taskEnd <= col.endDate);
        if (endColIndex === -1 && taskEnd > gridDistribution[gridDistribution.length - 1].endDate) endColIndex = totalColumns - 1;
        if (endColIndex === -1 && taskEnd < gridDistribution[0].startDate) endColIndex = 0;

        if (startColIndex !== -1 && endColIndex !== -1) {
            const colsSpanned = endColIndex - startColIndex + 1;
            leftOffset = `${(startColIndex / totalColumns) * 100}%`;
            width = `${Math.max(0.5, (colsSpanned / totalColumns) * 100)}%`;
        }
    }

    const defaultColor = 'bg-[#B3D0C8] text-gray-700';
    const barClasses = colorClass || defaultColor;
    const displayResponsible = Array.isArray(responsible) ? responsible.join(', ') : responsible;

    return (
        <div className={`grid grid-cols-[260px_1fr] group/row hover:bg-blue-50/30 transition-colors ${!isLast ? 'border-b border-gray-100' : ''}`}>
            <div className="py-3 px-4 flex items-start justify-between text-xs font-medium text-gray-700 bg-white group-hover/row:bg-blue-50/20 transition-colors border-r border-gray-100 leading-tight gap-2">
                <span className="flex-1" title={activity}>{activity}</span>
                {hasEvidence && (
                    <div className="shrink-0 text-blue-500 hover:text-blue-600 transition-colors mt-0.5" title="Esta actividad tiene evidencias adjuntas">
                        <Paperclip size={14} strokeWidth={2.5} />
                    </div>
                )}
            </div>
            <div className="relative py-2.5">
                <div className="absolute inset-0 grid divide-x divide-gray-100/30 opacity-20 pointer-events-none" style={{ gridTemplateColumns: `repeat(${gridDistribution.length}, 1fr)` }}>
                    {gridDistribution.map((col, i) => {
                        let additionalClasses = '';
                        if (col.type === 'day' && col.isWeekend) additionalClasses += 'bg-orange-600 opacity-20 ';
                        if (col.isMonthEnd) additionalClasses += 'border-r-2 border-r-gray-400 ';
                        return <div key={i} className={additionalClasses} />;
                    })}
                </div>
                {displayResponsible && (
                    <div
                        className="absolute top-1/2 -translate-y-1/2 h-7 rounded-md px-1 py-1 text-[10px] font-medium shadow-sm transition-all overflow-hidden flex items-center justify-center cursor-help group"
                        style={{ left: `calc(${leftOffset} + 2px)`, width: `calc(${width} - 4px)` }}
                        title={`Responsable: ${displayResponsible}`}
                    >
                        <div className={`absolute inset-0 rounded-md ${barClasses} opacity-80 pointer-events-none`}></div>
                        <span className="relative z-10 block truncate w-full text-center px-1">
                            {displayResponsible}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

const GanttChart = ({ tasks, onTaskClick, planPeriod }) => {
    const isGlobalDailyView = planPeriod?.weeks <= 4;
    const [zoomedMonthKey, setZoomedMonthKey] = useState(null);

    const totalRequiredWeeks = planPeriod?.weeks || 12;

    let minDate = new Date();
    minDate.setDate(1);
    minDate.setHours(0, 0, 0, 0);

    let maxDate = new Date(minDate);
    maxDate.setDate(minDate.getDate() + (totalRequiredWeeks * 7) - 1);
    maxDate.setHours(23, 59, 59, 999);

    if (tasks && tasks.length > 0) {
        const validTasks = tasks.filter(t => t.startDate);
        if (validTasks.length > 0) {
            const startDates = validTasks.map(t => new Date(t.startDate));
            const tasksMinDate = new Date(Math.min(...startDates.map(d => d.getTime())));
            if (tasksMinDate < minDate) {
                minDate = tasksMinDate;
                minDate.setDate(1);
                minDate.setHours(0, 0, 0, 0);
            }

            const endDates = validTasks.map(t => {
                const s = new Date(t.startDate);
                s.setHours(0, 0, 0, 0);
                return addWorkingDays(s, t.durationDays || 1);
            });
            const taskMaxDate = new Date(Math.max(...endDates.map(d => d.getTime())));
            if (taskMaxDate > maxDate) {
                maxDate = taskMaxDate;
                maxDate.setHours(23, 59, 59, 999);
            }
        }
    }

    const gridDistribution = [];
    const monthsToRender = [];

    let currentDate = new Date(minDate);
    let globalDayCounter = 0;
    let currentWeekNumber = 1;
    let daysAccumulatedInWeek = 0;
    let currentWeekStartDate = new Date(currentDate);

    while (currentDate <= maxDate) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthName = currentDate.toLocaleString('es-CL', { month: 'long' });
        const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        const monthKey = `${capitalizedMonth} ${year}`;
        const isMonthZoomed = isGlobalDailyView || zoomedMonthKey === monthKey;

        if (isMonthZoomed) {
            if (daysAccumulatedInWeek > 0) {
                const weekEndDate = new Date(currentDate);
                weekEndDate.setDate(weekEndDate.getDate() - 1);
                weekEndDate.setHours(23, 59, 59, 999);
                const wMonthName = currentWeekStartDate.toLocaleString('es-CL', { month: 'long' });
                const wCapMonth = wMonthName.charAt(0).toUpperCase() + wMonthName.slice(1);
                const wKey = `${wCapMonth} ${currentWeekStartDate.getFullYear()}`;
                gridDistribution.push({ type: 'week', startDate: new Date(currentWeekStartDate), endDate: weekEndDate, label: `S${currentWeekNumber}`, monthKey: wKey, monthName: wCapMonth });
                let lastM = monthsToRender[monthsToRender.length - 1];
                if (!lastM || lastM.key !== wKey) monthsToRender.push({ name: wCapMonth, key: wKey, colsCount: 1 });
                else lastM.colsCount++;
                currentWeekNumber++;
                daysAccumulatedInWeek = 0;
            }

            const dayEnd = new Date(currentDate);
            dayEnd.setHours(23, 59, 59, 999);
            gridDistribution.push({ type: 'day', startDate: new Date(currentDate), endDate: dayEnd, label: currentDate.getDate().toString(), isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6, monthKey, monthName: capitalizedMonth });
            let lastM = monthsToRender[monthsToRender.length - 1];
            if (!lastM || lastM.key !== monthKey) monthsToRender.push({ name: capitalizedMonth, key: monthKey, colsCount: 1 });
            else lastM.colsCount++;

            currentDate.setDate(currentDate.getDate() + 1);
            globalDayCounter++;
            currentWeekNumber = Math.floor(globalDayCounter / 7) + 1;
        } else {
            if (daysAccumulatedInWeek === 0) currentWeekStartDate = new Date(currentDate);
            daysAccumulatedInWeek++;
            globalDayCounter++;
            currentDate.setDate(currentDate.getDate() + 1);

            if (daysAccumulatedInWeek === 7) {
                const weekEndDate = new Date(currentDate);
                weekEndDate.setDate(weekEndDate.getDate() - 1);
                weekEndDate.setHours(23, 59, 59, 999);
                const wMonthName = currentWeekStartDate.toLocaleString('es-CL', { month: 'long' });
                const wCapMonth = wMonthName.charAt(0).toUpperCase() + wMonthName.slice(1);
                const wKey = `${wCapMonth} ${currentWeekStartDate.getFullYear()}`;
                gridDistribution.push({ type: 'week', startDate: new Date(currentWeekStartDate), endDate: weekEndDate, label: `S${currentWeekNumber}`, monthKey: wKey, monthName: wCapMonth });
                let lastM = monthsToRender[monthsToRender.length - 1];
                if (!lastM || lastM.key !== wKey) monthsToRender.push({ name: wCapMonth, key: wKey, colsCount: 1 });
                else lastM.colsCount++;
                currentWeekNumber++;
                daysAccumulatedInWeek = 0;
            }
        }
    }

    if (daysAccumulatedInWeek > 0) {
        const weekEndDate = new Date(currentDate);
        weekEndDate.setDate(weekEndDate.getDate() - 1);
        weekEndDate.setHours(23, 59, 59, 999);
        const wMonthName = currentWeekStartDate.toLocaleString('es-CL', { month: 'long' });
        const wCapMonth = wMonthName.charAt(0).toUpperCase() + wMonthName.slice(1);
        const wKey = `${wCapMonth} ${currentWeekStartDate.getFullYear()}`;
        gridDistribution.push({ type: 'week', startDate: new Date(currentWeekStartDate), endDate: weekEndDate, label: `S${currentWeekNumber}`, monthKey: wKey, monthName: wCapMonth });
        let lastM = monthsToRender[monthsToRender.length - 1];
        if (!lastM || lastM.key !== wKey) monthsToRender.push({ name: wCapMonth, key: wKey, colsCount: 1 });
        else lastM.colsCount++;
    }

    const totalColumns = gridDistribution.length;
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    let todayColIndex = gridDistribution.findIndex(col => now >= col.startDate && now <= col.endDate);

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-[#569991] text-white';
            case 'in_progress': return 'bg-[#1A71B8] text-white';
            case 'delayed': return 'bg-amber-100 text-amber-800 border border-amber-200';
            default: return 'bg-gray-100 text-gray-600 border border-gray-200';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-white flex flex-wrap justify-between items-center gap-3">
                <h3 className="font-bold text-gray-800">
                    Cronograma de Actividades ({new Date().toLocaleDateString('es-CL')})
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-600">
                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div> Pendiente</span>
                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#1A71B8' }}></div> En curso</span>
                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#569991' }}></div> Completado</span>
                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-200"></div> Atrasado</span>
                </div>
            </div>

            <div className="overflow-x-auto overflow-y-hidden custom-scrollbar pb-4">
                <div className="relative" style={{ minWidth: Math.max(900, totalRequiredWeeks * 60) + 'px' }}>

                    {todayColIndex !== -1 && (
                        <div
                            className="absolute top-0 bottom-0 w-px z-20 pointer-events-none"
                            style={{ left: `calc(260px + (100% - 260px) * (${todayColIndex / totalColumns}))` }}
                        >
                            <div className="w-px h-full bg-blue-500/60" />
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-b-md uppercase tracking-wider">
                                Hoy
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-[260px_1fr] bg-gray-50 border-b border-gray-200">
                        <div className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-r border-gray-200 flex items-center">
                            Actividad
                        </div>
                        <div className="flex w-full divide-x divide-gray-100/50">
                            {monthsToRender.map((month, i) => {
                                const isMonthZoomed = isGlobalDailyView || zoomedMonthKey === month.key;
                                const colsToRender = gridDistribution.filter(col => col.monthKey === month.key);
                                return (
                                    <div key={i} className="text-center flex flex-col min-w-[50px] transition-all" style={{ flex: month.colsCount }}>
                                        <div
                                            onClick={() => !isGlobalDailyView && setZoomedMonthKey(zoomedMonthKey === month.key ? null : month.key)}
                                            className={`py-1 text-[10px] font-extrabold text-gray-700 border-b border-gray-100/50 uppercase tracking-widest flex justify-center items-center min-h-[26px] select-none ${!isGlobalDailyView ? 'cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors' : ''} ${zoomedMonthKey === month.key ? 'bg-blue-50/70 text-blue-700' : 'bg-gray-100/30'}`}
                                            title={!isGlobalDailyView ? "Clic para hacer zoom a días" : ""}
                                        >
                                            {month.name} {zoomedMonthKey === month.key && '🔍'}
                                        </div>
                                        <div className="grid divide-x divide-gray-100/30 h-full" style={{ gridTemplateColumns: `repeat(${month.colsCount}, minmax(0, 1fr))` }}>
                                            {colsToRender.map((col, colIndex) => (
                                                col.type === 'day' ? (
                                                    <div key={colIndex} className={`text-[8px] py-1 font-bold ${col.isWeekend ? 'bg-orange-50 text-orange-400' : 'text-gray-400'}`}>
                                                        {col.label}
                                                    </div>
                                                ) : (
                                                    <div key={colIndex} className="text-[8px] text-gray-400 py-0.5">{col.label}</div>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {tasks && tasks.length > 0 ? (
                        tasks.map((task, index) => (
                            <div key={task.id || index} onClick={() => onTaskClick && onTaskClick(task)} className="cursor-pointer">
                                <GanttRow
                                    activity={task.title}
                                    responsible={task.assignedTo}
                                    startDate={task.startDate}
                                    durationDays={task.durationDays}
                                    colorClass={getStatusColor(task.status)}
                                    gridDistribution={gridDistribution}
                                    isLast={index === tasks.length - 1}
                                    hasEvidence={task.evidence && task.evidence.length > 0}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="p-10 text-center">
                            <p className="text-xs text-gray-400 font-medium mt-2">No hay actividades programadas aún.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GanttChart;
