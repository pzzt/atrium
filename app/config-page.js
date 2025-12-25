// ============================================
// i18n Initialization
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    await initI18N();

    // Setup language selector
    const langSelector = document.getElementById('languageSelector');
    if (langSelector) {
        langSelector.addEventListener('change', async (e) => {
            await setLanguage(e.target.value);
            // Re-render components with dynamic content
            renderServices();
            renderFeeds();
        });
    }
});

function updateAllConfigStrings() {
    // Update back button
    const backBtn = document.querySelector('.back-button');
    if (backBtn) backBtn.textContent = t('config.back');

    // Update title and subtitle
    const title = document.querySelector('.config-header h1');
    const subtitle = document.querySelector('.config-header p');
    if (title) title.textContent = t('config.title');
    if (subtitle) subtitle.textContent = t('config.subtitle');

    // Update tabs
    document.querySelectorAll('.tab-button').forEach(btn => {
        const tab = btn.dataset.tab;
        if (tab === 'general') {
            btn.textContent = t('config.general');
        } else if (tab === 'services') {
            btn.textContent = t('config.services');
        } else if (tab === 'news') {
            btn.textContent = t('config.news');
        }
    });

    // Update section headers
    const generalH2 = document.querySelector('#general-tab h2');
    const servicesH2 = document.querySelector('#services-tab h2');
    const feedsH2 = document.querySelector('#news-tab h2');
    if (generalH2) generalH2.textContent = t('config.generalSettings');
    if (servicesH2) servicesH2.textContent = t('config.yourServices');
    if (feedsH2) feedsH2.textContent = t('config.rssFeeds');

    // Update buttons
    const addServiceBtn = document.getElementById('addServiceBtn');
    const addFeedBtn = document.getElementById('addFeedBtn');
    const resetBtn = document.getElementById('resetBtn');
    const exportBtn = document.getElementById('exportBtn');

    if (addServiceBtn) addServiceBtn.textContent = t('config.addService');
    if (addFeedBtn) addFeedBtn.textContent = t('config.addFeed');
    if (resetBtn) resetBtn.textContent = t('config.reset');
    if (exportBtn) exportBtn.textContent = t('config.export');

    // Re-render services and feeds with updated strings
    renderServices();
    renderFeeds();
}


// ============================================
// Config Page - Gestione LocalStorage
// ============================================

const STORAGE_KEY = 'proxyHomeConfig';

// Carica configurazione da localStorage o usa default
function loadConfig() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    // Default da config.js
    return {
        appTitle: appTitle || "",
        services: services || [],
        newsFeeds: newsFeeds || []
    };
}

// Salva configurazione in localStorage
function saveConfig(config) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

// ============================================
// Tab Management
// ============================================

const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tab = button.dataset.tab;

        // Update buttons
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Update content
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`${tab}-tab`).classList.add('active');
    });
});

// ============================================
// General Settings Form
// ============================================

const generalForm = document.getElementById('generalForm');
const appTitleInput = document.getElementById('appTitleInput');

// Load current app title
function loadGeneralSettings() {
    const config = loadConfig();
    appTitleInput.value = config.appTitle || "";
}

// Save general settings
generalForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const config = loadConfig();
    config.appTitle = appTitleInput.value.trim();
    saveConfig(config);

    // Show save confirmation
    const saveBtn = generalForm.querySelector('.save-button');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '✓ Saved';
    setTimeout(() => {
        saveBtn.textContent = originalText;
    }, 1500);
});

// Load general settings on page load
loadGeneralSettings();

// ============================================
// Render Services
// ============================================

