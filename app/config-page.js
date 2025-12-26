// ============================================
// i18n Initialization
// ============================================

// Global config variable (will be loaded from API)
let pageConfig = {
    appTitle: "",
    services: [],
    newsFeeds: []
};

// Track editing state
let editingServiceIndex = -1;
let editingFeedIndex = -1;

document.addEventListener('DOMContentLoaded', async () => {
    await initI18N();

    // Load configuration from API
    pageConfig = await loadConfig();

    // Initialize UI with loaded config
    initializeUI();

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
// Config Page - Gestione Configurazione
// ============================================

// Load configuration from API
async function loadConfig() {
    const config = await loadConfigFromAPI();

    if (config && !config.error) {
        return {
            appTitle: config.appTitle || appTitle || "",
            services: config.services || services || [],
            newsFeeds: config.newsFeeds || newsFeeds || []
        };
    } else {
        // Fallback to defaults if API fails
        console.error('Failed to load config from API, using defaults');
        return {
            appTitle: appTitle || "",
            services: services || [],
            newsFeeds: newsFeeds || []
        };
    }
}

// Save configuration to API
async function saveConfig(config) {
    const success = await saveConfigToAPI(config);

    if (!success) {
        alert(t('config.saveError') || 'Error saving configuration. Please try again.');
        return false;
    }

    return true;
}

// Initialize all UI elements and event listeners
function initializeUI() {
    // Update all translatable strings
    updateAllConfigStrings();

    // Initialize tabs
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

    // Initialize General Settings Form
    const generalForm = document.getElementById('generalForm');
    const appTitleInput = document.getElementById('appTitleInput');

    // Load current app title
    appTitleInput.value = pageConfig.appTitle || "";

    // Save general settings
    generalForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        pageConfig.appTitle = appTitleInput.value.trim();
        const success = await saveConfig(pageConfig);

        if (success) {
            // Show save confirmation
            const saveBtn = generalForm.querySelector('.save-button');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '✓ Saved';
            setTimeout(() => {
                saveBtn.textContent = originalText;
            }, 1500);
        }
    });

    // Initialize Add Service handlers
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
        editingServiceIndex = -1; // Reset editing state
        document.querySelector('#serviceForm h3').textContent = t('config.newService');
    });

    newServiceForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const serviceData = {
            name: document.getElementById('serviceName').value,
            url: document.getElementById('serviceUrl').value,
            description: document.getElementById('serviceDesc').value || '',
            icon: document.getElementById('serviceIcon').value || '📁',
            color: document.getElementById('serviceColor').value
        };

        if (editingServiceIndex >= 0) {
            // Update existing service
            pageConfig.services[editingServiceIndex] = serviceData;
            editingServiceIndex = -1; // Reset editing state
        } else {
            // Add new service
            pageConfig.services.push(serviceData);
        }

        await saveConfig(pageConfig);
        renderServices();

        // Reset form and title
        serviceForm.style.display = 'none';
        addServiceBtn.style.display = 'block';
        newServiceForm.reset();
        document.querySelector('#serviceForm h3').textContent = t('config.newService');
    });

    // Initialize Add Feed handlers
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
        editingFeedIndex = -1; // Reset editing state
        document.querySelector('#feedForm h3').textContent = t('config.newFeed');
    });

    newFeedForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const feedData = {
            name: document.getElementById('feedName').value,
            url: document.getElementById('feedUrl').value
        };

        if (editingFeedIndex >= 0) {
            // Update existing feed
            pageConfig.newsFeeds[editingFeedIndex] = feedData;
            editingFeedIndex = -1; // Reset editing state
        } else {
            // Add new feed
            pageConfig.newsFeeds.push(feedData);
        }

        await saveConfig(pageConfig);
        renderFeeds();

        // Reset form and title
        feedForm.style.display = 'none';
        addFeedBtn.style.display = 'block';
        newFeedForm.reset();
        document.querySelector('#feedForm h3').textContent = t('config.newFeed');
    });

    // Initialize Reset button
    document.getElementById('resetBtn').addEventListener('click', async () => {
        if (!confirm(t('config.confirmReset'))) return;

        const success = await resetConfigOnAPI();

        if (success) {
            // Reload page to get fresh config
            pageConfig = await loadConfig();
            renderServices();
            renderFeeds();
            appTitleInput.value = pageConfig.appTitle || "";
            alert(t('config.resetDone'));
        } else {
            alert('Error resetting configuration. Please try again.');
        }
    });

    // Initialize Export button
    document.getElementById('exportBtn').addEventListener('click', () => {
        const dataStr = JSON.stringify(pageConfig, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'atrium-config.json';
        link.click();
        URL.revokeObjectURL(url);
    });

    // Initial render
    renderServices();
    renderFeeds();
}

