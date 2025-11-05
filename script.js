// Customer Management App - JavaScript
let customers = [];
let currentEditId = null;
let currentFilter = 'all';
let customTypes = [];
let appSettings = {
    logo: null
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadCustomTypes();
    loadCustomers();
    renderCustomers();
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
    document.getElementById('customerForm').addEventListener('submit', handleFormSubmit);

    // Photo upload
    document.getElementById('customerPhotos').addEventListener('change', handlePhotoUpload);

    // Document upload
    document.getElementById('customerDocuments').addEventListener('change', handleDocumentUpload);

    // Logo upload
    document.getElementById('logoUpload').addEventListener('change', handleLogoUpload);
}

// Load Customers from LocalStorage
function loadCustomers() {
    const stored = localStorage.getItem('woelfeder_customers');
    if (stored) {
        customers = JSON.parse(stored);
    }
}

// Save Customers to LocalStorage and Cloud
function saveCustomers() {
    localStorage.setItem('woelfeder_customers', JSON.stringify(customers));
    updateStats();

    // Sync to cloud if available
    if (typeof syncToCloud === 'function') {
        syncToCloud();
    }
}

// Render Customers List
function renderCustomers(searchTerm = '') {
    const container = document.getElementById('customersList');

    let filtered = customers;

    // Apply filter
    if (currentFilter !== 'all') {
        if (currentFilter === 'followup') {
            // Filter for customers with future follow-up dates
            filtered = filtered.filter(c => {
                if (!c.followUpDate) return false;
                const followUpDate = new Date(c.followUpDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return followUpDate >= today;
            });
        } else {
            filtered = filtered.filter(c => c.status === currentFilter);
        }
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

    container.innerHTML = filtered.map(customer => `
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
    `).join('');
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
}

// Show New Customer Modal
function showNewCustomerModal() {
    currentEditId = null;
    document.getElementById('modalTitle').textContent = 'Neuer Kunde';
    document.getElementById('customerForm').reset();
    document.getElementById('customerId').value = '';
    document.getElementById('photoPreview').innerHTML = '';
    document.getElementById('documentPreview').innerHTML = '';
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
    document.getElementById('customerPhone').value = customer.phone || '';
    document.getElementById('customerEmail').value = customer.email || '';
    document.getElementById('customerAddress').value = customer.address || '';
    document.getElementById('customerSource').value = customer.source;
    document.getElementById('customerType').value = customer.type;
    document.getElementById('customerStatus').value = customer.status;
    document.getElementById('customerAppointment').value = customer.appointment || '';
    document.getElementById('customerSageRef').value = customer.sageRef || '';
    document.getElementById('customerFollowUp').value = customer.followUpDate || '';
    document.getElementById('customerNotes').value = customer.notes || '';

    // Display existing photos
    const photoPreview = document.getElementById('photoPreview');
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

    // Display existing documents
    const documentPreview = document.getElementById('documentPreview');
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

// Delete Customer
function deleteCustomer(id) {
    if (confirm('Möchten Sie diesen Kunden wirklich löschen?')) {
        // Delete from cloud first
        if (typeof deleteCustomerFromCloud === 'function') {
            deleteCustomerFromCloud(id);
        }

        customers = customers.filter(c => c.id !== id);
        saveCustomers();
        renderCustomers();
    }
}

// Handle Form Submit
function handleFormSubmit(e) {
    e.preventDefault();

    const formData = {
        id: document.getElementById('customerId').value || generateId(),
        name: document.getElementById('customerName').value,
        phone: document.getElementById('customerPhone').value,
        email: document.getElementById('customerEmail').value,
        address: document.getElementById('customerAddress').value,
        source: document.getElementById('customerSource').value,
        type: document.getElementById('customerType').value,
        status: document.getElementById('customerStatus').value,
        appointment: document.getElementById('customerAppointment').value,
        sageRef: document.getElementById('customerSageRef').value,
        followUpDate: document.getElementById('customerFollowUp').value,
        notes: document.getElementById('customerNotes').value,
        createdAt: new Date().toISOString()
    };

    if (currentEditId) {
        // Update existing customer
        const index = customers.findIndex(c => c.id === currentEditId);
        if (index !== -1) {
            formData.photos = customers[index].photos || [];
            formData.documents = customers[index].documents || [];
            formData.createdAt = customers[index].createdAt;
            customers[index] = formData;
        }
    } else {
        // Add new customer
        formData.photos = [];
        formData.documents = [];
        customers.push(formData);
    }

    saveCustomers();
    renderCustomers();
    closeModal();
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

// Show Customer Details
function showCustomerDetails(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    document.getElementById('detailsName').textContent = customer.name;

    const detailsContent = document.getElementById('detailsContent');
    detailsContent.innerHTML = `
        <div class="details-section">
            <h3>Kontaktinformationen</h3>
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Telefon</div>
                    <div class="detail-value">${customer.phone || '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Email</div>
                    <div class="detail-value">${customer.email || '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Adresse</div>
                    <div class="detail-value">${customer.address || '-'}</div>
                </div>
            </div>
        </div>

        <div class="details-section">
            <h3>Auftragsinformationen</h3>
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Status</div>
                    <div class="detail-value">
                        <span class="customer-status status-${customer.status}">${getStatusLabel(customer.status)}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Auftragstyp</div>
                    <div class="detail-value">${getTypeLabel(customer.type)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Quelle</div>
                    <div class="detail-value">${getSourceLabel(customer.source)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Sage Nummer</div>
                    <div class="detail-value">${customer.sageRef || '-'}</div>
                </div>
                ${customer.appointment ? `
                    <div class="detail-item">
                        <div class="detail-label">Termin</div>
                        <div class="detail-value">${formatAppointment(customer.appointment)}</div>
                    </div>
                ` : ''}
                ${customer.followUpDate ? `
                    <div class="detail-item">
                        <div class="detail-label">Wiedervorlage</div>
                        <div class="detail-value">${formatDate(customer.followUpDate)}</div>
                    </div>
                ` : ''}
            </div>
        </div>

        ${customer.notes ? `
            <div class="details-section">
                <h3>Notizen</h3>
                <div class="detail-item">
                    <div class="detail-value">${escapeHtml(customer.notes).replace(/\n/g, '<br>')}</div>
                </div>
            </div>
        ` : ''}

        ${customer.photos && customer.photos.length > 0 ? `
            <div class="details-section">
                <h3>Fotos (${customer.photos.length})</h3>
                <div class="photo-gallery">
                    ${customer.photos.map((photo, i) => `
                        <div class="gallery-item" onclick="window.open('${photo}', '_blank')">
                            <img src="${photo}" alt="Foto ${i + 1}">
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}

        ${customer.documents && customer.documents.length > 0 ? `
            <div class="details-section">
                <h3>Dokumente (${customer.documents.length})</h3>
                <div class="document-preview">
                    ${customer.documents.map((doc, i) => `
                        <div class="document-item">
                            <div class="document-info">
                                <span class="document-icon">📄</span>
                                <span class="document-name">${doc.name}</span>
                            </div>
                            <div class="document-actions">
                                <button class="document-btn" onclick="downloadDocument('${customer.id}', ${i})">↓ Download</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}

        <div class="details-section">
            <div class="detail-item">
                <div class="detail-label">Erstellt am</div>
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
        if (appSettings.logo) {
            document.getElementById('logoImg').src = appSettings.logo;
        }
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

// Handle Logo Upload
function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            appSettings.logo = event.target.result;
            document.getElementById('logoImg').src = event.target.result;
            saveSettings();
            alert('Logo erfolgreich hochgeladen!');
        };
        reader.readAsDataURL(file);
    }
}

// Reset Logo
function resetLogo() {
    appSettings.logo = null;
    document.getElementById('logoImg').src = 'logo.png';
    saveSettings();
    alert('Logo zurückgesetzt!');
}

// ========== CUSTOM TYPES FUNCTIONS ==========

// Load Custom Types
function loadCustomTypes() {
    const stored = localStorage.getItem('woelfeder_custom_types');
    if (stored) {
        customTypes = JSON.parse(stored);
    }
    updateTypeDropdown();
}

// Save Custom Types
function saveCustomTypes() {
    localStorage.setItem('woelfeder_custom_types', JSON.stringify(customTypes));
    updateTypeDropdown();
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
    }
}

// Render Custom Types List
function renderCustomTypes() {
    const container = document.getElementById('customTypesList');

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

// Close modal when clicking outside
window.onclick = function(event) {
    const customerModal = document.getElementById('customerModal');
    const detailsModal = document.getElementById('detailsModal');
    const settingsModal = document.getElementById('settingsModal');

    if (event.target === customerModal) {
        closeModal();
    }
    if (event.target === detailsModal) {
        closeDetailsModal();
    }
    if (event.target === settingsModal) {
        closeSettingsModal();
    }
}
