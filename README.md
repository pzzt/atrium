# Atrium

> A self-hosted services dashboard with system monitoring, optimized for Raspberry Pi

![Docker](https://img.shields.io/badge/docker-multi--arch-blue?logo=docker)
![License](https://img.shields.io/badge/license-MIT-green)
![GitHub](https://img.shields.io/badge/github-published-lightgray)

![Atrium Dashboard](https://github.com/user-attachments/assets/efd46fe5-8cb5-4699-a8a8-c215cbfc72d2)

## ✨ Features

- 🎨 **Modern Dark Theme** - Beautiful gradient UI with smooth animations
- ⚙️ **Web UI Configuration** - Add/manage services and RSS feeds without editing files
- 📊 **Real-time System Monitoring** - CPU, RAM, Network, Uptime stats via Python API
- 🌍 **Multi-language Support** - English, Italian, German (UI switching)
- 📰 **RSS Feed Integration** - Latest news from your favorite sources
- 🔍 **Instant Search** - Quick filter through your services
- 📱 **Responsive Design** - Works perfectly on mobile and desktop
- 💾 **Docker Volume Persistence** - Configuration stored in `/data/config.json`
- 🐳 **Multi-Architecture Docker** - ARM64/ARMv7/x86_64 support
- ⚡ **Lightweight** - Optimized for Raspberry Pi 3 (~10-20MB RAM)

## 🚀 Quick Start

### Option 1: Pull from Docker Hub (Recommended)

```bash
docker run -d --name atrium -p 8080:80 -v atrium-data:/data --restart unless-stopped pzzt/atrium:latest
```

Access at: `http://your-raspberry-pi-ip:8080`

> **Note**: The `-v atrium-data:/data` flag ensures your configuration persists across container updates. If port 8080 is already in use, you can change the host port (e.g., `-p 80:80` for port 80)

### Option 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/pzzt/atrium.git
cd atrium

# Build the image
docker build -f docker/Dockerfile -t atrium:latest .

# Run the container
docker run -d --name atrium -p 8080:80 -v atrium-data:/data atrium:latest
```

### Using Docker Compose

```bash
cd atrium
docker compose up -d
```

The compose.yaml file uses port 8080 by default. You can edit the port mapping in compose.yaml if needed.

## 🏗️ Architecture

**Atrium** is a single-page static webapp with no backend database:

- **Frontend**: Pure HTML/CSS/JavaScript (no frameworks)
- **Web Server**: nginx (alpine-based)
- **System Monitor**: Python 3 HTTP server reading `/proc` filesystem
- **Config API**: Python REST API for configuration management
- **Storage**: JSON file in Docker volume (`/data/config.json`)
- **Language**: Browser localStorage (for language preference only)
- **Deployment**: Docker container

### Tech Stack

- **nginx**: Lightweight web server
- **Python 3**: System stats API
- **Vanilla JS**: No frameworks, pure JavaScript
- **CSS3**: Custom properties, flexbox, grid
- **i18n**: JSON-based translation system

## ⚙️ Configuration

All configuration is done through the web UI:

1. Click the ⚙️ icon in the top-right corner
2. **General Tab**: Customize application title
3. **Services Tab**: Add/remove services
   - Name (required)
   - URL (required)
   - Description
   - Icon (emoji)
   - Theme color
4. **RSS Feeds Tab**: Add/remove news feeds

### Default Configuration

Edit `app/config.js` to set defaults before building:

```javascript
const appTitle = "";
const services = [];
const newsFeeds = [];
```

## 📊 System Monitor

Atrium includes a real-time system monitor that displays:

- **CPU Usage**: Percentage and core count
- **Memory**: Total, used, available, percentage
- **Network Interfaces**: Interface names, RX/TX traffic
- **Uptime**: System uptime in days/hours/minutes
- **Load Average**: 1, 5, 15 minute load averages

Data is fetched every 5 seconds from `/proc` filesystem (Linux only).

## 🌍 Multi-Language Support

Atrium supports three languages:

- 🇬🇧 **English** (default)
- 🇮🇹 **Italiano**
- 🇩🇪 **Deutsch**

Language is automatically detected from browser settings, or manually selected via the dropdown in the top-right corner.

## 🎨 Customization

### Change Colors

Edit `app/style.css`:

```css
:root {
    --bg-primary: #0f0f1e;
    --bg-secondary: #1a1a2e;
    --bg-card: #16213e;
    --text-primary: #eee;
    --text-secondary: #aaa;
    --accent: #667eea;
}
```

### Add New Theme Color

Add to `app/style.css`:

```css
.service-card.mycolor::before {
    background: linear-gradient(90deg, #ff0000, #00ff00);
}

.service-card.mycolor .card-icon {
    background: linear-gradient(135deg, #ff0000, #00ff00);
}
```

### Add Custom Title

Set a custom title in the Configuration → General tab, or leave empty to use the default "Atrium".

## 🔧 Management

### View Logs

```bash
docker logs -f atrium
```

### Restart Container

```bash
docker restart atrium
```

### Update to Latest Version

```bash
docker pull pzzt/atrium:latest
docker stop atrium
docker rm atrium
docker run -d --name atrium -p 8080:80 -v atrium-data:/data --restart unless-stopped pzzt/atrium:latest
```

### Resource Usage (Recommended Limits)

- **CPU**: 1 core max
- **RAM**: 256MB max

Already configured in `docker/docker-compose.yml`.

## 📋 Supported Architectures

- **ARM64** (Raspberry Pi 3/4 - 64-bit OS)
- **ARMv7** (Raspberry Pi 3 - 32-bit OS)
- **x86_64** (Intel/AMD - for testing)

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs atrium

# Verify port 8080 is available (or your chosen port)
sudo netstat -tlnp | grep :8080

# Run without detach for debugging
docker run --rm -p 8080:80 atrium:latest
```

### Can't Access from Other Devices

1. Check firewall on Raspberry Pi:
   ```bash
   sudo ufw allow 80/tcp
   ```

2. Verify nginx is listening:
   ```bash
   docker exec atrium netstat -tlnp
   ```

### System Monitor Shows "API Not Available"

- System monitor only works on Linux (reads `/proc` filesystem)
- On macOS/Windows during development, statistics will show as unavailable
- This is expected behavior

## 💾 Backup & Restore

### Automatic Backup (Recommended)

Your configuration is automatically stored in a Docker volume. To back it up:

```bash
# Copy config from container
docker cp atrium:/data/config.json atrium-config-backup.json

# Restore from backup
docker cp atrium-config-backup.json atrium:/data/config.json
docker restart atrium
```

### Manual Export/Import

**Export:**
1. Go to Configuration page (⚙️)
2. Click "Export Configuration"
3. Download the JSON file

**Import:**
1. Go to Configuration page (⚙️)
2. Click "Restore Defaults"
3. Manually add your services from the backup (or use docker cp method above)

## 🔒 Security

- **No database** - All configuration stored in JSON file on Docker volume
- **No external calls** - RSS feeds fetched client-side via public API
- **No tracking** - No analytics or telemetry
- **No authentication** - Deploy on trusted network only (or add reverse proxy auth)

## 🛣️ Roadmap

- [x] Multi-language support (EN, IT, DE)
- [x] System monitoring (CPU, RAM, Network)
- [x] Custom application title
- [x] Docker volume persistence
- [ ] Optional authentication
- [ ] Light/dark theme toggle
- [ ] Pinned/favorite services
- [ ] Import configuration from UI
- [ ] Weather widget
- [ ] Calendar widget
- [ ] Service health checks

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/pzzt/atrium/issues)
- **Discussions**: [GitHub Discussions](https://github.com/pzzt/atrium/discussions)

## 🔗 Links

- **GitHub Repository**: [https://github.com/pzzt/atrium](https://github.com/pzzt/atrium)
- **Docker Hub Image**: [https://hub.docker.com/r/pzzt/atrium](https://hub.docker.com/r/pzzt/atrium)

## 🙏 Acknowledgments

Built with ❤️ for self-hosting enthusiasts.

Inspired by the need for a simple, beautiful dashboard to access self-hosted services.

---

**Atrium** - Your personal services entry point. 🏛️
