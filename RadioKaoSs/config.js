// RADIO KAOSS - Database File Audio & Sequenziazione Visiva Procedurale
const RADIO_CONFIG = [];

// Cartella 0 - L'INTERMEZZO
RADIO_CONFIG.push({
    cartella: "cartella0",
    titolo: "L'Intermezzo",
    audio: "audio0.MP3",
    immagini: ["audio0.mp4"]
});

// Il tuo pool personale di Immagini Inedite e Disegni (verificate su disco)
const tueImmaginiCreate = [
    "immagini/1 (1).jpeg", "immagini/1 (1).jpg", "immagini/1 (1).png",
    "immagini/1 (10).jpg", "immagini/1 (10).png", "immagini/1 (11).jpg",
    "immagini/1 (11).png", "immagini/1 (12).jpg", "immagini/1 (12).png",
    "immagini/1 (13).png", "immagini/1 (2).jpeg", "immagini/1 (2).jpg",
    "immagini/1 (2).png", "immagini/1 (3).jpeg", "immagini/1 (3).jpg",
    "immagini/1 (3).png", "immagini/1 (4).jpeg", "immagini/1 (4).jpg",
    "immagini/1 (4).png", "immagini/1 (5).jpg",
    "immagini/1 (6).jpg", "immagini/1 (6).png", "immagini/1 (7).jpg",
    "immagini/1 (7).png", "immagini/1 (8).jpg", "immagini/1 (8).png",
    "immagini/1 (9).jpg", "immagini/1 (9).png"
];

// Helper per generare URL di immagini procedurali affidabili basate su seed tematico
function getProceduralImageUrl(tag, variant = 0) {
    const seed = variant ? `${tag}_${variant}` : tag;
    return `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/600`;
}

// Database Temi e Parole Chiave Procedurali per tutte le cartelle (da 1 a 15)
const temiCanali = {
    1: {
        titolo: "I Potenti",
        tags: [
            "donald_trump", "putin", "kim_jong_un", "xi_jinping", "netanyahu",
            "politicians", "war", "israel", "religion", "devil",
            "dictator", "nuclear", "power", "money", "army",
            "apocalypse", "conspiracy", "corruption", "propaganda", "bunker",
            "explosion", "missile", "greed", "empire", "white_house"
        ],
        extraMedia: [
            "cartella1/atomic-bomb.gif",
            "cartella1/bombaatomi_nuxp91ui.gif",
            "cartella1/explosion-explode.gif",
            "cartella1/nbWJan.gif"
        ]
    },
    2: {
        titolo: "Memorie del Bosco",
        tags: ["god", "spirituality", "divine", "heaven", "suicide", "despair", "rope", "razor", "cliff", "bridge", "sadness", "revelation"]
    },
    3: {
        titolo: "Satan",
        tags: ["devil", "satan", "lucifer", "demons", "hell", "inferno", "dante", "fire", "horns", "pentagram", "occult", "underworld"]
    },
    4: {
        titolo: "Lettera di Dio",
        tags: ["lamp", "chandelier", "light", "god", "fragility", "poetry", "notes", "glass", "crystal", "illumination", "handwriting", "broken"]
    },
    5: {
        titolo: "Installazione Morte",
        tags: ["death", "ants", "insects", "anthill", "computer", "genocide", "war_crimes", "skeleton", "decay", "colony", "biology", "human_extinction"]
    },
    6: {
        titolo: "Appunti di Dio",
        tags: ["devil", "teeth", "dentist", "bombing", "horror", "presence", "delirium", "mental_asylum", "shouting", "pain", "claws", "extraction"]
    },
    7: {
        titolo: "Radio KaOsS",
        tags: ["radio", "cinema", "suicide", "psychiatry", "pain", "entropy", "anguish", "microphone", "theater", "electroshock", "isolation", "static"]
    },
    8: {
        titolo: "Margherita",
        tags: ["daisy", "margherita", "flower", "imaginary_friend", "kids_drawing", "garden", "innocence", "memory", "petal", "sunlight", "friendship"]
    },
    9: {
        titolo: "Luna e Vomito",
        tags: ["moon", "stars", "bathroom", "vomit", "snail", "falling_star", "rabbits", "night_sky", "astronomy", "disgust", "slime", "cosmic"]
    },
    10: {
        titolo: "Il Fanciullo",
        tags: ["child", "boy", "rabbit", "fox", "death", "evening", "woods", "forest", "dark_woods", "animals", "fairy_tale", "dusk"]
    },
    11: {
        titolo: "Commedia e Tragedia",
        tags: ["rabbit", "snail", "spider", "god", "nietzsche", "fair", "comedy", "tragedy", "fantasy", "fairy_tale", "roses", "carnival", "philosophy"]
    },
    12: {
        titolo: "Simbolo",
        tags: ["rabbit", "spider", "disco", "dance", "trump", "powerful", "mass", "dancing", "politicians", "party", "clubbing", "crowd"]
    },
    13: {
        titolo: "Assedio",
        tags: ["rabbits", "snails", "symbols", "cartoons", "clown", "fear", "brain", "wheat_ears", "clown_horror", "mickey_mouse", "occult_symbols", "mind"]
    },
    14: {
        titolo: "È Sempre Vero",
        tags: ["fear", "rabbits", "snails", "spiders", "isolation", "depression", "alcoholism", "whiskey", "loneliness", "web", "basement", "trapped"]
    },
    15: {
        titolo: "Infestazione",
        tags: ["rabbits", "snails", "spiders", "infestation", "multiplication", "swarm", "web", "fur", "shell", "garden_horror", "nature_dark", "creepy_crawly"]
    }
};

// Generazione procedurale di tutti i canali da 1 a 15 (inclusa Cartella 1)
for (let i = 1; i <= 15; i++) {
    const canale = temiCanali[i];
    if (!canale) continue;

    // Genera immagini procedurali per ciascun tag con multiple varianti seed
    const immaginiProcedurali = [];
    canale.tags.forEach(t => {
        immaginiProcedurali.push(getProceduralImageUrl(t, 1));
        immaginiProcedurali.push(getProceduralImageUrl(t, 2));
    });

    const extra = canale.extraMedia || [];

    RADIO_CONFIG.push({
        cartella: `cartella${i}`,
        titolo: canale.titolo,
        audio: `audio${i}.MP3`,
        immagini: [
            ...extra,
            ...immaginiProcedurali,
            ...tueImmaginiCreate
        ]
    });
}
