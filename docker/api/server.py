#!/usr/bin/env python3
"""
Atrium - System Stats API
Legge statistiche di sistema e le espone via HTTP
"""
import json
import time
import fcntl
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
import os

# Try to import kubernetes library for k3s monitoring
try:
    from kubernetes import client, config
    KUBERNETES_AVAILABLE = True
except ImportError:
    KUBERNETES_AVAILABLE = False

CONFIG_PATH = '/data/config.json'

class StatsHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse path
        parsed = urlparse(self.path)
        path = parsed.path

        # CORS headers
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

        if path == '/health':
            response = {'status': 'healthy'}
        elif path == '/api/stats':
            response = get_system_stats()
        elif path == '/api/stats/cpu':
            response = {'cpu': get_cpu_usage()}
        elif path == '/api/stats/memory':
            response = {'memory': get_memory_info()}
        elif path == '/api/stats/network':
            response = {'network': get_network_stats()}
        elif path == '/api/config':
            response = get_config()
        elif path == '/api/k3s':
            response = get_k3s_stats()
        else:
            response = {'error': 'Not found'}

        self.wfile.write(json.dumps(response).encode())

    def do_POST(self):
        # Parse path
        parsed = urlparse(self.path)
        path = parsed.path

        # Read request body
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else b''

        # CORS headers
        if path == '/api/config' or path == '/api/config/import':
            try:
                data = json.loads(body.decode('utf-8')) if body else {}
                if path == '/api/config':
                    response = save_config(data)
                else:  # /api/config/import
                    response = save_config(data)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode())
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_DELETE(self):
        # Parse path
        parsed = urlparse(self.path)
        path = parsed.path

        if path == '/api/config':
            response = delete_config()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        # Suppress default logging
        pass

def get_config():
    """Get configuration from file"""
    try:
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, 'r') as f:
                return json.load(f)
        else:
            # Return default empty config
            return {
                'appTitle': '',
                'services': [],
                'newsFeeds': []
            }
    except Exception as e:
        return {'error': str(e)}

def save_config(data):
    """Save configuration to file"""
    try:
        # Ensure directory exists
        os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)

        # Atomic write with temp file
        temp_path = CONFIG_PATH + '.tmp'
        with open(temp_path, 'w') as f:
            json.dump(data, f, indent=2)

        # Atomic rename
        os.rename(temp_path, CONFIG_PATH)

        return {'status': 'ok'}
    except Exception as e:
        return {'error': str(e)}

def delete_config():
    """Delete configuration file"""
    try:
        if os.path.exists(CONFIG_PATH):
            os.remove(CONFIG_PATH)
        return {'status': 'ok'}
    except Exception as e:
        return {'error': str(e)}

def get_cpu_usage():
    """Get CPU usage percentage"""
    try:
        # Leggi /proc/stat
        with open('/proc/stat', 'r') as f:
            line = f.readline()
            fields = line.split()
            total = sum(map(int, fields[1:8]))
            idle = int(fields[4])

            # Aspetta un momento per calcolare la differenza
            time.sleep(0.1)

            with open('/proc/stat', 'r') as f2:
                line2 = f2.readline()
                fields2 = line2.split()
                total2 = sum(map(int, fields2[1:8]))
                idle2 = int(fields2[4])

            total_diff = total2 - total
            idle_diff = idle2 - idle

            if total_diff > 0:
                cpu_percent = ((total_diff - idle_diff) / total_diff) * 100
                return round(cpu_percent, 1)
            return 0.0
    except Exception as e:
        return 0.0

def get_memory_info():
    """Get memory information"""
    try:
        with open('/proc/meminfo', 'r') as f:
            meminfo = {}
            for line in f:
                parts = line.split(':')
                if len(parts) == 2:
                    key = parts[0].strip()
                    value = parts[1].strip().split()[0]
                    meminfo[key] = int(value)

            total = meminfo.get('MemTotal', 0)
            available = meminfo.get('MemAvailable', meminfo.get('MemFree', 0))
            used = total - available

            return {
                'total_mb': round(total / 1024, 1),
                'used_mb': round(used / 1024, 1),
                'available_mb': round(available / 1024, 1),
                'percent': round((used / total) * 100, 1) if total > 0 else 0
            }
    except Exception as e:
        return {'error': str(e)}

def get_network_stats():
    """Get network statistics"""
    try:
        # Leggi /proc/net/dev per statistiche interfaccia
        with open('/proc/net/dev', 'r') as f:
            lines = f.readlines()[2:]  # Skip header lines

            interfaces = []
            for line in lines:
                if not line.strip():
                    continue

                parts = line.split()
                if_name = parts[0].rstrip(':')

                # Salta loopback
                if if_name == 'lo':
                    continue

                rx_bytes = int(parts[1])
                tx_bytes = int(parts[9])

                interfaces.append({
                    'name': if_name,
                    'rx_mb': round(rx_bytes / 1024 / 1024, 2),
                    'tx_mb': round(tx_bytes / 1024 / 1024, 2)
                })

            return interfaces[:4]  # Max 4 interfaces
    except Exception as e:
        return {'error': str(e)}