// ============================================
// Render Services
// ============================================

function renderServices() {
    const servicesList = document.getElementById('servicesList');
    if (!servicesList) return;

    if (pageConfig.services.length === 0) {
        servicesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🚀</div>
                <p>${t('config.emptyServices')}</p>
            </div>
        `;
        return;
    }

    servicesList.innerHTML = '';
    pageConfig.services.forEach((service, index) => {
        const item = document.createElement('div');
        item.className = 'service-item';

        // Determine button states
        const isFirst = index === 0;
        const isLast = index === pageConfig.services.length - 1;
        const totalItems = pageConfig.services.length;

        // Only show reorder buttons if there's more than 1 item
        const showReorderButtons = totalItems > 1;

        item.innerHTML = `
            <div class="service-left">
                <div class="service-icon-preview">${service.icon}</div>
                <div class="service-info">
                    <div class="service-name">${service.name}</div>
                    <div class="service-url">${service.url}</div>
                    ${service.description ? `<div class="service-desc">${service.description}</div>` : ''}
                </div>
            </div>
            <div class="service-actions">
                ${showReorderButtons ? `
                    <button class="reorder-button reorder-up ${isFirst ? 'disabled' : ''}"
                            onclick="moveServiceUp(${index})"
                            ${isFirst ? 'disabled' : ''}
                            title="${t('config.moveUp')}">
                        ${t('config.moveUp')}
                    </button>
                    <button class="reorder-button reorder-down ${isLast ? 'disabled' : ''}"
                            onclick="moveServiceDown(${index})"
                            ${isLast ? 'disabled' : ''}
                            title="${t('config.moveDown')}">
                        ${t('config.moveDown')}
                    </button>
                ` : ''}
                <button class="edit-button" onclick="editService(${index})">${t('config.edit')}</button>
                <button class="delete-button" onclick="deleteService(${index})">${t('config.delete')}</button>
            </div>
        `;
        servicesList.appendChild(item);
    });
}

// ============================================
// Render Feeds
// ============================================

function renderFeeds() {
    const feedsList = document.getElementById('feedsList');
    if (!feedsList) return;

    if (pageConfig.newsFeeds.length === 0) {
        feedsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📰</div>
                <p>${t('config.emptyFeeds')}</p>
            </div>
        `;
        return;
    }

    feedsList.innerHTML = '';
    pageConfig.newsFeeds.forEach((feed, index) => {
        const item = document.createElement('div');
        item.className = 'feed-item';

        // Determine button states
        const isFirst = index === 0;
        const isLast = index === pageConfig.newsFeeds.length - 1;
        const totalItems = pageConfig.newsFeeds.length;

        // Only show reorder buttons if there's more than 1 item
        const showReorderButtons = totalItems > 1;

        item.innerHTML = `
            <div class="feed-info">
                <div class="feed-name">${feed.name}</div>
                <div class="feed-url">${feed.url}</div>
            </div>
            <div class="feed-actions">
                ${showReorderButtons ? `
                    <button class="reorder-button reorder-up ${isFirst ? 'disabled' : ''}"
                            onclick="moveFeedUp(${index})"
                            ${isFirst ? 'disabled' : ''}
                            title="${t('config.moveUp')}">
                        ${t('config.moveUp')}
                    </button>
                    <button class="reorder-button reorder-down ${isLast ? 'disabled' : ''}"
                            onclick="moveFeedDown(${index})"
                            ${isLast ? 'disabled' : ''}
                            title="${t('config.moveDown')}">
                        ${t('config.moveDown')}
                    </button>
                ` : ''}
                <button class="edit-button" onclick="editFeed(${index})">${t('config.edit')}</button>
                <button class="delete-button" onclick="deleteFeed(${index})">${t('config.delete')}</button>
            </div>
        `;
        feedsList.appendChild(item);
    });
}