function renderServices() {
    const config = loadConfig();
    const servicesList = document.getElementById('servicesList');

    if (config.services.length === 0) {
        servicesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🚀</div>
                <p>${t('config.emptyServices')}</p>
            </div>
        `;
        return;
    }

    servicesList.innerHTML = '';
    config.services.forEach((service, index) => {
        const item = document.createElement('div');
        item.className = 'service-item';
        item.innerHTML = `
            <div class="service-left">
                <div class="service-icon-preview">${service.icon}</div>
                <div class="service-info">
                    <div class="service-name">${service.name}</div>
                    <div class="service-url">${service.url}</div>
                    ${service.description ? `<div class="service-desc">${service.description}</div>` : ''}
                </div>
            </div>
            <button class="delete-button" onclick="deleteService(${index})">${t('config.delete')}</button>
        `;
        servicesList.appendChild(item);
    });
}

// ============================================
// Render Feeds
// ============================================

function renderFeeds() {
    const config = loadConfig();
    const feedsList = document.getElementById('feedsList');

    if (config.newsFeeds.length === 0) {
        feedsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📰</div>
                <p>${t('config.emptyFeeds')}</p>
            </div>
        `;
        return;
    }

    feedsList.innerHTML = '';
    config.newsFeeds.forEach((feed, index) => {
        const item = document.createElement('div');
        item.className = 'feed-item';
        item.innerHTML = `
            <div class="feed-info">
                <div class="feed-name">${feed.name}</div>
                <div class="feed-url">${feed.url}</div>
            </div>
            <button class="delete-button" onclick="deleteFeed(${index})">${t('config.delete')}</button>
        `;
        feedsList.appendChild(item);
    });
}

// ============================================
// Add Service
// ============================================

const addServiceBtn = document.getElementById('addServiceBtn');
const serviceForm = document.getElementById('serviceForm');
const newServiceForm = document.getElementById('newServiceForm');
const cancelServiceBtn = document.getElementById('cancelServiceBtn');

addServiceBtn.addEventListener('click', () => {
    serviceForm.style.display = 'block';
    addServiceBtn.style.display = 'none';
});

cancelServiceBtn.addEventListener('click', () => {
    serviceForm.style.display = 'none';
    addServiceBtn.style.display = 'block';
    newServiceForm.reset();
});

newServiceForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const config = loadConfig();
    const newService = {
        name: document.getElementById('serviceName').value,
        url: document.getElementById('serviceUrl').value,
        description: document.getElementById('serviceDesc').value || '',
        icon: document.getElementById('serviceIcon').value || '📁',
        color: document.getElementById('serviceColor').value
    };

    config.services.push(newService);
    saveConfig(config);

    renderServices();

    // Reset form
    serviceForm.style.display = 'none';
    addServiceBtn.style.display = 'block';
    newServiceForm.reset();
});

function deleteService(index) {
    if (!confirm(t('config.confirmDelete', { item: 'service' }))) return;

    const config = loadConfig();
    config.services.splice(index, 1);
    saveConfig(config);
    renderServices();
}

// ============================================
// Add Feed
// ============================================

const addFeedBtn = document.getElementById('addFeedBtn');
const feedForm = document.getElementById('feedForm');
const newFeedForm = document.getElementById('newFeedForm');
const cancelFeedBtn = document.getElementById('cancelFeedBtn');

addFeedBtn.addEventListener('click', () => {
    feedForm.style.display = 'block';
    addFeedBtn.style.display = 'none';
});

cancelFeedBtn.addEventListener('click', () => {
    feedForm.style.display = 'none';
    addFeedBtn.style.display = 'block';
    newFeedForm.reset();
});

newFeedForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const config = loadConfig();
    const newFeed = {
        name: document.getElementById('feedName').value,
        url: document.getElementById('feedUrl').value
    };

    config.newsFeeds.push(newFeed);
    saveConfig(config);

    renderFeeds();

    // Reset form
    feedForm.style.display = 'none';
    addFeedBtn.style.display = 'block';
    newFeedForm.reset();
});

function deleteFeed(index) {
    if (!confirm(t('config.confirmDelete', { item: 'feed' }))) return;

    const config = loadConfig();
    config.newsFeeds.splice(index, 1);
    saveConfig(config);
    renderFeeds();
}

// ============================================
// Global Actions
// ============================================

// Reset to defaults
document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm(t('config.confirmReset'))) return;

    localStorage.removeItem(STORAGE_KEY);
    renderServices();
    renderFeeds();
    alert(t('config.resetDone'));
});

// Export configuration
document.getElementById('exportBtn').addEventListener('click', () => {
    const config = loadConfig();
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'proxy-home-config.json';
    link.click();
    URL.revokeObjectURL(url);
});

// ============================================
// Initialize
// ============================================

renderServices();
renderFeeds();
