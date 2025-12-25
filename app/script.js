// ============================================
// i18n Initialization
// ============================================

// Initialize i18n system before anything else
document.addEventListener('DOMContentLoaded', async () => {
    await initI18N();

    // Setup language selector
    const langSelector = document.getElementById('languageSelector');
    if (langSelector) {
        langSelector.addEventListener('change', async (e) => {
            await setLanguage(e.target.value);
            // Reload components that need translation
            updateAllTranslatableElements();
        });
    }
});

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


// ============================================
// Caricamento Configurazione
// ============================================

const STORAGE_KEY = 'proxyHomeConfig';

function loadConfig() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    // Default da config.js
    return {
        services: services || [],
        newsFeeds: newsFeeds || []
    };
}

// Carica configurazione all'avvio
const appConfig = loadConfig();


// ============================================
// Generazione Servizi dalla Configurazione
// ============================================

function renderServices() {
    const servicesGrid = document.getElementById('servicesGrid');
    const servicesList = appConfig.services;

    servicesList.forEach(service => {
        const card = document.createElement('a');
        card.href = service.url;
        card.className = `service-card ${service.color}`;
        card.innerHTML = `
            <div class="card-icon">${service.icon}</div>
            <h2 class="card-title">${service.name}</h2>
            <p class="card-description">${service.description}</p>
            <div class="card-link">${t('config.open', {}, 'Open →')}</div>
        `;
        servicesGrid.appendChild(card);
    });
}

// Genera i servizi al caricamento
document.addEventListener('DOMContentLoaded', () => {
    renderServices();
});


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
// Search Functionality
// ============================================

const searchInput = document.getElementById('search');
const noResults = document.getElementById('noResults');

searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase().trim();
    const serviceCards = document.querySelectorAll('.service-card');
    let visibleCount = 0;

    serviceCards.forEach(card => {
        const title = card.querySelector('.card-title').textContent.toLowerCase();
        const description = card.querySelector('.card-description').textContent.toLowerCase();

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


// ============================================
// Keyboard Shortcuts
// ============================================

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

