# Multi-stage Dockerfile for Raspberry Pi 3 (ARM)
# Atrium Webapp con System Monitor

FROM nginx:alpine

# Install Python 3 and kubernetes library for k3s monitoring
RUN apk add --no-cache python3 py3-pip && \
    pip3 install --no-cache-dir --break-system-packages kubernetes

# Create data directory and .kube directory for k3s config
RUN mkdir -p /root/.kube /data && \
    chown -R nginx:nginx /data && \
    chmod 755 /data

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy application files
COPY app/ /usr/share/nginx/html/

# Ensure all files have correct permissions for nginx
RUN chmod 644 /usr/share/nginx/html/*.js && \
    chmod 644 /usr/share/nginx/html/*.css && \
    chmod 644 /usr/share/nginx/html/*.html && \
    chmod 644 /usr/share/nginx/html/i18n/*.json

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

