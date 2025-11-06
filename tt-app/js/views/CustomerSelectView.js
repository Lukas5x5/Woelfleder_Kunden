/**
 * Customer Select View
 */

import AppState from '../state/AppState.js';
import { openModal, closeModal } from '../components/Modal.js';
import { validateCustomer } from '../utils/validator.js';

/**
 * Render customer select view
 * @returns {string}
 */
export function renderCustomerSelectView() {
    const customers = AppState.customers;

    return `
        <div class="card">
            <div class="card-title">Kunde auswählen</div>

            <div class="customer-actions">
                <button class="btn btn-primary" onclick="window.openNewCustomerModal()">
                    + Neuer Kunde
                </button>
            </div>

            ${customers.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-icon">👤</div>
                    <p>Noch keine Kunden vorhanden</p>
                    <p style="font-size: 0.9rem; color: var(--gray-dark); margin-top: 0.5rem;">
                        Erstellen Sie einen neuen Kunden, um zu beginnen.
                    </p>
                </div>
            ` : `
                <div class="customer-grid">
                    ${customers.map(customer => `
                        <div class="customer-card" onclick="window.selectCustomer('${customer.id}')">
                            <div class="customer-header">
                                <div class="customer-name">${customer.name}</div>
                                <button class="icon-btn delete"
                                        onclick="event.stopPropagation(); window.deleteCustomerFromCard('${customer.id}')"
                                        title="Löschen">
                                    🗑️
                                </button>
                            </div>
                            <div class="customer-info">
                                ${customer.company ? `<div>${customer.company}</div>` : ''}
                                ${customer.address ? `<div>${customer.address}</div>` : ''}
                                ${customer.city ? `<div>${customer.city}</div>` : ''}
                                ${customer.phone ? `<div>📞 ${customer.phone}</div>` : ''}
                                ${customer.email ? `<div>📧 ${customer.email}</div>` : ''}
                            </div>
                            ${customer.gates.length > 0 ? `
                                <div class="customer-gates">
                                    ${customer.gates.length} ${customer.gates.length === 1 ? 'Tor' : 'Tore'} gespeichert
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
}

/**
 * Render customer modal content
 * @param {Object} customer - Customer to edit (null for new)
 * @returns {string}
 */
export function renderCustomerModal(customer = null) {
    const isEdit = customer !== null;

    return `
        <form id="customerForm" onsubmit="window.handleCustomerSubmit(event)">
            <div class="form-grid">
                <div class="form-group">
                    <label for="customerName">Name *</label>
                    <input type="text" id="customerName" name="name"
                           value="${customer?.name || ''}" required>
                </div>

                <div class="form-group">
                    <label for="customerCompany">Firma</label>
                    <input type="text" id="customerCompany" name="company"
                           value="${customer?.company || ''}">
                </div>

                <div class="form-group">
                    <label for="customerAddress">Adresse</label>
                    <input type="text" id="customerAddress" name="address"
                           value="${customer?.address || ''}">
                </div>

                <div class="form-group">
                    <label for="customerCity">Stadt</label>
                    <input type="text" id="customerCity" name="city"
                           value="${customer?.city || ''}">
                </div>

                <div class="form-group">
                    <label for="customerPhone">Telefon</label>
                    <input type="tel" id="customerPhone" name="phone"
                           value="${customer?.phone || ''}">
                </div>

                <div class="form-group">
                    <label for="customerEmail">E-Mail</label>
                    <input type="email" id="customerEmail" name="email"
                           value="${customer?.email || ''}">
                </div>
            </div>

            <div class="btn-group">
                <button type="button" class="btn btn-secondary"
                        onclick="window.closeCustomerModal()">
                    Abbrechen
                </button>
                ${isEdit ? `
                    <button type="button" class="btn btn-danger"
                            onclick="window.deleteCustomer('${customer.id}')">
                        Löschen
                    </button>
                ` : ''}
                <button type="submit" class="btn btn-primary">
                    ${isEdit ? 'Aktualisieren' : 'Erstellen'}
                </button>
            </div>
        </form>
    `;
}

// ==================== EVENT HANDLERS ====================

/**
 * Open new customer modal
 */
window.openNewCustomerModal = function() {
    AppState.currentCustomerEdit = null;
    const modalBody = document.getElementById('modalBody');
    const modalTitle = document.querySelector('#customerModal .modal-title');

    modalTitle.textContent = 'Neuer Kunde';
    modalBody.innerHTML = renderCustomerModal();
    openModal('customerModal');
};

/**
 * Open edit customer modal
 * @param {string} customerId
 */
window.openEditCustomerModal = function(customerId) {
    const customer = AppState.getCustomer(customerId);
    if (!customer) return;

    AppState.currentCustomerEdit = customer;
    const modalBody = document.getElementById('modalBody');
    const modalTitle = document.querySelector('#customerModal .modal-title');

    modalTitle.textContent = 'Kunde bearbeiten';
    modalBody.innerHTML = renderCustomerModal(customer);
    openModal('customerModal');
};

/**
 * Close customer modal
 */
window.closeCustomerModal = function() {
    closeModal('customerModal');
    AppState.currentCustomerEdit = null;
};

/**
 * Handle customer form submit
 * @param {Event} event
 */
window.handleCustomerSubmit = function(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const customerData = {
        name: formData.get('name'),
        company: formData.get('company'),
        address: formData.get('address'),
        city: formData.get('city'),
        phone: formData.get('phone'),
        email: formData.get('email')
    };

    // Validate
    const validation = validateCustomer(customerData);
    if (!validation.valid) {
        alert(validation.errors.join('\n'));
        return;
    }

    // Save
    if (AppState.currentCustomerEdit) {
        AppState.updateCustomer(AppState.currentCustomerEdit.id, customerData);
    } else {
        AppState.addCustomer(customerData);
    }

    closeModal('customerModal');
};

/**
 * Select customer
 * @param {string} customerId
 */
window.selectCustomer = async function(customerId) {
    AppState.setCurrentCustomer(customerId);
    await AppState.goToTypeSelect();
};

/**
 * Delete customer (from modal)
 * @param {string} customerId
 */
window.deleteCustomer = function(customerId) {
    if (confirm('Möchten Sie diesen Kunden wirklich löschen?')) {
        AppState.deleteCustomer(customerId);
        closeModal('customerModal');
    }
};

/**
 * Delete customer (from card)
 * @param {string} customerId
 */
window.deleteCustomerFromCard = function(customerId) {
    const customer = AppState.getCustomer(customerId);
    if (!customer) return;

    const gateCount = customer.gates.length;
    const confirmMessage = gateCount > 0
        ? `Möchten Sie den Kunden "${customer.name}" wirklich löschen?\n\nEs ${gateCount === 1 ? 'ist 1 Tor' : `sind ${gateCount} Tore`} gespeichert, ${gateCount === 1 ? 'das' : 'die'} ebenfalls gelöscht ${gateCount === 1 ? 'wird' : 'werden'}.`
        : `Möchten Sie den Kunden "${customer.name}" wirklich löschen?`;

    if (confirm(confirmMessage)) {
        AppState.deleteCustomer(customerId);
    }
};
