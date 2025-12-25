/**
 * Atrium Configuration API
 * Gestisce il salvataggio e il caricamento della configurazione via API
 */

const API_BASE = '/api';

/**
 * Carica la configurazione dal server
 * @returns {Promise<Object|null>} Configurazione o null in caso di errore
 */
async function loadConfigFromAPI() {
    try {
        const response = await fetch(`${API_BASE}/config`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const config = await response.json();
        return config;
    } catch (error) {
        console.error('Failed to load config from API:', error);
        return null;
    }
}

/**
 * Salva la configurazione sul server
 * @param {Object} config - Configurazione da salvare
 * @returns {Promise<boolean>} True se salvato con successo
 */
async function saveConfigToAPI(config) {
    try {
        const response = await fetch(`${API_BASE}/config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return true;
    } catch (error) {
        console.error('Failed to save config to API:', error);
        return false;
    }
}

/**
 * Resetta la configurazione sul server
 * @returns {Promise<boolean>} True se resettato con successo
 */
async function resetConfigOnAPI() {
    try {
        const response = await fetch(`${API_BASE}/config`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return true;
    } catch (error) {
        console.error('Failed to reset config on API:', error);
        return false;
    }
}

/**
 * Importa una configurazione da un file JSON
 * @param {Object} config - Configurazione da importare
 * @returns {Promise<boolean>} True se importato con successo
 */
async function importConfigToAPI(config) {
    try {
        const response = await fetch(`${API_BASE}/config/import`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return true;
    } catch (error) {
        console.error('Failed to import config to API:', error);
        return false;
    }
}
