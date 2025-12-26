// ============================================
// Theme System for Atrium
// ============================================

const themes = {
    'catppuccin-macchiato': {
        name: 'Catppuccin - Macchiato',
        bgPrimary: '#24273a',
        bgSecondary: '#1e2030',
        bgCard: '#363a4f',
        textPrimary: '#cad3f5',
        textSecondary: '#a5adcb',
        accent: '#8aadf4',
        accentHover: '#b7bdf8',
        success: '#a6da95',
        danger: '#ed8796'
    },
    'catppuccin-mocha': {
        name: 'Catppuccin - Mocha',
        bgPrimary: '#1e1e2e',
        bgSecondary: '#181825',
        bgCard: '#313244',
        textPrimary: '#cdd6f4',
        textSecondary: '#a6adc8',
        accent: '#89b4fa',
        accentHover: '#b4befe',
        success: '#a6e3a1',
        danger: '#f38ba8'
    },
    'catppuccin-frappe': {
        name: 'Catppuccin - Frappé',
        bgPrimary: '#303446',
        bgSecondary: '#292c3c',
        bgCard: '#414559',
        textPrimary: '#c6d0f5',
        textSecondary: '#a5adce',
        accent: '#8caaee',
        accentHover: '#babbf1',
        success: '#a6d189',
        danger: '#e78284'
    },
    'catppuccin-latte': {
        name: 'Catppuccin - Latte',
        bgPrimary: '#eff1f5',
        bgSecondary: '#e6e9ef',
        bgCard: '#bcc0cc',
        textPrimary: '#4c4f69',
        textSecondary: '#6c6f85',
        accent: '#1e66f5',
        accentHover: '#7287fd',
        success: '#40a02b',
        danger: '#d20f39'
    },
    'minimal-kiwi': {
        name: 'Minimal Kiwi',
        bgPrimary: '#1a1a2e',
        bgSecondary: '#16213e',
        bgCard: '#0f3460',
        textPrimary: '#eaeaea',
        textSecondary: '#a0a0a0',
        accent: '#4ade80',
        accentHover: '#22c55e',
        success: '#4ade80',
        danger: '#f87171'
    },
    'one-dark-pro': {
        name: 'One Dark Pro',
        bgPrimary: '#282c34',
        bgSecondary: '#21252b',
        bgCard: '#2c313c',
        textPrimary: '#abb2bf',
        textSecondary: '#5c6370',
        accent: '#61afef',
        accentHover: '#56b6c2',
        success: '#98c379',
        danger: '#e06c75'
    },
    'nord-polar-night': {
        name: 'Nord - Polar Night',
        bgPrimary: '#2e3440',
        bgSecondary: '#3b4252',
        bgCard: '#434c5e',
        textPrimary: '#eceff4',
        textSecondary: '#d8dee9',
        accent: '#88c0d0',
        accentHover: '#8fbcbb',
        success: '#a3be8c',
        danger: '#bf616a'
    },
    'nord-frost': {
        name: 'Nord - Frost',
        bgPrimary: '#2e3440',
        bgSecondary: '#3b4252',
        bgCard: '#4c566a',
        textPrimary: '#eceff4',
        textSecondary: '#e5e9f0',
        accent: '#88c0d0',
        accentHover: '#81a1c1',
        success: '#a3be8c',
        danger: '#bf616a'
    },
    'nord-snow-storm': {
        name: 'Nord - Snow Storm',
        bgPrimary: '#3b4252',
        bgSecondary: '#434c5e',
        bgCard: '#4c566a',
        textPrimary: '#eceff4',
        textSecondary: '#e5e9f0',
        accent: '#5e81ac',
        accentHover: '#81a1c1',
        success: '#a3be8c',
        danger: '#bf616a'
    },
    'nord-aurora': {
        name: 'Nord - Aurora',
        bgPrimary: '#2e3440',
        bgSecondary: '#3b4252',
        bgCard: '#434c5e',
        textPrimary: '#eceff4',
        textSecondary: '#d8dee9',
        accent: '#88c0d0',
        accentHover: '#ebcb8b',
        success: '#a3be8c',
        danger: '#bf616a'
    }
};

// Apply theme to CSS variables
function applyTheme(themeId) {
    const theme = themes[themeId];
    if (!theme) {
        console.warn(`Theme ${themeId} not found`);
        return;
    }

    const root = document.documentElement;
    root.style.setProperty('--bg-primary', theme.bgPrimary);
    root.style.setProperty('--bg-secondary', theme.bgSecondary);
    root.style.setProperty('--bg-card', theme.bgCard);
    root.style.setProperty('--text-primary', theme.textPrimary);
    root.style.setProperty('--text-secondary', theme.textSecondary);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--accent-hover', theme.accentHover);
    root.style.setProperty('--success', theme.success);
    root.style.setProperty('--danger', theme.danger);
}
