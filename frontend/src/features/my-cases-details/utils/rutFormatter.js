// Formatear RUT chileno
export const formatRut = (value) => {
  const cleaned = value.replace(/[^0-9kK]/g, '');
  if (cleaned.length === 0) return '';

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1).toUpperCase();
  if (body.length === 0) return dv;

  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${dv}`;
};

// Limpiar y formatear el RUT durante el input
export const handleRutInput = (value, currentRut) => {
  const cleaned = value.replace(/[^0-9kK.\-]/g, '');

  if (cleaned.length < currentRut.length) {
    return cleaned;
  }

  if (cleaned.replace(/[.\-]/g, '').length >= 2) {
    return formatRut(cleaned);
  }

  return cleaned;
};
