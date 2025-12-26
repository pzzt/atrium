// ============================================
// i18n Initialization
// ============================================

// Initialize i18n system before anything else
document.addEventListener('DOMContentLoaded', async () => {
    await initI18N();

    // Load configuration from API
    await loadConfiguration();

    // Update app title from config or use i18n default
    updateAppTitle();

    // Initialize search and keyboard shortcuts
    initializeSearchAndShortcuts();

    // Setup language selector
    const langSelector = document.getElementById('languageSelector');
    if (langSelector) {
        langSelector.addEventListener('change', async (e) => {
            await setLanguage(e.target.value);
            // Re-render components that need dynamic translation
            updateAppTitle();
            renderServices();
            renderNews();
            updateSystemMonitorLabels();
            updateSystemMonitorVisibility();
            updateK3sMonitorVisibility();
        });
    }
});

// Update app title
function updateAppTitle() {
    const titleElement = document.querySelector('.title');
    if (!titleElement) return;

    // Use custom title from config if set, otherwise use i18n default
    if (appConfig.appTitle && appConfig.appTitle.trim()) {
        titleElement.textContent = appConfig.appTitle;
    } else {
        titleElement.textContent = t('app.title');
    }
}

function updateAllTranslatableElements() {
    // Update search placeholder
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.placeholder = t('search.placeholder');
    }

    // Update no results message
    const noResults = document.getElementById('noResults');
    if (noResults) {
        const p = noResults.querySelector('p');
        if (p) p.textContent = t('no.results');
    }

    // Update news title
    const newsTitle = document.querySelector('.news-title');
    if (newsTitle) {
        newsTitle.textContent = t('news.title');
    }

    // Update system monitor labels
    updateSystemMonitorLabels();
}

function updateSystemMonitorLabels() {
    // Update static labels that won't be updated by the i18n auto-update
    const cpuLabel = document.querySelector('.cpu-card .stat-label');
    const memLabel = document.querySelector('.memory-card .stat-label');
    const uptimeLabel = document.querySelector('.uptime-card .stat-label');
    const netLabel = document.querySelector('#networkStats h3');
    const footerText = document.querySelector('.footer p');

    if (cpuLabel) cpuLabel.textContent = t('system.cpu');
    if (memLabel) memLabel.textContent = t('system.memory');
    if (uptimeLabel) uptimeLabel.textContent = t('system.uptime');
    if (netLabel) netLabel.textContent = t('system.network');
    if (footerText) footerText.textContent = t('app.subtitle');
}

function updateSystemMonitorVisibility() {
    const systemMonitor = document.getElementById('systemMonitor');
    if (!systemMonitor) return;

    if (appConfig.showSystemMonitor) {
        systemMonitor.classList.remove('hidden');
    } else {
        systemMonitor.classList.add('hidden');
    }
}

function updateK3sMonitorVisibility() {
    // Update each K3s section visibility independently
    const sections = [
        { id: 'k3sNodesSection', enabled: appConfig.showK3sNodes },
        { id: 'k3sPodsSection', enabled: appConfig.showK3sPods },
        { id: 'k3sDeploymentsSection', enabled: appConfig.showK3sDeployments },
        { id: 'k3sServicesSection', enabled: appConfig.showK3sServices },
        { id: 'k3sEventsSection', enabled: appConfig.showK3sEvents }
    ];

    sections.forEach(section => {
        const el = document.getElementById(section.id);
        if (el) {
            if (section.enabled) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        }
    });
}


// ============================================
// Caricamento Configurazione
// ============================================

