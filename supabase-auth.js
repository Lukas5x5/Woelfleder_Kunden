// ============================================
// SUPABASE AUTHENTIFIZIERUNG & SYNC
// ============================================

let supabaseClient = null;
let currentUser = null;

// Supabase Client initialisieren
function initSupabase() {
    if (typeof SUPABASE_URL === 'undefined' || typeof SUPABASE_ANON_KEY === 'undefined') {
        console.error('❌ Supabase Konfiguration fehlt! Bitte supabase-config.js konfigurieren.');
        return false;
    }

    if (SUPABASE_URL === 'IHRE-PROJECT-URL-HIER' || SUPABASE_ANON_KEY === 'IHR-ANON-KEY-HIER') {
        console.warn('⚠️ Supabase nicht konfiguriert. App läuft im Offline-Modus.');
        return false;
    }

    try {
        const { createClient } = supabase;
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase initialisiert');
        return true;
    } catch (error) {
        console.error('❌ Supabase Fehler:', error);
        return false;
    }
}

// Prüfen ob Benutzer angemeldet ist
async function checkAuth() {
    if (!supabaseClient) {
        hideLoginScreen();
        return;
    }

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();

        if (session) {
            currentUser = session.user;
            hideLoginScreen();
            displayUserEmail(currentUser.email);
            await syncFromCloud();
        } else {
            showLoginScreen();
        }
    } catch (error) {
        console.error('Auth Fehler:', error);
        showLoginScreen();
    }
}

// Login Handler
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    showAuthMessage('Anmeldung läuft...', 'info');

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        currentUser = data.user;
        showAuthMessage('✅ Erfolgreich angemeldet!', 'success');

        setTimeout(() => {
            hideLoginScreen();
            displayUserEmail(currentUser.email);
            syncFromCloud();
        }, 1000);

    } catch (error) {
        showAuthMessage('❌ Fehler: ' + error.message, 'error');
    }
}

// Register Handler
async function handleRegister(event) {
    event.preventDefault();

    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

    if (password !== passwordConfirm) {
        showAuthMessage('❌ Passwörter stimmen nicht überein!', 'error');
        return;
    }

    showAuthMessage('Registrierung läuft...', 'info');

    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password
        });

        if (error) throw error;

        showAuthMessage('✅ Registrierung erfolgreich! Bitte bestätigen Sie Ihre Email.', 'success');

        // Nach erfolgreicher Registrierung zum Login wechseln
        setTimeout(() => {
            showLoginForm();
        }, 3000);

    } catch (error) {
        showAuthMessage('❌ Fehler: ' + error.message, 'error');
    }
}

// Logout Handler
async function handleLogout() {
    if (!supabaseClient) return;

    if (confirm('Möchten Sie sich wirklich abmelden?')) {
        try {
            await supabaseClient.auth.signOut();
            currentUser = null;
            showLoginScreen();
            showAuthMessage('Erfolgreich abgemeldet', 'success');
        } catch (error) {
            console.error('Logout Fehler:', error);
        }
    }
}

// UI Funktionen
function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.querySelector('.container').style.display = 'none';
}

function hideLoginScreen() {
    document.getElementById('loginScreen').style.display = 'none';
    document.querySelector('.container').style.display = 'block';
}

function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('authMessage').innerHTML = '';
}

function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('authMessage').innerHTML = '';
}

function showAuthMessage(message, type) {
    const messageEl = document.getElementById('authMessage');
    messageEl.textContent = message;
    messageEl.className = 'auth-message ' + type;
    messageEl.style.display = 'block';
}

function displayUserEmail(email) {
    document.getElementById('userEmail').textContent = email;
}

// ============================================
// CLOUD SYNC FUNKTIONEN
// ============================================

