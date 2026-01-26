// Calcular estadísticas principales para StatsCards
export const calculateStats = (cases) => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Contar por estado - MISMO mapeo que processStatusDistribution
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

  // Casos de esta semana
  const thisWeekCases = cases.filter(c => new Date(c.created_at) >= oneWeekAgo).length;

  // Calcular tendencias (simuladas - en producción compararías con mes anterior real)
  const totalTrend = Math.floor(Math.random() * 20) - 10;
  const activeTrend = Math.floor(Math.random() * 20) - 10;
  const resolvedTrend = Math.floor(Math.random() * 20) - 5;
  const weekTrend = Math.floor(Math.random() * 30) - 15;

  return {
    total: cases.length,
    active: statusCounts['Abiertos'],
    resolved: statusCounts['Resueltos'],
    pending: statusCounts['Pendientes'],
    unresolved: statusCounts['No Resueltos'],
    thisWeek: thisWeekCases,
    totalTrend,
    activeTrend,
    resolvedTrend,
    weekTrend
  };
};

// Calcular casos compartidos
export const calculateSharedCases = (cases, userId) => {
  const sharedByMe = cases.filter(c => c.is_shared && c.owner_id === userId).length;
  const sharedWithMe = cases.filter(c => c.is_shared && c.owner_id !== userId).length;
  const notShared = cases.filter(c => !c.is_shared).length;

  return {
    sharedByMe,
    sharedWithMe,
    notShared
  };
};

// Generar actividad reciente
export const generateRecentActivity = (cases) => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const sortedCases = [...cases].sort((a, b) =>
    new Date(b.created_at || b.updated_at) - new Date(a.created_at || a.updated_at)
  );

  return sortedCases.slice(0, 10).map(c => {
    const isNew = new Date(c.created_at) >= oneWeekAgo;
    const isShared = c.is_shared;

    let type = 'created';
    let description = `Caso ${c.case_type || 'General'}`;

    if (isShared) {
      type = 'shared';
      description = `Compartido con el equipo`;
    } else if (!isNew) {
      type = 'updated';
      description = `Actualizado recientemente`;
    }

    return {
      type,
      title: c.title,
      description,
      timestamp: c.created_at || c.updated_at,
      tag: c.case_type
    };
  });
};
