/**
 * Local Storage Service
 * Handles all data persistence operations
 */

import { STORAGE_KEY } from '../config/constants.js';

class StorageService {
    /**
     * Load all customers from localStorage
     * @returns {Array}
     */
    loadCustomers() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading customers:', error);
            return [];
        }
    }

    /**
     * Save customers to localStorage
     * @param {Array} customers
     * @returns {boolean}
     */
    saveCustomers(customers) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
            return true;
        } catch (error) {
            console.error('Error saving customers:', error);
            return false;
        }
    }

    /**
     * Clear all data from localStorage
     * @returns {boolean}
     */
    clearAll() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }

    /**
     * Export data as JSON file
     * @param {Array} customers
     */
    exportData(customers) {
        const dataStr = JSON.stringify(customers, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `woelfleder-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Import data from JSON file
     * @param {File} file
     * @returns {Promise<Array>}
     */
    async importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (Array.isArray(data)) {
                        resolve(data);
                    } else {
                        reject(new Error('Ungültiges Datenformat'));
                    }
                } catch (error) {
                    reject(new Error('Fehler beim Parsen der Datei'));
                }
            };

            reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
            reader.readAsText(file);
        });
    }

    /**
     * Get storage size in bytes
     * @returns {number}
     */
    getStorageSize() {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? new Blob([data]).size : 0;
    }

    /**
     * Check if storage is available
     * @returns {boolean}
     */
    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }
}

export default new StorageService();
