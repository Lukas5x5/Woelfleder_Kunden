/**
 * Application Constants
 */

export const APP_NAME = 'Wölfleder Kalkulator';
export const STORAGE_KEY = 'woelfleder_customers';
export const VERSION = '1.0.0';

export const GATE_TYPES = {
    DOOR: 'Türen',
    WING_GATE: 'Flügeltore und Falttore',
    PUSH_GATE: 'Schubtore',
    SLIDING_DOOR: 'Schiebetüren'
};

export const VAT_RATE = 0.20; // 20% MwSt

export const ICONS = {
    door: `<svg viewBox="0 0 100 100" class="type-icon-svg">
        <rect x="20" y="10" width="60" height="80" fill="none" stroke="currentColor" stroke-width="3"/>
        <rect x="25" y="15" width="50" height="70" fill="currentColor" opacity="0.1"/>
        <circle cx="75" cy="50" r="3" fill="currentColor"/>
        <line x1="20" y1="90" x2="80" y2="90" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    wingGate: `<svg viewBox="0 0 100 100" class="type-icon-svg">
        <rect x="15" y="20" width="35" height="60" fill="currentColor" opacity="0.2"/>
        <rect x="50" y="20" width="35" height="60" fill="currentColor" opacity="0.2"/>
        <path d="M 15 20 L 50 50 L 15 80" fill="none" stroke="currentColor" stroke-width="3"/>
        <path d="M 85 20 L 50 50 L 85 80" fill="none" stroke="currentColor" stroke-width="3"/>
        <line x1="15" y1="80" x2="85" y2="80" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    pushGate: `<svg viewBox="0 0 100 100" class="type-icon-svg">
        <rect x="30" y="20" width="50" height="60" fill="currentColor" opacity="0.2"/>
        <rect x="30" y="20" width="50" height="60" fill="none" stroke="currentColor" stroke-width="3"/>
        <line x1="40" y1="20" x2="40" y2="80" stroke="currentColor" stroke-width="2"/>
        <line x1="60" y1="20" x2="60" y2="80" stroke="currentColor" stroke-width="2"/>
        <path d="M 20 50 L 30 50 M 25 45 L 30 50 L 25 55" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    slidingDoor: `<svg viewBox="0 0 100 100" class="type-icon-svg">
        <rect x="15" y="20" width="40" height="60" fill="currentColor" opacity="0.1"/>
        <rect x="35" y="20" width="40" height="60" fill="currentColor" opacity="0.3"/>
        <rect x="15" y="20" width="40" height="60" fill="none" stroke="currentColor" stroke-width="3"/>
        <rect x="35" y="20" width="40" height="60" fill="none" stroke="currentColor" stroke-width="3"/>
        <line x1="15" y1="15" x2="85" y2="15" stroke="currentColor" stroke-width="2"/>
    </svg>`
};

export const VIEWS = {
    CUSTOMER_SELECT: 'customer-select',
    TYPE_SELECT: 'type-select',
    GATE_CONFIG: 'gate-config'
};

export const TABS = {
    MAIN: 'main',
    ACCESSORIES: 'accessories',
    GENERAL: 'general'
};
