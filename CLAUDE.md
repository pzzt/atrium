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

This is **Atrium**, a single-page static webapp with dual-mode configuration persistence, running in Docker with nginx + Python API.

### Key Architectural Decisions

**Dual-Mode Configuration Persistence**:
1. **Server-side** (primary): Configuration stored in `/data/config.json` via Python API (`/api/config`)
2. **Client-side** (fallback): Browser localStorage as backup when API unavailable
3. **Load sequence**: `loadConfiguration()` tries API first → falls back to localStorage → uses `config.js` defaults
4. **Save sequence**: Config page saves to API (`saveConfigToAPI()`) → on error, shows alert but keeps localStorage copy

**Dual HTTP Servers**: The container runs two processes:
- `nginx` on port 80: serves static HTML/CSS/JS
- Python HTTP server on port 8001: provides `/api/stats`, `/api/config`, `/api/k3s` endpoints

**Server-Side Caching**: Python API implements 15-second TTL cache for both system stats and K3s stats to reduce `/proc` and k8s API reads. Use `?nocache=true` query parameter to bypass cache.

**Multi-Language System (i18n)**:
- All UI strings in `app/i18n/*.json` (en, it, de) with flat structure: `"section.key": "value"`
- Language detection: localStorage → `navigator.language` → fallback to 'en'
- Translation function `t('key')` does direct lookup: `translations.strings['section.key']`
- HTML with `data-i18n="key"` auto-updates on page load and language change
- JS code must manually call `t()` and update DOM elements

**Dynamic Version System**: Version auto-generated during Docker build
- Git tag present: `v1.6.0` → footer shows "v1.6.0"
- No tag, commit only: `f940d52` → footer shows commit hash
- Local dev without git: footer shows "dev"
- Build script: `git describe --tags --always` → `--build-arg VERSION=v1.6.0`

**Theme System**: Catppuccin-based themes in `app/themes.js`
- Default: `catppuccin-macchiato`
- Themes defined as CSS variable sets (bgPrimary, textPrimary, accent, etc.)
- Applied dynamically via JavaScript on page load

### File Structure

```
app/
├── index.html          # Homepage (uses t() for i18n, data-i18n attributes)
├── config.html         # Configuration page (tabs: General, Services, RSS Feeds, Monitoring)
├── style.css           # Homepage styles + theme color definitions
├── config-page.css     # Config page styles
├── script.js           # Homepage logic: clock, search, services rendering, system/K3s monitor polling
├── config.js           # Default configuration (empty for distribution)
├── config-page.js      # Config page logic: CRUD for services/feeds, form handling, API save/load
├── api.js              # API client: loadConfigFromAPI(), saveConfigToAPI()
├── themes.js           # Theme system with Catppuccin color palettes
├── i18n.js             # Translation system: loadTranslations(), t(), setLanguage(), initI18N()
└── i18n/
    ├── en.json         # English translations (default)
    ├── it.json         # Italian translations
    └── de.json         # German translations

docker/
├── Dockerfile          # nginx:alpine + Python3 + kubernetes library
├── nginx.conf          # nginx config + /api/ proxy to :8001
├── entrypoint.sh       # Starts both nginx and Python API
├── docker-compose.yml  # Production deployment config
└── api/
    └── server.py       # Python HTTP server: /proc stats, /api/config, /api/k3s

scripts/
├── build.sh            # Multi-arch Docker build with auto-versioning
└── deploy.sh           # Deployment script for Raspberry Pi
```

### Important Implementation Details

**API Endpoints** (Python server on port 8001, proxied by nginx):
- `GET /api/stats` - System stats (CPU, RAM, network, uptime) with 15s cache
- `GET /api/stats?nocache=true` - Bypass cache, fresh data
- `GET /api/config` - Load configuration from `/data/config.json`
- `POST /api/config` - Save configuration to `/data/config.json`
- `GET /api/k3s` - K3s cluster stats (nodes, pods, deployments, services, events, namespaces, pod details)
- `GET /health` - Health check endpoint

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
- Default title from i18n: `t('app.title')` → "Atrium"
- Users override via Config page → General tab → stored as `appTitle` in config
- `updateAppTitle()` checks `appConfig.appTitle` first, falls back to i18n default
- Call `updateAppTitle()` after i18n init and language change

