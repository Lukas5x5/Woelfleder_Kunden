/**
 * Calculation Service
 * Handles all price and area calculations
 */

import { VAT_RATE } from '../config/constants.js';

class CalculationService {
    /**
     * Calculate areas from dimensions
     * @param {number} breite - Width in cm
     * @param {number} hoehe - Height in cm
     * @param {number} glashoehe - Glass height in cm
     * @returns {Object}
     */
    calculateAreas(breite, hoehe, glashoehe = 0) {
        const gesamtflaeche = (breite * hoehe) / 10000; // Convert cm² to m²
        const glasflaeche = glashoehe > 0 ? (breite * glashoehe) / 10000 : 0;
        const torflaeche = gesamtflaeche - glasflaeche;

        return {
            gesamtflaeche: Math.max(0, gesamtflaeche),
            glasflaeche: Math.max(0, glasflaeche),
            torflaeche: Math.max(0, torflaeche)
        };
    }

    /**
     * Check if product is glass-related (uses glasflaeche)
     * @param {Object} product
     * @returns {boolean}
     */
    isGlassProduct(product) {
        const nameLower = product.name.toLowerCase();
        return nameLower.includes('verglasung');
    }

    /**
     * Check if product is "Minderpreis einwandige Füllung"
     * @param {Object} product
     * @returns {boolean}
     */
    isMinderpreisProduct(product) {
        const nameLower = product.name.toLowerCase();
        return nameLower.includes('minderpreis') && nameLower.includes('einwandige');
    }

    /**
     * Check if product is "in ganzen Platten" (whole plates)
     * @param {Object} product
     * @returns {boolean}
     */
    isWholePlatesProduct(product) {
        const nameLower = product.name.toLowerCase();
        return nameLower.includes('in ganzen platten');
    }

    /**
     * Check if product is "zugeschnitten" (cut to size)
     * @param {Object} product
     * @returns {boolean}
     */
    isCutToSizeProduct(product) {
        const nameLower = product.name.toLowerCase();
        return nameLower.includes('zugeschnitten');
    }

    /**
     * Calculate total price for gate
     * @param {Object} gate
     * @param {Array} products - All available products
     * @param {Array} mainProducts - Main products for this gate type (optional)
     * @returns {Object}
     */
    calculateTotal(gate, products, mainProducts = []) {
        const { gesamtflaeche, torflaeche, glasflaeche } = this.calculateAreas(
            gate.breite,
            gate.hoehe,
            gate.glashoehe
        );

        let subtotal = 0;
        const selectedProductsDetails = [];

        // Calculate price for each selected product
        gate.selectedProducts.forEach(selected => {
            const product = products.find(p => p.id === selected.id);
            if (!product) return;

            let amount = 0;
            let quantity = selected.quantity || 1;
            const sides = selected.sides || 'einseitig';

            // Apply sides multiplier: beidseitig doubles quantity, but NOT for Verglasung
            const sidesMultiplier = (sides === 'beidseitig' && !this.isGlassProduct(product)) ? 2 : 1;
            const effectiveQuantity = quantity * sidesMultiplier;

            if (product.unit === 'm²') {
                // Special handling for "ganze Platten" (whole plates) and "zugeschnitten" (cut to size)
                if (this.isWholePlatesProduct(product)) {
                    // Whole plates: quantity is number of plates, price is per m²
                    // Calculation: price × quantity (no area multiplication)
                    amount = product.price * effectiveQuantity;
                } else if (this.isCutToSizeProduct(product)) {
                    // Cut to size: quantity is m² area entered by user
                    // Calculation: price × m² (effectiveQuantity is already the m²)
                    amount = product.price * effectiveQuantity;
                } else {
                    // Standard m² products: calculate based on gate area
                    // Determine which area to use:
                    // 1. Products with "Verglasung" in name: use glasflaeche
                    // 2. Hauptprodukte (main products): ALWAYS use gesamtflaeche
                    // 3. Minderpreis einwandige Füllung: use torflaeche (without glass)
                    // 4. All other m² products with glass: use torflaeche
                    let area;
                    const isMainProduct = mainProducts.some(p => p.id === product.id);

                    if (this.isGlassProduct(product)) {
                        // Verglasung uses glasflaeche
                        area = glasflaeche;
                    } else if (isMainProduct) {
                        // Hauptprodukte ALWAYS use gesamtflaeche (full area)
                        area = gesamtflaeche;
                    } else if (this.isMinderpreisProduct(product)) {
                        // Minderpreis einwandige Füllung uses torflaeche
                        area = torflaeche;
                    } else if (gate.glashoehe > 0) {
                        // If glass height is set, use torflaeche (area without glass)
                        area = torflaeche;
                    } else {
                        // No glass: use gesamtflaeche
                        area = gesamtflaeche;
                    }
                    amount = product.price * area * effectiveQuantity;
                }
            } else {
                // For piece-based or linear meter products
                amount = product.price * effectiveQuantity;
            }

            subtotal += amount;

            selectedProductsDetails.push({
                ...product,
                quantity: effectiveQuantity,
                amount
            });
        });

        // Calculate surcharge
        const aufschlagBetrag = subtotal * (gate.aufschlag / 100);
        const exklusiveMwst = subtotal + aufschlagBetrag;
        const inklMwst = exklusiveMwst * (1 + VAT_RATE);

        return {
            torflaeche,
            glasflaeche,
            subtotal,
            aufschlagBetrag,
            exklusiveMwst,
            inklMwst,
            products: selectedProductsDetails
        };
    }

