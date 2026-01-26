// Formatear fecha al formato español: "18 de noviembre 2025"
export const formatDateToSpanish = (date) => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Verificar si es una fecha válida
  if (isNaN(dateObj.getTime())) return '';

  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  const day = dateObj.getDate();
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  return `${day} de ${month} ${year}`;
};

// Obtener fecha actual formateada
export const getCurrentDateFormatted = () => {
  return formatDateToSpanish(new Date());
};
