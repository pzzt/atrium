# Atrium - Docker Webapp

Dashboard web per gestire servizi self-hosted (Jellyfin, Navidrome, ecc.) con feed RSS integrati.

Ottimizzata per **Raspberry Pi 3** e altre architetture ARM.

![Version](https://img.shields.io/badge/version-1.0-blue)
![Docker](https://img.shields.io/badge/docker-multi--arch-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Caratteristiche

- 🎨 **Design moderno** con tema scuro e animazioni
- ⚙️ **Configurazione via UI** - Nessun edit di file manuali
- 🔍 **Ricerca istantanea** tra i servizi
- 📰 **Feed RSS** integrati per le notizie
- ⏰ **Orologio** in tempo reale
- 📱 **Responsive** per mobile e desktop
- 💾 **LocalStorage** per persistenza configurazione
- 🐳 **Docker** multi-arch (ARM64/ARMv7/x86_64)
- ⚡ **Leggero** - ottimizzato per Raspberry Pi

## Screenshots

La homepage mostra:
- Orologio e data in tempo reale
- Card colorate per ogni servizio
- Sezione notizie dai feed RSS
- Bottone configurazione (⚙️) in alto a destra

## Architettura Supportate

- **ARM64** (Raspberry Pi 3/4 con OS 64-bit)
- **ARMv7** (Raspberry Pi 3 con OS 32-bit)
- **x86_64** (Test/develop su PC)

## Guida Rapida

### Opzione 1: Build e Deploy su Raspberry Pi

```bash
# Clona o copia la directory docker-app sul tuo Pi
cd docker-app

# Build dell'immagine (rileva automaticamente l'architettura)
./scripts/build.sh

# Avvia il container
docker-compose -f docker/docker-compose.yml up -d

# Oppure run manuale
docker run -d --name atrium -p 80:80 --restart unless-stopped atrium:latest
```

### Opzione 2: Build Remoto e Deploy

```bash
# Sul tuo PC (x86_64)
cd docker-app

# 1. Configura variabili per il deploy
export PI_USER="pi"
export PI_HOST="192.168.1.100"  # o raspberrypi.local
export PI_PORT="22"
export PI_DEPLOY_KEY="~/.ssh/id_rsa"  # opzionale

# 2. Build multi-arch
./scripts/build.sh

# 3. Deploy su Raspberry Pi
./scripts/deploy.sh
```

### Opzione 3: Docker Compose (direttamente su Pi)

```bash
cd docker-app
docker-compose -f docker/docker-compose.yml up -d
```

## Accesso

Dopo il deploy, apri il browser su:

- **http://localhost** (se sul Pi stesso)
- **http://indirizzo-ip-del-pi** (da altro dispositivo nella rete)

## Configurazione

### Via Web UI (Consigliato)

1. Clicca sull'ingranaggio ⚙️ in alto a destra
2. Nella tab "Servizi":
   - Clicca "+ Aggiungi Servizio"
   - Compila nome, URL, descrizione, icona
   - Scegli un colore tema
   - Salva
3. Nella tab "Feed RSS":
   - Clicca "+ Aggiungi Feed"
   - Inserisci nome fonte e URL RSS
   - Salva

### Configurazione Predefinita

I servizi di default sono definiti in `app/config.js`:

```javascript
const services = [
    {
        name: "Jellyfin",
        url: "http://192.168.1.151:8096/",
        description: "Media Server - Film e Serie TV",
        icon: "🎬",
        color: "jellyfin"
    },
    {
        name: "Navidrome",
        url: "http://192.168.1.151:30045/",
        description: "Music Server - La tua musica",
        icon: "🎵",
        color: "navidrome"
    }
];
```

### Modificare i Default

Per cambiare i servizi di default, modifica `app/config.js` e rebuild:

```bash
./scripts/build.sh
docker-compose -f docker/docker-compose.yml up -d --force-recreate
```

## Struttura Progetto

```
docker-app/
├── app/                    # File dell'applicazione
│   ├── index.html         # Homepage
│   ├── config.html        # Pagina configurazione
│   ├── style.css          # Stili homepage
│   ├── config-page.css    # Stili configurazione
│   ├── script.js          # Logica homepage
│   ├── config.js          # Configurazione default
│   └── config-page.js     # Logica configurazione
├── docker/
│   ├── Dockerfile         # Immagine Docker
│   ├── nginx.conf         # Configurazione nginx
│   └── docker-compose.yml # Docker Compose
├── scripts/
│   ├── build.sh          # Script build
│   └── deploy.sh         # Script deploy remoto
└── README.md             # Questo file
```

## Gestione Container

### Comandi Utili

```bash
# Verifica stato container
docker ps | grep atrium

# Vedi log
docker logs -f atrium

# Riavvia
docker restart atrium

# Ferma
docker stop atrium

# Rimuovi
docker rm atrium

# Vedi resource usage
docker stats atrium
```

### Aggiornare l'App

```bash
# 1. Pull nuove versioni dei file (se usando git)
git pull

# 2. Rebuild
./scripts/build.sh

# 3. Riavvia container
docker-compose -f docker/docker-compose.yml up -d --force-recreate
```

## Troubleshooting

### Container non parte

```bash
# Vedi log per errori
docker logs atrium

# Verifica che la porta 80 sia libera
sudo netstat -tlnp | grep :80

# Prova run manuale senza detach
docker run --rm -p 80:80 atrium:latest
```

### Impossibile accedere da altri dispositivi

1. Verifica firewall sul Pi:
```bash
sudo ufw allow 80/tcp
```

2. Verifica che nginx sia in ascolto:
```bash
docker exec atrium netstat -tlnp
```

### Architettura non supportata

Se hai problemi con l'architettura, verifica:

```bash
# Sul Pi
uname -m

# Dovresti vedere: armv7l o aarch64
```

Per cross-compilation da x86 a ARM, assicurati di avere Docker Buildx:

```bash
docker buildx version
```

### Build fallisce

```bash
# Pulisci cache Docker
docker builder prune -a

# Build con verbose output
docker build --no-cache -f docker/Dockerfile .
```

## Performance su Raspberry Pi 3

L'immagine è ottimizzata per:
- **Bassa memoria**: ~10-20MB RAM
- **CPU ARM**: nginx compilato per ARM
- **Storage**: Compressione gzip abilitata
- **Cache**: Browser caching per assets statici

Resource limits raccomandati (già nel docker-compose.yml):
- CPU: 1 core max
- RAM: 256MB max

## Backup e Restore

### Backup Configurazione

La configurazione è salvata nel **localStorage del browser**. Per backup:

1. Vai nella pagina Configurazione (⚙️)
2. Clicca "Esporta Configurazione"
3. Scarica il file JSON

### Restore

Dalla pagina Configurazione:
1. Modifica il file `app/config.js`
2. Inserisci i servizi dal backup
3. Rebuild e redeploy

## Sicurezza

- Nessuna database o server-side
- Configurazione salvata solo nel browser (localStorage)
- Nessuna trasmissione dati esterna
- Feed RSS fetched via API pubblica (rss2json.com)

## Personalizzazione

### Cambiare Colori

Modifica `app/style.css`:

```css
:root {
    --bg-primary: #0f0f1e;
    --bg-secondary: #1a1a2e;
    --bg-card: #16213e;
    --text-primary: #eee;
    --text-secondary: #aaa;
}
```

### Aggiungere Nuovi Colori Tema

In `app/style.css` aggiungi:

```css
.service-card.miollo::before {
    background: linear-gradient(90deg, #tueft, #tueft2);
}

.service-card.miollo .card-icon {
    background: linear-gradient(135deg, #tueft, #tueft2);
}
```

## Roadmap

- [ ] Autenticazione opzionale
- [ ] Temi chiari/switch tema
- [ ] Pinned services
- [ ] Export/import configurazione da UI
- [ ] Multi-language support
- [ ] Widgets (weather, calendar)

## Licenza

MIT

## Contributi

Contributi benvenuti! Apri una issue o PR.

## Supporto

Per problemi:
1. Controlla la sezione Troubleshooting
2. Verifica i log del container
3. Apri una issue su GitHub con dettagli

---

Creato con ❤️ per self-hosting
