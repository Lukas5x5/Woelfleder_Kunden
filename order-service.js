/**
 * Order Service
 * Manages orders (Aufträge) for customers
 */

class OrderService {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
    }

    /**
     * Initialize with Supabase client and user
     */
    init(supabaseClient, user) {
        this.supabase = supabaseClient;
        this.currentUser = user;
    }

    /**
     * Generate order number
     * Format: ORD-YYYYMMDD-XXX
     */
    async generateOrderNumber(customerId) {
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '');

        // Get existing orders for today for this customer
        const { data, error } = await this.supabase
            .from('orders')
            .select('order_number')
            .eq('customer_id', customerId)
            .like('order_number', `ORD-${today}%`)
            .order('order_number', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Error getting order count:', error);
            return `ORD-${today}-001`;
        }

        if (!data || data.length === 0) {
            return `ORD-${today}-001`;
        }

        // Extract number and increment
        const lastNumber = parseInt(data[0].order_number.split('-')[2]) || 0;
        const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
        return `ORD-${today}-${nextNumber}`;
    }

    /**
     * Load all orders for a customer
     * @param {string} customerId
     * @returns {Promise<Array>}
     */
    async loadOrdersForCustomer(customerId) {
        if (!this.supabase || !this.currentUser) {
            console.error('❌ Order Service not initialized');
            return [];
        }

        try {
            const { data, error } = await this.supabase
                .from('orders')
                .select('*')
                .eq('customer_id', customerId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Load gates for each order
            const ordersWithGates = await Promise.all(
                (data || []).map(async (order) => {
                    const gates = await this.loadGatesForOrder(order.id);
                    return {
                        ...order,
                        gates: gates,
                        gateCount: gates.length
                    };
                })
            );

            console.log(`✅ Loaded ${ordersWithGates.length} orders for customer ${customerId}`);
            return ordersWithGates;
        } catch (error) {
            console.error('Error loading orders:', error);
            return [];
        }
    }

    /**
     * Load gates for a specific order
     * @param {string} orderId
     * @returns {Promise<Array>}
     */
    async loadGatesForOrder(orderId) {
        if (!this.supabase) return [];

        try {
            const { data, error } = await this.supabase
                .from('gates')
                .select('*')
                .eq('order_id', orderId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error loading gates for order:', error);
            return [];
        }
    }

    /**
     * Create a new order
     * @param {string} customerId
     * @param {Object} orderData
     * @returns {Promise<Object|null>}
     */
    async createOrder(customerId, orderData) {
        if (!this.supabase || !this.currentUser) {
            console.error('❌ Order Service not initialized');
            return null;
        }

        try {
            const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Use provided order number or generate one
            const orderNumber = orderData.orderNumber || await this.generateOrderNumber(customerId);

            const newOrder = {
                id: orderId,
                user_id: this.currentUser.id,
                customer_id: customerId,
                order_number: orderNumber,
                type: orderData.type || 'standard',
                status: orderData.status || 'anfrage',
                sage_ref: orderData.sageRef || '',
                appointment: orderData.appointment || '',
                follow_up_date: orderData.followUpDate || '',
                notes: orderData.notes || ''
            };

            const { data, error } = await this.supabase
                .from('orders')
                .insert([newOrder])
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Order created:', data.order_number);
            return data;
        } catch (error) {
            console.error('Error creating order:', error);
            return null;
        }
    }

    /**
     * Update an existing order
     * @param {string} orderId
     * @param {Object} orderData
     * @returns {Promise<boolean>}
     */
    async updateOrder(orderId, orderData) {
        if (!this.supabase) {
            console.error('❌ Order Service not initialized');
            return false;
        }

        try {
            const updateData = {
                order_number: orderData.orderNumber,  // FIX: Order number jetzt auch beim Update
                type: orderData.type,
                status: orderData.status,
                sage_ref: orderData.sageRef || '',
                appointment: orderData.appointment || '',
                follow_up_date: orderData.followUpDate || '',
                notes: orderData.notes || '',
                updated_at: new Date().toISOString()
            };

            const { error } = await this.supabase
                .from('orders')
                .update(updateData)
                .eq('id', orderId);

            if (error) throw error;

            console.log('✅ Order updated:', orderId);
            return true;
        } catch (error) {
            console.error('Error updating order:', error);
            return false;
        }
    }

    /**
     * Delete an order
     * @param {string} orderId
     * @returns {Promise<boolean>}
     */
    async deleteOrder(orderId) {
        if (!this.supabase) {
            console.error('❌ Order Service not initialized');
            return false;
        }

        try {
            // Check if order has gates
            const gates = await this.loadGatesForOrder(orderId);
            if (gates.length > 0) {
                if (!confirm(`Dieser Auftrag hat ${gates.length} Tor(e). Wirklich löschen?`)) {
                    return false;
                }
            }

            const { error } = await this.supabase
                .from('orders')
                .delete()
                .eq('id', orderId);

            if (error) throw error;

            console.log('✅ Order deleted:', orderId);
            return true;
        } catch (error) {
            console.error('Error deleting order:', error);
            return false;
        }
    }

    /**
     * Get order by ID
     * @param {string} orderId
     * @returns {Promise<Object|null>}
     */
    async getOrderById(orderId) {
        if (!this.supabase) {
            console.error('❌ Order Service not initialized');
            return null;
        }

        try {
            const { data, error } = await this.supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (error) throw error;

            // Load gates
            const gates = await this.loadGatesForOrder(orderId);

            return {
                ...data,
                gates: gates,
                gateCount: gates.length
            };
        } catch (error) {
            console.error('Error getting order:', error);
            return null;
        }
    }

    /**
     * Mark order as completed
     * @param {string} orderId
     * @returns {Promise<boolean>}
     */
    async completeOrder(orderId) {
        return await this.updateOrder(orderId, { status: 'abgeschlossen' });
    }

    /**
     * Get all orders for statistics
     * @returns {Promise<Array>}
     */
    async getAllOrders() {
        if (!this.supabase || !this.currentUser) {
            return [];
        }

        try {
            const { data, error } = await this.supabase
                .from('orders')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting all orders:', error);
            return [];
        }
    }
}

// Create singleton instance
const orderService = new OrderService();

// Export for use in other files
if (typeof window !== 'undefined') {
    window.orderService = orderService;
}
