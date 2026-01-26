// Estados del caso
export const CASE_STATUS = {
  PENDING: 'pendiente',
  OPEN: 'abierto',
  RESOLVED: 'resuelto',
  NOT_RESOLVED: 'no_resuelto'
};

// Configuración visual para cada estado
export const STATUS_CONFIGS = {
  [CASE_STATUS.PENDING]: {
    label: 'Pendiente',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    dotColor: 'bg-yellow-500'
  },
  [CASE_STATUS.OPEN]: {
    label: 'Abierto',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    dotColor: 'bg-blue-500'
  },
  [CASE_STATUS.RESOLVED]: {
    label: 'Resuelto',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    dotColor: 'bg-green-500'
  },
  [CASE_STATUS.NOT_RESOLVED]: {
    label: 'No Resuelto',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    dotColor: 'bg-red-500'
  }
};

// Estado por defecto para casos nuevos
export const DEFAULT_CASE_STATUS = CASE_STATUS.PENDING;
