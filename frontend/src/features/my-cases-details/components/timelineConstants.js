export const PROTOCOLOS_PREDEFINIDOS = {
  bullying: {
    nombre: 'Protocolo de Bullying',
    pasos: [
      { titulo: 'Entrevista inicial con víctima', descripcion: 'Realizar entrevista individual con el estudiante afectado para recabar información', estimated_time: '24 horas' },
      { titulo: 'Entrevista con agresor', descripcion: 'Entrevistar al estudiante agresor para conocer su versión de los hechos', estimated_time: '48 horas' },
      { titulo: 'Citación a apoderados', descripcion: 'Convocar a los apoderados de ambas partes para informar la situación', estimated_time: '3 días hábiles' },
      { titulo: 'Aplicación de medidas formativas', descripcion: 'Implementar medidas formativas según reglamento interno', estimated_time: '5 días hábiles' },
      { titulo: 'Seguimiento y cierre', descripcion: 'Monitorear la situación y evaluar efectividad de las medidas', estimated_time: '15 días hábiles' }
    ]
  }
};

export const getEstadoColor = (estado) => {
  switch (estado) {
    case 'completado':
      return 'bg-green-500';
    case 'en_progreso':
      return 'bg-yellow-500';
    default:
      return 'bg-stone-300';
  }
};

export const getEstadoTexto = (estado) => {
  switch (estado) {
    case 'completado':
      return 'Completado';
    case 'en_progreso':
      return 'En progreso';
    default:
      return 'Pendiente';
  }
};

export const formatearFecha = (fecha) => {
  if (!fecha) return '';
  const date = new Date(fecha);
  const ahora = new Date();
  const diffMs = ahora - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return date.toLocaleDateString('es-CL');
};

export const getRolColor = (rol) => {
  switch (rol) {
    case 'agresor':
      return 'bg-red-100 text-red-700';
    case 'victima':
      return 'bg-blue-100 text-blue-700';
    case 'testigo':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export const getRolTexto = (rol) => {
  switch (rol) {
    case 'agresor':
      return 'Agresor';
    case 'victima':
      return 'Víctima';
    case 'testigo':
      return 'Testigo';
    default:
      return rol;
  }
};
