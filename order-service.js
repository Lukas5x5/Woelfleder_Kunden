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

            console.log(`📋 Loaded ${data?.length || 0} gates for order ${orderId}`, data);
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

    /**
     * Upload documents for an order
     * @param {string} orderId
     * @param {FileList} files
     * @returns {Promise<Array>} Array of uploaded file URLs
     */
    async uploadOrderDocuments(orderId, files) {
        if (!this.supabase || !this.currentUser) {
            console.error('❌ Order Service not initialized');
            return [];
        }

        const uploadedUrls = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${orderId}_${Date.now()}_${i}.${fileExt}`;
                const filePath = `order-documents/${this.currentUser.id}/${fileName}`;

                // Upload to Supabase Storage
                const { data, error } = await this.supabase.storage
                    .from('customer-files')
                    .upload(filePath, file);

                if (error) throw error;

                // Get public URL
                const { data: urlData } = this.supabase.storage
                    .from('customer-files')
                    .getPublicUrl(filePath);

                uploadedUrls.push({
                    name: file.name,
                    url: urlData.publicUrl,
                    path: filePath
                });
            }

            console.log(`✅ Uploaded ${uploadedUrls.length} documents for order ${orderId}`);
            return uploadedUrls;
        } catch (error) {
            console.error('Error uploading order documents:', error);
            return uploadedUrls; // Return partial results
        }
    }

    /**
     * Load documents for an order
     * @param {string} orderId
     * @returns {Promise<Array>}
     */
    async loadOrderDocuments(orderId) {
        if (!this.supabase) return [];

        try {
            const { data, error } = await this.supabase
                .from('orders')
                .select('documents')
                .eq('id', orderId)
                .single();

            if (error) throw error;

            return data?.documents ? JSON.parse(data.documents) : [];
        } catch (error) {
            console.error('Error loading order documents:', error);
            return [];
        }
    }

    /**
     * Save document metadata to order
     * @param {string} orderId
     * @param {Array} documents
     * @returns {Promise<boolean>}
     */
    async saveOrderDocuments(orderId, documents) {
        if (!this.supabase) return false;

        try {
            const { error } = await this.supabase
                .from('orders')
                .update({
                    documents: JSON.stringify(documents),
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderId);

            if (error) throw error;

            console.log('✅ Order documents metadata saved');
            return true;
        } catch (error) {
            console.error('Error saving order documents:', error);
            return false;
        }
    }

    /**
     * Delete a document from an order
     * @param {string} orderId
     * @param {string} documentPath
     * @returns {Promise<boolean>}
     */
    async deleteOrderDocument(orderId, documentPath) {
        if (!this.supabase) return false;

        try {
            // Delete from storage
            const { error: storageError } = await this.supabase.storage
                .from('customer-files')
                .remove([documentPath]);

            if (storageError) throw storageError;

            // Update order documents list
            const documents = await this.loadOrderDocuments(orderId);
            const updatedDocuments = documents.filter(doc => doc.path !== documentPath);
            await this.saveOrderDocuments(orderId, updatedDocuments);

            console.log('✅ Document deleted from order');
            return true;
        } catch (error) {
            console.error('Error deleting order document:', error);
            return false;
        }
    }
}

// Create singleton instance
const orderService = new OrderService();

// Export for use in other files
if (typeof window !== 'undefined') {
    window.orderService = orderService;
}
