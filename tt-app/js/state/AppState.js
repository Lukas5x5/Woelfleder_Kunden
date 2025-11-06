/**
 * Application State Management
 */

import { Customer } from '../models/Customer.js';
import { Gate } from '../models/Gate.js';
import { VIEWS, TABS } from '../config/constants.js';
import StorageService from '../services/StorageService.js';
import SupabaseStorageService from '../services/SupabaseStorageService.js';

class AppState {
    constructor() {
        this.customers = [];
        this.currentCustomer = null;
        this.currentCustomerEdit = null;
        this.currentGate = null;
        this.view = VIEWS.CUSTOMER_SELECT;
        this.activeTab = TABS.MAIN;
        this.showAllProducts = false;
        this.listeners = [];
        this.isInitialized = false;

        // Don't call init() here - it will be called from app.js after Supabase is ready
    }

    /**
     * Initialize app and load data
     */
    async init() {
        if (this.isInitialized) {
            console.log('ℹ️ AppState already initialized');
            return;
        }

        console.log('⏳ Initializing AppState...');
        await SupabaseStorageService.init();
        await this.loadFromStorage();
        this.isInitialized = true;
        console.log('✅ AppState initialized');
        this.notify();
    }

    /**
     * Load data from Supabase storage
     */
    async loadFromStorage() {
        const data = await SupabaseStorageService.loadCustomers();
        this.customers = data.map(c => Customer.fromJSON(c));
        console.log(`✅ ${this.customers.length} customers loaded from Supabase`);
    }

    /**
     * Save data to storage
     */
    saveToStorage() {
        const data = this.customers.map(c => c.toJSON());
        return StorageService.saveCustomers(data);
    }

    /**
     * Subscribe to state changes
     * @param {Function} callback
     * @returns {Function} unsubscribe function
     */
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    /**
     * Notify all listeners of state change
     */
    notify() {
        this.listeners.forEach(callback => callback(this));
    }

    // ==================== CUSTOMER METHODS ====================

    /**
     * Add new customer
     * @param {Object} customerData
     * @returns {Customer}
     */
    addCustomer(customerData) {
        const customer = new Customer(customerData);
        this.customers.push(customer);
        this.saveToStorage();
        this.notify();
        return customer;
    }

    /**
     * Update customer
     * @param {string} customerId
     * @param {Object} customerData
     * @returns {boolean}
     */
    updateCustomer(customerId, customerData) {
        const customer = this.customers.find(c => c.id === customerId);
        if (customer) {
            customer.update(customerData);
            this.saveToStorage();
            this.notify();
            return true;
        }
        return false;
    }

    /**
     * Delete customer
     * @param {string} customerId
     * @returns {boolean}
     */
    deleteCustomer(customerId) {
        const index = this.customers.findIndex(c => c.id === customerId);
        if (index !== -1) {
            this.customers.splice(index, 1);
            if (this.currentCustomer?.id === customerId) {
                this.currentCustomer = null;
                this.view = VIEWS.CUSTOMER_SELECT;
            }
            this.saveToStorage();
            this.notify();
            return true;
        }
        return false;
    }

    /**
     * Get customer by ID
     * @param {string} customerId
     * @returns {Customer|null}
     */
    getCustomer(customerId) {
        return this.customers.find(c => c.id === customerId) || null;
    }

    /**
     * Set current customer
     * @param {string} customerId
     */
    setCurrentCustomer(customerId) {
        this.currentCustomer = this.getCustomer(customerId);
        this.notify();
    }

    // ==================== GATE METHODS ====================

    /**
     * Add gate to current customer
     * @param {Object} gateData
     * @returns {Promise<Gate>}
     */
    async addGate(gateData) {
        if (!this.currentCustomer) return null;

        const gate = new Gate(gateData);

        // Save to Supabase
        const savedGate = await SupabaseStorageService.saveGate(this.currentCustomer.id, gate.toJSON());

        if (savedGate) {
            // Update local state
            this.currentCustomer.addGate(gate.toJSON());
            this.notify();
            console.log('✅ Gate saved to Supabase');
        }

        return gate;
    }

    /**
     * Update gate
     * @param {string} gateId
     * @param {Object} gateData
     * @returns {Promise<boolean>}
     */
    async updateGate(gateId, gateData) {
        if (!this.currentCustomer) return false;

        const success = await SupabaseStorageService.updateGate(gateId, gateData);

        if (success) {
            this.currentCustomer.updateGate(gateId, gateData);
            this.notify();
            console.log('✅ Gate updated in Supabase');
        }

        return success;
    }

    /**
     * Delete gate
     * @param {string} gateId
     * @returns {Promise<boolean>}
     */
    async deleteGate(gateId) {
        if (!this.currentCustomer) return false;

        const success = await SupabaseStorageService.deleteGate(gateId);

        if (success) {
            this.currentCustomer.removeGate(gateId);
            this.notify();
            console.log('✅ Gate deleted from Supabase');
        }

        return success;
    }

    /**
     * Set current gate for editing
     * @param {Object} gateData
     */
    setCurrentGate(gateData) {
        this.currentGate = new Gate(gateData);
        this.notify();
    }

    /**
     * Clear current gate
     */
    clearCurrentGate() {
        this.currentGate = null;
        this.notify();
    }

    // ==================== VIEW METHODS ====================

    /**
     * Change current view
     * @param {string} view
     */
    setView(view) {
        this.view = view;
        this.notify();
    }

    /**
     * Go to customer select view
     */
    async goToCustomerSelect() {
        // Reload customers from storage to ensure fresh data
        await this.loadFromStorage();
        this.view = VIEWS.CUSTOMER_SELECT;
        this.currentCustomer = null;
        this.currentGate = null;
        this.notify();
    }

    /**
     * Go to type select view
     */
    async goToTypeSelect() {
        // Reload data from storage to ensure fresh gate list
        await this.loadFromStorage();
        // Re-set current customer to get updated reference
        if (this.currentCustomer) {
            const customerId = this.currentCustomer.id;
            this.currentCustomer = this.customers.find(c => c.id === customerId);
        }
        this.view = VIEWS.TYPE_SELECT;
        this.currentGate = null;
        this.notify();
    }

    /**
     * Go to gate config view
     * @param {string} gateType
     */
    goToGateConfig(gateType) {
        this.view = VIEWS.GATE_CONFIG;

        // Create new gate if none exists
        if (!this.currentGate) {
            this.currentGate = new Gate({ gateType });
        } else {
            this.currentGate.gateType = gateType;
        }

        this.notify();
    }

    // ==================== TAB METHODS ====================

    /**
     * Set active tab
     * @param {string} tab
     */
    setActiveTab(tab) {
        this.activeTab = tab;
        this.notify();
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Toggle show all products
     */
    toggleShowAllProducts() {
        this.showAllProducts = !this.showAllProducts;
        this.notify();
    }

    /**
     * Export all data
     */
    exportData() {
        const data = this.customers.map(c => c.toJSON());
        StorageService.exportData(data);
    }

    /**
     * Import data
     * @param {File} file
     */
    async importData(file) {
        try {
            const data = await StorageService.importData(file);
            this.customers = data.map(c => Customer.fromJSON(c));
            this.saveToStorage();
            this.notify();
            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }

    /**
     * Get state snapshot
     * @returns {Object}
     */
    getState() {
        return {
            customers: this.customers,
            currentCustomer: this.currentCustomer,
            currentGate: this.currentGate,
            view: this.view,
            activeTab: this.activeTab,
            showAllProducts: this.showAllProducts
        };
    }
}

// Create singleton instance
export default new AppState();
