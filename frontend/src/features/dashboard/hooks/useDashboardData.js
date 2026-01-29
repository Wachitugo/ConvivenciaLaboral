import { useState, useEffect } from 'react';
import { casesService, chatService, interviewsService } from '../../../services/api';
import { processRecentCases, processCasesByProtocol, processMonthlyEvolution, processMonthlyRollingComparison, processWeeklyEvolution, processStatusDistribution, processDailyActivity } from '../utils/dataProcessors';
import { calculateStats, calculateSharedCases, generateRecentActivity } from '../utils/statsCalculators';
import { calculateDeadlineDate, getDeadlineStatus } from '../../../utils/dateUtils';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('useDashboardData');

// Procesar estadísticas de entrevistas
const processInterviewStats = (interviews) => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  // Entrevistas por mes (últimos 6 meses)
  const monthlyCount = {};
  const currentMonth = new Date().getMonth();

  // Inicializar últimos 6 meses
  for (let i = 5; i >= 0; i--) {
    let mIndex = currentMonth - i;
    if (mIndex < 0) mIndex += 12;
    monthlyCount[months[mIndex]] = 0;
  }

  // Contadores para género y área de trabajo
  const genderCount = {};
  const gradeCount = {};
  let assigned = 0;
  let unassigned = 0;

  interviews.forEach(interview => {
    // Contar por mes
    if (interview.created_at) {
      const date = new Date(interview.created_at);
      const monthName = months[date.getMonth()];
      if (monthlyCount[monthName] !== undefined) {
        monthlyCount[monthName]++;
      }
    }

    // Contar asignación a caso
    if (interview.case_id) {
      assigned++;
    } else {
      unassigned++;
    }

    // Contar por género
    const gender = interview.gender || 'No especificado';
    genderCount[gender] = (genderCount[gender] || 0) + 1;

    // Contar por área de trabajo
    const grade = interview.grade || interview.course || 'No especificado';
    gradeCount[grade] = (gradeCount[grade] || 0) + 1;
  });

  // Calculate generic interview stats
  const totalInterviews = interviews.length;
  const authorizedInterviews = interviews.filter(i => i.status === 'Autorizada').length;

  // Formatear datos para gráficos
  const interviewsMonthly = Object.entries(monthlyCount).map(([month, count]) => ({
    month,
    count
  }));

  const interviewsGender = Object.entries(genderCount).map(([name, count]) => ({
    name,
    count
  })).sort((a, b) => b.count - a.count);

  const interviewsGrade = Object.entries(gradeCount).map(([name, count]) => ({
    name,
    count
  })).sort((a, b) => b.count - a.count);

  return {
    interviewsMonthly,
    interviewsAssignment: { assigned, unassigned },
    interviewsGender,
    interviewsGrade,
    totalInterviews,
    authorizedInterviews
  };
};

