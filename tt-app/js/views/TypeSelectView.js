/**
 * Type Select View
 */

import AppState from '../state/AppState.js';
import { GATE_TYPES, ICONS } from '../config/constants.js';
import { formatPrice, formatDate } from '../utils/formatter.js';

/**
 * Render type select view
 * @returns {string}
 */
export function renderTypeSelectView() {
    const customer = AppState.currentCustomer;
    if (!customer) {
        AppState.goToCustomerSelect();
        return '';
    }

    const gateTypes = Object.values(GATE_TYPES);

    return `
        <div class="card">
            <button class="btn btn-secondary" onclick="window.backToCustomers()"
                    style="margin-bottom: 1.5rem;">
                ← Zurück zur Kundenauswahl
            </button>

            <div class="current-customer-info">
                <div class="current-customer-name">${customer.name}</div>
                <div class="current-customer-details">
                    ${customer.company ? customer.company + ' • ' : ''}
                    ${customer.city || ''}
                </div>
            </div>

            <div class="card-title">
                Neues Tor erstellen
            </div>

            <div class="type-grid">
                ${gateTypes.map((type, index) => {
                    const iconKey = ['door', 'wingGate', 'pushGate', 'slidingDoor'][index];
                    return `
                        <div class="type-card" onclick="window.selectGateType('${type}')">
                            ${ICONS[iconKey]}
                            <div class="type-name">${type}</div>
                        </div>
                    `;
                }).join('')}
            </div>

            ${customer.gates.length > 0 ? `
                <div class="saved-gates-section" style="margin-top: 2rem;">
                    <h3 class="section-title">Gespeicherte Tore</h3>
                    <div class="gate-list">
                        ${customer.gates.map(gate => `
                            <div class="gate-card">
                                <div class="gate-header">
                                    <div>
                                        <div class="gate-name">${gate.name || 'Unbenanntes Tor'}</div>
                                        <div class="gate-type">${gate.gateType}</div>
                                    </div>
                                    <div class="gate-actions">
                                        <button class="icon-btn copy"
                                                onclick="window.copyGate('${gate.id}')"
                                                title="Kopieren">
                                            📋
                                        </button>
                                        <button class="icon-btn edit"
                                                onclick="window.editGate('${gate.id}')"
                                                title="Bearbeiten">
                                            ✏️
                                        </button>
                                        <button class="icon-btn delete"
                                                onclick="window.deleteGate('${gate.id}')"
                                                title="Löschen">
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                <div class="gate-details">
                                    <div class="gate-detail">
                                        <span class="detail-label">Breite</span>
                                        <span class="detail-value">${gate.breite} cm</span>
                                    </div>
                                    <div class="gate-detail">
                                        <span class="detail-label">Höhe</span>
                                        <span class="detail-value">${gate.hoehe} cm</span>
                                    </div>
                                    <div class="gate-detail">
                                        <span class="detail-label">Fläche</span>
                                        <span class="detail-value">${gate.gesamtflaeche.toFixed(2)} m²</span>
                                    </div>
                                    <div class="gate-detail">
                                        <span class="detail-label">Aufschlag</span>
                                        <span class="detail-value">${gate.aufschlag}% (${formatPrice(gate.aufschlagBetrag)})</span>
                                    </div>
                                    <div class="gate-detail">
                                        <span class="detail-label">Preis (exkl. MwSt)</span>
                                        <span class="detail-value">${formatPrice(gate.exklusiveMwst)}</span>
                                    </div>
                                    <div class="gate-detail">
                                        <span class="detail-label">Preis (inkl. MwSt)</span>
                                        <span class="detail-value" style="font-weight: 700; color: var(--red-primary);">${formatPrice(gate.inklMwst)}</span>
                                    </div>
                                    ${gate.createdAt ? `
                                        <div class="gate-detail">
                                            <span class="detail-label">Erstellt</span>
                                            <span class="detail-value">${formatDate(gate.createdAt)}</span>
                                        </div>
                                    ` : ''}
                                </div>
                                ${gate.notizen ? `
                                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); font-size: 0.85rem; color: var(--gray-dark);">
                                        <strong>Notizen:</strong> ${gate.notizen}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// ==================== EVENT HANDLERS ====================

/**
 * Back to customers view
 */
window.backToCustomers = function() {
    AppState.goToCustomerSelect();
};

/**
 * Select gate type
 * @param {string} gateType
 */
window.selectGateType = function(gateType) {
    AppState.goToGateConfig(gateType);
};

/**
 * Copy/duplicate existing gate
 * @param {string} gateId
 */
window.copyGate = function(gateId) {
    const customer = AppState.currentCustomer;
    if (!customer) return;

    const gate = customer.getGate(gateId);
    if (!gate) return;

    // Create a copy of the gate data without the ID
    const gateCopy = { ...gate };
    delete gateCopy.id; // Remove ID so a new one is generated
    gateCopy.name = `${gate.name} (Kopie)`;
    gateCopy.createdAt = new Date().toISOString();
    gateCopy.updatedAt = new Date().toISOString();

    // Set as current gate and go to config view
    AppState.setCurrentGate(gateCopy);
    AppState.goToGateConfig(gate.gateType);
};

/**
 * Edit existing gate
 * @param {string} gateId
 */
window.editGate = function(gateId) {
    const customer = AppState.currentCustomer;
    if (!customer) return;

    const gate = customer.getGate(gateId);
    if (!gate) return;

    AppState.setCurrentGate(gate);
    AppState.goToGateConfig(gate.gateType);
};

/**
 * Delete gate
 * @param {string} gateId
 */
window.deleteGate = async function(gateId) {
    if (confirm('Möchten Sie dieses Tor wirklich löschen?')) {
        await AppState.deleteGate(gateId);
    }
};
