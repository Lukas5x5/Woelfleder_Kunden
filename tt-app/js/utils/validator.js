/**
 * Validation Utilities
 */

/**
 * Validate email address
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number (German format)
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
    if (!phone) return true; // Phone is optional
    const phoneRegex = /^[\d\s\+\-\(\)\/]+$/;
    return phoneRegex.test(phone) && phone.length >= 5;
}

/**
 * Validate required field
 * @param {string} value
 * @returns {boolean}
 */
export function isRequired(value) {
    return value && value.trim().length > 0;
}

/**
 * Validate positive number
 * @param {number|string} value
 * @returns {boolean}
 */
export function isPositiveNumber(value) {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return !isNaN(num) && num > 0;
}

/**
 * Validate customer data
 * @param {Object} customer
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateCustomer(customer) {
    const errors = [];

    if (!isRequired(customer.name)) {
        errors.push('Name ist erforderlich');
    }

    if (customer.email && !isValidEmail(customer.email)) {
        errors.push('Ungültige E-Mail-Adresse');
    }

    if (customer.phone && !isValidPhone(customer.phone)) {
        errors.push('Ungültige Telefonnummer');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate gate dimensions
 * @param {Object} dimensions
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateGateDimensions(dimensions) {
    const errors = [];

    if (!isPositiveNumber(dimensions.breite)) {
        errors.push('Breite muss eine positive Zahl sein');
    }

    if (!isPositiveNumber(dimensions.hoehe)) {
        errors.push('Höhe muss eine positive Zahl sein');
    }

    if (dimensions.glashoehe && !isPositiveNumber(dimensions.glashoehe)) {
        errors.push('Glashöhe muss eine positive Zahl sein');
    }

    if (dimensions.glashoehe && parseFloat(dimensions.glashoehe) > parseFloat(dimensions.hoehe)) {
        errors.push('Glashöhe kann nicht größer als Gesamthöhe sein');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
