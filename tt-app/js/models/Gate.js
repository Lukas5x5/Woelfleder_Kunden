/**
 * Gate Model
 */

export class Gate {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.name = data.name || '';
        this.gateType = data.gateType || '';
        this.notizen = data.notizen || '';
        this.orderId = data.orderId || null;
        this.breite = data.breite || 0;
        this.hoehe = data.hoehe || 0;
        this.glashoehe = data.glashoehe || 0;
        this.gesamtflaeche = data.gesamtflaeche || 0;
        this.glasflaeche = data.glasflaeche || 0;
        this.torflaeche = data.torflaeche || 0;
        this.selectedProducts = data.selectedProducts || [];
        this.productQuantities = data.productQuantities || {};
        this.customPrices = data.customPrices || {};
        this.aufschlag = data.aufschlag || 0;
        this.subtotal = data.subtotal || 0;
        this.aufschlagBetrag = data.aufschlagBetrag || 0;
        this.exklusiveMwst = data.exklusiveMwst || 0;
        this.inklMwst = data.inklMwst || 0;
        this.quantity = data.quantity || 1;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    /**
     * Generate unique ID
     * @returns {string}
     */
    generateId() {
        return `gate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Update gate data
     * @param {Object} data
     */
    update(data) {
        Object.assign(this, data);
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Update dimensions
     * @param {number} breite
     * @param {number} hoehe
     * @param {number} glashoehe
     */
    updateDimensions(breite, hoehe, glashoehe = 0) {
        this.breite = breite;
        this.hoehe = hoehe;
        this.glashoehe = glashoehe;
        this.calculateAreas();
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Calculate areas from dimensions
     */
    calculateAreas() {
        this.gesamtflaeche = (this.breite * this.hoehe) / 10000;
        this.glasflaeche = this.glashoehe > 0 ? (this.breite * this.glashoehe) / 10000 : 0;
        this.torflaeche = this.gesamtflaeche - this.glasflaeche;
    }

    /**
     * Add or update selected product
     * @param {number} productId
     * @param {number} quantity
     * @param {string} sides - 'einseitig' or 'beidseitig' (default: 'einseitig')
     */
    toggleProduct(productId, quantity = 1, sides = 'einseitig') {
        const index = this.selectedProducts.findIndex(p => p.id === productId);

        if (index !== -1) {
            // Product already selected, remove it
            this.selectedProducts.splice(index, 1);
        } else {
            // Add new product
            this.selectedProducts.push({ id: productId, quantity, sides });
        }

        this.updatedAt = new Date().toISOString();
    }

    /**
     * Update product quantity
     * @param {number} productId
     * @param {number} quantity
     */
    updateProductQuantity(productId, quantity) {
        const product = this.selectedProducts.find(p => p.id === productId);
        if (product) {
            product.quantity = quantity;
            this.updatedAt = new Date().toISOString();
        }
    }

    /**
     * Update product sides (einseitig/beidseitig)
     * @param {number} productId
     * @param {string} sides - 'einseitig' or 'beidseitig'
     */
    updateProductSides(productId, sides) {
        const product = this.selectedProducts.find(p => p.id === productId);
        if (product) {
            product.sides = sides;
            this.updatedAt = new Date().toISOString();
        }
    }

    /**
     * Check if product is selected
     * @param {number} productId
     * @returns {boolean}
     */
    isProductSelected(productId) {
        return this.selectedProducts.some(p => p.id === productId);
    }

    /**
     * Get product quantity
     * @param {number} productId
     * @returns {number}
     */
    getProductQuantity(productId) {
        const product = this.selectedProducts.find(p => p.id === productId);
        return product ? product.quantity : 0;
    }

    /**
     * Get product sides setting
     * @param {number} productId
     * @returns {string}
     */
    getProductSides(productId) {
        const product = this.selectedProducts.find(p => p.id === productId);
        return product ? (product.sides || 'einseitig') : 'einseitig';
    }

    /**
     * Update surcharge
     * @param {number} aufschlag
     */
    updateAufschlag(aufschlag) {
        this.aufschlag = aufschlag;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Update calculated totals
     * @param {Object} calculations
     */
    updateCalculations(calculations) {
        this.subtotal = calculations.subtotal || 0;
        this.aufschlagBetrag = calculations.aufschlagBetrag || 0;
        this.exklusiveMwst = calculations.exklusiveMwst || 0;
        this.inklMwst = calculations.inklMwst || 0;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Convert to plain object for storage
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            gateType: this.gateType,
            notizen: this.notizen,
            orderId: this.orderId,
            breite: this.breite,
            hoehe: this.hoehe,
            glashoehe: this.glashoehe,
            gesamtflaeche: this.gesamtflaeche,
            glasflaeche: this.glasflaeche,
            torflaeche: this.torflaeche,
            selectedProducts: this.selectedProducts,
            productQuantities: this.productQuantities,
            customPrices: this.customPrices,
            aufschlag: this.aufschlag,
            subtotal: this.subtotal,
            aufschlagBetrag: this.aufschlagBetrag,
            exklusiveMwst: this.exklusiveMwst,
            inklMwst: this.inklMwst,
            quantity: this.quantity,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Create Gate from plain object
     * @param {Object} data
     * @returns {Gate}
     */
    static fromJSON(data) {
        return new Gate(data);
    }
}
