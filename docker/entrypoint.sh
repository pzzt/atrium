#!/bin/sh
set -e

echo "Starting Proxy Homepage..."

# Avvia il server API Python in background
echo "Starting System Stats API on port 8001..."
python3 /usr/local/bin/stats-api.py &

# Avvia nginx in foreground
echo "Starting nginx..."
exec nginx -g 'daemon off;'
