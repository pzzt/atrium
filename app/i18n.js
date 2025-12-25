// ============================================
// i18n - Internationalization System
// ============================================

const I18N_STORAGE_KEY = 'proxyHomepageLang';
const DEFAULT_LANG = 'en';
const AVAILABLE_LANGS = ['en', 'it', 'de'];

let currentLang = DEFAULT_LANG;
let translations = {};

// Load translations for a specific language
async function loadTranslations(lang) {
    try {
        const response = await fetch(`i18n/${lang}.json`);
        if (!response.ok) throw new Error(`Failed to load ${lang}.json`);
        translations = await response.json();
        currentLang = lang;
        return translations;
    } catch (error) {
        console.error(`Failed to load translations for ${lang}:`, error);
        // Fallback to English
        if (lang !== DEFAULT_LANG) {
            return loadTranslations(DEFAULT_LANG);
        }
        translations = { strings: {} };
        return translations;
    }
}

// Get current language
function getLanguage() {
    const saved = localStorage.getItem(I18N_STORAGE_KEY);
    if (saved && AVAILABLE_LANGS.includes(saved)) {
        return saved;
    }
    // Try browser language
    const browserLang = navigator.language.split('-')[0];
    if (AVAILABLE_LANGS.includes(browserLang)) {
        return browserLang;
    }
    return DEFAULT_LANG;
}

// Set language
async function setLanguage(lang) {
    if (!AVAILABLE_LANGS.includes(lang)) {
        console.warn(`Language ${lang} not available, falling back to ${DEFAULT_LANG}`);
        lang = DEFAULT_LANG;
    }
    localStorage.setItem(I18N_STORAGE_KEY, lang);
    await loadTranslations(lang);
    updatePageLanguage();
}

// Translate a key with optional parameters
function t(key, params = {}) {
    // Try to get the translation directly from the strings object
    let value = translations.strings ? translations.strings[key] : undefined;

    // If not found, return the key itself
    if (value === undefined) {
        return key;
    }

    // Replace placeholders like {n}, {item}, etc.
    if (typeof value === 'string' && params) {
        Object.keys(params).forEach(param => {
            value = value.replace(`{${param}}`, params[param]);
        });

        // Handle pluralization
        if (params.n !== undefined) {
            const isPlural = params.n !== 1;
            if (currentLang === 'it') {
                value = value.replace('{s}', isPlural ? 's' : '');
                value = value.replace('{e}', isPlural ? 'i' : 'o');
            } else if (currentLang === 'de') {
                value = value.replace('{n}', params.n);
                value = value.replace('{e}', isPlural ? 'e' : '');
            } else {
                value = value.replace('{s}', params.n === 1 ? '' : 's');
            }
        }
    }

    return value;
}

// Update all translatable elements on the page
function updatePageLanguage() {
    // Check if translations are loaded
    if (!translations.strings || Object.keys(translations.strings).length === 0) {
        return;
    }

    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const params = element.getAttribute('data-i18n-params');
        const parsedParams = params ? JSON.parse(params) : {};
        element.textContent = t(key, parsedParams);
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = t(key);
    });

    // Update title
    if (translations.strings?.['app.title']) {
        document.title = t('app.title');
    }

    // Update language selector
    updateLanguageSelector();
}

// Create/update language selector
function updateLanguageSelector() {
    let selector = document.getElementById('languageSelector');
    if (!selector) return;

    selector.innerHTML = AVAILABLE_LANGS.map(lang => {
        const isSelected = lang === currentLang;
        const langNames = {
            'en': '🇺🇸 English',
            'it': '🇮🇹 Italiano',
            'de': '🇩🇪 Deutsch'
        };
        return `<option value="${lang}" ${isSelected ? 'selected' : ''}>${langNames[lang]}</option>`;
    }).join('');
}

// Initialize i18n system
async function initI18N() {
    const lang = getLanguage();
    await loadTranslations(lang);
    updatePageLanguage();
}

// Get available languages
function getAvailableLanguages() {
    return AVAILABLE_LANGS;
}

// Get language name
function getLanguageName(lang) {
    const names = {
        'en': 'English',
        'it': 'Italiano',
        'de': 'Deutsch'
    };
    return names[lang] || lang;
}
