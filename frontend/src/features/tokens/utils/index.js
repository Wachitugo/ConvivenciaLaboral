/**
 * Format a number with locale-specific thousand separators
 * @param {number} value - Number to format
 * @returns {string} Formatted number string
 */
export const formatTokenCount = (value) => {
    if (value === null || value === undefined) return '0';
    return value.toLocaleString();
};

/**
 * Format token count with suffix (k, M)
 * @param {number} value - Number to format
 * @returns {string} Formatted string with suffix
 */
export const formatTokenCountCompact = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value?.toString() || '0';
};

/**
 * Calculate usage percentage
 * @param {number} current - Current usage
 * @param {number} limit - Usage limit
 * @returns {number} Percentage (0-100)
 */
export const calculateUsagePercent = (current, limit) => {
    if (!limit) return 0;
    return Math.min((current / limit) * 100, 100);
};

/**
 * Get color class based on usage percentage and thresholds
 * @param {number} percent - Usage percentage
 * @param {number[]} thresholds - Warning thresholds
 * @returns {string} Tailwind color class
 */
export const getUsageColorClass = (percent, thresholds = [75, 90]) => {
    const sorted = [...thresholds].sort((a, b) => a - b);

    if (percent >= sorted[sorted.length - 1]) return 'bg-red-500';
    if (percent >= sorted[0]) return 'bg-yellow-500';
    return 'bg-green-500';
};

/**
 * Parse date range for API filters
 * @param {number} days - Number of days ago
 * @returns {Object} Object with start and end date strings
 */
export const getDateRange = (days = 7) => {
    return {
        start: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    };
};
