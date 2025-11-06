/**
 * Gate Config View
 */

import AppState from '../state/AppState.js';
import { TABS } from '../config/constants.js';
import { productsByCategory, generalAccessories } from '../data/products.js';
import CalculationService from '../services/CalculationService.js';
import { renderSummary } from '../components/Summary.js';
import { openModal, closeModal } from '../components/Modal.js';
import { formatPrice } from '../utils/formatter.js';

/**
 * Render gate config view
 * @returns {string}
 */
export function renderGateConfigView() {
    const customer = AppState.currentCustomer;
    const gate = AppState.currentGate;

    if (!customer || !gate) {
        AppState.goToCustomerSelect();
        return '';
    }

    const categoryData = productsByCategory[gate.gateType];
    if (!categoryData) {
        console.error('Invalid gate type:', gate.gateType);
        AppState.goToTypeSelect();
        return '';
    }

    // Calculate current totals
    const allProducts = [...categoryData.main, ...categoryData.accessories, ...generalAccessories];
    const calculations = CalculationService.calculateTotal(gate, allProducts, categoryData.main);

    return `
        <div class="layout-grid">
            <div>
                <button class="btn btn-secondary" onclick="window.backToTypeSelect()"
                        style="margin-bottom: 1.5rem;">
                    ← Zurück zur Auswahl
                </button>

                <div class="config-header">
                    <div class="config-customer-name">${customer.name}</div>
                    <div class="config-gate-type">${gate.gateType}</div>
                </div>

                <div class="card">
                    <div class="card-title">Maße eingeben</div>

                    <div class="form-grid">
                        <div class="form-group">
                            <label for="breite">Breite (cm) *</label>
                            <div class="input-with-unit">
                                <input type="number" id="breite" value="${gate.breite || ''}"
                                       min="0" step="1" oninput="window.updateDimensions()">
                                <span class="input-unit">cm</span>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="hoehe">Höhe (cm) *</label>
                            <div class="input-with-unit">
                                <input type="number" id="hoehe" value="${gate.hoehe || ''}"
                                       min="0" step="1" oninput="window.updateDimensions()">
                                <span class="input-unit">cm</span>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="glashoehe">Glashöhe (cm)</label>
                            <div class="input-with-unit">
                                <input type="number" id="glashoehe" value="${gate.glashoehe || ''}"
                                       min="0" step="1" oninput="window.updateDimensions()">
                                <span class="input-unit">cm</span>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="aufschlag">Aufschlag (%)</label>
                            <div class="input-with-unit">
                                <input type="number" id="aufschlag" value="${gate.aufschlag || 0}"
                                       min="0" max="100" step="0.1" oninput="window.updateAufschlag()">
                                <span class="input-unit">%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="tabs-container">
                    <div class="tab-nav">
                        <button class="tab-btn ${AppState.activeTab === TABS.MAIN ? 'active' : ''}"
                                onclick="window.switchTab('${TABS.MAIN}')">
                            Hauptprodukte
                        </button>
                        <button class="tab-btn ${AppState.activeTab === TABS.ACCESSORIES ? 'active' : ''}"
                                onclick="window.switchTab('${TABS.ACCESSORIES}')">
                            Zubehör
                        </button>
                        <button class="tab-btn ${AppState.activeTab === TABS.GENERAL ? 'active' : ''}"
                                onclick="window.switchTab('${TABS.GENERAL}')">
                            Allg. Zubehör
                        </button>
                    </div>

                    ${renderProductTab(gate, AppState.activeTab, categoryData)}
                </div>

                <div class="btn-group">
                    <button class="btn btn-secondary" onclick="window.backToTypeSelect()">
                        Abbrechen
                    </button>
                    <button class="btn btn-primary" onclick="window.saveGate()"
                            ${!gate.breite || !gate.hoehe ? 'disabled' : ''}>
                        Tor speichern
                    </button>
                </div>
            </div>

            <div id="summary-container">
                ${renderSummary(gate, calculations)}
            </div>
        </div>
    `;
}

