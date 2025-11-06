// Customer Management App - JavaScript
let customers = [];
let currentEditId = null;
let currentFilter = 'all';
let customTypes = [];
let customStatus = [];
let appSettings = {
    logo: null
};

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    loadSettings();
    loadCustomTypes();
    loadCustomStatus();

    // Note: Customer loading is now handled by supabase-auth.js after authentication
    // which calls initSupabaseSync() from supabase-sync.js
    // Don't call loadCustomers() here - it will be called by initSupabaseSync()
    // or by syncFromCloud() if using the legacy sync system

    renderCustomers(); // Will show empty initially, then update when data loads
    updateStats();
    setupEventListeners();
    checkUpcomingAppointments();
});

// Setup Event Listeners
function setupEventListeners() {
    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        renderCustomers(e.target.value);
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderCustomers();
        });
    });

    // Form submit
    const customerForm = document.getElementById('customerForm');
    if (customerForm) {
        customerForm.addEventListener('submit', handleFormSubmit);
        console.log('✅ Customer form event listener registered');
    } else {
        console.error('❌ Customer form not found!');
    }

    // Photo upload
    document.getElementById('customerPhotos').addEventListener('change', handlePhotoUpload);

    // Document upload
    document.getElementById('customerDocuments').addEventListener('change', handleDocumentUpload);

    // Logo upload - DISABLED: Logo is now fixed and cannot be changed
    // const logoUploadElement = document.getElementById('logoUpload');
    // if (logoUploadElement) {
    //     logoUploadElement.addEventListener('change', handleLogoUpload);
    // }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('openOrdersDropdown');
        const dropdownBtn = document.getElementById('openOrdersBtn');

        // Check if click is outside both the dropdown and the button
        if (dropdown && dropdownBtn &&
            !dropdown.contains(e.target) &&
            !dropdownBtn.contains(e.target) &&
            dropdown.style.display === 'block') {
            dropdown.style.display = 'none';
        }
    });
}

// Load Customers from LocalStorage
function loadCustomers() {
    const stored = localStorage.getItem('woelfeder_customers');
    if (stored) {
        customers = JSON.parse(stored);
    }
}

// Save Customers to LocalStorage and Cloud
async function saveCustomers() {
    localStorage.setItem('woelfeder_customers', JSON.stringify(customers));
    updateStats();

    // Sync to cloud using new sync system
    if (typeof saveCustomerToSupabase === 'function' && customers.length > 0) {
        // Save the last customer (newest one) to Supabase
        const lastCustomer = customers[customers.length - 1];
        console.log('💾 Saving customer to Supabase:', lastCustomer.name);
        await saveCustomerToSupabase(lastCustomer);
    } else if (typeof syncToCloud === 'function') {
        // Fallback to old sync system
        await syncToCloud();
    }
}

// Render Customers List
async function renderCustomers(searchTerm = '') {
    const container = document.getElementById('customersList');

    let filtered = customers;

    // Apply filter based on order status
    if (currentFilter !== 'all' && typeof orderService !== 'undefined') {
        const customersWithOrders = await Promise.all(
            customers.map(async (customer) => {
                const orders = await orderService.loadOrdersForCustomer(customer.id);
                const hasMatchingOrder = orders.some(order => order.status === currentFilter);
                return hasMatchingOrder ? customer : null;
            })
        );
        filtered = customersWithOrders.filter(c => c !== null);
    }

    // Apply search
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(c => {
            // Get the label for the customer's type (including custom types)
            const typeLabel = getTypeLabel(c.type).toLowerCase();

            return c.name.toLowerCase().includes(term) ||
                c.phone?.toLowerCase().includes(term) ||
                c.email?.toLowerCase().includes(term) ||
                c.address?.toLowerCase().includes(term) ||
                c.notes?.toLowerCase().includes(term) ||
                c.sageRef?.toLowerCase().includes(term) ||
                typeLabel.includes(term);
        });
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-text">
                    ${searchTerm ? 'Keine Kunden gefunden' : 'Noch keine Kunden vorhanden'}
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(customer => {
        // Get gates info
        const gatesCount = customer.gates ? customer.gates.length : 0;
        const gatesNotes = customer.gates && customer.gates.length > 0
            ? customer.gates.map(g => g.notizen || g.notes).filter(n => n).join(', ').substring(0, 100)
            : '';

        // Debug log for first customer
        if (filtered[0] === customer) {
            console.log('🐛 Debug - Customer gates:', {
                customerName: customer.name,
                hasGates: !!customer.gates,
                gatesCount: gatesCount,
                gates: customer.gates,
                gatesNotes: gatesNotes
            });
        }

        return `
        <div class="customer-card status-${customer.status}" onclick="showCustomerDetails('${customer.id}')">
            <div class="customer-header">
                <div class="customer-name">${escapeHtml(customer.name)}</div>
                <span class="customer-status status-${customer.status}">${getStatusLabel(customer.status)}</span>
            </div>
            <div class="customer-info">
                ${customer.phone ? `<div class="customer-info-item">📞 ${escapeHtml(customer.phone)}</div>` : ''}
                ${customer.email ? `<div class="customer-info-item">📧 ${escapeHtml(customer.email)}</div>` : ''}
                ${customer.address ? `<div class="customer-info-item">📍 ${escapeHtml(customer.address)}</div>` : ''}
                <div class="customer-info-item"><strong>Typ:</strong> ${getTypeLabel(customer.type)}</div>
                <div class="customer-info-item"><strong>Quelle:</strong> ${getSourceLabel(customer.source)}</div>
                ${customer.sageRef ? `<div class="customer-info-item"><strong>Sage:</strong> ${escapeHtml(customer.sageRef)}</div>` : ''}
            </div>
            ${gatesCount > 0 ? `
                <div class="gates-info-badge">
                    <div class="gates-count">🚪 ${gatesCount} Tor${gatesCount !== 1 ? 'e' : ''}</div>
                    ${gatesNotes ? `<div class="gates-notes-preview">${escapeHtml(gatesNotes)}${gatesNotes.length >= 100 ? '...' : ''}</div>` : ''}
                </div>
            ` : ''}
            ${customer.appointment ? `
                <div class="appointment-badge ${isUpcoming(customer.appointment) ? 'upcoming' : ''}">
                    📅 Termin: ${formatAppointment(customer.appointment)}
                </div>
            ` : ''}
            ${customer.followUpDate ? `
                <div class="followup-badge ${isFollowUpDue(customer.followUpDate) ? 'due' : ''}">
                    🔔 Wiedervorlage: ${formatDate(customer.followUpDate)}
                </div>
            ` : ''}
            <div class="customer-actions" onclick="event.stopPropagation()">
                <button class="btn btn-primary btn-small" onclick="editCustomer('${customer.id}')">✏️ Bearbeiten</button>
                <button class="btn btn-danger btn-small" onclick="deleteCustomer('${customer.id}')">🗑️ Löschen</button>
            </div>
        </div>
        `;
    }).join('');
}

// Update Statistics
function updateStats() {
    document.getElementById('statTotal').textContent = customers.length;

    const upcomingAppointments = customers.filter(c =>
        c.appointment && new Date(c.appointment) > new Date()
    ).length;
    document.getElementById('statTermine').textContent = upcomingAppointments;

    const anfragen = customers.filter(c => c.status === 'anfrage').length;
    document.getElementById('statAnfragen').textContent = anfragen;

    const auftraege = customers.filter(c => c.status === 'auftrag').length;
    document.getElementById('statAuftraege').textContent = auftraege;

    // Count follow-ups (future dates)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const followUps = customers.filter(c => {
        if (!c.followUpDate) return false;
        const followUpDate = new Date(c.followUpDate);
        return followUpDate >= today;
    }).length;
    document.getElementById('statFollowUp').textContent = followUps;

    // Update open orders count
    updateOpenOrdersCount();
}

// Update open orders count in header
async function updateOpenOrdersCount() {
    if (typeof orderService === 'undefined' || !orderService) {
        return;
    }

    try {
        const allOrders = await orderService.getAllOrders();
        const openOrders = allOrders.filter(order => order.status !== 'abgeschlossen');
        document.getElementById('openOrdersCount').textContent = openOrders.length;
    } catch (error) {
        console.error('Error updating open orders count:', error);
    }
}

// Show New Customer Modal
function showNewCustomerModal() {
    currentEditId = null;
    document.getElementById('modalTitle').textContent = 'Neuer Kunde';
    document.getElementById('customerForm').reset();
    document.getElementById('customerId').value = '';

    const photoPreview = document.getElementById('photoPreview');
    if (photoPreview) {
        photoPreview.innerHTML = '';
    }

    const documentPreview = document.getElementById('documentPreview');
    if (documentPreview) {
        documentPreview.innerHTML = '';
    }

    document.getElementById('customerModal').classList.add('active');
}

