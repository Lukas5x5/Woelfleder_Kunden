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
        // persistSession auf true setzen für "Angemeldet bleiben"
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true
            }
        });
        console.log('✅ Supabase initialisiert');

        // Dispatch event immediately so TT-App can start loading
        window.dispatchEvent(new CustomEvent('supabase-client-ready', {
            detail: { client: supabaseClient }
        }));

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

            // Initialize Order Service
            if (typeof orderService !== 'undefined') {
                orderService.init(supabaseClient, currentUser);
                console.log('✅ Order Service initialized');
            }

            // Dispatch event that user is authenticated (for TT-App)
            window.dispatchEvent(new CustomEvent('supabase-user-ready', {
                detail: { user: currentUser }
            }));

            hideLoginScreen();
            displayUserEmail(currentUser.email);

            // Use new sync system from supabase-sync.js
            if (typeof initSupabaseSync === 'function') {
                await initSupabaseSync();
            } else {
                await syncFromCloud();
            }
        } else {
            showLoginScreen();

            // Dispatch event even if no user (TT-App should not wait forever)
            window.dispatchEvent(new CustomEvent('supabase-user-ready', {
                detail: { user: null }
            }));
        }
    } catch (error) {
        console.error('Auth Fehler:', error);
        showLoginScreen();

        // Dispatch event on error too
        window.dispatchEvent(new CustomEvent('supabase-user-ready', {
            detail: { user: null }
        }));
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

        setTimeout(async () => {
            hideLoginScreen();
            displayUserEmail(currentUser.email);

            // Use new sync system from supabase-sync.js
            if (typeof initSupabaseSync === 'function') {
                await initSupabaseSync();
            } else {
                syncFromCloud();
            }
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
    const loginScreen = document.getElementById('loginScreen');
    const container = document.querySelector('.container');

    if (loginScreen) {
        loginScreen.style.display = 'flex';
    }
    if (container) {
        container.style.display = 'none';
    }
}

function hideLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    const container = document.querySelector('.container');

    if (loginScreen) {
        loginScreen.style.display = 'none';
    }
    if (container) {
        container.style.display = 'block';
    }
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
    const userEmailEl = document.getElementById('userEmail');
    if (userEmailEl) {
        userEmailEl.textContent = email;
    }
}

// ============================================
// CLOUD SYNC FUNKTIONEN
// ============================================

// Daten von Cloud laden (LEGACY - kept for backwards compatibility)
async function syncFromCloud() {
    if (!supabaseClient || !currentUser) return;

    try {
        // Kunden laden - using simplified table structure
        const { data: customersData, error: customersError } = await supabaseClient
            .from('customers')
            .select('*')
            .eq('user_id', currentUser.id);

        if (customersError) throw customersError;

        if (customersData && customersData.length > 0) {
            // Konvertiere Supabase Format zu lokalem Format (complete)
            customers = await Promise.all(customersData.map(async (c) => {
                // Load gates for this customer
                const gates = await loadGatesForCustomerKundenApp(c.id);

                return {
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
                    gates: gates,
                    createdAt: c.created_at
                };
            }));

            localStorage.setItem('woelfeder_customers', JSON.stringify(customers));
        }

        console.log('✅ Daten von Cloud geladen');

        // Re-render if functions are available
        if (typeof renderCustomers === 'function') {
            renderCustomers();
        }
        if (typeof updateStats === 'function') {
            updateStats();
        }

    } catch (error) {
        console.error('Sync Fehler:', error);
    }
}

// Daten in Cloud speichern (LEGACY - use supabase-sync.js functions instead)
async function syncToCloud() {
    if (!supabaseClient || !currentUser) {
        // Offline-Modus: nur lokal speichern
        return;
    }

    try {
        // Alle Kunden syncen (simplified table structure)
        for (const customer of customers) {
            const dbCustomer = {
                id: customer.id,
                user_id: currentUser.id,
                name: customer.name,
                company: customer.company || null,
                phone: customer.phone || null,
                email: customer.email || null,
                address: customer.address || null,
                city: customer.city || null,
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

// ============================================
// TORE/TÜREN FUNKTIONEN
// ============================================

// Tore für einen Kunden laden (konvertiert für Kunden-App Format)
async function loadGatesForCustomer(customerId) {
    if (!supabaseClient) {
        return [];
    }

    try {
        const { data, error } = await supabaseClient
            .from('gates')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Convert from TT-App format to Kunden-App format
        const gates = (data || []).map(gate => {
            // Parse selected products if needed
            let selectedProducts = [];
            try {
                selectedProducts = JSON.parse(gate.selected_products || '[]');
            } catch (e) {
                console.error('Error parsing selected_products:', e);
            }

            return {
                id: gate.id,
                customer_id: gate.customer_id,
                name: gate.name || (gate.notizen ? gate.notizen.split('\n')[0] : (gate.gate_type || 'Tor')),
                type: gate.gate_type || 'Tor',

                // Convert dimensions from cm to m
                width: gate.breite ? (gate.breite / 100).toFixed(2) : null,
                height: gate.hoehe ? (gate.hoehe / 100).toFixed(2) : null,

                // Use final price including VAT
                price: gate.inkl_mwst || 0,

                // Store full notes
                notes: gate.notizen || '',

                // Store all data for detailed view
                config: {
                    breite: gate.breite,
                    hoehe: gate.hoehe,
                    glashoehe: gate.glashoehe,
                    gesamtflaeche: gate.gesamtflaeche,
                    glasflaeche: gate.glasflaeche,
                    torflaeche: gate.torflaeche,
                    selectedProducts: selectedProducts,
                    aufschlag: gate.aufschlag,
                    subtotal: gate.subtotal,
                    aufschlagBetrag: gate.aufschlag_betrag,
                    exklusiveMwst: gate.exklusive_mwst,
                    inklMwst: gate.inkl_mwst,
                    quantity: gate.quantity
                },

                created_at: gate.created_at,
                createdAt: gate.created_at
            };
        });

        return gates;
    } catch (error) {
        console.error('Error loading gates:', error);
        return [];
    }
}

// Tore für einen Kunden laden (für Kunden-App mit Feldkonvertierung)
async function loadGatesForCustomerKundenApp(customerId) {
    if (!supabaseClient || !currentUser) {
        return [];
    }

    try {
        const { data, error } = await supabaseClient
            .from('gates')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Konvertiere von TT-App Format (breite, hoehe, inklMwst, notizen)
        // zu Kunden-App Format (width, height, price, notes)
        const gates = (data || []).map(gate => {
            // Parse selected products if needed
            let selectedProducts = [];
            try {
                selectedProducts = JSON.parse(gate.selected_products || '[]');
            } catch (e) {
                console.error('Error parsing selected_products:', e);
            }

            return {
                id: gate.id,
                customer_id: gate.customer_id,
                name: gate.name || (gate.notizen ? gate.notizen.split('\n')[0] : (gate.gate_type || 'Tor')),
                type: gate.gate_type || 'Tor',

                // Convert dimensions from cm to m
                width: gate.breite ? (gate.breite / 100).toFixed(2) : null,
                height: gate.hoehe ? (gate.hoehe / 100).toFixed(2) : null,

                // Use final price including VAT
                price: gate.inkl_mwst || 0,

                // Store full notes
                notes: gate.notizen || '',

                // Store all data for detailed view
                config: {
                    breite: gate.breite,
                    hoehe: gate.hoehe,
                    glashoehe: gate.glashoehe,
                    gesamtflaeche: gate.gesamtflaeche,
                    glasflaeche: gate.glasflaeche,
                    torflaeche: gate.torflaeche,
                    selectedProducts: selectedProducts,
                    aufschlag: gate.aufschlag,
                    subtotal: gate.subtotal,
                    aufschlagBetrag: gate.aufschlag_betrag,
                    exklusiveMwst: gate.exklusive_mwst,
                    inklMwst: gate.inkl_mwst,
                    quantity: gate.quantity
                },

                created_at: gate.created_at,
                createdAt: gate.created_at
            };
        });

        return gates;
    } catch (error) {
        console.error('Error loading gates for Kunden-App:', error);
        return [];
    }
}

// Tor-Details laden (für Kunden-App)
async function loadGateDetails(gateId) {
    if (!supabaseClient || !currentUser) {
        return null;
    }

    try {
        const { data, error } = await supabaseClient
            .from('gates')
            .select('*')
            .eq('id', gateId)
            .single();

        if (error) throw error;

        // Convert from TT-App format to Kunden-App format
        const gate = data;

        // Parse selected products if needed
        let selectedProducts = [];
        try {
            selectedProducts = JSON.parse(gate.selected_products || '[]');
        } catch (e) {
            console.error('Error parsing selected_products:', e);
        }

        return {
            id: gate.id,
            customer_id: gate.customer_id,
            name: gate.name || (gate.notizen ? gate.notizen.split('\n')[0] : (gate.gate_type || 'Tor')),
            type: gate.gate_type || 'Tor',

            // Convert dimensions from cm to m
            width: gate.breite ? (gate.breite / 100).toFixed(2) : null,
            height: gate.hoehe ? (gate.hoehe / 100).toFixed(2) : null,

            // Use final price including VAT
            price: gate.inkl_mwst || 0,

            // Store full notes
            notes: gate.notizen || '',

            // Store all data for detailed view
            config: {
                breite: gate.breite,
                hoehe: gate.hoehe,
                glashoehe: gate.glashoehe,
                gesamtflaeche: gate.gesamtflaeche,
                glasflaeche: gate.glasflaeche,
                torflaeche: gate.torflaeche,
                selectedProducts: selectedProducts,
                aufschlag: gate.aufschlag,
                subtotal: gate.subtotal,
                aufschlagBetrag: gate.aufschlag_betrag,
                exklusiveMwst: gate.exklusive_mwst,
                inklMwst: gate.inkl_mwst,
                quantity: gate.quantity
            },

            created_at: gate.created_at,
            createdAt: gate.created_at
        };
    } catch (error) {
        console.error('Error loading gate details:', error);
        return null;
    }
}

// App initialisieren
document.addEventListener('DOMContentLoaded', async () => {
    const isSupabaseConfigured = initSupabase();

    if (isSupabaseConfigured) {
        await checkAuth();
    } else {
        // Offline-Modus
        console.log('📱 App läuft im Offline-Modus');
        hideLoginScreen();

        // Dispatch event even in offline mode
        window.dispatchEvent(new CustomEvent('supabase-user-ready', {
            detail: { user: null }
        }));
    }
});