/**
 * Render product tab content
 * @param {Object} gate
 * @param {string} activeTab
 * @param {Object} categoryData
 * @returns {string}
 */
function renderProductTab(gate, activeTab, categoryData) {
    let products = [];

    switch (activeTab) {
        case TABS.MAIN:
            products = categoryData.main;
            break;
        case TABS.ACCESSORIES:
            products = categoryData.accessories;
            break;
        case TABS.GENERAL:
            products = generalAccessories;
            break;
    }

    if (products.length === 0) {
        return `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <p>Keine Produkte in dieser Kategorie</p>
            </div>
        `;
    }

    return `
        <div class="product-section">
            <div class="product-list">
                ${products.map(product => {
                    const isSelected = gate.isProductSelected(product.id);
                    const quantity = gate.getProductQuantity(product.id);
                    const sides = gate.getProductSides(product.id);
                    const isGeneralAccessory = activeTab === TABS.GENERAL;

                    // Determine input step based on product type
                    const nameLower = product.name.toLowerCase();
                    const isCutToSize = nameLower.includes('zugeschnitten');
                    const isWholePlates = nameLower.includes('in ganzen platten');
                    const inputStep = (isCutToSize || isWholePlates) ? (isCutToSize ? '0.01' : '1') : '1';
                    const inputMin = (isCutToSize || isWholePlates) ? '0.01' : '1';
                    const inputLabel = (isCutToSize || isWholePlates) ? (isCutToSize ? 'm²' : 'Stk') : '';

                    return `
                        <div class="product-item ${isSelected ? 'selected' : ''}"
                             id="product-${product.id}"
                             onclick="window.toggleProduct(${product.id})">
                            <div class="product-name">${product.name}</div>
                            <div class="product-price">${formatPrice(product.price)}/${product.unit}</div>
                            ${isSelected ? `
                                <div class="product-controls" onclick="event.stopPropagation()">
                                    <input type="number" class="quantity-input"
                                           value="${quantity}"
                                           min="${inputMin}" step="${inputStep}"
                                           placeholder="${inputLabel}"
                                           oninput="window.updateQuantity(${product.id}, this.value)">
                                    ${isGeneralAccessory ? `
                                        <select class="sides-select"
                                                onchange="window.updateSides(${product.id}, this.value)">
                                            <option value="einseitig" ${sides === 'einseitig' ? 'selected' : ''}>Einseitig</option>
                                            <option value="beidseitig" ${sides === 'beidseitig' ? 'selected' : ''}>Beidseitig</option>
                                        </select>
                                    ` : ''}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

/**
 * Render only summary (for quick updates)
 */
function updateSummaryOnly() {
    const gate = AppState.currentGate;
    if (!gate) return;

    const categoryData = productsByCategory[gate.gateType];
    const allProducts = [...categoryData.main, ...categoryData.accessories, ...generalAccessories];
    const calculations = CalculationService.calculateTotal(gate, allProducts, categoryData.main);

    const summaryContainer = document.getElementById('summary-container');
    if (summaryContainer) {
        summaryContainer.innerHTML = renderSummary(gate, calculations);
    }

    // Update gate calculations
    gate.updateCalculations(calculations);
}

// ==================== EVENT HANDLERS ====================

/**
 * Back to type select
 */
window.backToTypeSelect = async function() {
    if (confirm('Möchten Sie wirklich zurück? Nicht gespeicherte Änderungen gehen verloren.')) {
        AppState.clearCurrentGate();
        await AppState.goToTypeSelect();
    }
};

/**
 * Switch tab
 * @param {string} tab
 */
window.switchTab = function(tab) {
    AppState.setActiveTab(tab);
};

// Debounce timer for auto product selection
let autoProductSelectionTimer = null;

/**
 * Update dimensions
 */
window.updateDimensions = function() {
    const breite = parseFloat(document.getElementById('breite').value) || 0;
    const hoehe = parseFloat(document.getElementById('hoehe').value) || 0;
    const glashoehe = parseFloat(document.getElementById('glashoehe').value) || 0;

    const gate = AppState.currentGate;
    if (!gate) return;

    const oldArea = gate.gesamtflaeche;
    gate.updateDimensions(breite, hoehe, glashoehe);

    // Always update summary immediately for instant feedback
    updateSummaryOnly();

    // Debounce auto product selection to avoid interrupting user input
    if (Math.abs(gate.gesamtflaeche - oldArea) > 0.1) {
        // Clear previous timer
        if (autoProductSelectionTimer) {
            clearTimeout(autoProductSelectionTimer);
        }

        // Wait 800ms after user stops typing before auto-selecting product
        autoProductSelectionTimer = setTimeout(() => {
            const categoryData = productsByCategory[gate.gateType];
            const autoProductId = CalculationService.autoSelectMainProduct(
                gate.gateType,
                gate.gesamtflaeche,
                categoryData.main
            );

            if (autoProductId && !gate.isProductSelected(autoProductId)) {
                // Save current tab
                const currentTab = AppState.activeTab;

                // Remove other main products
                categoryData.main.forEach(p => {
                    if (gate.isProductSelected(p.id)) {
                        gate.toggleProduct(p.id);
                    }
                });
                // Add new main product
                gate.toggleProduct(autoProductId, 1);

                // Ensure active tab stays the same
                AppState.activeTab = currentTab;

                // Re-render view to show new selection
                AppState.notify();
            }
        }, 800);
    }
};

/**
 * Update aufschlag
 */
window.updateAufschlag = function() {
    const aufschlag = parseFloat(document.getElementById('aufschlag').value) || 0;
    const gate = AppState.currentGate;

    if (gate) {
        gate.updateAufschlag(aufschlag);
        updateSummaryOnly();
    }
};

/**
 * Toggle product selection
 * @param {number} productId
 */
window.toggleProduct = function(productId) {
    const gate = AppState.currentGate;
    if (!gate) return;

    gate.toggleProduct(productId, 1);
    updateSummaryOnly();

    // Highlight the product
    const productEl = document.getElementById(`product-${productId}`);
    if (productEl) {
        productEl.style.animation = 'highlight-pulse 1s ease-out';
        setTimeout(() => {
            productEl.style.animation = '';
        }, 1000);
    }

    // Re-render to show/hide quantity input
    AppState.notify();
};

/**
 * Update product quantity
 * @param {number} productId
 * @param {string|number} value
 */
window.updateQuantity = function(productId, value) {
    const quantity = Math.max(1, parseInt(value) || 1);
    const gate = AppState.currentGate;

    if (gate) {
        gate.updateProductQuantity(productId, quantity);
        updateSummaryOnly();
    }
};

/**
 * Update product sides (einseitig/beidseitig)
 * @param {number} productId
 * @param {string} sides
 */
window.updateSides = function(productId, sides) {
    const gate = AppState.currentGate;

    if (gate) {
        gate.updateProductSides(productId, sides);
        updateSummaryOnly();
    }
};

/**
 * Save gate
 */
window.saveGate = function() {
    const gate = AppState.currentGate;
    const customer = AppState.currentCustomer;

    if (!gate || !customer) return;

    if (!gate.breite || !gate.hoehe) {
        alert('Bitte geben Sie Breite und Höhe ein.');
        return;
    }

    if (gate.selectedProducts.length === 0) {
        alert('Bitte wählen Sie mindestens ein Produkt aus.');
        return;
    }

    // IMPORTANT: Recalculate totals before saving to ensure all pricing fields are up-to-date
    const categoryData = productsByCategory[gate.gateType];
    const allProducts = [...categoryData.main, ...categoryData.accessories, ...generalAccessories];
    const calculations = CalculationService.calculateTotal(gate, allProducts, categoryData.main);
    gate.updateCalculations(calculations);

    console.log('💾 Saving gate with calculations:', {
        subtotal: calculations.subtotal,
        aufschlagBetrag: calculations.aufschlagBetrag,
        exklusiveMwst: calculations.exklusiveMwst,
        inklMwst: calculations.inklMwst
    });

    // Show save modal
    openSaveGateModal();
};

/**
 * Generate product notes from selected products
 * @param {Gate} gate
 * @returns {string}
 */
function generateProductNotes(gate) {
    const categoryData = productsByCategory[gate.gateType];
    const allProducts = [...categoryData.main, ...categoryData.accessories, ...generalAccessories];

    // Organize selected products by category
    const mainProducts = [];
    const accessories = [];
    const generalAcc = [];

    gate.selectedProducts.forEach(selected => {
        const product = allProducts.find(p => p.id === selected.id);
        if (!product) return;

        const quantity = selected.quantity || 1;
        const sides = selected.sides || 'einseitig';

        // Check if this is a general accessory and add sides info
        const isGeneralAccessory = generalAccessories.some(p => p.id === product.id);
        const sidesInfo = (isGeneralAccessory && sides === 'beidseitig') ? ' (beidseitig)' : '';

        const productLine = `- ${product.name} x ${quantity}${sidesInfo}`;

        if (categoryData.main.some(p => p.id === product.id)) {
            mainProducts.push(productLine);
        } else if (categoryData.accessories.some(p => p.id === product.id)) {
            accessories.push(productLine);
        } else if (isGeneralAccessory) {
            generalAcc.push(productLine);
        }
    });

    // Build notes text
    let notes = '';

    if (mainProducts.length > 0) {
        notes += 'Hauptprodukte:\n' + mainProducts.join('\n') + '\n\n';
    }

    if (accessories.length > 0) {
        notes += 'Zubehör:\n' + accessories.join('\n') + '\n\n';
    }

    if (generalAcc.length > 0) {
        notes += 'Allg. Zubehör:\n' + generalAcc.join('\n') + '\n\n';
    }

    return notes.trim();
}

/**
 * Open save gate modal
 */
function openSaveGateModal() {
    const gate = AppState.currentGate;
    const modalBody = document.getElementById('gateModalBody');
    const modalTitle = document.querySelector('#gateModal .modal-title');

    // Generate product notes if not already set
    const productNotes = gate.notizen || generateProductNotes(gate);

    modalTitle.textContent = 'Tor speichern';
    modalBody.innerHTML = `
        <form id="gateForm" onsubmit="window.handleGateSave(event)">
            <div class="form-group" style="margin-bottom: 1rem;">
                <label for="gateName">Bezeichnung *</label>
                <input type="text" id="gateName" name="name"
                       value="${gate.name || ''}" required
                       placeholder="z.B. Haupteingang, Garage, ...">
            </div>

            <div class="form-group" style="margin-bottom: 1.5rem;">
                <label for="gateNotizen">Notizen</label>
                <textarea id="gateNotizen" name="notizen" rows="8"
                          placeholder="Zusätzliche Informationen...">${productNotes}</textarea>
            </div>

            <div class="btn-group">
                <button type="button" class="btn btn-secondary"
                        onclick="window.closeGateModal()">
                    Abbrechen
                </button>
                <button type="submit" class="btn btn-primary">
                    Speichern
                </button>
            </div>
        </form>
    `;

    openModal('gateModal');
}

/**
 * Handle gate save
 * @param {Event} event
 */
window.handleGateSave = async function(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const gate = AppState.currentGate;

    if (!gate) return;

    gate.name = formData.get('name');
    gate.notizen = formData.get('notizen');

    // Check if editing existing gate
    if (gate.id && AppState.currentCustomer.getGate(gate.id)) {
        // Update existing
        await AppState.updateGate(gate.id, gate.toJSON());
    } else {
        // Add new
        await AppState.addGate(gate.toJSON());
    }

    closeModal('gateModal');
    AppState.clearCurrentGate();
    await AppState.goToTypeSelect();
};

/**
 * Close gate modal
 */
window.closeGateModal = function() {
    closeModal('gateModal');
};