    /**
     * Auto-select main product based on area
     * @param {string} gateType
     * @param {number} area - Total area in m²
     * @param {Array} mainProducts
     * @returns {number|null} Product ID
     */
    autoSelectMainProduct(gateType, area, mainProducts) {
        switch (gateType) {
            case 'Türen':
                // Auto-select first door product
                return mainProducts[0]?.id || null;

            case 'Flügeltore und Falttore':
                // Select based on area thresholds
                if (area <= 4) return mainProducts.find(p => p.name.includes('bis 4'))?.id;
                if (area <= 7) return mainProducts.find(p => p.name.includes('bis 7'))?.id;
                if (area <= 11) return mainProducts.find(p => p.name.includes('bis 11'))?.id;
                if (area <= 15) return mainProducts.find(p => p.name.includes('bis 15'))?.id;
                if (area <= 20) return mainProducts.find(p => p.name.includes('bis 20'))?.id;
                return mainProducts.find(p => p.name.includes('über 20'))?.id;

            case 'Schubtore':
                // Select based on area thresholds
                if (area <= 3) return mainProducts.find(p => p.name.includes('bis 3'))?.id;
                if (area <= 4) return mainProducts.find(p => p.name.includes('bis 4'))?.id;
                if (area <= 7) return mainProducts.find(p => p.name.includes('bis 7'))?.id;
                if (area <= 11) return mainProducts.find(p => p.name.includes('bis 11'))?.id;
                if (area <= 15) return mainProducts.find(p => p.name.includes('bis 15'))?.id;
                if (area <= 20) return mainProducts.find(p => p.name.includes('bis 20'))?.id;
                return mainProducts.find(p => p.name.includes('über 20'))?.id;

            case 'Schiebetüren':
                // Auto-select Betoplan
                return mainProducts.find(p => p.name.includes('Betoplan'))?.id;

            default:
                return null;
        }
    }

    /**
     * Calculate discount
     * @param {number} total
     * @param {number} discountPercent
     * @returns {Object}
     */
    calculateDiscount(total, discountPercent) {
        const discountAmount = total * (discountPercent / 100);
        const finalTotal = total - discountAmount;

        return {
            discountAmount,
            finalTotal
        };
    }
}

export default new CalculationService();
