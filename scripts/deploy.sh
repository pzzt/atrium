#!/bin/bash

# Proxy Homepage - Deploy Script for Raspberry Pi
# Questo script deploya l'immagine su un Raspberry Pi remoto

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurazione - MODIFICA QUESTI VALORI
PI_USER="${PI_USER:-pi}"
PI_HOST="${PI_HOST:-raspberrypi.local}"
PI_PORT="${PI_PORT:-22}"
IMAGE_NAME="proxy-homepage"
IMAGE_TAG="latest"
REMOTE_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"
ARCHIVE_FILE="${IMAGE_NAME}.tar"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Proxy Homepage - Deploy to Pi${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Verifica variabili d'ambiente
if [ -z "$PI_DEPLOY_KEY" ]; then
    echo -e "${YELLOW}⚠ Variabile PI_DEPLOY_KEY non impostata${NC}"
    echo -e "${YELLOW}  Usando autenticazione SSH standard${NC}"
    SSH_CMD="ssh -p ${PI_PORT}"
    SCP_CMD="scp -P ${PI_PORT}"
else
    echo -e "${GREEN}✓ Usando chiave SSH: ${PI_DEPLOY_KEY}${NC}"
    SSH_CMD="ssh -i ${PI_DEPLOY_KEY} -p ${PI_PORT} -o StrictHostKeyChecking=no"
    SCP_CMD="scp -i ${PI_DEPLOY_KEY} -P ${PI_PORT} -o StrictHostKeyChecking=no"
fi

# Mostra configurazione
echo -e "${YELLOW}Configurazione:${NC}"
echo -e "  Host: ${GREEN}${PI_USER}@${PI_HOST}:${PI_PORT}${NC}"
echo ""

# 1. Salva immagine localmente
echo -e "${YELLOW}[1/5] Salvataggio immagine Docker...${NC}"
docker save ${IMAGE_NAME}:${IMAGE_TAG} -o /tmp/${ARCHIVE_FILE}
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Impossibile salvare l'immagine${NC}"
    echo -e "${YELLOW}  Esegui prima: ${GREEN}./scripts/build.sh${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Immagine salvata${NC}"

# 2. Trasferisci immagine al Raspberry Pi
echo -e "${YELLOW}[2/5] Trasferimento immagine al Raspberry Pi...${NC}"
$SCP_CMD /tmp/${ARCHIVE_FILE} ${PI_USER}@${PI_HOST}:/tmp/
echo -e "${GREEN}✓ Trasferimento completato${NC}"

# 3. Carica immagine sul Raspberry Pi
echo -e "${YELLOW}[3/5] Caricamento immagine su Raspberry Pi...${NC}"
$SSH_CMD ${PI_USER}@${PI_HOST} "docker load -i /tmp/${ARCHIVE_FILE}"
echo -e "${GREEN}✓ Immagine caricata${NC}"

# 4. Copia docker-compose.yml se non esiste
echo -e "${YELLOW}[4/5] Configurazione docker-compose...${NC}"
$SCP_CMD docker/docker-compose.yml ${PI_USER}@${PI_HOST}~/proxy-homepage/docker-compose.yml 2>/dev/null || true

# 5. Riavvia container
echo -e "${YELLOW}[5/5] Riavvio container...${NC}"
$SSH_CMD ${PI_USER}@${PI_HOST} << 'ENDSSH'
    # Crea directory se non esiste
    mkdir -p ~/proxy-homepage

    # Ferma container esistente
    docker stop proxy-homepage 2>/dev/null || true
    docker rm proxy-homepage 2>/dev/null || true

    # Avvia nuovo container
    cd ~/proxy-homepage
    docker run -d \
        --name proxy-homepage \
        --restart unless-stopped \
        -p 80:80 \
        ${IMAGE_NAME}:${IMAGE_TAG}

    # Pulizia
    rm -f /tmp/${IMAGE_NAME}.tar

    echo "✓ Container avviato"
ENDSSH

# Pulizia locale
rm -f /tmp/${ARCHIVE_FILE}

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Deploy completato!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "App disponibile su: ${GREEN}http://${PI_HOST}${NC}"
echo ""
echo -e "${YELLOW}Comandi utili:${NC}"
echo -e "  Log: ${SSH_CMD} ${PI_USER}@${PI_HOST} 'docker logs -f proxy-homepage'"
echo -e "  Stop: ${SSH_CMD} ${PI_USER}@${PI_HOST} 'docker stop proxy-homepage'"
echo -e "  Restart: ${SSH_CMD} ${PI_USER}@${PI_HOST} 'docker restart proxy-homepage'"