// Load configuration from API
async function loadConfiguration() {
    const config = await loadConfigFromAPI();

    if (config && !config.error) {
        appConfig = {
            appTitle: config.appTitle || appTitle || "",
            services: config.services || services || [],
            newsFeeds: config.newsFeeds || newsFeeds || [],
            theme: config.theme || theme || "catppuccin-macchiato",
            showSystemMonitor: config.showSystemMonitor || showSystemMonitor || false,
            showK3sNodes: config.showK3sNodes || showK3sNodes || false,
            showK3sPods: config.showK3sPods || showK3sPods || false,
            showK3sDeployments: config.showK3sDeployments || showK3sDeployments || false,
            showK3sServices: config.showK3sServices || showK3sServices || false,
            showK3sEvents: config.showK3sEvents || showK3sEvents || false
        };
    } else {
        // Fallback to defaults if API fails
        console.error('Failed to load config from API, using defaults');
        appConfig = {
            appTitle: appTitle || "",
            services: services || [],
            newsFeeds: newsFeeds || [],
            theme: theme || "catppuccin-macchiato",
            showSystemMonitor: showSystemMonitor || false,
            showK3sNodes: showK3sNodes || false,
            showK3sPods: showK3sPods || false,
            showK3sDeployments: showK3sDeployments || false,
            showK3sServices: showK3sServices || false,
            showK3sEvents: showK3sEvents || false
        };

        // Show error notification to user
        showErrorNotification('Unable to load configuration. Check if the container is running properly.');
    }

    // Apply theme
    if (appConfig.theme && typeof applyTheme === 'function') {
        applyTheme(appConfig.theme);
    }

    // Apply system monitor visibility
    updateSystemMonitorVisibility();
    updateK3sMonitorVisibility();

    // Render services and news after loading config
    renderServices();
    renderNews();
}

// Show error notification to user
function showErrorNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff6b6b;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Initialize appConfig (will be populated by loadConfiguration)
let appConfig = {
    appTitle: "",
    services: [],
    newsFeeds: [],
    theme: "",
    showSystemMonitor: false,
    showK3sNodes: false,
    showK3sPods: false,
    showK3sDeployments: false,
    showK3sServices: false,
    showK3sEvents: false
};


// ============================================
// Generazione Servizi dalla Configurazione
// ============================================

function renderServices() {
    const servicesGrid = document.getElementById('servicesGrid');
    if (!servicesGrid) return;

    // Clear existing services
    servicesGrid.innerHTML = '';

    const servicesList = appConfig.services;

    servicesList.forEach(service => {
        const card = document.createElement('a');
        card.href = service.url;
        card.className = `service-card ${service.color}`;
        card.innerHTML = `
            <div class="card-icon">${service.icon}</div>
            <h2 class="card-title">${service.name}</h2>
            <p class="card-description">${service.description}</p>
            <div class="card-link">${t('config.open')}</div>
        `;
        servicesGrid.appendChild(card);
    });
}


// ============================================
// Clock & Date Functionality
// ============================================

function updateClock() {
    const now = new Date();

    // Format time (HH:MM:SS)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;

    // Format date (Italian locale)
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('it-IT', options);

    // Update DOM
    document.getElementById('time').textContent = timeString;
    document.getElementById('date').textContent = dateString;
}

// Update clock immediately and then every second
updateClock();
setInterval(updateClock, 1000);


// ============================================
// Search Functionality & Keyboard Shortcuts
// ============================================

// Initialize search and keyboard shortcuts after DOM is ready
function initializeSearchAndShortcuts() {
    const searchInput = document.getElementById('search');
    const noResults = document.getElementById('noResults');

    if (!searchInput || !noResults) return;

    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        const serviceCards = document.querySelectorAll('.service-card');
        let visibleCount = 0;

        serviceCards.forEach(card => {
            const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
            const description = card.querySelector('.card-description')?.textContent.toLowerCase() || '';

            // Search in both title and description
            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                card.classList.remove('hidden');
                visibleCount++;
            } else {
                card.classList.add('hidden');
            }
        });

        // Show/hide "no results" message
        if (visibleCount === 0 && searchTerm !== '') {
            noResults.style.display = 'block';
        } else {
            noResults.style.display = 'none';
        }
    });

    // Focus search on '/' key
    document.addEventListener('keydown', function(e) {
        // Only if not typing in an input
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            searchInput.focus();
        }

        // Clear search on Escape
        if (e.key === 'Escape') {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
            searchInput.blur();
        }
    });
}


