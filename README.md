# Atrium

> A self-hosted services dashboard with system monitoring

![Docker](https://img.shields.io/badge/docker-multi--arch-blue?logo=docker)
![License](https://img.shields.io/badge/license-MIT-green)
![GitHub](https://img.shields.io/badge/github-published-lightgray)

![Atrium Dashboard](https://github.com/user-attachments/assets/efd46fe5-8cb5-4699-a8a8-c215cbfc72d2)

## 📑 Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Configuration](#️-configuration)
- [System Monitor](#-system-monitor)
- [K3s Cluster Monitoring](#️-k3s-cluster-monitoring)
- [Multi-Language Support](#-multi-language-support)
- [Management](#-management)
- [Supported Architectures](#-supported-architectures)
- [Troubleshooting](#-troubleshooting)
- [Backup & Restore](#-backup--restore)
- [Security](#-security)
- [Roadmap](#-roadmap)
- [License](#-license)
- [Contributing](#-contributing)
- [Support](#-support)
- [Links](#-links)

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
- ⚡ **Lightweight** - Minimal resource usage

## 🚀 Quick Start

### Option 1: Pull from Docker Hub (Recommended)

```bash
docker run -d --name atrium -p 8080:80 -v atrium-data:/data --restart unless-stopped pzzt/atrium:latest
```

Access at: `http://localhost:8080` or `http://your-server-ip:8080`

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

## ⚙️ Configuration

All configuration is done through the web UI:

1. Click the ⚙️ icon in the top-right corner
2. **General Tab**: Customize application title
3. **Services Tab**: Add/remove services (name, URL, description, icon, theme color)
4. **RSS Feeds Tab**: Add/remove news feeds
5. **Nerd Tab**: Enable system monitor and K3s monitoring sections

Configuration is stored in `/data/config.json` on the Docker volume. When you first run Atrium, it starts with an empty configuration. Use the web UI to add your services and feeds.

## 📊 System Monitor

Atrium includes a real-time system monitor that displays:

- **CPU Usage**: Percentage and core count
- **Memory**: Total, used, available, percentage
- **Network Interfaces**: Interface names, RX/TX traffic
- **Uptime**: System uptime in days/hours/minutes
- **Load Average**: 1, 5, 15 minute load averages

Data is fetched every 5 seconds from `/proc` filesystem (Linux only).

## ☸️ K3s Cluster Monitoring

Atrium includes Kubernetes cluster monitoring with 5 independent toggleable sections:

- **Nodes**: Cluster node status, roles, versions, and resource capacity
- **Pods**: Total, running, pending, failed, and succeeded pod counts
- **Deployments**: Total deployments with ready/unavailable statistics
- **Services**: Service counts by type (ClusterIP, NodePort, LoadBalancer)
- **Events**: Recent cluster events (warnings, normal events)

### Enable K3s Monitoring

1. Click the ⚙️ icon in the top-right corner
2. Go to the **Nerd** tab
3. Under "K3s Cluster Monitor", enable the sections you want to display

Each section can be enabled independently, so you can choose exactly what cluster information to show on your dashboard.

### ⚠️ Important: v1.7.0+ Changes

Starting from **v1.7.0**, Atrium uses **automatic Kubernetes in-cluster configuration** instead of hardcoded IPs or manual kubeconfig mounting. This makes it work seamlessly on any Kubernetes cluster.

### Deployment Methods

#### Method 1: Deploy Inside Kubernetes (Recommended)

When deploying Atrium inside your Kubernetes cluster, it automatically detects and uses the in-cluster configuration.

**Required RBAC Configuration:**

Atrium requires specific permissions to monitor your cluster. Create these resources:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: atrium
  namespace: atrium
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: atrium
rules:
  # Nodes
  - apiGroups: [""]
    resources: ["nodes"]
    verbs: ["get", "list", "watch"]
  # Pods
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]
  # Deployments
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list", "watch"]
  # Services
  - apiGroups: [""]
    resources: ["services"]
    verbs: ["get", "list", "watch"]
  # Events
  - apiGroups: [""]
    resources: ["events"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: atrium
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: atrium
subjects:
  - kind: ServiceAccount
    name: atrium
    namespace: atrium
```

**Apply the RBAC:**

```bash
kubectl apply -f atrium-rbac.yaml
```

**Deploy Atrium:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: atrium
  namespace: atrium
spec:
  replicas: 1
  selector:
    matchLabels:
      app: atrium
  template:
    metadata:
      labels:
        app: atrium
    spec:
      serviceAccountName: atrium
      containers:
      - name: atrium
        image: pzzt/atrium:latest
        ports:
        - containerPort: 80
```

Atrium will automatically:
- Detect it's running in-cluster
- Load the ServiceAccount token from `/var/run/secrets/kubernetes.io/serviceaccount/token`
- Load the CA certificate from `/var/run/secrets/kubernetes.io/serviceaccount/ca.crt`
- Resolve `kubernetes.default.svc` to connect to the API server

#### Method 2: External Access with kubeconfig (Docker/Podman)

For running Atrium outside the cluster (e.g., on your workstation):

```bash
docker run -d --name atrium \
  -p 8080:80 \
  -v atrium-data:/data \
  -v ~/.kube/config:/root/.kube/config:ro \
  --restart unless-stopped \
  pzzt/atrium:latest
```

Replace `~/.kube/config` with your actual kubeconfig path.

#### Custom API Endpoint (Optional)

If your cluster uses a non-standard API endpoint, set the `KUBERNETES_API_HOST` environment variable:

```yaml
env:
  - name: KUBERNETES_API_HOST
    value: "https://your-custom-api-server:6443"
```

Or with Docker:

```bash
docker run -d --name atrium \
  -p 8080:80 \
  -v atrium-data:/data \
  -v ~/.kube/config:/root/.kube/config:ro \
  -e KUBERNETES_API_HOST=https://custom-api-server:6443 \
  --restart unless-stopped \
  pzzt/atrium:latest
```

### Troubleshooting K3s Monitoring

**"403 Forbidden" or "cannot list resource 'nodes'":**
- The ServiceAccount lacks required permissions
- **Solution**: Apply the custom ClusterRole `atrium` provided above
- Do NOT use the default `view` ClusterRole - it may not have all required permissions

**"Unable to connect to K3s cluster" or connection timeout:**
- Check if Atrium can reach the API server: `kubectl exec -n atrium deployment/atrium -- curl -k https://kubernetes.default.svc`
- Verify ServiceAccount exists: `kubectl get sa atrium -n atrium`
- Check ClusterRoleBinding: `kubectl get clusterrolebinding atrium`
- Review pod logs: `kubectl logs -n atrium deployment/atrium`

**No data showing in K3s sections:**
- Ensure K3s sections are enabled in Configuration → Nerd tab
- Verify the cluster has resources (nodes, pods, deployments)
- Check browser console for JavaScript errors

**Events showing incorrect timestamps:**
- Some events may not have timestamps - this is expected
- These events will display with "No timestamp" or similar

## 🌍 Multi-Language Support

Atrium supports three languages:

- 🇬🇧 **English** (default)
- 🇮🇹 **Italiano**
- 🇩🇪 **Deutsch**

Language is automatically detected from browser settings, or manually selected via the dropdown in the top-right corner.

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

Your configuration is automatically stored in a Docker volume. To back it up:

```bash
# Copy config from container
docker cp atrium:/data/config.json atrium-config-backup.json

# Restore from backup
docker cp atrium-config-backup.json atrium:/data/config.json
docker restart atrium
```

**Export**: Use the "Export Configuration" button in Configuration page (⚙️)

## 🔒 Security

- **No database** - All configuration stored in JSON file on Docker volume
- **No external calls** - RSS feeds fetched client-side (via rss2json API for conversion)
- **No tracking** - No analytics or telemetry
- **No authentication** - Deploy on trusted network only (or add reverse proxy auth)

## 🛣️ Roadmap

- [x] Multi-language support (EN, IT, DE)
- [x] System monitoring (CPU, RAM, Network)
- [x] K3s cluster monitoring
- [x] Custom application title
- [x] Docker volume persistence
- [x] Import/Export configuration from UI
- [ ] Optional authentication
- [ ] Pinned/favorite services
- [ ] Weather widget
- [ ] Calendar widget

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

- **GitHub**: [https://github.com/pzzt/atrium](https://github.com/pzzt/atrium)
- **Docker Hub**: [https://hub.docker.com/r/pzzt/atrium](https://hub.docker.com/r/pzzt/atrium)

---

**Atrium** - Your personal services entry point. 🏛️
