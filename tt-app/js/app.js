/**
 * Main Application Entry Point
 */

import AppState from './state/AppState.js';
import { VIEWS } from './config/constants.js';
import { renderHeader } from './components/Header.js';
import { renderProgressSteps } from './components/ProgressSteps.js';
import { initModals } from './components/Modal.js';
import { renderCustomerSelectView } from './views/CustomerSelectView.js';
import { renderTypeSelectView } from './views/TypeSelectView.js';
import { renderGateConfigView } from './views/GateConfigView.js';
import StorageService from './services/StorageService.js';

/**
 * Main render function
 */
function render() {
    const state = AppState.getState();

    // Render header
    const headerContainer = document.getElementById('header');
    if (headerContainer) {
        headerContainer.innerHTML = renderHeader();
    }

    // Render progress steps
    const stepsContainer = document.getElementById('progress-steps');
    if (stepsContainer) {
        stepsContainer.innerHTML = renderProgressSteps(state.view);
    }

    // Render main view
    const appContainer = document.getElementById('app');
    if (appContainer) {
        switch (state.view) {
            case VIEWS.CUSTOMER_SELECT:
                appContainer.innerHTML = renderCustomerSelectView();
                break;

            case VIEWS.TYPE_SELECT:
                appContainer.innerHTML = renderTypeSelectView();
                break;

            case VIEWS.GATE_CONFIG:
                appContainer.innerHTML = renderGateConfigView();
                break;

            default:
                console.error('Unknown view:', state.view);
                appContainer.innerHTML = '<div class="empty-state">Fehler: Unbekannte Ansicht</div>';
        }
    }

    // Update home button visibility
    updateHomeButton(state.view);
}

/**
 * Update home button visibility and behavior
 * @param {string} currentView
 */
function updateHomeButton(currentView) {
    const homeButton = document.getElementById('homeButton');
    if (!homeButton) return;

    if (currentView === VIEWS.CUSTOMER_SELECT) {
        homeButton.style.display = 'none';
    } else {
        homeButton.style.display = 'flex';
    }
}

/**
 * Home button handler
 */
window.goToHome = function() {
    if (AppState.view !== VIEWS.CUSTOMER_SELECT) {
        if (AppState.view === VIEWS.GATE_CONFIG && AppState.currentGate) {
            if (confirm('Möchten Sie zur Startseite zurück? Nicht gespeicherte Änderungen gehen verloren.')) {
                AppState.clearCurrentGate();
                AppState.goToCustomerSelect();
            }
        } else {
            AppState.goToCustomerSelect();
        }
    }
};

/**
 * Wait for Supabase client to be ready
 */
async function waitForSupabaseClient() {
    return new Promise((resolve) => {
        // Check if already available
        if (typeof supabaseClient !== 'undefined' && supabaseClient !== null) {
            console.log('✅ Supabase Client bereits verfügbar');
            resolve(true);
            return;
        }

        // Set a timeout
        const timeout = setTimeout(() => {
            console.warn('⚠️ Supabase Client timeout');
            resolve(false);
        }, 2000);

        // Wait for supabase-client-ready event
        window.addEventListener('supabase-client-ready', (event) => {
            clearTimeout(timeout);
            console.log('✅ Supabase Client ready');
            resolve(true);
        }, { once: true });
    });
}

/**
 * Wait for Supabase user authentication (non-blocking)
 */
function waitForSupabaseUserAsync() {
    return new Promise((resolve) => {
        // Check if user already exists
        if (typeof currentUser !== 'undefined' && currentUser !== null) {
            console.log('✅ User bereits eingeloggt:', currentUser.email);
            resolve(true);
            return;
        }

        // Start waiting but don't block
        window.addEventListener('supabase-user-ready', (event) => {
            if (event.detail.user) {
                console.log('✅ User ist eingeloggt:', event.detail.user.email);
                // Trigger a re-load of customers now that user is authenticated
                if (AppState.isInitialized) {
                    AppState.loadFromStorage();
                }
                resolve(true);
            } else {
                console.log('ℹ️ Kein User eingeloggt');
                resolve(false);
            }
        }, { once: true });
    });
}

/**
 * Wait for Supabase to be ready
 */
async function waitForSupabase() {
    console.log('⏳ Warte auf Supabase Client...');

    // Only wait for client, not user
    const clientReady = await waitForSupabaseClient();

    if (!clientReady) {
        console.warn('⚠️ Supabase Client nicht verfügbar');
        return false;
    }

    // Start listening for user auth (non-blocking)
    waitForSupabaseUserAsync();

    return true;
}

/**
 * Load data in background
 */
async function loadDataInBackground() {
    try {
        // Wait for Supabase to be ready (non-blocking for UI)
        await waitForSupabase();

        // Initialize AppState (loads customers from Supabase)
        await AppState.init();

        console.log('✨ Wölfleder Kalkulator gestartet');
        console.log(`📊 ${AppState.customers.length} Kunden geladen`);
    } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
    }
}

/**
 * Initialize the application
 */
async function init() {
    console.log('🚀 Wölfleder Kalkulator wird gestartet...');

    // Check if localStorage is available
    if (!StorageService.isAvailable()) {
        alert('Warnung: LocalStorage ist nicht verfügbar. Daten können nicht gespeichert werden.');
    }

    // Initialize modals
    initModals();

    // Subscribe to state changes
    AppState.subscribe(() => {
        console.log('State changed, re-rendering...');
        render();
    });

    // Initial render immediately (shows empty state)
    render();

    // Load data in background
    loadDataInBackground();

    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('✅ Service Worker registriert:', registration.scope);
            })
            .catch(error => {
                console.log('❌ Service Worker Registrierung fehlgeschlagen:', error);
            });
    }

    // PWA install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        // Show install button/banner if needed
        console.log('💡 App kann installiert werden');
    });

    window.addEventListener('appinstalled', () => {
        console.log('✅ App wurde installiert');
        deferredPrompt = null;
    });
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for debugging
window.AppState = AppState;