def get_system_stats():
    """Get all system statistics"""
    # Ottieni CPU (con cache per evitare di rileggere troppo spesso)
    cpu = get_cpu_usage()

    return {
        'cpu': {
            'percent': cpu,
            'cores': os.cpu_count() or 1
        },
        'memory': get_memory_info(),
        'network': get_network_stats(),
        'uptime': get_uptime(),
        'load_average': get_load_average()
    }

def get_uptime():
    """Get system uptime in seconds"""
    try:
        with open('/proc/uptime', 'r') as f:
            uptime_seconds = float(f.readline().split()[0])
            days = int(uptime_seconds // 86400)
            hours = int((uptime_seconds % 86400) // 3600)
            minutes = int((uptime_seconds % 3600) // 60)
            return f'{days}d {hours}h {minutes}m'
    except:
        return 'Unknown'

def get_load_average():
    """Get load average"""
    try:
        with open('/proc/loadavg', 'r') as f:
            loadavg = f.readline().split()[:3]
            return [float(x) for x in loadavg]
    except:
        return [0, 0, 0]

def get_k3s_stats():
    """Get k3s cluster statistics if available"""
    if not KUBERNETES_AVAILABLE:
        return {'error': 'Kubernetes library not available'}

    try:
        # Try in-cluster config first
        try:
            # Load in-cluster config (automatically uses token and CA from standard paths)
            config.load_incluster_config()

            # Override the API server host to use the correct endpoint
            # The kubernetes service is on 10.43.0.1:443 (not the API server port 6443)
            # Kubernetes service on port 443 redirects to API server on port 6443
            # Use the service IP with port 443 which is accessible from within the cluster
            custom_host = os.getenv('KUBERNETES_API_HOST', 'https://10.43.0.1')

            # Ensure the URL has the correct format
            if not custom_host.startswith('https://') and not custom_host.startswith('http://'):
                custom_host = f'https://{custom_host}'

            # Directly set the configuration host
            client.Configuration._default.host = custom_host
        except config.ConfigException:
            # Fallback to kubeconfig
            kubeconfig_path = os.getenv('KUBECONFIG', '/root/.kube/config')
            if not os.path.exists(kubeconfig_path):
                return {'error': 'No kubernetes configuration found'}
            config.load_kube_config(config_file=kubeconfig_path)

        v1 = client.CoreV1Api()
        apps_v1 = client.AppsV1Api()

        # Get nodes
        nodes = v1.list_node()
        nodes_data = []
        for node in nodes.items:
            nodes_data.append({
                'name': node.metadata.name,
                'status': 'Ready' if any(condition.type == 'Ready' and condition.status == 'True' for condition in node.status.conditions) else 'NotReady',
                'roles': node.metadata.labels.get('kubernetes.io/role', ''),
                'version': node.status.node_info.kubelet_version,
                'capacity': {
                    'cpu': node.status.capacity.get('cpu'),
                    'memory': node.status.capacity.get('memory'),
                    'pods': node.status.capacity.get('pods')
                }
            })

        # Get pods
        pods = v1.list_pod_for_all_namespaces()
        pods_data = {
            'total': len(pods.items),
            'running': sum(1 for p in pods.items if p.status.phase == 'Running'),
            'pending': sum(1 for p in pods.items if p.status.phase == 'Pending'),
            'failed': sum(1 for p in pods.items if p.status.phase == 'Failed'),
            'succeeded': sum(1 for p in pods.items if p.status.phase == 'Succeeded')
        }

        # Get deployments
        deployments = apps_v1.list_deployment_for_all_namespaces()
        deployments_data = {
            'total': len(deployments.items),
            'ready': sum(1 for d in deployments.items if d.status.ready_replicas == d.spec.replicas),
            'unavailable': sum(1 for d in deployments.items if d.status.unavailable_replicas and d.status.unavailable_replicas > 0)
        }

        # Get services
        services = v1.list_service_for_all_namespaces()
        services_data = {
            'total': len(services.items),
            'cluster_ip': sum(1 for s in services.items if s.spec.type == 'ClusterIP'),
            'node_port': sum(1 for s in services.items if s.spec.type == 'NodePort'),
            'load_balancer': sum(1 for s in services.items if s.spec.type == 'LoadBalancer')
        }

        # Get recent events (last hour)
        from datetime import datetime, timedelta
        events = v1.list_event_for_all_namespaces()
        recent_events = []
        cutoff = datetime.now(events.items[0].last_timestamp.tzinfo) - timedelta(hours=1) if events.items else None

        for event in events.items[:20]:  # Last 20 events
            if cutoff and event.last_timestamp < cutoff:
                continue
            recent_events.append({
                'type': event.type,  # Normal, Warning
                'reason': event.reason,
                'message': event.message,
                'namespace': event.metadata.namespace,
                'involved_object': {
                    'kind': event.involved_object.kind,
                    'name': event.involved_object.name
                },
                'timestamp': event.last_timestamp.isoformat() if event.last_timestamp else None
            })

        return {
            'nodes': nodes_data,
            'pods': pods_data,
            'deployments': deployments_data,
            'services': services_data,
            'events': recent_events[:10]  # Last 10 events
        }

    except Exception as e:
        return {'error': str(e)}

def run_server(port=8001):
    """Start HTTP server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, StatsHandler)
    print(f'System Stats API running on port {port}')
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()
