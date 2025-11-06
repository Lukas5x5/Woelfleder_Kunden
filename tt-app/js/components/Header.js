/**
 * Header Component
 */

export function renderHeader() {
    return `
        <div class="header">
            <div class="header-content">
                <div class="logo-container">
                    <img src="./woelfleder_Logo.jpg" alt="Wölfleder Logo" class="logo-img">
                    <div class="logo-text">
                        <div class="logo-subtitle">Türen & Tore Kalkulator</div>
                    </div>
                </div>
                <div class="header-actions">
                    <a href="index.html" class="app-switcher-tt" title="Zurück zur Kundenverwaltung" style="font-size: 2rem; text-decoration: none; padding: 0.5rem;">
                        👥
                    </a>
                </div>
            </div>
        </div>
    `;
}
