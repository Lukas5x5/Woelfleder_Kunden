/**
 * Formatting Utilities
 */

/**
 * Format number as price in EUR
 * @param {number} amount
 * @returns {string}
 */
export function formatPrice(amount) {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Format number as area in m²
 * @param {number} area
 * @returns {string}
 */
export function formatArea(area) {
    return `${area.toFixed(2)} m²`;
}

/**
 * Format date to German format
 * @param {Date|string} date
 * @returns {string}
 */
export function formatDate(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(d);
}

/**
 * Format date to German format with time
 * @param {Date|string} date
 * @returns {string}
 */
export function formatDateTime(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(d);
}

/**
 * Truncate text to specified length
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}
