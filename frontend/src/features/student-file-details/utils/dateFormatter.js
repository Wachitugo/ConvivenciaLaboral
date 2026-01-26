/**
 * Parsea una fecha string (YYYY-MM-DD o ISO) sin problemas de timezone
 * @param {string} dateString - Fecha en formato YYYY-MM-DD o ISO
 * @returns {Date} Fecha parseada correctamente en zona local
 */
export const parseLocalDate = (dateString) => {
  if (!dateString) return null;
  // Obtener solo la parte YYYY-MM-DD
  const dateOnly = dateString.split('T')[0];
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = parseLocalDate(dateString);
  if (!date) return '';
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nacimiento = parseLocalDate(fechaNacimiento);
  if (!nacimiento) return null;

  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
};
