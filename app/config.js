// ============================================
// CONFIGURAZIONE HOME PAGE PROXY
// ============================================

// Servizi da mostrare nella homepage
const services = [
    // Aggiungi i tuoi servizi qui seguendo questo formato:
    // {
    //     name: "Service Name",
    //     url: "http://address:port/",
    //     description: "Service description",
    //     icon: "📁",
    //     color: "custom" // aggiungi la classe CSS corrispondente
    // }
];

// Feed RSS da mostrare nella sezione news
const newsFeeds = [
    // Aggiungi i tuoi feed RSS qui:
    // { name: "Feed Name", url: "https://example.com/feed/" },
];

// Numero massimo di notizie da mostrare per feed
const maxNewsPerFeed = 3;

// ============================================
// NOTA: Per aggiungere un nuovo colore per un servizio:
// 1. Aggiungi il servizio all'array 'services' sopra
// 2. In style.css, aggiungi una nuova classe .service-card.custom::before
//    e .service-card.custom .card-icon con i colori desiderati
// ============================================