// Global functions for onclick handlers
window.deleteService = async function(index) {
    if (!confirm(t('config.confirmDelete', { item: 'service' }))) return;

    pageConfig.services.splice(index, 1);
    await saveConfig(pageConfig);
    renderServices();
};

window.deleteFeed = async function(index) {
    if (!confirm(t('config.confirmDelete', { item: 'feed' }))) return;

    pageConfig.newsFeeds.splice(index, 1);
    await saveConfig(pageConfig);
    renderFeeds();
};

// ============================================
// Reorder Functions
// ============================================

window.moveServiceUp = async function(index) {
    if (index === 0) return; // Already at top

    // Swap with previous element
    [pageConfig.services[index - 1], pageConfig.services[index]] =
    [pageConfig.services[index], pageConfig.services[index - 1]];

    await saveConfig(pageConfig);
    renderServices();
};

window.moveServiceDown = async function(index) {
    if (index === pageConfig.services.length - 1) return; // Already at bottom

    // Swap with next element
    [pageConfig.services[index], pageConfig.services[index + 1]] =
    [pageConfig.services[index + 1], pageConfig.services[index]];

    await saveConfig(pageConfig);
    renderServices();
};

window.moveFeedUp = async function(index) {
    if (index === 0) return; // Already at top

    // Swap with previous element
    [pageConfig.newsFeeds[index - 1], pageConfig.newsFeeds[index]] =
    [pageConfig.newsFeeds[index], pageConfig.newsFeeds[index - 1]];

    await saveConfig(pageConfig);
    renderFeeds();
};

window.moveFeedDown = async function(index) {
    if (index === pageConfig.newsFeeds.length - 1) return; // Already at bottom

    // Swap with next element
    [pageConfig.newsFeeds[index], pageConfig.newsFeeds[index + 1]] =
    [pageConfig.newsFeeds[index + 1], pageConfig.newsFeeds[index]];

    await saveConfig(pageConfig);
    renderFeeds();
};

// ============================================
// Edit Functions
// ============================================

// Edit service - populate form with existing data
window.editService = function(index) {
    const service = pageConfig.services[index];
    editingServiceIndex = index;

    // Populate form
    document.getElementById('serviceName').value = service.name;
    document.getElementById('serviceUrl').value = service.url;
    document.getElementById('serviceDesc').value = service.description || '';
    document.getElementById('serviceIcon').value = service.icon || '📁';
    document.getElementById('serviceColor').value = service.color;

    // Update form title
    document.querySelector('#serviceForm h3').textContent = t('config.editService');

    // Show form
    document.getElementById('serviceForm').style.display = 'block';
    document.getElementById('addServiceBtn').style.display = 'none';
};

// Edit feed - populate form with existing data
window.editFeed = function(index) {
    const feed = pageConfig.newsFeeds[index];
    editingFeedIndex = index;

    // Populate form
    document.getElementById('feedName').value = feed.name;
    document.getElementById('feedUrl').value = feed.url;

    // Update form title
    document.querySelector('#feedForm h3').textContent = t('config.editFeed');

    // Show form
    document.getElementById('feedForm').style.display = 'block';
    document.getElementById('addFeedBtn').style.display = 'none';
};
