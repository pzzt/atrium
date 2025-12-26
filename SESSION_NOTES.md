# Session Notes - 26 December 2025

## Latest Release: v1.6.0

### What Was Done

#### 1. System Monitor Granular Control
- Split System Monitor into 5 individually toggleable components:
  - CPU Usage
  - Memory/RAM
  - Uptime & Load
  - Network Interfaces (list)
  - Network Chart (scrolling graph)
- Each component has independent checkbox in Nerd settings
- Parent section auto-hides when all components are disabled
- CPU, RAM, Uptime displayed in single row (3-column grid layout)

#### 2. Dynamic Version System
- Version automatically generated from git tags during Docker build
- **Dockerfile**: Added `ARG VERSION` with default "dev"
- **Dockerfile**: Auto-generates `version.js` with `window.APP_VERSION`
- **config.js**: Reads VERSION from `window.APP_VERSION` (fallback: "dev")
- **index.html**: Loads `version.js` before `config.js`
- **build.sh**: Extracts version with `git describe --tags --always`

**How versioning works:**
- With tag: `v1.6.0` → footer shows "v1.6.0"
- Without tag: `f940d52` → footer shows commit hash
- Local dev: no git → footer shows "dev"

#### 3. Network Traffic Chart
- Added scrolling line chart in System Monitor
- Canvas-based rendering
- Cyan line for download (RX), magenta for upload (TX)
- 60 data points (5 minutes history at 5-second intervals)
- Toggleable via checkbox in Nerd settings

#### 4. Other Improvements
- Added favicon: 🖥️ emoji
- Updated README with K3s monitoring configuration guide
- Added table of contents to README
- Cleaned up README (removed superfluous sections)
- Updated Roadmap to reflect completed features

## Current Git Status

- **Latest commit**: 939236e feat: Auto-generate version from git tags during build
- **Latest tag**: v1.6.0
- **Branch**: main (up to date with origin/main)
- **Unpushed commits**: None
- **Working tree**: Clean

## Files Modified

### Core Application
- `app/index.html`: Added version.js script, system-stats wrapper, IDs for individual components
- `app/config.js`: Dynamic VERSION from window.APP_VERSION
- `app/script.js`: Added updateSystemMonitorVisibility() for granular control
- `app/style.css`: Added 3-column grid layout, K3s styles, network chart styles

### Configuration
- `app/config.html`: 5 separate checkboxes for System Monitor components
- `app/config-page.js`: Updated to handle 5 independent boolean flags

### Internationalization
- `app/i18n/en.json`: Added 10 new keys (5 labels + 5 hints for System Monitor)
- `app/i18n/it.json`: Added 10 Italian translations
- `app/i18n/de.json`: Added 10 German translations

### Docker & Build
- `docker/Dockerfile`: Added ARG VERSION, auto-generates version.js
- `scripts/build.sh`: Auto-detects version from git, passes as build-arg

## Current Issues

### GitHub Actions - docker-publish.yml
- **Error**: "Forbidden" on build-and-push job
- **Status**: Secrets configured correctly (DOCKERHUB_USERNAME, DOCKERHUB_TOKEN)
- **Action needed**: Manual test pending via workflow_dispatch

## How to Create New Release

### Method 1: Using build script (Recommended)
```bash
# Create and push tag
git tag -a v1.7.0 -m "Release v1.7.0"
git push origin v1.7.0

# Build with version (automatically detects tag)
./scripts/build.sh

# Or manual build with specific version
docker build --build-arg VERSION=v1.7.0 -t atrium:v1.7.0 -f docker/Dockerfile .
```

### Method 2: Manual tagging
```bash
# Annotated tag with release notes
git tag -a v1.7.0 -m "Release v1.7.0

Features:
- Feature 1
- Feature 2

Fixes:
- Bug fix 1
- Bug fix 2
"

# Push tag
git push origin v1.7.0

# Rebuild container
docker build --build-arg VERSION=$(git describe --tags --always) \
  -t atrium:latest -f docker/Dockerfile .
```

## Development Workflow

