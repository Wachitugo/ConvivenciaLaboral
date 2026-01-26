// Helper para obtener prioridad desde tipo de caso
const getPriorityFromType = (type) => {
  const high = ['Bullying', 'Agresión', 'Drogas', 'Abuso'];
  if (high.some(t => type?.includes(t))) return 'high';
  return 'medium';
};

// Procesar casos recientes (últimos 5)
export const processRecentCases = (cases) => {
  const sortedCases = [...cases].sort((a, b) =>
    new Date(b.created_at || b.updated_at) - new Date(a.created_at || a.updated_at)
  );

  return sortedCases.slice(0, 5).map(c => {
    let uiStatus = 'pending';
    const rawStatus = (c.status || '').toLowerCase();

    if (['abierto', 'open'].includes(rawStatus)) {
      uiStatus = 'active';
    } else if (['resolved', 'resuelto', 'cerrado'].includes(rawStatus)) {
      uiStatus = 'resolved';
    } else if (['pending', 'pendiente', 'active'].includes(rawStatus)) {
      uiStatus = 'pending';
    }

    return {
      id: c.id,
      title: c.title,
      student: c.involved && c.involved.length > 0 ? c.involved[0].name : 'No especificado',
      status: uiStatus,
      time: new Date(c.created_at).toLocaleDateString(),
      priority: getPriorityFromType(c.case_type)
    };
  });
};

// Procesar casos por protocolo
export const processCasesByProtocol = (cases) => {
  const protocolCount = {};

  cases.forEach(c => {
    const protocol = c.case_type || 'General';
    protocolCount[protocol] = (protocolCount[protocol] || 0) + 1;
  });

  return Object.keys(protocolCount).map(protocol => ({
    name: protocol,
    type: protocol, // Para compatibilidad con componente antiguo
    value: protocolCount[protocol],
    count: protocolCount[protocol],
    percentage: Math.round((protocolCount[protocol] / cases.length) * 100)
  })).sort((a, b) => b.value - a.value);
};

// Procesar evolución mensual (comparativa año actual vs anterior)
export const processMonthlyEvolution = (cases, selectedYear) => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  // Determinar años a comparar
  const currentYear = selectedYear === 'all' ? new Date().getFullYear() : parseInt(selectedYear);
  const previousYear = currentYear - 1;

  const currentYearCounts = {};
  const previousYearCounts = {};

  cases.forEach(c => {
    const date = new Date(c.created_at);
    // Verificar si es fecha válida
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const monthIndex = date.getMonth();
      const monthName = months[monthIndex];

      if (year === currentYear) {
        currentYearCounts[monthName] = (currentYearCounts[monthName] || 0) + 1;
      } else if (year === previousYear) {
        previousYearCounts[monthName] = (previousYearCounts[monthName] || 0) + 1;
      }
    }
  });

  return months.map(mName => ({
    mes: mName,
    current: currentYearCounts[mName] || 0,
    previous: previousYearCounts[mName] || 0,
    yearCurrent: currentYear,
    yearPrevious: previousYear,
    isComparison: true
  }));
};

// Procesar evolución Rolling 6 meses (Comparativa periodo)
export const processMonthlyRollingComparison = (cases) => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const today = new Date();

  // Construir los últimos 6 meses (incluyendo actual)
  const windowMonths = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    windowMonths.push({
      monthIndex: d.getMonth(),
      year: d.getFullYear(),
      name: months[d.getMonth()]
    });
  }

  // Estructura de conteo: "Año-MesIndex" -> Count
  const counts = {};

  cases.forEach(c => {
    const d = new Date(c.created_at);
    if (!isNaN(d.getTime())) {
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      counts[key] = (counts[key] || 0) + 1;
    }
  });

  return windowMonths.map(m => {
    const currentKey = `${m.year}-${m.monthIndex}`;
    const previousKey = `${m.year - 1}-${m.monthIndex}`; // El mismo mes, año anterior

    return {
      mes: m.name,
      current: counts[currentKey] || 0,
      previous: counts[previousKey] || 0,

      // Metadata para tooltips/leyenda (opcional)
      tooltipCurrent: `${m.name} ${m.year}`,
      tooltipPrevious: `${m.name} ${m.year - 1}`,
      year: m.year,
      isComparison: true,
      isRolling: true
    };
  });
};

