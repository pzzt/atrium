#!/usr/bin/env python3
"""
Atrium - System Stats API
Legge statistiche di sistema e le espone via HTTP
"""
import json
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
import os

class StatsHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse path
        parsed = urlparse(self.path)
        path = parsed.path

        # CORS headers
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
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
        else:
            response = {'error': 'Not found'}

        self.wfile.write(json.dumps(response).encode())

    def log_message(self, format, *args):
        # Suppress default logging
        pass

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

def run_server(port=8001):
    """Start HTTP server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, StatsHandler)
    print(f'System Stats API running on port {port}')
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()
