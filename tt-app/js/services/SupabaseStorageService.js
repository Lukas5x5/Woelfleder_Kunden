/**
 * Supabase Storage Service
 * Syncs customers and gates with Supabase database
 */

class SupabaseStorageService {
    constructor() {
        this.supabase = null;
        this.initialized = false;
    }

    /**
     * Initialize Supabase connection
     * Uses existing client from supabase-auth.js
     */
    async init() {
        if (this.initialized) return;

        try {
            // Use existing Supabase client from supabase-auth.js
            if (typeof supabaseClient === 'undefined' || !supabaseClient) {
                console.error('❌ Supabase client not initialized!');
                return false;
            }

            this.supabase = supabaseClient;

            // Wait for user to be authenticated
            if (typeof currentUser === 'undefined' || !currentUser) {
                console.log('⏳ Waiting for user authentication...');
                await this.waitForUser();
            } else {
                this.currentUser = currentUser;
            }

            this.initialized = true;
            console.log('✅ TT-App Supabase connected', this.currentUser ? `(User: ${this.currentUser.email})` : '(No user)');
            return true;
        } catch (error) {
            console.error('Error initializing Supabase:', error);
            return false;
        }
    }

    /**
     * Wait for user to be authenticated
     */
    async waitForUser() {
        return new Promise((resolve) => {
            // Check if user is already available
            if (typeof currentUser !== 'undefined' && currentUser !== null) {
                this.currentUser = currentUser;
                resolve();
                return;
            }

            // Set timeout to avoid waiting forever
            const timeout = setTimeout(() => {
                console.warn('⚠️ User authentication timeout');
                resolve();
            }, 5000);

            // Listen for user ready event
            window.addEventListener('supabase-user-ready', (event) => {
                clearTimeout(timeout);
                if (event.detail.user) {
                    this.currentUser = event.detail.user;
                    console.log('✅ User authenticated for TT-App:', this.currentUser.email);
                }
                resolve();
            }, { once: true });
        });
    }