// Daten von Cloud laden
async function syncFromCloud() {
    if (!supabaseClient || !currentUser) return;

    try {
        // Kunden laden
        const { data: customersData, error: customersError } = await supabaseClient
            .from('customers')
            .select('*')
            .eq('user_id', currentUser.id);

        if (customersError) throw customersError;

        if (customersData && customersData.length > 0) {
            // Konvertiere Supabase Format zu lokalem Format
            customers = customersData.map(c => ({
                id: c.id,
                name: c.name,
                phone: c.phone,
                email: c.email,
                address: c.address,
                source: c.source,
                type: c.type,
                status: c.status,
                appointment: c.appointment,
                sageRef: c.sage_ref,
                followUpDate: c.follow_up_date,
                notes: c.notes,
                photos: c.photos || [],
                documents: c.documents || [],
                createdAt: c.created_at
            }));

            localStorage.setItem('woelfeder_customers', JSON.stringify(customers));
        }

        // Custom Types laden
        const { data: typesData, error: typesError } = await supabaseClient
            .from('custom_types')
            .select('*')
            .eq('user_id', currentUser.id);

        if (typesError) throw typesError;

        if (typesData) {
            customTypes = typesData;
            localStorage.setItem('woelfeder_custom_types', JSON.stringify(customTypes));
        }

        // Settings laden
        const { data: settingsData, error: settingsError } = await supabaseClient
            .from('app_settings')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();

        if (settingsData) {
            appSettings = {
                logo: settingsData.logo
            };
            localStorage.setItem('woelfeder_settings', JSON.stringify(appSettings));
        }

        console.log('✅ Daten von Cloud geladen');
        renderCustomers();
        updateStats();

    } catch (error) {
        console.error('Sync Fehler:', error);
    }
}

// Daten in Cloud speichern
async function syncToCloud() {
    if (!supabaseClient || !currentUser) {
        // Offline-Modus: nur lokal speichern
        return;
    }

    try {
        // Alle Kunden syncen
        for (const customer of customers) {
            const dbCustomer = {
                id: customer.id,
                user_id: currentUser.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                address: customer.address,
                source: customer.source,
                type: customer.type,
                status: customer.status,
                appointment: customer.appointment || null,
                sage_ref: customer.sageRef,
                follow_up_date: customer.followUpDate || null,
                notes: customer.notes,
                photos: customer.photos || [],
                documents: customer.documents || [],
                created_at: customer.createdAt,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabaseClient
                .from('customers')
                .upsert(dbCustomer);

            if (error) throw error;
        }

        console.log('✅ Daten in Cloud gespeichert');
    } catch (error) {
        console.error('Cloud Sync Fehler:', error);
    }
}

// Custom Type in Cloud speichern
async function syncCustomTypeToCloud(type) {
    if (!supabaseClient || !currentUser) return;

    try {
        const { error } = await supabaseClient
            .from('custom_types')
            .upsert({
                id: type.id,
                user_id: currentUser.id,
                name: type.name,
                created_at: new Date().toISOString()
            });

        if (error) throw error;
    } catch (error) {
        console.error('Custom Type Sync Fehler:', error);
    }
}

// Custom Type aus Cloud löschen
async function deleteCustomTypeFromCloud(typeId) {
    if (!supabaseClient || !currentUser) return;

    try {
        const { error } = await supabaseClient
            .from('custom_types')
            .delete()
            .eq('id', typeId)
            .eq('user_id', currentUser.id);

        if (error) throw error;
    } catch (error) {
        console.error('Delete Custom Type Fehler:', error);
    }
}

// Settings in Cloud speichern
async function syncSettingsToCloud() {
    if (!supabaseClient || !currentUser) return;

    try {
        const { error } = await supabaseClient
            .from('app_settings')
            .upsert({
                user_id: currentUser.id,
                logo: appSettings.logo,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
    } catch (error) {
        console.error('Settings Sync Fehler:', error);
    }
}

// Einzelnen Kunden aus Cloud löschen
async function deleteCustomerFromCloud(customerId) {
    if (!supabaseClient || !currentUser) return;

    try {
        const { error } = await supabaseClient
            .from('customers')
            .delete()
            .eq('id', customerId)
            .eq('user_id', currentUser.id);

        if (error) throw error;
    } catch (error) {
        console.error('Delete Customer Fehler:', error);
    }
}

// App initialisieren
document.addEventListener('DOMContentLoaded', () => {
    const isSupabaseConfigured = initSupabase();

    if (isSupabaseConfigured) {
        checkAuth();
    } else {
        // Offline-Modus
        console.log('📱 App läuft im Offline-Modus');
        hideLoginScreen();
    }
});