// Edit Customer
function editCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    currentEditId = id;
    document.getElementById('modalTitle').textContent = 'Kunde bearbeiten';
    document.getElementById('customerId').value = customer.id;
    document.getElementById('customerName').value = customer.name;
    document.getElementById('customerCompany').value = customer.company || '';
    document.getElementById('customerPhone').value = customer.phone || '';
    document.getElementById('customerEmail').value = customer.email || '';
    document.getElementById('customerAddress').value = customer.address || '';

    // Safe setting of optional fields
    const sourceField = document.getElementById('customerSource');
    if (sourceField) sourceField.value = customer.source || '';

    const typeField = document.getElementById('customerType');
    if (typeField) typeField.value = customer.type || '';

    const statusField = document.getElementById('customerStatus');
    if (statusField) statusField.value = customer.status || '';

    const appointmentField = document.getElementById('customerAppointment');
    if (appointmentField) appointmentField.value = customer.appointment || '';

    const sageRefField = document.getElementById('customerSageRef');
    if (sageRefField) sageRefField.value = customer.sageRef || '';

    const followUpField = document.getElementById('customerFollowUp');
    if (followUpField) followUpField.value = customer.followUpDate || '';

    const notesField = document.getElementById('customerNotes');
    if (notesField) notesField.value = customer.notes || '';

    // Display existing photos
    const photoPreview = document.getElementById('photoPreview');
    if (photoPreview) {
        photoPreview.innerHTML = '';
        if (customer.photos && customer.photos.length > 0) {
            customer.photos.forEach((photo, index) => {
                const photoDiv = document.createElement('div');
                photoDiv.className = 'photo-item';
                photoDiv.innerHTML = `
                    <img src="${photo}" alt="Foto ${index + 1}">
                    <button type="button" class="photo-delete" onclick="deletePhoto(${index})">×</button>
                `;
                photoPreview.appendChild(photoDiv);
            });
        }
    }

    // Display existing documents
    const documentPreview = document.getElementById('documentPreview');
    if (documentPreview) {
        documentPreview.innerHTML = '';
        if (customer.documents && customer.documents.length > 0) {
            customer.documents.forEach((doc, index) => {
                const docDiv = document.createElement('div');
                docDiv.className = 'document-item';
                docDiv.innerHTML = `
                    <div class="document-info">
                        <span class="document-icon">📄</span>
                        <span class="document-name">${escapeHtml(doc.name)}</span>
                    </div>
                    <div class="document-actions">
                        <button type="button" class="document-btn" onclick="downloadDocument('${customer.id}', ${index})">↓</button>
                        <button type="button" class="document-btn document-btn-delete" onclick="deleteDocument(${index})">×</button>
                    </div>
                `;
                documentPreview.appendChild(docDiv);
            });
        }
    }

    document.getElementById('customerModal').classList.add('active');
}

// Delete Photo
function deletePhoto(index) {
    if (!currentEditId) return;

    const customer = customers.find(c => c.id === currentEditId);
    if (customer && customer.photos) {
        customer.photos.splice(index, 1);
        saveCustomers();
        editCustomer(currentEditId);
    }
}

// Clean up orphaned orders (orders without existing customer)
async function cleanupOrphanedOrders() {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        console.log('⏭️ Skipping orphaned orders cleanup - Supabase not available');
        return;
    }

    try {
        console.log('🧹 Checking for orphaned orders...');

        // Get all orders
        const { data: allOrders, error: ordersError } = await supabaseClient
            .from('orders')
            .select('id, customer_id, order_number');

        if (ordersError) throw ordersError;

        if (!allOrders || allOrders.length === 0) {
            console.log('✅ No orders to check');
            return;
        }

        // Get all customers
        const { data: allCustomers, error: customersError } = await supabaseClient
            .from('customers')
            .select('id');

        if (customersError) throw customersError;

        const customerIds = new Set(allCustomers.map(c => c.id));
        const orphanedOrders = allOrders.filter(order => !customerIds.has(order.customer_id));

        if (orphanedOrders.length === 0) {
            console.log('✅ No orphaned orders found');
            return;
        }

        console.log(`🗑️ Found ${orphanedOrders.length} orphaned orders, deleting...`);

        // Delete orphaned orders and their gates
        for (const order of orphanedOrders) {
            // Delete gates for this order
            const { error: gatesError } = await supabaseClient
                .from('gates')
                .delete()
                .eq('order_id', order.id);

            if (gatesError) {
                console.error(`Error deleting gates for order ${order.order_number}:`, gatesError);
            }

            // Delete the order
            const { error: orderError } = await supabaseClient
                .from('orders')
                .delete()
                .eq('id', order.id);

            if (orderError) {
                console.error(`Error deleting order ${order.order_number}:`, orderError);
            } else {
                console.log(`✅ Deleted orphaned order: ${order.order_number}`);
            }
        }

        console.log(`✅ Cleanup completed: ${orphanedOrders.length} orphaned orders removed`);

        // Show notification
        if (typeof showNotification === 'function') {
            showNotification(`🧹 ${orphanedOrders.length} verwaiste Aufträge wurden entfernt`, 'info');
        }
    } catch (error) {
        console.error('❌ Error cleaning up orphaned orders:', error);
    }
}

// Delete Customer
async function deleteCustomer(id) {
    try {
        // Load orders for this customer to show count
        let orderCount = 0;
        let gateCount = 0;

        if (typeof orderService !== 'undefined') {
            const orders = await orderService.loadOrdersForCustomer(id);
            orderCount = orders.length;
            // Count total gates across all orders
            gateCount = orders.reduce((sum, order) => sum + (order.gateCount || 0), 0);
        }

        // Show confirmation with order/gate count
        const message = orderCount > 0
            ? `Möchten Sie diesen Kunden wirklich löschen?\n\nDies wird auch ${orderCount} Auftrag/Aufträge und ${gateCount} Tor(e) löschen!`
            : 'Möchten Sie diesen Kunden wirklich löschen?';

        if (!confirm(message)) {
            return;
        }

        console.log(`🗑️ Deleting customer ${id} with ${orderCount} orders and ${gateCount} gates...`);

        // Delete all gates for this customer from Supabase
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            const { error: gatesError } = await supabaseClient
                .from('gates')
                .delete()
                .eq('customer_id', id);

            if (gatesError) {
                console.error('Error deleting gates:', gatesError);
            } else {
                console.log(`✅ Deleted ${gateCount} gates`);
            }

            // Delete all orders for this customer from Supabase
            const { error: ordersError } = await supabaseClient
                .from('orders')
                .delete()
                .eq('customer_id', id);

            if (ordersError) {
                console.error('Error deleting orders:', ordersError);
            } else {
                console.log(`✅ Deleted ${orderCount} orders`);
            }
        }

        // Delete customer from Supabase
        if (typeof deleteCustomerFromSupabase === 'function') {
            await deleteCustomerFromSupabase(id);
            console.log('✅ Deleted customer from Supabase');
        }

        // Delete from local array
        customers = customers.filter(c => c.id !== id);
        await saveCustomers();
        renderCustomers();

        console.log('✅ Customer and all related data deleted successfully');

        // Show success notification
        if (typeof showNotification === 'function') {
            showNotification('✅ Kunde und alle zugehörigen Aufträge gelöscht!', 'success');
        }
    } catch (error) {
        console.error('❌ Error deleting customer:', error);
        alert('Fehler beim Löschen des Kunden: ' + error.message);
    }
}

// Handle Form Submit
async function handleFormSubmit(e) {
    e.preventDefault();

    try {
        // Helper function to safely get element value
        const getValueSafe = (id, defaultValue = '') => {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`⚠️ Element with id "${id}" not found`);
                return defaultValue;
            }
            return element.value || defaultValue;
        };

        const formData = {
            id: getValueSafe('customerId') || generateId(),
            name: getValueSafe('customerName'),
            company: getValueSafe('customerCompany'),
            phone: getValueSafe('customerPhone'),
            email: getValueSafe('customerEmail'),
            address: getValueSafe('customerAddress'),
            city: getValueSafe('customerCity'),
            source: getValueSafe('customerSource'),
            type: getValueSafe('customerType'),
            status: getValueSafe('customerStatus'),
            appointment: getValueSafe('customerAppointment'),
            sageRef: getValueSafe('customerSageRef'),
            followUpDate: getValueSafe('customerFollowUp'),
            notes: getValueSafe('customerNotes'),
            createdAt: new Date().toISOString()
        };

        console.log('📝 Saving customer:', formData.name);

        if (currentEditId) {
            // Update existing customer
            const index = customers.findIndex(c => c.id === currentEditId);
            if (index !== -1) {
                formData.photos = customers[index].photos || [];
                formData.documents = customers[index].documents || [];
                formData.createdAt = customers[index].createdAt;
                customers[index] = formData;
                console.log('✏️ Updated existing customer');
            }
        } else {
            // Add new customer
            formData.photos = [];
            formData.documents = [];
            customers.push(formData);
            console.log('➕ Added new customer, total:', customers.length);
        }

        // Save to localStorage
        localStorage.setItem('woelfeder_customers', JSON.stringify(customers));
        console.log('💾 Saved to localStorage');

        // Save this specific customer to Supabase
        if (typeof saveCustomerToSupabase === 'function') {
            console.log('☁️ Saving to Supabase...');
            await saveCustomerToSupabase(formData);
            console.log('✅ Saved to Supabase');
        }

        console.log('🔄 Rendering customers...');
        renderCustomers();
        updateStats();
        closeModal();
        console.log('✅ Done!');

        // Show success notification
        if (typeof showNotification === 'function') {
            showNotification(`✅ Kunde "${formData.name}" erfolgreich gespeichert!`, 'success');
        }
    } catch (error) {
        console.error('❌ Error saving customer:', error);
        alert('Fehler beim Speichern: ' + error.message);
    }
}

