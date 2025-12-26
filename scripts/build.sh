#!/bin/bash

# Atrium - Build Script
# Questo script costruisce l'immagine Docker con versione automatica da git

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurazione
IMAGE_NAME="atrium"
IMAGE_TAG="latest"
COMPOSE_FILE="docker/docker-compose.yml"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Atrium - Build Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Get version from git tags
if command -v git &> /dev/null && git rev-parse --git-dir > /dev/null 2>&1; then
    VERSION=$(git describe --tags --always 2>/dev/null || echo "dev")
    echo -e "${GREEN}✓ Git version: ${VERSION}${NC}"
else
    VERSION="dev"
    echo -e "${YELLOW}⚠ Git non disponibile, usando versione: ${VERSION}${NC}"
fi

# Detect architecture
ARCH=$(uname -m)
echo -e "${YELLOW}Architettura rilevata: ${ARCH}${NC}"

# Verifica se siamo su Raspberry Pi o stiamo cross-compilando
if [[ "$ARCH" == "armv7l" ]] || [[ "$ARCH" == "aarch64" ]]; then
    echo -e "${GREEN}✓ Build nativo ARM detected${NC}"
    BUILD_CMD="docker build --build-arg VERSION=${VERSION} -t ${IMAGE_NAME}:${IMAGE_TAG} -f docker/Dockerfile ."
elif [[ "$ARCH" == "x86_64" ]]; then
    echo -e "${YELLOW}⚠ Architettura x86_64 - Cross-compilation per ARM${NC}"
    echo -e "${YELLOW}  Usando buildx per multi-platform...${NC}"

    # Verifica se buildx è disponibile
    if docker buildx version &> /dev/null; then
        echo -e "${GREEN}✓ docker buildx disponibile${NC}"
        BUILD_CMD="docker buildx build --build-arg VERSION=${VERSION} --platform linux/arm/v7,linux/arm64 --load -t ${IMAGE_NAME}:${IMAGE_TAG} -f docker/Dockerfile ."
    else
        echo -e "${RED}✗ docker buildx non disponibile${NC}"
        echo -e "${YELLOW}  Installa Docker Buildx o esegui direttamente su Raspberry Pi${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Architettura non supportata: $ARCH${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Costruzione immagine...${NC}"
echo ""

# Esegui il build
cd "$(dirname "$0")/.."
eval $BUILD_CMD

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ Build completato con successo!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "Immagine: ${GREEN}${IMAGE_NAME}:${IMAGE_TAG}${NC}"
    echo -e "Versione: ${GREEN}${VERSION}${NC}"
    echo ""

    # Mostra dimensione immagine
    docker images ${IMAGE_NAME}:${IMAGE_TAG} --format "Dimensione: {{.Size}}"

    echo ""
    echo -e "${YELLOW}Prossimi passi:${NC}"
    echo -e "  1. Test locale: ${GREEN}docker run -p 8080:80 ${IMAGE_NAME}:${IMAGE_TAG}${NC}"
    echo -e "  2. Tag per release: ${GREEN}docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:${VERSION}${NC}"
else
    echo ""
    echo -e "${RED}✗ Build fallito!${NC}"
    exit 1
fi
