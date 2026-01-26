/**
 * Formatea segundos en formato MM:SS
 * @param {number} seconds - Segundos a formatear
 * @returns {string} - Tiempo formateado como "MM:SS"
 */
export const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};
