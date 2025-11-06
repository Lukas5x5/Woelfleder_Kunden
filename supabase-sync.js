// Supabase Sync für Kunden-App
// Note: Uses supabaseClient and currentUser from supabase-auth.js

// Initialize Supabase Sync (uses existing client from supabase-auth.js)
async function initSupabaseSync() {
    try {
        // Wait for supabase-auth.js to initialize
        if (typeof supabaseClient === 'undefined' || !supabaseClient) {
            console.warn('⚠️ Supabase client not initialized yet');
            return false;
        }

        // Wait for user to be authenticated
        if (!currentUser) {
            console.warn('⚠️ No user logged in yet');
            return false;
        }

        console.log('✅ Supabase sync initialized for user:', currentUser.email);
        // Load customers from Supabase on init
        await loadCustomersFromSupabase();

        return true;
    } catch (error) {
        console.error('Error initializing Supabase sync:', error);
        return false;
    }
}

// Load customers from Supabase
async function loadCustomersFromSupabase() {
    if (!supabaseClient || !currentUser) return;

    try {
        const { data, error } = await supabaseClient
            .from('customers')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        console.log(`✅ Loaded ${data ? data.length : 0} customers from Supabase for user:`, currentUser.email);

        // Convert to app format
        customers = data.map(c => ({
            id: c.id,
            name: c.name,
            company: c.company || '',
            phone: c.phone || '',
            email: c.email || '',
            address: c.address || '',
            city: c.city || '',
            source: c.source || '',
            type: c.type || 'standard',
            status: c.status || 'active',
            appointment: c.appointment || '',
            sageRef: c.sage_ref || '',
            followUpDate: c.follow_up_date || '',
            notes: c.notes || '',
            photos: [],
            documents: [],
            appointments: [],
            createdAt: c.created_at
        }));

        // Also save to localStorage as cache
        localStorage.setItem('woelfeder_customers', JSON.stringify(customers));

        // Re-render
        if (typeof renderCustomers === 'function') {
            renderCustomers();
        }
        if (typeof updateStats === 'function') {
            updateStats();
        }
    } catch (error) {
        console.error('Error loading customers from Supabase:', error);
    }
}

// Save customer to Supabase
async function saveCustomerToSupabase(customer) {
    if (!supabaseClient || !currentUser) {
        console.warn('⚠️ Supabase not initialized, saving only to localStorage');
        return false;
    }

    try {
        console.log('💾 Saving customer to Supabase:', customer.name);

        // Use upsert instead of checking if exists
        const { data, error } = await supabaseClient
            .from('customers')
            .upsert({
                id: customer.id,
                user_id: currentUser.id,
                name: customer.name,
                company: customer.company || null,
                phone: customer.phone || null,
                email: customer.email || null,
                address: customer.address || null,
                city: customer.city || null,
                source: customer.source || null,
                type: customer.type || null,
                status: customer.status || null,
                appointment: customer.appointment || null,
                sage_ref: customer.sageRef || null,
                follow_up_date: customer.followUpDate || null,
                notes: customer.notes || null,
                created_at: customer.createdAt || new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'id'
            })
            .select();

        if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
        }

        console.log('✅ Customer saved to Supabase:', data);
        return true;
    } catch (error) {
        console.error('Error saving customer to Supabase:', error);
        return false;
    }
}

// Delete customer from Supabase
async function deleteCustomerFromSupabase(customerId) {
    if (!supabaseClient || !currentUser) {
        console.warn('⚠️ Supabase not initialized');
        return false;
    }

    try {
        const { error } = await supabaseClient
            .from('customers')
            .delete()
            .eq('id', customerId);

        if (error) throw error;
        console.log('✅ Customer deleted from Supabase');
        return true;
    } catch (error) {
        console.error('Error deleting customer from Supabase:', error);
        return false;
    }
}

// Sync all customers to Supabase
async function syncToCloud() {
    if (!supabaseClient || !currentUser) return;

    try {
        for (const customer of customers) {
            await saveCustomerToSupabase(customer);
        }
        console.log('✅ All customers synced to Supabase');
    } catch (error) {
        console.error('Error syncing to cloud:', error);
    }
}

// Export functions
window.initSupabaseSync = initSupabaseSync;
window.loadCustomersFromSupabase = loadCustomersFromSupabase;
window.saveCustomerToSupabase = saveCustomerToSupabase;
window.deleteCustomerFromSupabase = deleteCustomerFromSupabase;
window.syncToCloud = syncToCloud;