export const useDashboardData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [rawData, setRawData] = useState(null);

  const [dashboardData, setDashboardData] = useState({
    recentCases: [],
    casesByProtocol: [],
    monthlyEvolution: [],
    dailyActivity: [],
    statusDistribution: [],
    stats: {
      total: 0,
      active: 0,
      resolved: 0,
      pending: 0,
      thisWeek: 0,
      totalTrend: 0,
      activeTrend: 0,
      resolvedTrend: 0,
      weekTrend: 0,
      expiredProtocols: 0
    },
    sharedCases: {
      sharedByMe: 0,
      sharedWithMe: 0,
      notShared: 0
    },
    recentActivity: [],
    allCases: [],
    interviewsMonthly: [],
    interviewsAssignment: { assigned: 0, unassigned: 0 },
    interviewsGender: [],
    interviewsGrade: [],
    totalInterviews: 0,
    authorizedInterviews: 0,
    selectedMonth: 'all',
    selectedYear: 'all'
  });

  // Effect 1: Fetch Data (Only once)
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        const colegios = JSON.parse(localStorage.getItem('colegios'));
        const colegio = colegios && colegios.length > 0 ? colegios[0] : null;

        if (!usuario || !colegio) {
          logger.error("Usuario o colegio no encontrado");
          setIsLoading(false);
          return;
        }

        // Directivo ve todos los casos del colegio, otros roles ven solo sus casos
        const isDirectivo = usuario.rol === 'Directivo';
        logger.info(`[Dashboard] Usuario: ${usuario.nombre}, Rol: ${usuario.rol}, isDirectivo: ${isDirectivo}`);

        const [cases, sessions, interviews] = await Promise.all([
          isDirectivo
            ? casesService.getAllCasesBySchool(colegio.id)
            : casesService.getCases(usuario.id, colegio.id),
          chatService.getSessions(usuario.id).catch(err => {
            logger.error("Error fetching sessions:", err);
            return [];
          }),
          isDirectivo
            ? interviewsService.listAllBySchool(colegio.id).catch(err => {
                logger.error("Error fetching all school interviews:", err);
                return [];
              })
            : interviewsService.list(colegio.id).catch(err => {
                logger.error("Error fetching interviews:", err);
                return [];
              })
        ]);

        // Pre-process cases that don't depend on filters (like deadlines relative to NOW)
        const processedCases = cases.map((c) => {
          const isOwner = c.owner_id === usuario.id;
          const isShared = c.is_shared || false;

          let deadlineStatus = 'none';
          let deadlineText = null;
          let nextDeadlineDate = null;

          const steps = c.pasosProtocolo || c.protocolSteps || [];
          if (steps && steps.length > 0) {
            const nextStepIndex = steps.findIndex(s => s.status !== 'completed' && s.status !== 'completado' && s.status !== 'skipped');
            const nextStep = nextStepIndex !== -1 ? steps[nextStepIndex] : null;

            if (nextStep && (nextStep.deadline || nextStep.estimated_time)) {
              if (nextStep.deadline) {
                nextDeadlineDate = new Date(nextStep.deadline);
              } else if (nextStep.estimated_time) {
                // Fix: Pass case creation date as base date to prevent daily shifting
                const baseDate = c.created_at ? new Date(c.created_at) : new Date();
                nextDeadlineDate = calculateDeadlineDate(nextStep.estimated_time, baseDate);
              }

              if (nextDeadlineDate) {
                deadlineStatus = getDeadlineStatus(nextDeadlineDate);

                const now = new Date();
                const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const deadlineDay = new Date(nextDeadlineDate.getFullYear(), nextDeadlineDate.getMonth(), nextDeadlineDate.getDate());
                const diffDays = Math.ceil((deadlineDay - nowDay) / (1000 * 60 * 60 * 24));

                const stepNum = nextStepIndex + 1;

                if (diffDays < 0) {
                  deadlineText = `Paso ${stepNum}: Venció hace ${Math.abs(diffDays)} días`;
                } else if (diffDays === 0) {
                  deadlineText = `Paso ${stepNum}: Vence hoy`;
                } else if (diffDays === 1) {
                  deadlineText = `Paso ${stepNum}: Vence mañana`;
                } else {
                  deadlineText = `Paso ${stepNum}: Vence en ${diffDays} días`;
                }
              }
            }
          }

          const isOverdue = nextDeadlineDate ? (Math.ceil((new Date(nextDeadlineDate.getFullYear(), nextDeadlineDate.getMonth(), nextDeadlineDate.getDate()) - new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())) / (1000 * 60 * 60 * 24)) < 0) : false;

          return {
            ...c,
            id: c.id,
            counterCase: c.counter_case,
            title: c.title,
            status: c.status === 'active' ? 'pendiente' : (c.status || 'pendiente'),
            caseType: c.case_type || 'No especificado',
            lastUpdate: new Date(c.updated_at || c.created_at).toLocaleDateString(),
            isActive: c.status !== 'resuelto' && c.status !== 'no_resuelto',
            isShared: isShared,
            isSharedByMe: isOwner && isShared,
            isSharedWithMe: !isOwner && isShared,
            involved: (c.involved || []).map(person => ({
              id: person.name,
              name: person.name
            })),
            description: c.description,
            createdAt: c.created_at,
            ownerId: c.owner_id,
            ownerName: c.owner_name,
            colegioId: c.colegio_id,
            deadlineStatus: deadlineStatus,
            deadlineText: deadlineText,
            nextDeadlineDate: nextDeadlineDate,
            isOverdue: isOverdue
          };
        });

        setRawData({
          cases: processedCases,
          sessions,
          interviews,
          userId: usuario.id
        });

      } catch (error) {
        logger.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Effect 2: Filter Data (Runs locally)
  useEffect(() => {
    if (!rawData) return;

    const { cases, sessions, interviews, userId } = rawData;
    let filteredCases = cases;
    let filteredInterviews = interviews;

    const yearFilter = dashboardData.selectedYear;
    const monthFilter = dashboardData.selectedMonth;

    // 2. Filtrar por AÑO y MES (para el resto de estadísticas)
    if (yearFilter !== 'all' || monthFilter !== 'all') {
      filteredCases = cases.filter(c => {
        const date = new Date(c.created_at);
        const matchYear = yearFilter === 'all' || date.getFullYear() === parseInt(yearFilter);
        const matchMonth = monthFilter === 'all' || date.getMonth().toString() === monthFilter;
        return matchYear && matchMonth;
      });

      filteredInterviews = interviews.filter(i => {
        const date = new Date(i.created_at);
        const matchYear = yearFilter === 'all' || date.getFullYear() === parseInt(yearFilter);
        const matchMonth = monthFilter === 'all' || date.getMonth().toString() === monthFilter;
        return matchYear && matchMonth;
      });
    }

    // Preparar datos para evolución anual (ignora filtro de mes, solo respeta año)
    let casesByYear = cases;
    if (yearFilter !== 'all') {
      casesByYear = cases.filter(c => {
        const date = new Date(c.created_at);
        return date.getFullYear() === parseInt(yearFilter);
      });
    }

    // Calcular estadísticas

    // Actividad Diaria: Usamos todos los datos y le pasamos el filtro al procesador
    // para que muestre los dias correctos
    const dailyStats = processDailyActivity(cases, sessions, monthFilter, yearFilter);

    const interviewStats = processInterviewStats(filteredInterviews);
    const recentCases = processRecentCases(filteredCases);
    const casesByProtocol = processCasesByProtocol(filteredCases);

    // Evolución: Mensual (Todo el año) o Semanal (Mes específico)
    let monthlyEvolution;
    let monthlyRolling = []; // Nuevo dato para vista de 6 meses

    if (monthFilter !== 'all') {
      monthlyEvolution = processWeeklyEvolution(filteredCases, monthFilter, yearFilter);
    } else {
      // Pasamos todos los casos para poder comparar con el año anterior
      monthlyEvolution = processMonthlyEvolution(cases, yearFilter);
      monthlyRolling = processMonthlyRollingComparison(cases);
    }

    const statusDistribution = processStatusDistribution(filteredCases);
    const stats = calculateStats(filteredCases);

    stats.totalInterviews = interviewStats.totalInterviews;
    stats.authorizedInterviews = interviewStats.authorizedInterviews;
    stats.expiredProtocols = filteredCases.filter(c => c.isOverdue).length;

    const sharedCases = calculateSharedCases(filteredCases, userId);
    const recentActivity = generateRecentActivity(filteredCases);

    setDashboardData(prev => ({
      ...prev,
      recentCases,
      casesByProtocol,
      monthlyEvolution,
      monthlyRolling,
      dailyActivity: dailyStats,
      statusDistribution,
      stats,
      sharedCases,
      recentActivity,
      allCases: filteredCases,
      ...interviewStats
    }));

  }, [rawData, dashboardData.selectedMonth, dashboardData.selectedYear]);

  const setSelectedMonth = (month) => {
    setDashboardData(prev => ({ ...prev, selectedMonth: month }));
  };

  const setSelectedYear = (year) => {
    setDashboardData(prev => ({ ...prev, selectedYear: year }));
  };

  return {
    dashboardData,
    isLoading,
    setSelectedMonth,
    selectedMonth: dashboardData.selectedMonth,
    setSelectedYear,
    selectedYear: dashboardData.selectedYear
  };
};
