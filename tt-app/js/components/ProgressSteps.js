/**
 * Progress Steps Component
 */

import { VIEWS } from '../config/constants.js';

const steps = [
    { id: 1, name: 'Kunde', view: VIEWS.CUSTOMER_SELECT },
    { id: 2, name: 'Tor-Typ', view: VIEWS.TYPE_SELECT },
    { id: 3, name: 'Konfiguration', view: VIEWS.GATE_CONFIG }
];

/**
 * Render progress steps
 * @param {string} currentView
 * @returns {string}
 */
export function renderProgressSteps(currentView) {
    return `
        <div class="progress-steps">
            ${steps.map(step => `
                <div class="step ${currentView === step.view ? 'active' : ''}">
                    <div class="step-number">${step.id}</div>
                    <span>${step.name}</span>
                </div>
            `).join('')}
        </div>
    `;
}