// Handle Photo Upload
function handlePhotoUpload(e) {
    const files = Array.from(e.target.files);
    const photoPreview = document.getElementById('photoPreview');

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const photoDiv = document.createElement('div');
            photoDiv.className = 'photo-item';
            photoDiv.innerHTML = `
                <img src="${event.target.result}" alt="Foto">
            `;
            photoPreview.appendChild(photoDiv);

            // Store photo in customer data
            if (currentEditId) {
                const customer = customers.find(c => c.id === currentEditId);
                if (customer) {
                    if (!customer.photos) customer.photos = [];
                    customer.photos.push(event.target.result);
                    saveCustomers();
                }
            }
        };
        reader.readAsDataURL(file);
    });
}

// Show Customer Details - NEW: Shows Orders instead of direct gates
async function showCustomerDetails(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    document.getElementById('detailsName').textContent = customer.name;

    const detailsContent = document.getElementById('detailsContent');

    // Show loading state
    detailsContent.innerHTML = `
        <div class="details-section">
            <div class="empty-state">Lade Aufträge...</div>
        </div>
    `;

    // Load orders for this customer
    let orders = [];
    if (typeof orderService !== 'undefined') {
        orders = await orderService.loadOrdersForCustomer(customer.id);
    }

    detailsContent.innerHTML = `
        <div class="details-section">
            <h3>Kontaktinformationen</h3>
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Telefon</div>
                    <div class="detail-value">${customer.phone ? `<a href="tel:${customer.phone}" class="contact-link">${escapeHtml(customer.phone)}</a>` : '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Email</div>
                    <div class="detail-value">${customer.email ? `<a href="mailto:${customer.email}" class="contact-link">${escapeHtml(customer.email)}</a>` : '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Adresse</div>
                    <div class="detail-value">${customer.address || '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Firma</div>
                    <div class="detail-value">${customer.company || '-'}</div>
                </div>
            </div>
        </div>

        ${customer.notes ? `
            <div class="details-section">
                <h3>Kundennotizen</h3>
                <div class="detail-item">
                    <div class="detail-value">${escapeHtml(customer.notes).replace(/\n/g, '<br>')}</div>
                </div>
            </div>
        ` : ''}

        <div class="details-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0;">Aufträge (${orders.length})</h3>
                <button class="btn btn-primary" onclick="showNewOrderModal('${customer.id}')">➕ Neuer Auftrag</button>
            </div>

            ${orders.length === 0 ? `
                <div class="empty-state">
                    Noch keine Aufträge vorhanden.<br>
                    <small>Klicken Sie auf "Neuer Auftrag" um einen Auftrag zu erstellen.</small>
                </div>
            ` : `
                <div class="orders-list">
                    ${orders.map(order => `
                        <div class="order-card" onclick="showOrderDetails('${order.id}')">
                            <div class="order-header">
                                <div class="order-number">${order.order_number}</div>
                                <span class="customer-status status-${order.status}">${getStatusLabel(order.status)}</span>
                            </div>
                            <div class="order-info">
                                <div class="order-info-item">
                                    <strong>Typ:</strong> ${getTypeLabel(order.type)}
                                </div>
                                ${order.sage_ref ? `
                                    <div class="order-info-item">
                                        <strong>Sage:</strong> ${escapeHtml(order.sage_ref)}
                                    </div>
                                ` : ''}
                                <div class="order-info-item">
                                    <strong>🚪 Tore:</strong> ${order.gateCount}
                                </div>
                                ${order.appointment ? `
                                    <div class="order-info-item">
                                        <strong>📅 Termin:</strong> ${formatAppointment(order.appointment)}
                                    </div>
                                ` : ''}
                            </div>
                            <div class="order-actions" onclick="event.stopPropagation()">
                                <button class="btn btn-primary btn-small" onclick="editOrder('${order.id}')">✏️ Bearbeiten</button>
                                ${order.status !== 'abgeschlossen' ? `
                                    <button class="btn btn-success btn-small" onclick="completeOrder('${order.id}')">✅ Abschließen</button>
                                ` : ''}
                                <button class="btn btn-danger btn-small" onclick="deleteOrder('${order.id}', '${customer.id}')">🗑️ Löschen</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>

        <div class="details-section">
            <div class="detail-item">
                <div class="detail-label">Kunde erstellt am</div>
                <div class="detail-value">${new Date(customer.createdAt).toLocaleString('de-DE')}</div>
            </div>
        </div>
    `;

    document.getElementById('detailsModal').classList.add('active');
    currentEditId = id;
}

// Edit from Details Modal
function editFromDetails() {
    closeDetailsModal();
    editCustomer(currentEditId);
}

// Close Modal
function closeModal() {
    document.getElementById('customerModal').classList.remove('active');
    currentEditId = null;
}

// Close Details Modal
function closeDetailsModal() {
    document.getElementById('detailsModal').classList.remove('active');
}

// Check Upcoming Appointments
function checkUpcomingAppointments() {
    const now = new Date();
    const upcomingIn24h = customers.filter(c => {
        if (!c.appointment) return false;
        const appointmentDate = new Date(c.appointment);
        const diff = appointmentDate - now;
        return diff > 0 && diff < 24 * 60 * 60 * 1000;
    });

    if (upcomingIn24h.length > 0) {
        const message = upcomingIn24h.map(c =>
            `${c.name} - ${formatAppointment(c.appointment)}`
        ).join('\n');

        console.log(`⚠️ Termine in den nächsten 24h:\n${message}`);
    }

    // Check again in 1 hour
    setTimeout(checkUpcomingAppointments, 60 * 60 * 1000);
}

// Helper Functions
function generateId() {
    return 'customer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getStatusLabel(status) {
    const labels = {
        'anfrage': 'Anfrage',
        'termin': 'Termin',
        'angebot': 'Angebot',
        'auftrag': 'Auftrag',
        'abgeschlossen': 'Abgeschlossen'
    };
    return labels[status] || status;
}

function getTypeLabel(type) {
    const labels = {
        'nur-angebot': 'Nur Angebot',
        'ausmessen-tore': 'Ausmessen Tore',
        'stall-zeichnen': 'Stall zeichnen + ausmessen',
        'bestellung': 'Bestellung/Auftrag'
    };

    // Check custom types
    const customType = customTypes.find(t => t.id === type);
    if (customType) {
        return customType.name;
    }

    return labels[type] || type;
}

function getSourceLabel(source) {
    const labels = {
        'email': 'Email',
        'telefon': 'Telefon',
        'mundpropaganda': 'Mundpropaganda',
        'firma': 'Firma direkt'
    };
    return labels[source] || source;
}

function formatAppointment(appointment) {
    const date = new Date(appointment);
    return date.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function isUpcoming(appointment) {
    const now = new Date();
    const appointmentDate = new Date(appointment);
    const diff = appointmentDate - now;
    return diff > 0 && diff < 24 * 60 * 60 * 1000;
}

function isFollowUpDue(followUpDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const followUp = new Date(followUpDate);
    followUp.setHours(0, 0, 0, 0);
    const diff = followUp - today;
    // Due if today or within next 3 days
    return diff >= 0 && diff <= 3 * 24 * 60 * 60 * 1000;
}

// Export Data (for backup)
function exportData() {
    const dataStr = JSON.stringify(customers, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `woelfleder_kunden_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// Import Data (for restore)
function importData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (confirm(`${imported.length} Kunden importieren? Bestehende Daten werden überschrieben!`)) {
                customers = imported;
                saveCustomers();
                renderCustomers();
                updateStats();
            }
        } catch (error) {
            alert('Fehler beim Importieren der Daten!');
        }
    };
    reader.readAsText(file);
}

function importDataFromFile(file) {
    if (file) {
        importData(file);
    }
}

// ========== SETTINGS FUNCTIONS ==========

// Load Settings
function loadSettings() {
    const stored = localStorage.getItem('woelfeder_settings');
    if (stored) {
        appSettings = JSON.parse(stored);
        // Logo is now fixed - always use logo.png regardless of stored settings
        // if (appSettings.logo) {
        //     document.getElementById('logoImg').src = appSettings.logo;
        // }
    }
    // Always ensure logo is set to woelfleder_Logo.jpg
    const logoImg = document.getElementById('logoImg');
    if (logoImg) {
        logoImg.src = 'woelfleder_Logo.jpg';
    }
}

// Save Settings
function saveSettings() {
    localStorage.setItem('woelfeder_settings', JSON.stringify(appSettings));

    // Sync to cloud if available
    if (typeof syncSettingsToCloud === 'function') {
        syncSettingsToCloud();
    }
}

// Show Settings Modal
function showSettingsModal() {
    renderCustomTypes();
    document.getElementById('settingsModal').classList.add('active');
}

// Close Settings Modal
function closeSettingsModal() {
    document.getElementById('settingsModal').classList.remove('active');
}

// Handle Logo Upload - DISABLED: Logo is now fixed
// function handleLogoUpload(e) {
//     const file = e.target.files[0];
//     if (file) {
//         const reader = new FileReader();
//         reader.onload = function(event) {
//             appSettings.logo = event.target.result;
//             document.getElementById('logoImg').src = event.target.result;
//             saveSettings();
//             alert('Logo erfolgreich hochgeladen!');
//         };
//         reader.readAsDataURL(file);
//     }
// }

// Reset Logo - DISABLED: Logo is now fixed
// function resetLogo() {
//     appSettings.logo = null;
//     document.getElementById('logoImg').src = 'logo.png';
//     saveSettings();
//     alert('Logo zurückgesetzt!');
// }

// ========== CUSTOM TYPES FUNCTIONS ==========

// Load Custom Types
function loadCustomTypes() {
    const stored = localStorage.getItem('woelfeder_custom_types');
    if (stored) {
        customTypes = JSON.parse(stored);
    }
    updateTypeDropdown();
    updateOrderTypeDropdown();
}

// Save Custom Types
function saveCustomTypes() {
    localStorage.setItem('woelfeder_custom_types', JSON.stringify(customTypes));
    updateTypeDropdown();
    updateOrderTypeDropdown();
}

// Add Custom Type
function addCustomType() {
    const input = document.getElementById('newTypeName');
    const name = input.value.trim();

    if (!name) {
        alert('Bitte einen Namen eingeben!');
        return;
    }

    const newType = {
        id: 'custom_' + Date.now(),
        name: name
    };

    customTypes.push(newType);
    saveCustomTypes();
    renderCustomTypes();
    updateOrderTypeDropdown();
    input.value = '';

    // Sync to cloud if available
    if (typeof syncCustomTypeToCloud === 'function') {
        syncCustomTypeToCloud(newType);
    }
}

// Delete Custom Type
function deleteCustomType(id) {
    if (confirm('Diesen Auftragstyp wirklich löschen?')) {
        // Delete from cloud first
        if (typeof deleteCustomTypeFromCloud === 'function') {
            deleteCustomTypeFromCloud(id);
        }

        customTypes = customTypes.filter(t => t.id !== id);
        saveCustomTypes();
        renderCustomTypes();
        updateOrderTypeDropdown();
    }
}

// Render Custom Types List
function renderCustomTypes() {
    const container = document.getElementById('customTypesList');

    // Check if element exists (only in settings page)
    if (!container) {
        return;
    }

    if (customTypes.length === 0) {
        container.innerHTML = '<p style="color: #6c757d; font-size: 14px;">Noch keine eigenen Auftragstypen vorhanden.</p>';
        return;
    }

    container.innerHTML = customTypes.map(type => `
        <div class="custom-type-item">
            <span class="custom-type-name">${escapeHtml(type.name)}</span>
            <button class="btn btn-danger btn-small" onclick="deleteCustomType('${type.id}')">Löschen</button>
        </div>
    `).join('');
}

// Update Type Dropdown
function updateTypeDropdown() {
    const select = document.getElementById('customerType');

    // Check if element exists (only on customer form)
    if (!select) {
        return;
    }

    const currentValue = select.value;

    // Get default options
    const defaultOptions = `
        <option value="">Bitte wählen</option>
        <option value="nur-angebot">Nur Angebot</option>
        <option value="ausmessen-tore">Ausmessen Tore</option>
        <option value="stall-zeichnen">Stall zeichnen + ausmessen</option>
        <option value="bestellung">Bestellung/Auftrag</option>
    `;

    // Add custom types
    const customOptions = customTypes.map(type =>
        `<option value="${type.id}">${escapeHtml(type.name)}</option>`
    ).join('');

    select.innerHTML = defaultOptions + customOptions;
    select.value = currentValue;
}

// Update Order Type Dropdown (for Order form)
function updateOrderTypeDropdown() {
    const select = document.getElementById('orderType');

    if (!select) {
        return;
    }

    const currentValue = select.value;

    const defaultOptions = `
        <option value="standard">Standard</option>
        <option value="ausmessen">Ausmessen Tore</option>
        <option value="montage">Montage</option>
        <option value="reparatur">Reparatur</option>
        <option value="wartung">Wartung</option>
        <option value="beratung">Beratung</option>
    `;

    const customOptions = customTypes.map(type =>
        `<option value="${type.id}">${escapeHtml(type.name)}</option>`
    ).join('');

    select.innerHTML = defaultOptions + customOptions;
    select.value = currentValue;
}

// ========== CUSTOM STATUS FUNCTIONS ==========

// Add Custom Status
function addCustomStatus() {
    const input = document.getElementById('newStatusName');
    const name = input.value.trim();

    if (!name) {
        alert('Bitte einen Namen eingeben!');
        return;
    }

    const newStatus = {
        id: 'custom_status_' + Date.now(),
        name: name
    };

    customStatus.push(newStatus);
    saveCustomStatus();
    renderCustomStatus();
    updateOrderStatusDropdown();
    renderFilterButtons();
    input.value = '';
}

// Delete Custom Status
function deleteCustomStatus(id) {
    if (confirm('Diesen Status wirklich löschen?')) {
        customStatus = customStatus.filter(s => s.id !== id);
        saveCustomStatus();
        renderCustomStatus();
        updateOrderStatusDropdown();
        renderFilterButtons();
    }
}

// Render Custom Status List
function renderCustomStatus() {
    const container = document.getElementById('customStatusList');

    if (!container) {
        return;
    }

    if (customStatus.length === 0) {
        container.innerHTML = '<p style="color: #6c757d; font-size: 14px;">Noch keine eigenen Status vorhanden.</p>';
        return;
    }

    container.innerHTML = customStatus.map(status => `
        <div class="custom-type-item">
            <span class="custom-type-name">${escapeHtml(status.name)}</span>
            <button class="btn btn-danger btn-small" onclick="deleteCustomStatus('${status.id}')">Löschen</button>
        </div>
    `).join('');
}

// Update Order Status Dropdown
function updateOrderStatusDropdown() {
    const select = document.getElementById('orderStatus');

    if (!select) {
        return;
    }

    const currentValue = select.value;

    const defaultOptions = `
        <option value="anfrage">Anfrage</option>
        <option value="termin">Termin vereinbart</option>
        <option value="angebot">Angebot erstellt</option>
        <option value="auftrag">Auftrag erteilt</option>
        <option value="abgeschlossen">Abgeschlossen</option>
    `;

    const customOptions = customStatus.map(status =>
        `<option value="${status.id}">${escapeHtml(status.name)}</option>`
    ).join('');

    select.innerHTML = defaultOptions + customOptions;
    select.value = currentValue;
}

// Save Custom Status to localStorage
function saveCustomStatus() {
    localStorage.setItem('woelfeder_customStatus', JSON.stringify(customStatus));
}

// Load Custom Status from localStorage
function loadCustomStatus() {
    const saved = localStorage.getItem('woelfeder_customStatus');
    if (saved) {
        try {
            customStatus = JSON.parse(saved);
            renderCustomStatus();
            updateOrderStatusDropdown();
            renderFilterButtons();
        } catch (e) {
            console.error('Error loading custom status:', e);
            customStatus = [];
        }
    }
}

// Render Filter Buttons dynamically
function renderFilterButtons() {
    const container = document.querySelector('.filter-buttons');
    if (!container) return;

    const defaultButtons = [
        { id: 'all', label: 'Alle' },
        { id: 'anfrage', label: 'Anfrage' },
        { id: 'termin', label: 'Termin' },
        { id: 'angebot', label: 'Angebot' },
        { id: 'auftrag', label: 'Auftrag' },
        { id: 'abgeschlossen', label: 'Abgeschlossen' }
    ];

    const customButtons = customStatus.map(status => ({
        id: status.id,
        label: status.name
    }));

    const allButtons = [...defaultButtons, ...customButtons];

    container.innerHTML = allButtons.map(btn => `
        <button class="filter-btn ${btn.id === currentFilter ? 'active' : ''}" data-filter="${btn.id}">
            ${escapeHtml(btn.label)}
        </button>
    `).join('');

    // Re-attach event listeners
    container.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderCustomers();
        });
    });
}

// ========== DOCUMENT FUNCTIONS ==========

// Handle Document Upload
function handleDocumentUpload(e) {
    const files = Array.from(e.target.files);
    const documentPreview = document.getElementById('documentPreview');

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const docDiv = document.createElement('div');
            docDiv.className = 'document-item';
            docDiv.innerHTML = `
                <div class="document-info">
                    <span class="document-icon">📄</span>
                    <span class="document-name">${escapeHtml(file.name)}</span>
                </div>
            `;
            documentPreview.appendChild(docDiv);

            // Store document in customer data
            if (currentEditId) {
                const customer = customers.find(c => c.id === currentEditId);
                if (customer) {
                    if (!customer.documents) customer.documents = [];
                    customer.documents.push({
                        name: file.name,
                        data: event.target.result
                    });
                    saveCustomers();
                }
            }
        };
        reader.readAsDataURL(file);
    });
}

// Delete Document
function deleteDocument(index) {
    if (!currentEditId) return;

    const customer = customers.find(c => c.id === currentEditId);
    if (customer && customer.documents) {
        customer.documents.splice(index, 1);
        saveCustomers();
        editCustomer(currentEditId);
    }
}

// Download Document
function downloadDocument(customerId, docIndex) {
    const customer = customers.find(c => c.id === customerId);
    if (customer && customer.documents && customer.documents[docIndex]) {
        const doc = customer.documents[docIndex];
        const link = document.createElement('a');
        link.href = doc.data;
        link.download = doc.name;
        link.click();
    }
}

// Download Photo
function downloadPhoto(customerId, photoIndex) {
    const customer = customers.find(c => c.id === customerId);
    if (customer && customer.photos && customer.photos[photoIndex]) {
        const photo = customer.photos[photoIndex];
        const link = document.createElement('a');
        link.href = photo;
        link.download = `${customer.name}_Foto_${photoIndex + 1}.jpg`;
        link.click();
    }
}

// View Document in new tab
function viewDocument(customerId, docIndex) {
    const customer = customers.find(c => c.id === customerId);
    if (customer && customer.documents && customer.documents[docIndex]) {
        const doc = customer.documents[docIndex];
        window.open(doc.data, '_blank');
    }
}

// Get Document Icon based on file type
function getDocumentIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        'pdf': '📕',
        'doc': '📘',
        'docx': '📘',
        'xls': '📗',
        'xlsx': '📗',
        'txt': '📄',
        'jpg': '🖼️',
        'jpeg': '🖼️',
        'png': '🖼️'
    };
    return icons[ext] || '📄';
}

// ========== TORE/TÜREN FUNCTIONS ==========

// Load and display gates for a customer
async function loadAndDisplayGates(customerId) {
    const container = document.getElementById('gatesListContainer');
    const indicator = document.getElementById('gatesLoadingIndicator');

    if (!container) return;

    // Show loading
    indicator.innerHTML = '<span style="font-size: 12px; color: #6c757d;">⏳ Lädt...</span>';

    try {
        const gates = await loadGatesForCustomer(customerId);

        // Update indicator with count
        if (gates.length > 0) {
            indicator.innerHTML = `<span style="font-size: 0.9rem; color: var(--text-secondary); background: var(--primary-color); color: white; padding: 0.25rem 0.6rem; border-radius: 12px; font-weight: 600;">${gates.length}</span>`;
        } else {
            indicator.innerHTML = '';
        }

        if (gates.length === 0) {
            container.innerHTML = '<div class="empty-state">Noch keine Tore/Türen erstellt</div>';
            return;
        }

        container.innerHTML = `
            <div class="gates-list">
                ${gates.map(gate => {
                    const config = gate.config || {};
                    return `
                    <div class="gate-item" onclick="showGateDetails('${gate.id}')" style="cursor: pointer;">
                        <div class="gate-icon">🚪</div>
                        <div class="gate-info">
                            <div class="gate-name" style="font-weight: 600; font-size: 1rem; color: var(--text-color); margin-bottom: 0.25rem;">
                                ${escapeHtml(gate.name || gate.type || 'Unbenannt')}
                            </div>
                            ${gate.name ? `<div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">${escapeHtml(gate.type)}</div>` : ''}
                            <div class="gate-details-mini" style="display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.9rem; color: var(--text-secondary);">
                                ${gate.width && gate.height ? `
                                    <span style="display: flex; align-items: center; gap: 0.25rem;">
                                        <span style="font-weight: 500;">📏</span>
                                        <span>${gate.width}m × ${gate.height}m</span>
                                    </span>
                                ` : ''}
                                ${config.gesamtflaeche ? `
                                    <span style="display: flex; align-items: center; gap: 0.25rem;">
                                        <span style="font-weight: 500;">⬜</span>
                                        <span>${config.gesamtflaeche.toFixed(2)} m²</span>
                                    </span>
                                ` : ''}
                                ${gate.price ? `
                                    <span style="display: flex; align-items: center; gap: 0.25rem; color: var(--primary-color); font-weight: 600;">
                                        <span>💶</span>
                                        <span>${formatCurrency(gate.price)}</span>
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                        <div class="gate-arrow" style="font-size: 1.5rem; color: var(--primary-color);">→</div>
                    </div>
                `}).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Error loading gates:', error);
        indicator.innerHTML = '';
        container.innerHTML = '<div class="empty-state error-state">Fehler beim Laden der Tore</div>';
    }
}

// Load gate details from Supabase
async function loadGateDetails(gateId) {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        console.error('Supabase client not available');
        return null;
    }

    try {
        const { data, error } = await supabaseClient
            .from('gates')
            .select('*')
            .eq('id', gateId)
            .single();

        if (error) throw error;

        console.log('Gate details loaded:', data);

        // Transform data for display
        return {
            id: data.id,
            name: data.name,
            type: data.gate_type,
            notes: data.notizen,
            width: data.breite ? (data.breite / 100).toFixed(2) : null,
            height: data.hoehe ? (data.hoehe / 100).toFixed(2) : null,
            price: data.inkl_mwst,
            created_at: data.created_at,
            config: {
                breite: data.breite,
                hoehe: data.hoehe,
                glashoehe: data.glashoehe,
                gesamtflaeche: data.gesamtflaeche,
                glasflaeche: data.glasflaeche,
                torflaeche: data.torflaeche,
                subtotal: data.subtotal,
                aufschlag: data.aufschlag,
                aufschlagBetrag: data.aufschlag_betrag,
                exklusiveMwst: data.exklusive_mwst,
                inklMwst: data.inkl_mwst
            }
        };
    } catch (error) {
        console.error('Error loading gate details:', error);
        return null;
    }
}

// Show gate details modal
window.showGateDetails = async function(gateId) {
    try {
        const gate = await loadGateDetails(gateId);

        if (!gate) {
            alert('Tor nicht gefunden');
            return;
        }

        const config = gate.config || {};

        const modalContent = `
            <div class="gate-details-modal" style="color: #1f2937;">
                <h2 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; color: #1f2937;">
                    <span>🚪</span>
                    <span>${escapeHtml(gate.name || gate.type || 'Unbenannt')}</span>
                </h2>
                ${gate.name ? `<div style="font-size: 1rem; color: #6b7280; margin-bottom: 1rem;">Typ: ${escapeHtml(gate.type)}</div>` : ''}

                <!-- Preise - OBEN angezeigt -->
                ${gate.price ? `
                    <div style="background: linear-gradient(135deg, #c8102e 0%, #a00d25 100%); color: white; padding: 1.25rem; border-radius: 10px; margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                            <div>
                                <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 0.25rem;">Gesamtpreis inkl. MwSt.</div>
                                <div style="font-size: 1.75rem; font-weight: 700;">${formatCurrency(gate.price)}</div>
                            </div>
                            ${config.exklusiveMwst ? `
                                <div style="text-align: right;">
                                    <div style="font-size: 0.8rem; opacity: 0.9;">Netto</div>
                                    <div style="font-size: 1.1rem; font-weight: 600;">${formatCurrency(config.exklusiveMwst)}</div>
                                </div>
                            ` : ''}
                        </div>
                        ${config.subtotal && config.aufschlag ? `
                            <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.3); display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.85rem; opacity: 0.95;">
                                <span>Zwischensumme: ${formatCurrency(config.subtotal)}</span>
                                <span>Aufschlag: ${config.aufschlag}% (+${formatCurrency(config.aufschlagBetrag || 0)})</span>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}

                <!-- Abmessungen und Flächen -->
                <div style="margin-bottom: 1rem;">
                    <h3 style="font-size: 1rem; margin-bottom: 0.75rem; color: #1f2937; font-weight: 600;">📏 Abmessungen & Flächen</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 0.65rem;">
                        <div style="background: #f8f9fa; padding: 0.65rem; border-radius: 8px;">
                            <div style="font-size: 0.7rem; color: #6b7280; margin-bottom: 0.2rem;">Breite</div>
                            <div style="font-size: 1rem; font-weight: 600; color: #1f2937;">${gate.width || '-'} m</div>
                        </div>
                        <div style="background: #f8f9fa; padding: 0.65rem; border-radius: 8px;">
                            <div style="font-size: 0.7rem; color: #6b7280; margin-bottom: 0.2rem;">Höhe</div>
                            <div style="font-size: 1rem; font-weight: 600; color: #1f2937;">${gate.height || '-'} m</div>
                        </div>
                        ${config.glashoehe ? `
                            <div style="background: #f8f9fa; padding: 0.65rem; border-radius: 8px;">
                                <div style="font-size: 0.7rem; color: #6b7280; margin-bottom: 0.2rem;">Glashöhe</div>
                                <div style="font-size: 1rem; font-weight: 600; color: #1f2937;">${(config.glashoehe / 100).toFixed(2)} m</div>
                            </div>
                        ` : ''}
                        ${config.gesamtflaeche ? `
                            <div style="background: #f8f9fa; padding: 0.65rem; border-radius: 8px;">
                                <div style="font-size: 0.7rem; color: #6b7280; margin-bottom: 0.2rem;">Gesamtfläche</div>
                                <div style="font-size: 1rem; font-weight: 600; color: #c8102e;">${config.gesamtflaeche.toFixed(2)} m²</div>
                            </div>
                        ` : ''}
                        ${config.glasflaeche ? `
                            <div style="background: #f8f9fa; padding: 0.65rem; border-radius: 8px;">
                                <div style="font-size: 0.7rem; color: #6b7280; margin-bottom: 0.2rem;">Glasfläche</div>
                                <div style="font-size: 0.95rem; font-weight: 600; color: #1f2937;">${config.glasflaeche.toFixed(2)} m²</div>
                            </div>
                        ` : ''}
                        ${config.torflaeche ? `
                            <div style="background: #f8f9fa; padding: 0.65rem; border-radius: 8px;">
                                <div style="font-size: 0.7rem; color: #6b7280; margin-bottom: 0.2rem;">Torfläche</div>
                                <div style="font-size: 0.95rem; font-weight: 600; color: #1f2937;">${config.torflaeche.toFixed(2)} m²</div>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Ausgewählte Produkte -->
                ${gate.notes ? `
                    <div style="margin-bottom: 1rem;">
                        <h3 style="font-size: 1rem; margin-bottom: 0.75rem; color: #1f2937; font-weight: 600;">📦 Ausgewählte Produkte</h3>
                        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; border-left: 4px solid #c8102e;">
                            <pre style="white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; line-height: 1.6; font-size: 0.85rem; color: #1f2937;">${escapeHtml(gate.notes)}</pre>
                        </div>
                    </div>
                ` : ''}

                <!-- Erstellungsdatum -->
                <div style="border-top: 1px solid #e5e7eb; padding-top: 0.75rem; margin-top: 0.75rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; color: #6b7280; font-size: 0.85rem;">
                        <span>📅</span>
                        <span>Erstellt am: ${new Date(gate.created_at || gate.createdAt).toLocaleString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</span>
                    </div>
                </div>

                <div style="margin-top: 1.25rem; display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" onclick="closeGateDetailsModal()" style="flex: 1;">Schließen</button>
                </div>
            </div>
        `;

        // Create and show gate details modal
        let gateModal = document.getElementById('gateDetailsModal');
        if (!gateModal) {
            gateModal = document.createElement('div');
            gateModal.id = 'gateDetailsModal';
            gateModal.className = 'modal';
            gateModal.innerHTML = `
                <div class="modal-content" style="max-width: 800px; width: 95%; max-height: 95vh; overflow-y: auto; padding: 0; margin: auto;">
                    <div id="gateDetailsContent" style="padding: 1rem;"></div>
                </div>
            `;
            document.body.appendChild(gateModal);
        }

        document.getElementById('gateDetailsContent').innerHTML = modalContent;
        gateModal.classList.add('active');

    } catch (error) {
        console.error('Error showing gate details:', error);
        alert('Fehler beim Laden der Tor-Details');
    }
}

// Close gate details modal
window.closeGateDetailsModal = function() {
    const modal = document.getElementById('gateDetailsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Close order details modal
window.closeOrderDetailsModal = function() {
    const modal = document.getElementById('orderDetailsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Toggle gates section
function toggleGatesSection() {
    const container = document.getElementById('gatesListContainer');
    const icon = document.getElementById('gatesToggleIcon');

    if (container.style.display === 'none') {
        container.style.display = 'block';
        icon.textContent = '▲';
    } else {
        container.style.display = 'none';
        icon.textContent = '▼';
    }
}

// ========== ORDER FUNCTIONS (AUFTRÄGE) ==========

// Show New Order Modal
async function showNewOrderModal(customerId) {
    document.getElementById('orderModalTitle').textContent = 'Neuer Auftrag';
    document.getElementById('orderForm').reset();
    document.getElementById('orderId').value = '';
    document.getElementById('orderCustomerId').value = customerId;

    // Suggest order number, but user can edit it
    if (typeof orderService !== 'undefined') {
        const orderNumber = await orderService.generateOrderNumber(customerId);
        document.getElementById('orderNumber').value = orderNumber;
    }

    document.getElementById('orderModal').classList.add('active');
}

// Edit Order
async function editOrder(orderId) {
    if (typeof orderService === 'undefined') {
        alert('Order Service nicht verfügbar');
        return;
    }

    const order = await orderService.getOrderById(orderId);
    if (!order) {
        alert('Auftrag nicht gefunden');
        return;
    }

    document.getElementById('orderModalTitle').textContent = 'Auftrag bearbeiten';
    document.getElementById('orderId').value = order.id;
    document.getElementById('orderCustomerId').value = order.customer_id;
    document.getElementById('orderNumber').value = order.order_number;
    document.getElementById('orderType').value = order.type;
    document.getElementById('orderStatus').value = order.status;
    document.getElementById('orderSageRef').value = order.sage_ref || '';
    document.getElementById('orderAppointment').value = order.appointment || '';
    document.getElementById('orderFollowUpDate').value = order.follow_up_date || '';
    document.getElementById('orderNotes').value = order.notes || '';

    document.getElementById('orderModal').classList.add('active');
}

// Handle Order Form Submit
async function handleOrderSubmit(event) {
    event.preventDefault();

    if (typeof orderService === 'undefined') {
        alert('Order Service nicht verfügbar');
        return;
    }

    const orderId = document.getElementById('orderId').value;
    const customerId = document.getElementById('orderCustomerId').value;
    const orderNumber = document.getElementById('orderNumber').value;

    // Validate order number
    if (!orderNumber || orderNumber.trim() === '') {
        alert('Bitte geben Sie eine Auftragsnummer ein');
        return;
    }

    const orderData = {
        orderNumber: orderNumber,
        type: document.getElementById('orderType').value,
        status: document.getElementById('orderStatus').value,
        sageRef: document.getElementById('orderSageRef').value,
        appointment: document.getElementById('orderAppointment').value,
        followUpDate: document.getElementById('orderFollowUpDate').value,
        notes: document.getElementById('orderNotes').value
    };

    let success = false;
    let savedOrderId = orderId;

    if (orderId) {
        // Update existing order
        success = await orderService.updateOrder(orderId, orderData);
        if (success) {
            showNotification('✅ Auftrag erfolgreich aktualisiert!', 'success');
        }
    } else {
        // Create new order
        const newOrder = await orderService.createOrder(customerId, orderData);
        success = newOrder !== null;
        savedOrderId = newOrder?.id;
        if (success) {
            showNotification('✅ Auftrag erfolgreich erstellt!', 'success');
        }
    }

    if (success && savedOrderId) {
        // Upload photos
        const photoFiles = document.getElementById('orderPhotos').files;
        if (photoFiles && photoFiles.length > 0) {
            showNotification(`📤 ${photoFiles.length} Foto(s) werden hochgeladen...`, 'info');
            for (let file of photoFiles) {
                await uploadOrderFile(file, savedOrderId, 'photo');
            }
        }

        // Upload documents
        const docFiles = document.getElementById('orderDocuments').files;
        if (docFiles && docFiles.length > 0) {
            showNotification(`📤 ${docFiles.length} Dokument(e) werden hochgeladen...`, 'info');
            for (let file of docFiles) {
                await uploadOrderFile(file, savedOrderId, 'document');
            }
        }

        closeOrderModal();
        // Refresh customer details
        showCustomerDetails(customerId);
        // Update open orders count
        updateOpenOrdersCount();
    } else {
        alert('Fehler beim Speichern des Auftrags');
    }
}

// Close Order Modal
function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

// Complete Order (Mark as Abgeschlossen)
async function completeOrder(orderId) {
    if (!confirm('Auftrag als abgeschlossen markieren?')) {
        return;
    }

    if (typeof orderService === 'undefined') {
        alert('Order Service nicht verfügbar');
        return;
    }

    const success = await orderService.completeOrder(orderId);

    if (success) {
        alert('Auftrag abgeschlossen!');
        // Refresh the customer details view
        const order = await orderService.getOrderById(orderId);
        if (order) {
            showCustomerDetails(order.customer_id);
        }
        // Update open orders count
        updateOpenOrdersCount();
    } else {
        alert('Fehler beim Abschließen des Auftrags');
    }
}

// Delete Order
async function deleteOrder(orderId, customerId) {
    if (!confirm('Auftrag wirklich löschen? Dies wird auch alle zugehörigen Tore löschen!')) {
        return;
    }

    if (typeof orderService === 'undefined') {
        alert('Order Service nicht verfügbar');
        return;
    }

    try {
        // Delete all gates for this order first
        if (supabaseClient) {
            const { error: gatesError } = await supabaseClient
                .from('gates')
                .delete()
                .eq('order_id', orderId);

            if (gatesError) {
                console.error('Error deleting gates:', gatesError);
            }
        }

        // Delete the order
        const success = await orderService.deleteOrder(orderId);

        if (success) {
            showNotification('✅ Auftrag gelöscht!', 'success');
            // Refresh the customer details view
            showCustomerDetails(customerId);
            // Update open orders count
            updateOpenOrdersCount();
        } else {
            alert('Fehler beim Löschen des Auftrags');
        }
    } catch (error) {
        console.error('Error deleting order:', error);
        alert('Fehler beim Löschen des Auftrags: ' + error.message);
    }
}

// Show Order Details (with gates)
async function showOrderDetails(orderId) {
    if (typeof orderService === 'undefined') {
        alert('Order Service nicht verfügbar');
        return;
    }

    const order = await orderService.getOrderById(orderId);
    if (!order) {
        alert('Auftrag nicht gefunden');
        return;
    }

    // Load files
    const { photos, documents } = await loadOrderFiles(orderId);

    // Create a modal for order details
    const modalContent = `
        <div style="padding: 1.5rem;">
            <h2 style="margin-bottom: 1rem;">${order.order_number}</h2>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                <div>
                    <div style="font-size: 0.8rem; color: #6b7280; margin-bottom: 0.25rem;">Status</div>
                    <div><span class="customer-status status-${order.status}">${getStatusLabel(order.status)}</span></div>
                </div>
                <div>
                    <div style="font-size: 0.8rem; color: #6b7280; margin-bottom: 0.25rem;">Typ</div>
                    <div>${getTypeLabel(order.type)}</div>
                </div>
                ${order.sage_ref ? `
                    <div>
                        <div style="font-size: 0.8rem; color: #6b7280; margin-bottom: 0.25rem;">Sage Nummer</div>
                        <div>${escapeHtml(order.sage_ref)}</div>
                    </div>
                ` : ''}
                ${order.appointment ? `
                    <div>
                        <div style="font-size: 0.8rem; color: #6b7280; margin-bottom: 0.25rem;">Termin</div>
                        <div>${formatAppointment(order.appointment)}</div>
                    </div>
                ` : ''}
            </div>

            ${order.notes ? `
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">Notizen</h3>
                    <div style="padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                        ${escapeHtml(order.notes).replace(/\n/g, '<br>')}
                    </div>
                </div>
            ` : ''}

            <div style="margin-bottom: 1rem;">
                <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">Tore/Türen (${order.gates.length})</h3>
            </div>

            ${order.gates.length === 0 ? `
                <div class="empty-state">Noch keine Tore für diesen Auftrag erstellt</div>
            ` : `
                <div style="display: grid; gap: 1rem;">
                    ${order.gates.map(gate => `
                        <div style="padding: 1rem; background: white; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; transition: all 0.2s;"
                             onclick="event.stopPropagation(); showGateDetails('${gate.id}')"
                             onmouseover="this.style.boxShadow='0 4px 12px rgba(200, 16, 46, 0.15)'; this.style.transform='translateY(-2px)'"
                             onmouseout="this.style.boxShadow=''; this.style.transform=''">
                            <div style="font-weight: 600; margin-bottom: 0.5rem;">${escapeHtml(gate.name || 'Tor')}</div>
                            <div style="font-size: 0.85rem; color: #6b7280;">
                                ${gate.breite && gate.hoehe ? `${(gate.breite/100).toFixed(2)}m × ${(gate.hoehe/100).toFixed(2)}m` : 'Keine Maße'}
                            </div>
                            ${gate.inkl_mwst ? `
                                <div style="font-weight: 600; color: #c8102e; margin-top: 0.5rem;">
                                    ${formatCurrency(gate.inkl_mwst)}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `}

            ${photos.length > 0 ? `
                <div style="margin: 1.5rem 0;">
                    <h3 style="font-size: 1rem; margin-bottom: 0.75rem;">📷 Fotos (${photos.length})</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem;">
                        ${photos.map(photo => `
                            <div style="position: relative; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: white;">
                                <img src="${photo.url}" alt="${photo.name}" style="width: 100%; height: 150px; object-fit: cover; cursor: pointer;" onclick="window.open('${photo.url}', '_blank')">
                                <div style="padding: 0.5rem; display: flex; gap: 0.5rem; justify-content: space-between; align-items: center;">
                                    <button class="btn btn-primary btn-small" style="flex: 1; font-size: 0.75rem; padding: 0.3rem;" onclick="downloadFile('${photo.url}', '${photo.name}')">⬇️</button>
                                    <button class="btn btn-danger btn-small" style="flex: 1; font-size: 0.75rem; padding: 0.3rem;" onclick="handleDeleteOrderFile('${photo.path}', '${order.id}')">🗑️</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            ${documents.length > 0 ? `
                <div style="margin: 1.5rem 0;">
                    <h3 style="font-size: 1rem; margin-bottom: 0.75rem;">📄 Dokumente (${documents.length})</h3>
                    <div style="display: grid; gap: 0.75rem;">
                        ${documents.map(doc => `
                            <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: white; border: 1px solid #e5e7eb; border-radius: 8px;">
                                <div style="flex: 1; min-width: 0;">
                                    <div style="font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${doc.name}</div>
                                    <div style="font-size: 0.75rem; color: #6b7280;">${(doc.size / 1024).toFixed(1)} KB</div>
                                </div>
                                <div style="display: flex; gap: 0.5rem;">
                                    <button class="btn btn-primary btn-small" onclick="downloadFile('${doc.url}', '${doc.name}')">⬇️ Download</button>
                                    <button class="btn btn-danger btn-small" onclick="handleDeleteOrderFile('${doc.path}', '${order.id}')">🗑️ Löschen</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb;">
                <button class="btn btn-primary" onclick="editOrder('${order.id}'); closeOrderDetailsModal();">✏️ Bearbeiten</button>
                <button class="btn btn-secondary" onclick="closeOrderDetailsModal()">Schließen</button>
            </div>
        </div>
    `;

    // Create/reuse order details modal
    let modal = document.getElementById('orderDetailsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'orderDetailsModal';
        modal.className = 'modal';
        modal.innerHTML = '<div class="modal-content" style="max-width: 900px;"><div id="orderDetailsContent"></div></div>';
        document.body.appendChild(modal);
    }

    if (modal) {
        modal.querySelector('.modal-content').innerHTML = modalContent;
        modal.classList.add('active');
    }
}

// Format currency helper
function formatCurrency(value) {
    if (!value && value !== 0) return '-';
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR'
    }).format(value);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const customerModal = document.getElementById('customerModal');
    const detailsModal = document.getElementById('detailsModal');
    const settingsModal = document.getElementById('settingsModal');
    const orderModal = document.getElementById('orderModal');

    if (event.target === customerModal) {
        closeModal();
    }
    if (event.target === detailsModal) {
        closeDetailsModal();
    }
    if (event.target === settingsModal) {
        closeSettingsModal();
    }
    if (event.target === orderModal) {
        closeOrderModal();
    }
}

// iPhone Installation Instructions
function showInstallInstructions() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone);

    if (isIOS && !isInStandaloneMode) {
        alert('📱 Zum iPhone Startbildschirm hinzufügen:\n\n1. Tippe auf das Teilen-Symbol (□↑) unten\n2. Scrolle nach unten\n3. Wähle "Zum Home-Bildschirm"\n4. Tippe auf "Hinzufügen"\n\nDie App erscheint dann als Icon auf deinem Startbildschirm!');
    } else if (isIOS && isInStandaloneMode) {
        alert('✅ Die App ist bereits auf deinem Startbildschirm installiert!');
    } else {
        alert('ℹ️ Diese Funktion ist nur auf iPhone/iPad verfügbar.\n\nAuf Android: Öffne das Menü (⋮) und wähle "Zum Startbildschirm hinzufügen"');
    }
}

// ============================================
// OPEN ORDERS DROPDOWN
// ============================================

/**
 * Toggle open orders dropdown
 */
function toggleOpenOrdersDropdown() {
    const dropdown = document.getElementById('openOrdersDropdown');

    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
        dropdown.style.display = 'block';
        loadOpenOrders();
    } else {
        dropdown.style.display = 'none';
    }
}

/**
 * Load open orders (not completed)
 */
async function loadOpenOrders() {
    if (typeof orderService === 'undefined' || !orderService) {
        console.error('Order service not available');
        return;
    }

    const openOrdersList = document.getElementById('openOrdersList');
    openOrdersList.innerHTML = '<div style="padding: 1rem; text-align: center;">Laden...</div>';

    try {
        // Get all orders
        const allOrders = await orderService.getAllOrders();

        // Filter open orders (not abgeschlossen)
        const openOrders = allOrders.filter(order => order.status !== 'abgeschlossen');

        // Update count
        document.getElementById('openOrdersCount').textContent = openOrders.length;

        if (openOrders.length === 0) {
            openOrdersList.innerHTML = '<div class="dropdown-empty">Keine offenen Aufträge</div>';
            return;
        }

        // Load customer names for each order
        const ordersWithCustomers = await Promise.all(
            openOrders.map(async (order) => {
                // Find customer by ID
                let customerName = 'Unbekannt';

                // Try to find in localStorage customers
                const customer = customers.find(c => c.id === order.customer_id);
                if (customer) {
                    customerName = customer.name;
                } else if (typeof loadCustomerById === 'function') {
                    // Try to load from Supabase
                    const loadedCustomer = await loadCustomerById(order.customer_id);
                    if (loadedCustomer) {
                        customerName = loadedCustomer.name;
                    }
                }

                return {
                    ...order,
                    customerName
                };
            })
        );

        // Render open orders
        openOrdersList.innerHTML = ordersWithCustomers.map(order => `
            <div class="dropdown-order-item" onclick="openOrderFromDropdown('${order.id}')">
                <div class="dropdown-order-number">${order.order_number}</div>
                <div class="dropdown-order-customer">👤 ${order.customerName}</div>
                <div class="dropdown-order-meta">
                    <span class="status-badge status-${order.status}">${getStatusLabel(order.status)}</span>
                    <span>🚪 ${order.gateCount || 0} Tor(e)</span>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading open orders:', error);
        openOrdersList.innerHTML = '<div class="dropdown-empty">Fehler beim Laden</div>';
    }
}

/**
 * Open order from dropdown
 */
async function openOrderFromDropdown(orderId) {
    // Close dropdown
    document.getElementById('openOrdersDropdown').classList.remove('show');

    // Open order details
    await showOrderDetails(orderId);
}

/**
 * Load customer by ID (helper function)
 */
async function loadCustomerById(customerId) {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        return null;
    }

    try {
        const { data, error } = await supabaseClient
            .from('customers')
            .select('*')
            .eq('id', customerId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error loading customer:', error);
        return null;
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('openOrdersDropdown');
    const button = document.getElementById('openOrdersBtn');

    if (dropdown && button && !dropdown.contains(event.target) && !button.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

// Listen for gate-saved events from TT-App (automatic refresh)
window.addEventListener('message', async function(event) {
    // Security: Check origin in production
    if (event.data && event.data.type === 'gate-saved') {
        console.log('📨 Received gate-saved event from TT-App:', event.data);

        const { orderId, customerId } = event.data;

        // If order details modal is open, refresh it
        const orderDetailsModal = document.getElementById('orderDetailsModal');
        if (orderDetailsModal && orderDetailsModal.classList.contains('active')) {
            console.log('🔄 Refreshing order details...');
            if (orderId) {
                // Small delay to allow database to update
                setTimeout(() => {
                    showOrderDetails(orderId);
                }, 300);
            }
        }

        // If customer details are open, refresh the order list
        const detailsModal = document.getElementById('detailsModal');
        if (detailsModal && detailsModal.classList.contains('active') && customerId) {
            console.log('🔄 Refreshing customer details...');
            setTimeout(async () => {
                await showCustomerDetails(customerId);
            }, 300);
        }

        // Show success notification
        showNotification('✅ Tor erfolgreich gespeichert!', 'success');
    }
});

// Show notification helper
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        font-weight: 600;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// ============================================
// FILE MANAGEMENT FOR ORDERS
// ============================================

/**
 * Upload file to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} orderId - The order ID
 * @param {string} type - 'photo' or 'document'
 * @returns {Promise<string|null>} - The file URL or null on error
 */
async function uploadOrderFile(file, orderId, type = 'document') {
    if (!supabaseClient || !currentUser) {
        console.error('Supabase not initialized');
        return null;
    }

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${currentUser.id}/${orderId}/${type}s/${fileName}`;

        console.log(`📤 Uploading ${type}:`, fileName);

        const { data, error } = await supabaseClient.storage
            .from('order-files')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabaseClient.storage
            .from('order-files')
            .getPublicUrl(filePath);

        console.log(`✅ ${type} uploaded successfully:`, urlData.publicUrl);

        return {
            url: urlData.publicUrl,
            path: filePath,
            name: file.name,
            size: file.size,
            type: file.type
        };
    } catch (error) {
        console.error(`Error uploading ${type}:`, error);
        alert(`Fehler beim Hochladen: ${error.message}`);
        return null;
    }
}

/**
 * Delete file from Supabase Storage
 * @param {string} filePath - The file path in storage
 * @returns {Promise<boolean>}
 */
async function deleteOrderFile(filePath) {
    if (!supabaseClient) {
        console.error('Supabase not initialized');
        return false;
    }

    try {
        const { error } = await supabaseClient.storage
            .from('order-files')
            .remove([filePath]);

        if (error) throw error;

        console.log('✅ File deleted:', filePath);
        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
}

/**
 * Download file
 * @param {string} url - The file URL
 * @param {string} filename - The filename
 */
function downloadFile(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/**
 * Load files for an order from Supabase Storage
 * @param {string} orderId - The order ID
 * @returns {Promise<{photos: Array, documents: Array}>}
 */
async function loadOrderFiles(orderId) {
    if (!supabaseClient || !currentUser) {
        return { photos: [], documents: []};
    }

    try {
        const basePath = `${currentUser.id}/${orderId}`;

        // List photos
        const { data: photoData, error: photoError } = await supabaseClient.storage
            .from('order-files')
            .list(`${basePath}/photos`, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' }
            });

        // List documents
        const { data: docData, error: docError } = await supabaseClient.storage
            .from('order-files')
            .list(`${basePath}/documents`, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' }
            });

        const photos = (photoData || []).map(file => {
            const { data: urlData } = supabaseClient.storage
                .from('order-files')
                .getPublicUrl(`${basePath}/photos/${file.name}`);

            return {
                name: file.name,
                path: `${basePath}/photos/${file.name}`,
                url: urlData.publicUrl,
                size: file.metadata?.size || 0,
                created_at: file.created_at
            };
        });

        const documents = (docData || []).map(file => {
            const { data: urlData } = supabaseClient.storage
                .from('order-files')
                .getPublicUrl(`${basePath}/documents/${file.name}`);

            return {
                name: file.name,
                path: `${basePath}/documents/${file.name}`,
                url: urlData.publicUrl,
                size: file.metadata?.size || 0,
                created_at: file.created_at
            };
        });

        return { photos, documents };
    } catch (error) {
        console.error('Error loading order files:', error);
        return { photos: [], documents: [] };
    }
}

/**
 * Delete file and update UI
 * @param {string} filePath - The file path
 * @param {string} orderId - The order ID
 */
async function handleDeleteOrderFile(filePath, orderId) {
    if (!confirm('Datei wirklich löschen?')) {
        return;
    }

    const success = await deleteOrderFile(filePath);
    if (success) {
        showNotification('✅ Datei gelöscht!', 'success');
        // Refresh order details
        showOrderDetails(orderId);
    } else {
        alert('Fehler beim Löschen der Datei');
    }
}

window.uploadOrderFile = uploadOrderFile;
window.deleteOrderFile = deleteOrderFile;
window.downloadFile = downloadFile;
window.loadOrderFiles = loadOrderFiles;
window.handleDeleteOrderFile = handleDeleteOrderFile;
