export const getInitials = (nombres, apellidos) => {
  const first = nombres?.charAt(0) || '';
  const last = apellidos?.charAt(0) || '';
  return `${first}${last}`.toUpperCase();
};
