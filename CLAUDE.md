# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Run Commands

### Local Development
```bash
# Build Docker image (multi-arch: ARM64/ARMv7/x86_64)
docker build -f docker/Dockerfile -t atrium:dev .

# Run container for testing
docker run -d --name atrium-dev -p 8080:80 atrium:dev

# Access at http://localhost:8080
```

### Production Deployment
```bash
# Build and deploy to Raspberry Pi
./scripts/build.sh
./scripts/deploy.sh

# Or use docker-compose directly on Pi
docker-compose -f docker/docker-compose.yml up -d
```

### Testing Changes
After modifying any files in `app/`, rebuild and restart:
```bash
docker build -f docker/Dockerfile -t atrium:test .
docker rm -f atrium-test
docker run -d --name atrium-test -p 8082:80 atrium:test
```

### Container Management
```bash
# View logs
docker logs -f atrium

# Check resource usage (important for Raspberry Pi)
docker stats atrium

# Restart
docker restart atrium
```

## Architecture

This is **Atrium**, a single-page static webapp with no backend database, running in Docker with nginx + Python API.

### Key Architectural Decisions

**Client-Side Only State**: All configuration (services, RSS feeds, app title) is stored in browser localStorage. There is no server-side persistence. The `app/config.js` file only provides defaults for new installations.

**Dual HTTP Servers**: The container runs two processes:
- `nginx` on port 80: serves static HTML/CSS/JS
- Python HTTP server on port 8001: provides `/api/stats` endpoint for system monitoring

**Multi-Language System (i18n)**:
- All UI strings are stored in `app/i18n/*.json` (en, it, de)
- Language detection: browser localStorage → browser `navigator.language` → fallback to 'en'
- Translation key format: `"section.key": "value"` (flat structure, not nested)
- Use `t('config.title')` function to translate, not direct string access
- HTML elements with `data-i18n="key"` attribute are auto-translated on page load and language change

**Configuration Flow**:
1. Page load → `loadConfig()` checks localStorage for `proxyHomeConfig`
2. If not found → uses defaults from `config.js` (empty arrays for clean distribution)
3. All config changes via UI are saved to localStorage immediately
4. Config page provides "Export Configuration" to download JSON backup

### File Structure

```
app/
├── index.html          # Homepage (uses t() for i18n, data-i18n attributes)
├── config.html         # Configuration page (tabs: General, Services, RSS Feeds)
├── style.css           # Homepage styles + theme color definitions
├── config-page.css     # Config page styles
├── script.js           # Homepage logic: clock, search, services rendering, system monitor polling
├── config.js           # Default configuration (empty for distribution)
├── config-page.js      # Config page logic: CRUD for services/feeds, form handling
├── i18n.js             # Translation system: loadTranslations(), t(), setLanguage(), initI18N()
└── i18n/
    ├── en.json         # English translations (default)
    ├── it.json         # Italian translations
    └── de.json         # German translations

docker/
├── Dockerfile          # nginx:alpine + Python3
├── nginx.conf          # nginx config + /api/ proxy to :8001
├── entrypoint.sh       # Starts both nginx and Python API
├── docker-compose.yml  # Production deployment config
└── api/
    └── server.py       # Python HTTP server reading /proc for system stats
```

### Important Implementation Details

**i18n Translation Function**:
```javascript
// t() expects flat key structure: "app.title" NOT nested "app": { "title": ... }
let value = translations.strings['app.title'];  // Direct access, not nested traversal
```

**Adding New Translatable Strings**:
1. Add keys to all three files: `app/i18n/en.json`, `it.json`, `de.json`
2. Use in HTML: `<span data-i18n="config.newKey">default</span>` (auto-updated)
3. Use in JS: `element.textContent = t('config.newKey')` (manual update needed)

**Custom Application Title**:
- Default title is "Atrium" (defined in i18n files)
- Users can override via Config page → General tab
- Stored in config as `appTitle` (empty string = use i18n default)
- In `script.js`, call `updateAppTitle()` after i18n init and language change
- Function checks `appConfig.appTitle` first, falls back to `t('app.title')`

**System Monitor Data Flow**:
1. Python API reads `/proc/stat`, `/proc/meminfo`, `/proc/net/dev`
2. Serves JSON at `http://127.0.0.1:8001/api/stats`
3. nginx proxies `/api/stats` → Python backend
4. `script.js` polls API every 5 seconds via `setInterval()`
5. Updates DOM elements by ID (`cpuValue`, `memValue`, etc.)

**Service Color Themes**:
- Defined in `style.css` as `.service-card.{color}::before` and `.card-icon` gradients
- Add new colors by creating new CSS classes and adding option to config.html select

**Common Development Tasks**:

**Add a new configuration field**:
1. Add default to `config.js` (e.g., `const newFeature = "";`)
2. Add to `loadConfig()` in both `script.js` and `config-page.js`
3. Add UI input in appropriate HTML page
4. Add form handler to save to localStorage
5. Add translation keys to all i18n JSON files

**Add a new language**:
1. Create `app/i18n/{lang}.json` with same keys as `en.json`
2. Add to `AVAILABLE_LANGS` array in `i18n.js`
3. Add language name to `updateLanguageSelector()` in `i18n.js`
4. Add option to language selector in HTML pages

**Debug translation issues**:
- Check browser console for missing keys (returns key name if not found)
- Verify JSON files have `{"lang": "xx", "strings": {...}}` structure
- Ensure `data-i18n` attributes match JSON keys exactly
- After i18n changes, hard refresh browser (Ctrl+Shift+R) to clear cache

**Testing on x86_64 before ARM deployment**:
- Docker build is multi-arch, will work on x86_64 for testing
- System monitor API requires Linux `/proc` filesystem - won't work on macOS/Windows
- On macOS/Windows, system stats will show "API not available"
