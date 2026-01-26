// Utilidades para el dashboard

export const getPriorityColor = (priority) => {
  const colors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200'
  };
  return colors[priority] || colors.medium;
};

export const getPriorityText = (priority) => {
  const texts = {
    high: 'Alta',
    medium: 'Media',
    low: 'Baja'
  };
  return texts[priority] || 'Media';
};

export const getStatusColor = (status) => {
  const colors = {
    active: 'bg-blue-100 text-blue-700 border-blue-200',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  };
  return colors[status] || colors.pending;
};

export const getStatusText = (status) => {
  const texts = {
    active: 'Abierto',
    pending: 'Pendiente',
    resolved: 'Resuelto'
  };
  return texts[status] || 'Pendiente';
};