**System Monitor Data Flow**:
1. Python API reads `/proc/stat`, `/proc/meminfo`, `/proc/net/dev` with 15s cache
2. Serves JSON at `http://127.0.0.1:8001/api/stats`
3. nginx proxies `/api/stats` → Python backend
4. `script.js` polls API every 5 seconds via `setInterval()`, updates DOM by ID

**K3s Monitor Data Flow**:
1. Python API uses kubernetes library (auto-detects in-cluster config or mounted kubeconfig)
2. Reads cluster state: nodes, pods, deployments, services, events, namespaces
3. Serves JSON at `http://127.0.0.1:8001/api/k3s` with 15s cache
4. 7 independent sections: Nodes, Pods, Deployments, Services, Events, Namespaces, Pod Details
5. Parent section auto-hides when all 7 subsections disabled

**Service Color Themes**:
- Defined in `style.css` as `.service-card.{color}::before` and `.card-icon` gradients
- Add new colors by creating CSS classes and adding option to config.html select

**Client-Side Caching**:
- System stats and K3s stats cached in browser memory (5-second polling)
- Manual refresh buttons bypass cache with `?nocache=true` query parameter
- Display shows cached data instantly, updates in background on polling cycle

### Configuration Persistence Architecture

**Server-Side Storage** (Primary):
- Path: `/data/config.json` inside container (Docker volume)
- API: `GET /api/config` loads, `POST /api/config` saves
- Managed by Python HTTP server in `docker/api/server.py`
- Persists across container restarts when volume mounted

**Client-Side Storage** (Fallback):
- Browser localStorage key: `proxyHomeConfig`
- Used only when server API unavailable
- Config page "Export Configuration" downloads JSON backup

**Load Priority**: API response → localStorage → `config.js` defaults
**Save Behavior**: Always tries API first, shows alert on failure

### Version Management

**Auto-Versioning During Build**:
```bash
# Build script extracts version automatically
VERSION=$(git describe --tags --always)  # v1.6.0 or commit hash

# Dockerfile accepts VERSION build arg
docker build --build-arg VERSION=v1.6.0 -t atrium:latest .
```

**Version Display**:
- Footer shows version from `window.APP_VERSION` (generated by Dockerfile)
- `config.js` reads from `window.APP_VERSION` with fallback to "dev"
- `index.html` loads `version.js` before `config.js` for availability

**Create New Release**:
```bash
git tag -a v1.7.0 -m "Release v1.7.0"
git push origin v1.7.0
./scripts/build.sh  # Automatically detects and uses tag
```

### Development Workflow

**Add a new configuration field**:
1. Add default to `app/config.js` (e.g., `const newFeature = "";`)
2. Add to `loadConfig()` in both `app/script.js` and `app/config-page.js` (merge with API response)
3. Add UI input in appropriate HTML page (index.html or config.html)
4. Add form handler in `config-page.js` to include field in `saveConfigToAPI()` call
5. Add translation keys to all i18n JSON files (`en.json`, `it.json`, `de.json`)

**Add a new K3s monitoring section**:
1. Add visibility flag to `app/config.js` (e.g., `const showK3sNewSection = false;`)
2. Add checkbox in `config.html` Monitoring tab
3. Add handler in `config-page.js` load/save functions
4. Add section visibility logic in `script.js` `updateK3sMonitorVisibility()`
5. Add Python API handler in `docker/api/server.py` for k8s API calls
6. Add update function in `script.js` to render new section data
7. Add translation keys for all UI strings

**Add a new language**:
1. Create `app/i18n/{lang}.json` with same keys as `en.json`
2. Add to `AVAILABLE_LANGS` array in `app/i18n.js`
3. Add language name to `updateLanguageSelector()` in `app/i18n.js`
4. Add option to language selector in HTML pages

**Debug translation issues**:
- Check browser console for missing keys (returns key name if not found)
- Verify JSON files have `{"lang": "xx", "strings": {...}}` structure
- Ensure `data-i18n` attributes match JSON keys exactly
- After i18n changes, hard refresh browser (Ctrl+Shift+R) to clear cache

**Testing on x86_64 before ARM deployment**:
- Docker build is multi-arch, will work on x86_64 for testing
- System monitor API requires Linux `/proc` filesystem - won't work on macOS/Windows
- On macOS/Windows, system stats show "API not available"
- K3s monitoring works only when k8s API is accessible (in-cluster or mounted kubeconfig)
