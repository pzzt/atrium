# Multi-stage Dockerfile for Raspberry Pi 3 (ARM)
# Proxy Homepage Webapp con System Monitor

FROM nginx:alpine

# Install Python 3 per l'API delle statistiche
RUN apk add --no-cache python3

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy application files
COPY app/ /usr/share/nginx/html/

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy API server
COPY docker/api/server.py /usr/local/bin/stats-api.py

# Copy entrypoint script
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start both nginx and API server
CMD ["/usr/local/bin/entrypoint.sh"]

