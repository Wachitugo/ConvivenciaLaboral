/**
 * Adds N working days (Mon–Fri) to a given date.
 * @param {Date|string} startDate
 * @param {number} days
 * @returns {Date}
 */
export const addWorkingDays = (startDate, days) => {
    const date = new Date(startDate);
    date.setHours(0, 0, 0, 0);
    let added = 0;
    while (added < days) {
        date.setDate(date.getDate() + 1);
        const day = date.getDay();
        if (day !== 0 && day !== 6) added++;
    }
    return date;
};

/**
 * Returns the number of working days between two dates.
 * @param {Date|string} startDate
 * @param {Date|string} endDate
 * @returns {number}
 */
export const getWorkingDaysBetween = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    let count = 0;
    const cur = new Date(start);
    while (cur < end) {
        cur.setDate(cur.getDate() + 1);
        const day = cur.getDay();
        if (day !== 0 && day !== 6) count++;
    }
    return count;
};

/**
 * Formats a Date or date string to YYYY-MM-DD.
 * @param {Date|string} date
 * @returns {string}
 */
export const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Calculate the deadline date based on a start date and duration string.
 * This function mimics the logic previously inside ProtocolStep.jsx
 * 
 * @param {string} durationStr - The duration string (e.g., "2 days", "48 horas", "3 días hábiles")
 * @param {Date|string} startDate - The start date (default: now)
 * @returns {Date|null} The calculated deadline date
 */
export const calculateDeadlineDate = (durationStr, startDate = new Date()) => {
    if (!durationStr) return null;

    const match = durationStr.match(/(\d+)/);
    if (!match) return null;

    let units = parseInt(match[0]);
    const isHours = durationStr.toLowerCase().includes('hora');
    const isBusinessDays = durationStr.toLowerCase().includes('hábiles') || durationStr.toLowerCase().includes('habiles');

    let currentDate = new Date(startDate);

    // Note: Strict holiday calculation is handled by backend. 
    // This frontend utility focuses on business days (Mon-Fri) only.

    if (isHours) {
        currentDate.setHours(currentDate.getHours() + units);
    } else {
        // Asumimos días
        let daysAdded = 0;
        // Safety break to prevent infinite loops
        let iterations = 0;
        const MAX_ITERATIONS = 365;

        while (daysAdded < units && iterations < MAX_ITERATIONS) {
            currentDate.setDate(currentDate.getDate() + 1);
            iterations++;

            if (isBusinessDays) {
                const day = currentDate.getDay();
                // Si es Día hábil (Lunes-Viernes)
                // Note: Holiday check is delegated to backend
                if (day !== 0 && day !== 6) {
                    daysAdded++;
                }
                // Si es fin de semana, el loop continúa sin aumentar daysAdded
            } else {
                daysAdded++;
            }
        }
    }

    return currentDate;
};

/**
 * Determine the status of a deadline relative to today.
 * Nueva lógica estricta para mejor seguimiento de plazos:
 * - 🔴 Rojo (Crítico): Ya venció O quedan 2 días o menos
 * - 🟡 Amarillo (Alerta): Quedan entre 3 y 5 días
 * - 🟢 Verde (A tiempo): Quedan más de 5 días
 *
 * @param {Date|string} deadline - The deadline date
 * @returns {string} 'red' (critical), 'yellow' (warning), 'green' (on time), or 'none'
 */
export const getDeadlineStatus = (deadline) => {
    if (!deadline) return 'none';

    const now = new Date();
    const deadlineDate = new Date(deadline);

    // Normalizar a inicio del día para comparaciones de días completos
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const deadlineDay = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());

    // Diferencia en milisegundos y días
    const diffTime = deadlineDate - now;
    const diffDays = (deadlineDay - nowDay) / (1000 * 60 * 60 * 24);

    // 🔴 ROJO: Ya expiró O quedan 2 días o menos (crítico/urgente)
    if (diffTime < 0 || diffDays <= 2) {
        return 'red';
    }

    // 🟡 AMARILLO: Quedan entre 3 y 5 días (alerta temprana)
    if (diffDays >= 3 && diffDays <= 5) {
        return 'yellow';
    }

    // 🟢 VERDE: Quedan más de 5 días (a tiempo)
    return 'green';
};
