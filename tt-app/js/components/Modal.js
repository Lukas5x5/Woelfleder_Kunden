/**
 * Modal Component
 */

/**
 * Open modal
 * @param {string} modalId
 */
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close modal
 * @param {string} modalId
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Close modal on outside click
 * @param {Event} event
 * @param {string} modalId
 */
export function handleModalOutsideClick(event, modalId) {
    const modal = document.getElementById(modalId);
    if (event.target === modal) {
        closeModal(modalId);
    }
}

/**
 * Initialize modal event listeners
 */
export function initModals() {
    // Close modals on outside click
    document.getElementById('customerModal')?.addEventListener('click', (e) => {
        handleModalOutsideClick(e, 'customerModal');
    });

    document.getElementById('gateModal')?.addEventListener('click', (e) => {
        handleModalOutsideClick(e, 'gateModal');
    });

    // Close modals on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal('customerModal');
            closeModal('gateModal');
        }
    });
}
