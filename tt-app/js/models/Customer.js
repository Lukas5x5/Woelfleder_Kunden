/**
 * Customer Model
 */

export class Customer {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.name = data.name || '';
        this.company = data.company || '';
        this.address = data.address || '';
        this.city = data.city || '';
        this.phone = data.phone || '';
        this.email = data.email || '';
        this.gates = data.gates || [];
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    /**
     * Generate unique ID
     * @returns {string}
     */
    generateId() {
        return `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Update customer data
     * @param {Object} data
     */
    update(data) {
        Object.assign(this, data);
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Add gate to customer
     * @param {Gate} gate
     */
    addGate(gate) {
        this.gates.push(gate);
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Remove gate from customer
     * @param {string} gateId
     * @returns {boolean}
     */
    removeGate(gateId) {
        const index = this.gates.findIndex(g => g.id === gateId);
        if (index !== -1) {
            this.gates.splice(index, 1);
            this.updatedAt = new Date().toISOString();
            return true;
        }
        return false;
    }

    /**
     * Update existing gate
     * @param {string} gateId
     * @param {Object} gateData
     * @returns {boolean}
     */
    updateGate(gateId, gateData) {
        const gate = this.gates.find(g => g.id === gateId);
        if (gate) {
            Object.assign(gate, gateData);
            gate.updatedAt = new Date().toISOString();
            this.updatedAt = new Date().toISOString();
            return true;
        }
        return false;
    }

    /**
     * Get gate by ID
     * @param {string} gateId
     * @returns {Gate|null}
     */
    getGate(gateId) {
        return this.gates.find(g => g.id === gateId) || null;
    }

    /**
     * Get total number of gates
     * @returns {number}
     */
    getGateCount() {
        return this.gates.length;
    }

    /**
     * Convert to plain object for storage
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            company: this.company,
            address: this.address,
            city: this.city,
            phone: this.phone,
            email: this.email,
            gates: this.gates,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Create Customer from plain object
     * @param {Object} data
     * @returns {Customer}
     */
    static fromJSON(data) {
        return new Customer(data);
    }
}