// Procesar evolución SEMANAL (para cuando se selecciona un mes)
export const processWeeklyEvolution = (cases, month, year) => {
  // Dividir el mes en 4 semanas (aprox)
  const weeks = [
    { name: 'Semana 1', start: 1, end: 7, count: 0 },
    { name: 'Semana 2', start: 8, end: 14, count: 0 },
    { name: 'Semana 3', start: 15, end: 21, count: 0 },
    { name: 'Semana 4+', start: 22, end: 31, count: 0 }
  ];

  cases.forEach(c => {
    const d = new Date(c.created_at);
    // Filtrar por mes y año (aunque ya deberían venir filtrados, doble check no daña)
    // Nota: 'month' viene como string "0"-"11"
    if (d.getMonth() === parseInt(month) && d.getFullYear() === parseInt(year)) {
      const day = d.getDate();
      if (day <= 7) weeks[0].count++;
      else if (day <= 14) weeks[1].count++;
      else if (day <= 21) weeks[2].count++;
      else weeks[3].count++;
    }
  });

  return weeks.map(w => ({
    mes: w.name,
    casos: w.count,
    isComparison: false
  }));
};

// Procesar distribución de estados
export const processStatusDistribution = (cases) => {
  const statusMap = {
    'active': 'Pendientes', // Legacy status mapped to Pendientes
    'abierto': 'Abiertos',
    'pending': 'Pendientes',
    'pendiente': 'Pendientes',
    'resolved': 'Resueltos',
    'resuelto': 'Resueltos',
    'unresolved': 'No Resueltos',
    'no_resuelto': 'No Resueltos'
  };

  const statusCounts = {
    'Abiertos': 0,
    'Pendientes': 0,
    'Resueltos': 0,
    'No Resueltos': 0
  };

  cases.forEach(c => {
    const rawStatus = (c.status || 'pending').toLowerCase();
    const mappedStatus = statusMap[rawStatus] || 'Pendientes';
    if (statusCounts[mappedStatus] !== undefined) {
      statusCounts[mappedStatus]++;
    }
  });

  return [
    { name: 'Pendientes', value: statusCounts['Pendientes'], color: '#f59e0b' },
    { name: 'Abiertos', value: statusCounts['Abiertos'], color: '#3b82f6' },
    { name: 'Resueltos', value: statusCounts['Resueltos'], color: '#10b981' },
    { name: 'No Resueltos', value: statusCounts['No Resueltos'], color: '#ef4444' }
  ];
};

// Procesar actividad diaria (mes seleccionado o actual)
export const processDailyActivity = (cases, sessions, selectedMonth, selectedYear) => {
  const today = new Date();

  // MODO 1: Filtros "Todos" -> Mostrar últimos 30 días (Rolling Window)
  if (selectedMonth === 'all' && selectedYear === 'all') {
    const dailyData = [];
    const dateMap = {};

    // Generar últimos 30 días
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const dayLabel = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }); // "02 ene"
      const key = d.getTime(); // Timestamp para comparar facil

      dateMap[key] = { day: dayLabel, cases: 0, consultations: 0, rawDate: d };
      dailyData.push(dateMap[key]);
    }

    // Contar casos
    cases.forEach(c => {
      const d = new Date(c.created_at);
      d.setHours(0, 0, 0, 0);
      const key = d.getTime();
      if (dateMap[key]) {
        dateMap[key].cases++;
      }
    });

    // Contar sesiones
    if (sessions && Array.isArray(sessions)) {
      sessions.forEach(s => {
        const d = new Date(s.created_at);
        d.setHours(0, 0, 0, 0);
        const key = d.getTime();
        if (dateMap[key]) {
          dateMap[key].consultations++;
        }
      });
    }

    return dailyData;
  }

  // MODO 2: Mes/Año Específico -> Mostrar días del mes (1..31)
  let year = parseInt(selectedYear);
  if (isNaN(year)) year = today.getFullYear();

  let month;
  if (selectedMonth === 'all') {
    // Si año específico pero mes 'all', mostramos mes actual? O lógica de año?
    // Para simplificar y mantener utilidad, si selecciona año pero no mes, mostramos Enero? O Hoy?
    // El usuario pidió cross-year. Si selecciona 2023/All, esto no aplica.
    // Falback: Mes actual del año seleccionado o primer mes.
    // Vamos a asumir mes actual si el año es el actual, sino Enero?
    // Mejor: Mes actual.
    month = today.getMonth();
  } else {
    month = parseInt(selectedMonth);
  }

  // Número de días en el mes seleccionado
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Inicializar array de actividad
  const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    cases: 0,
    consultations: 0
  }));

  // Contar casos por día
  cases.forEach(c => {
    const d = new Date(c.created_at);
    if (d.getMonth() === month && d.getFullYear() === year) {
      const dayIndex = d.getDate() - 1;
      if (dailyData[dayIndex]) {
        dailyData[dayIndex].cases++;
      }
    }
  });

  // Contar sesiones por día
  if (sessions && Array.isArray(sessions)) {
    sessions.forEach(s => {
      const d = new Date(s.created_at);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const dayIndex = d.getDate() - 1;
        if (dailyData[dayIndex]) {
          dailyData[dayIndex].consultations++;
        }
      }
    });
  }

  return dailyData;
};