// ============================================
// RSS Feed Functionality
// ============================================

async function fetchRSSFeed(feedUrl) {
    // Use rss2json.com to convert RSS to JSON and avoid CORS
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Adesso';
    if (diffHours < 24) return `${diffHours} ore fa`;
    if (diffDays < 7) return `${diffDays} giorni fa`;
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

async function renderNews() {
    // Skip if no feeds configured
    if (!appConfig.newsFeeds || appConfig.newsFeeds.length === 0) {
        return;
    }

    const newsSection = document.getElementById('newsSection');
    const newsGrid = document.getElementById('newsGrid');

    // Show loading state
    newsSection.style.display = 'block';
    newsGrid.innerHTML = `<div class="news-loading">${t('news.loadingText')}</div>`;

    let allNews = [];

    // Fetch all feeds
    for (const feed of appConfig.newsFeeds) {
        try {
            const data = await fetchRSSFeed(feed.url);

            if (data.status === 'ok') {
                const items = data.items.slice(0, 3).map(item => ({
                    title: item.title,
                    link: item.link,
                    date: item.pubDate,
                    source: feed.name
                }));
                allNews = allNews.concat(items);
            }
        } catch (error) {
            console.error(`Errore nel caricamento del feed ${feed.name}:`, error);
        }
    }

    // Sort by date (newest first)
    allNews.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Display top 6 news
    if (allNews.length > 0) {
        newsGrid.innerHTML = '';
        allNews.slice(0, 6).forEach(news => {
            const card = document.createElement('a');
            card.href = news.link;
            card.className = 'news-card';
            card.target = '_blank';
            card.rel = 'noopener noreferrer';
            card.innerHTML = `
                <div class="news-source">${news.source}</div>
                <h3 class="news-headline">${news.title}</h3>
                <div class="news-date">${formatDate(news.date)}</div>
            `;
            newsGrid.appendChild(card);
        });
    } else {
        newsGrid.innerHTML = '<div class="news-error">Impossibile caricare le notizie. Controlla la configurazione dei feed RSS.</div>';
    }
}

// Load news when page loads
renderNews();


// ============================================
// System Monitor Functionality
// ============================================

let statsUpdateInterval;

async function fetchSystemStats() {
    try {
        const response = await fetch('/api/stats');
        if (!response.ok) throw new Error('API not available');
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch system stats:', error);
        return null;
    }
}

function updateCPUStats(cpu) {
    const cpuValue = document.getElementById('cpuValue');
    const cpuDetails = document.getElementById('cpuDetails');
    const cpuBar = document.getElementById('cpuBar');

    if (cpu) {
        const percent = cpu.percent || 0;
        const cores = cpu.cores || 1;

        cpuValue.textContent = `${percent}%`;
        cpuDetails.textContent = t('system.cores', { n: cores, s: cores > 1 ? 's' : '' });
        cpuBar.style.width = `${percent}%`;

        // Colore basato sull'utilizzo
        if (percent > 80) {
            cpuBar.style.background = 'linear-gradient(90deg, #ff6b6b, #ff8e8e)';
        } else if (percent > 50) {
            cpuBar.style.background = 'linear-gradient(90deg, #feca57, #ff9ff3)';
        } else {
            cpuBar.style.background = 'linear-gradient(90deg, #4ecdc4, #7ee8e0)';
        }
    } else {
        cpuValue.textContent = 'N/A';
        cpuDetails.textContent = t('system.apiUnavailable');
        cpuBar.style.width = '0%';
    }
}

function updateMemoryStats(memory) {
    const memoryValue = document.getElementById('memoryValue');
    const memoryDetails = document.getElementById('memoryDetails');
    const memoryBar = document.getElementById('memoryBar');

    if (memory && !memory.error) {
        const percent = memory.percent || 0;
        const used = memory.used_mb || 0;
        const total = memory.total_mb || 0;

        memoryValue.textContent = `${percent}%`;
        memoryDetails.textContent = `${used}MB / ${total}MB`;
        memoryBar.style.width = `${percent}%`;

        // Colore basato sull'utilizzo
        if (percent > 80) {
            memoryBar.style.background = 'linear-gradient(90deg, #ff6b6b, #ff8e8e)';
        } else if (percent > 50) {
            memoryBar.style.background = 'linear-gradient(90deg, #feca57, #ff9ff3)';
        } else {
            memoryBar.style.background = 'linear-gradient(90deg, #4ecdc4, #7ee8e0)';
        }
    } else {
        memoryValue.textContent = 'N/A';
        memoryDetails.textContent = t('system.apiUnavailable');
        memoryBar.style.width = '0%';
    }
}

function updateUptimeStats(stats) {
    const uptimeValue = document.getElementById('uptimeValue');
    const loadValue = document.getElementById('loadValue');

    if (stats) {
        uptimeValue.textContent = stats.uptime || 'N/A';

        const load = stats.load_average || [0, 0, 0];
        loadValue.textContent = load.map(l => l.toFixed(2)).join(' / ');
    } else {
        uptimeValue.textContent = 'N/A';
        loadValue.textContent = t('system.apiUnavailable');
    }
}

function updateNetworkStats(networks) {
    const networkList = document.getElementById('networkList');

    if (!networks || networks.length === 0) {
        networkList.innerHTML = `<div class="network-error">${t('system.noNetwork')}</div>`;
        return;
    }

    networkList.innerHTML = '';
    networks.forEach(net => {
        if (net.error) return;

        const item = document.createElement('div');
        item.className = 'network-item';
        item.innerHTML = `
            <div class="network-name">${net.name}</div>
            <div class="network-traffic">
                <div class="network-rx">${net.rx_mb} MB</div>
                <div class="network-tx">${net.tx_mb} MB</div>
            </div>
        `;
        networkList.appendChild(item);
    });
}

async function updateSystemMonitor() {
    const stats = await fetchSystemStats();

    if (stats) {
        updateCPUStats(stats.cpu);
        updateMemoryStats(stats.memory);
        updateUptimeStats(stats);
        updateNetworkStats(stats.network);
    }

    // Update K3s stats if any section is enabled
    if (appConfig.showK3sNodes || appConfig.showK3sPods || appConfig.showK3sDeployments || appConfig.showK3sServices || appConfig.showK3sEvents) {
        await updateK3sStats();
    }
}

// Initialize system monitor
async function initSystemMonitor() {
    // First update immediately
    await updateSystemMonitor();

    // Then update every 5 seconds
    statsUpdateInterval = setInterval(updateSystemMonitor, 5000);
}

// Start system monitor when page loads
initSystemMonitor();



// ============================================
// K3s Monitor Functions  
// ============================================

async function updateK3sStats() {
    try {
        const response = await fetch('/api/k3s');
        if (!response.ok) {
            showK3sError('K3s API not available');
            return;
        }

        const data = await response.json();

        if (data.error) {
            showK3sError(data.error);
            return;
        }

        if (appConfig.showK3sNodes) updateK3sNodes(data.nodes || []);
        if (appConfig.showK3sPods) updateK3sPods(data.pods || {});
        if (appConfig.showK3sDeployments) updateK3sDeployments(data.deployments || {});
        if (appConfig.showK3sServices) updateK3sServices(data.services || {});
        if (appConfig.showK3sEvents) updateK3sEvents(data.events || []);
        hideK3sError();

    } catch (error) {
        console.error('Error fetching K3s stats:', error);
        showK3sError('Unable to connect to K3s cluster');
    }
}

function updateK3sNodes(nodes) {
    const container = document.getElementById('k3sNodes');
    if (!container) return;

    if (nodes.length === 0) {
        container.innerHTML = '<div class="k3s-empty">No nodes found</div>';
        return;
    }

    container.innerHTML = nodes.map(node => `
        <div class="k3s-node-item ${node.status === 'Ready' ? 'ready' : 'not-ready'}">
            <div class="k3s-node-header">
                <span class="k3s-node-name">${node.name}</span>
                <span class="k3s-node-status">${node.status}</span>
            </div>
            <div class="k3s-node-details">
                <span>Role: ${node.roles || 'worker'}</span>
                <span>v${node.version}</span>
                <span>CPU: ${node.capacity.cpu}</span>
                <span>Mem: ${formatMemory(node.capacity.memory)}</span>
            </div>
        </div>
    `).join('');
}

function updateK3sPods(pods) {
    const container = document.getElementById('k3sPods');
    if (!container) return;
    
    container.innerHTML = `
        <span class="k3s-stat">Total: ${pods.total || 0}</span>
        <span class="k3s-stat k3s-running">Running: ${pods.running || 0}</span>
        <span class="k3s-stat k3s-pending">Pending: ${pods.pending || 0}</span>
        <span class="k3s-stat k3s-failed">Failed: ${pods.failed || 0}</span>
    `;
}

function updateK3sDeployments(deployments) {
    const container = document.getElementById('k3sDeployments');
    if (!container) return;
    
    container.innerHTML = `
        <span class="k3s-stat">Total: ${deployments.total || 0}</span>
        <span class="k3s-stat k3s-ready">Ready: ${deployments.ready || 0}</span>
        <span class="k3s-stat k3s-unavailable">Unavailable: ${deployments.unavailable || 0}</span>
    `;
}

function updateK3sServices(services) {
    const container = document.getElementById('k3sServices');
    if (!container) return;
    
    container.innerHTML = `
        <span class="k3s-stat">Total: ${services.total || 0}</span>
        <span class="k3s-stat">ClusterIP: ${services.cluster_ip || 0}</span>
        <span class="k3s-stat">NodePort: ${services.node_port || 0}</span>
        <span class="k3s-stat">LoadBalancer: ${services.load_balancer || 0}</span>
    `;
}

function updateK3sEvents(events) {
    const container = document.getElementById('k3sEvents');
    if (!container) return;

    if (events.length === 0) {
        container.innerHTML = '<div class="k3s-empty">No recent events</div>';
        return;
    }

    container.innerHTML = events.map(event => `
        <div class="k3s-event-item ${event.type.toLowerCase()}">
            <div class="k3s-event-header">
                <span class="k3s-event-type">${event.type}</span>
                <span class="k3s-event-reason">${event.reason}</span>
            </div>
            <div class="k3s-event-message">${event.message}</div>
            <div class="k3s-event-meta">
                <span>${event.involved_object.kind}/${event.involved_object.name}</span>
                <span>${formatTimestamp(event.timestamp)}</span>
            </div>
        </div>
    `).join('');
}

function showK3sError(message) {
    const errorEl = document.getElementById('k3sError');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

function hideK3sError() {
    const errorEl = document.getElementById('k3sError');
    if (errorEl) {
        errorEl.style.display = 'none';
    }
}

function formatMemory(mem_str) {
    const ki = parseInt(mem_str);
    if (ki >= 1024 * 1024) {
        return (ki / (1024 * 1024)).toFixed(1) + 'Gi';
    } else if (ki >= 1024) {
        return (ki / 1024).toFixed(0) + 'Mi';
    }
    return ki + 'Ki';
}

function formatTimestamp(ts) {
    const date = new Date(ts);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return diff + 's ago';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return date.toLocaleDateString();
}
