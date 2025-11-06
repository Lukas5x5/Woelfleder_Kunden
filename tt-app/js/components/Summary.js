/**
 * Summary Component
 */

import { formatPrice, formatArea } from '../utils/formatter.js';

/**
 * Render summary sidebar
 * @param {Object} gate
 * @param {Object} calculations
 * @returns {string}
 */
export function renderSummary(gate, calculations) {
    if (!gate || !calculations) {
        return `
            <div class="summary">
                <div class="summary-title">Zusammenfassung</div>
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <p>Noch keine Daten eingegeben</p>
                </div>
            </div>
        `;
    }

    const { torflaeche, glasflaeche, subtotal, aufschlagBetrag, exklusiveMwst, inklMwst, products } = calculations;

    return `
        <div class="summary">
            <div class="summary-title">Zusammenfassung</div>

            <div class="summary-row">
                <span>Torfläche:</span>
                <span class="summary-value">${formatArea(torflaeche)}</span>
            </div>

            ${glasflaeche > 0 ? `
                <div class="summary-row">
                    <span>Glasfläche:</span>
                    <span class="summary-value">${formatArea(glasflaeche)}</span>
                </div>
            ` : ''}

            <div class="summary-row">
                <span>Gesamtfläche:</span>
                <span class="summary-value">${formatArea(torflaeche + glasflaeche)}</span>
            </div>

            ${products && products.length > 0 ? `
                <div class="summary-products">
                    <div style="font-weight: 600; margin-bottom: 0.8rem;">Produkte:</div>
                    ${products.map(p => `
                        <div class="summary-product">
                            <div style="font-weight: 500; margin-bottom: 0.3rem;">${p.name}</div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
                                <span>${p.quantity}x ${formatPrice(p.price)}/${p.unit}</span>
                                <span>${formatPrice(p.amount)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <div class="summary-row">
                <span>Zwischensumme:</span>
                <span class="summary-value">${formatPrice(subtotal)}</span>
            </div>

            ${gate.aufschlag > 0 ? `
                <div class="summary-row">
                    <span>Aufschlag (${gate.aufschlag}%):</span>
                    <span class="summary-value">${formatPrice(aufschlagBetrag)}</span>
                </div>
            ` : ''}

            <div class="summary-row">
                <span>Exkl. MwSt:</span>
                <span class="summary-value">${formatPrice(exklusiveMwst)}</span>
            </div>

            <div class="summary-total">
                <div class="summary-row" style="border: none;">
                    <span>Inkl. MwSt (20%):</span>
                    <span class="summary-value">${formatPrice(inklMwst)}</span>
                </div>
            </div>
        </div>
    `;
}