### Local Development
```bash
# Make changes to files in app/
# Test locally
docker build -f docker/Dockerfile -t atrium:test .
docker run -d --name atrium-test -p 8082:80 atrium:test

# Access at http://localhost:8082
# Version will show as "dev" without git tag
```

### Testing Version System
```bash
# Test with commit hash
docker build --build-arg VERSION=$(git rev-parse --short HEAD) \
  -t atrium:test . && docker run -p 8082:80 atrium:test

# Test with custom version
docker build --build-arg VERSION=v2.0.0-rc1 \
  -t atrium:test . && docker run -p 8082:80 atrium:test
```

### Production Deployment
```bash
# Rebuild container
docker build --build-arg VERSION=$(git describe --tags --always) \
  -t atrium:latest -f docker/Dockerfile .

# Restart container
docker rm -f atrium
docker run -d --name atrium -p 8080:80 atrium:latest
```

## Architecture Notes

### System Monitor Visibility Control
- **Parent section**: `.system-monitor` with ID `systemMonitor`
- **Components grid**: `.system-stats` wrapper (3-column grid layout)
- **Individual cards**: `#cpuCard`, `#memoryCard`, `#uptimeCard`
- **Network section**: `#networkStats` (contains both list and chart)
- **Network chart**: `#networkChart` (inside networkStats)

**Visibility logic:**
```javascript
// Parent visible if ANY component enabled
const anySystemEnabled = appConfig.showCPU || appConfig.showMemory ||
                        appConfig.showUptime || appConfig.showNetworkInterfaces ||
                        appConfig.showNetworkChart;

// Each component independently toggleable
document.getElementById('cpuCard').classList.toggle('hidden', !appConfig.showCPU);
```

### K3s Monitoring (Already Implemented)
- Toggleable components: Nodes, Pods, Deployments, Services, Events
- Uses Python kubernetes library
- Supports in-cluster config and mounted kubeconfig
- 5 separate checkboxes in Nerd settings

### Version Flow
1. **Git tag** → `v1.6.0`
2. **Build script** → `git describe --tags --always` → `v1.6.0`
3. **Docker build** → `--build-arg VERSION=v1.6.0`
4. **Dockerfile** → `echo "window.APP_VERSION = \"v1.6.0\";" > version.js`
5. **index.html** → `<script src="version.js">`
6. **config.js** → `const VERSION = window.APP_VERSION`
7. **Footer** → Displays "v1.6.0"

## TODO Items

### Pending
- Test GitHub Actions workflow manually (docker-publish.yml)
- Investigate "Forbidden" error if test fails

### Completed ✅
- Dynamic version system
- System Monitor granular control
- Network traffic chart
- Favicon
- K3s cluster monitoring
- Multi-language support (en, it, de)
- Theme system
- Import/Export configuration

## Quick Reference

### View Current Version
```bash
git describe --tags --always
# Output: v1.6.0
```

### View All Tags
```bash
git tag -l
```

### Check Version in Container
```bash
docker exec atrium cat /usr/share/nginx/html/version.js
# Output: window.APP_VERSION = "v1.6.0";
```

### Rebuild After Changes
```bash
docker build --build-arg VERSION=$(git describe --tags --always) \
  -t atrium:latest -f docker/Dockerfile . && \
docker rm -f atrium && \
docker run -d --name atrium -p 8080:80 atrium:latest
```

## Container Management

### Local Testing
- **Production**: http://localhost:8080 (atrium:latest)
- **Testing**: http://localhost:8082 (atrium:test or atrium:test)

### Useful Commands
```bash
# View logs
docker logs -f atrium

# Check resource usage
docker stats atrium

# Restart
docker restart atrium

# Shell access
docker exec -it atrium sh
```

## Next Session Suggestions

1. **Fix GitHub Actions** if "Forbidden" error persists
2. **Create v1.6.1 patch release** if any bugs found
3. **Plan v1.7.0 features** (check Roadmap in README)
4. **Consider GitHub Container Registry (ghcr.io)** as alternative to Docker Hub

---
**Session Date**: 26 December 2025
**Claude Version**: Sonnet 4.5
**Project**: Atrium - Self-hosted services dashboard with system monitoring