    /**
     * Load all customers from Supabase
     * @returns {Promise<Array>}
     */
    async loadCustomers() {
        if (!this.initialized) await this.init();

        if (!this.currentUser) {
            console.error('❌ No user logged in, cannot load customers');
            return [];
        }

        try {
            const { data, error } = await this.supabase
                .from('customers')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                console.log('ℹ️ No customers found in Supabase for user:', this.currentUser.email);
                return [];
            }

            console.log(`✅ Loaded ${data.length} customers from Supabase for user:`, this.currentUser.email);

            // Load gates for each customer
            const customersWithGates = await Promise.all(
                data.map(async (customer) => {
                    const gates = await this.loadGatesForCustomer(customer.id);
                    return {
                        id: customer.id,
                        name: customer.name,
                        company: customer.company || '',
                        address: customer.address || '',
                        city: customer.city || '',
                        phone: customer.phone || '',
                        email: customer.email || '',
                        gates: gates
                    };
                })
            );

            return customersWithGates;
        } catch (error) {
            console.error('Error loading customers:', error);
            return [];
        }
    }

    /**
     * Load gates for a specific customer
     * @param {string} customerId
     * @returns {Promise<Array>}
     */
    async loadGatesForCustomer(customerId) {
        if (!this.initialized) await this.init();

        try {
            const { data, error } = await this.supabase
                .from('gates')
                .select('*')
                .eq('customer_id', customerId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Convert to Gate format with German field names
            return data.map(gate => {
                // Parse JSON fields
                let selectedProducts = [];
                let productQuantities = {};
                let customPrices = {};

                try {
                    selectedProducts = JSON.parse(gate.selected_products || '[]');
                    productQuantities = JSON.parse(gate.product_quantities || '{}');
                    customPrices = JSON.parse(gate.custom_prices || '{}');
                } catch (e) {
                    console.error('Error parsing gate JSON fields:', e);
                }

                // Use stored values or calculate from old format
                const breite = parseFloat(gate.breite || gate.width) || 0;
                const hoehe = parseFloat(gate.hoehe || gate.height) || 0;
                const glashoehe = parseFloat(gate.glashoehe) || 0;
                const gesamtflaeche = parseFloat(gate.gesamtflaeche) || ((breite * hoehe) / 10000);
                const glasflaeche = parseFloat(gate.glasflaeche) || 0;
                const torflaeche = parseFloat(gate.torflaeche) || gesamtflaeche;

                return {
                    id: gate.id,
                    customer_id: gate.customer_id,

                    // Basic Info
                    name: gate.name || '',
                    gateType: gate.gate_type || gate.type || 'unknown',
                    notizen: gate.notizen || gate.notes || '',

                    // Dimensions (in cm)
                    breite: breite,
                    hoehe: hoehe,
                    glashoehe: glashoehe,

                    // Calculated Areas (in m²)
                    gesamtflaeche: gesamtflaeche,
                    glasflaeche: glasflaeche,
                    torflaeche: torflaeche,

                    // Products
                    selectedProducts: selectedProducts,
                    productQuantities: productQuantities,
                    customPrices: customPrices,

                    // Pricing
                    aufschlag: parseFloat(gate.aufschlag) || 0,
                    subtotal: parseFloat(gate.subtotal) || 0,
                    aufschlagBetrag: parseFloat(gate.aufschlag_betrag) || 0,
                    exklusiveMwst: parseFloat(gate.exklusive_mwst) || 0,
                    inklMwst: parseFloat(gate.inkl_mwst) || 0,

                    // Quantity
                    quantity: parseInt(gate.quantity) || 1,

                    // Timestamps
                    createdAt: gate.created_at,
                    updatedAt: gate.updated_at || gate.created_at
                };
            });
        } catch (error) {
            console.error('Error loading gates:', error);
            return [];
        }
    }

    /**
     * Save a new gate to Supabase
     * @param {string} customerId
     * @param {Object} gateData
     * @returns {Promise<Object|null>}
     */
    async saveGate(customerId, gateData) {
        if (!this.initialized) await this.init();

        if (!this.currentUser) {
            console.error('❌ No user logged in');
            return null;
        }

        try {
            // Generate unique ID
            const gateId = gateData.id || `gate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Prepare gate data for Supabase with ALL fields
            const dbGate = {
                id: gateId,
                user_id: this.currentUser.id,
                customer_id: customerId,

                // Basic Info
                name: gateData.name || '',
                gate_type: gateData.gateType || gateData.type || 'unknown',
                notizen: gateData.notizen || gateData.notes || '',

                // Dimensions (in cm)
                breite: parseFloat(gateData.breite || gateData.width) || 0,
                hoehe: parseFloat(gateData.hoehe || gateData.height) || 0,
                glashoehe: parseFloat(gateData.glashoehe) || 0,

                // Calculated Areas (in m²)
                gesamtflaeche: parseFloat(gateData.gesamtflaeche) || 0,
                glasflaeche: parseFloat(gateData.glasflaeche) || 0,
                torflaeche: parseFloat(gateData.torflaeche) || 0,

                // Products (JSONB)
                selected_products: JSON.stringify(gateData.selectedProducts || []),
                product_quantities: JSON.stringify(gateData.productQuantities || {}),
                custom_prices: JSON.stringify(gateData.customPrices || {}),

                // Pricing
                aufschlag: parseFloat(gateData.aufschlag) || 0,
                subtotal: parseFloat(gateData.subtotal) || 0,
                aufschlag_betrag: parseFloat(gateData.aufschlagBetrag) || 0,
                exklusive_mwst: parseFloat(gateData.exklusiveMwst) || 0,
                inkl_mwst: parseFloat(gateData.inklMwst) || 0,

                // Quantity
                quantity: parseInt(gateData.quantity) || 1
            };

            console.log('💾 Saving gate to Supabase:', dbGate);

            const { data, error } = await this.supabase
                .from('gates')
                .insert([dbGate])
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Gate saved to Supabase with all data');
            return data;
        } catch (error) {
            console.error('Error saving gate:', error);
            console.error('Gate data:', gateData);
            return null;
        }
    }

    /**
     * Update an existing gate
     * @param {string} gateId
     * @param {Object} gateData
     * @returns {Promise<boolean>}
     */
    async updateGate(gateId, gateData) {
        if (!this.initialized) await this.init();

        try {
            const { error } = await this.supabase
                .from('gates')
                .update({
                    // Basic Info
                    name: gateData.name || '',
                    gate_type: gateData.gateType || gateData.type || 'unknown',
                    notizen: gateData.notizen || gateData.notes || '',

                    // Dimensions (in cm)
                    breite: parseFloat(gateData.breite || gateData.width) || 0,
                    hoehe: parseFloat(gateData.hoehe || gateData.height) || 0,
                    glashoehe: parseFloat(gateData.glashoehe) || 0,

                    // Calculated Areas (in m²)
                    gesamtflaeche: parseFloat(gateData.gesamtflaeche) || 0,
                    glasflaeche: parseFloat(gateData.glasflaeche) || 0,
                    torflaeche: parseFloat(gateData.torflaeche) || 0,

                    // Products (JSONB)
                    selected_products: JSON.stringify(gateData.selectedProducts || []),
                    product_quantities: JSON.stringify(gateData.productQuantities || {}),
                    custom_prices: JSON.stringify(gateData.customPrices || {}),

                    // Pricing
                    aufschlag: parseFloat(gateData.aufschlag) || 0,
                    subtotal: parseFloat(gateData.subtotal) || 0,
                    aufschlag_betrag: parseFloat(gateData.aufschlagBetrag) || 0,
                    exklusive_mwst: parseFloat(gateData.exklusiveMwst) || 0,
                    inkl_mwst: parseFloat(gateData.inklMwst) || 0,

                    // Quantity
                    quantity: parseInt(gateData.quantity) || 1,

                    // Timestamp
                    updated_at: new Date().toISOString()
                })
                .eq('id', gateId);

            if (error) throw error;

            console.log('✅ Gate updated in Supabase with all data');
            return true;
        } catch (error) {
            console.error('Error updating gate:', error);
            return false;
        }
    }

    /**
     * Delete a gate
     * @param {string} gateId
     * @returns {Promise<boolean>}
     */
    async deleteGate(gateId) {
        if (!this.initialized) await this.init();

        try {
            const { error } = await this.supabase
                .from('gates')
                .delete()
                .eq('id', gateId);

            if (error) throw error;

            console.log('✅ Gate deleted from Supabase');
            return true;
        } catch (error) {
            console.error('Error deleting gate:', error);
            return false;
        }
    }

    /**
     * Check if storage is available
     * @returns {boolean}
     */
    isAvailable() {
        return this.initialized && this.supabase !== null;
    }
}

export default new SupabaseStorageService();
