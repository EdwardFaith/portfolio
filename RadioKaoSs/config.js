// RADIO KAOSS - Database File Audio & Sequenziazione Visiva Procedurale
const RADIO_CONFIG = [];

// Cartella 0 - L'INTERMEZZO
RADIO_CONFIG.push({
    cartella: "cartella0",
    titolo: "L'Intermezzo",
    audio: "audio0.MP3",
    immagini: ["audio0.mp4"]
});

// Cartella 1 - I Potenti
RADIO_CONFIG.push({
    cartella: "cartella1",
    titolo: "I Potenti",
    audio: "audio1.MP3",
    immagini: [
        "https://loremflickr.com/800/600/donald_trump",
        "https://loremflickr.com/800/600/putin",
        "https://loremflickr.com/800/600/kim_jong_un", 
        "https://loremflickr.com/800/600/xi_jinping", 
        "https://loremflickr.com/800/600/Benjamin_Netanyahu", 
        "https://loremflickr.com/800/600/politicians", 
        "https://loremflickr.com/800/600/war", 
        "https://loremflickr.com/800/600/israel", 
        "https://loremflickr.com/800/600/religion", 
        "https://loremflickr.com/800/600/devil"
    ]
});

// Temi aggiornati secondo le tue indicazioni
const temiOrizzontali = [
    // 2: Memorie del Bosco
    ["god", "spirituality", "divine", "heaven", "suicide", "despair", "rope", "razor", "cliff", "bridge", "sadness", "revelation"],
    // 3: Satan
    ["devil", "satan", "lucifer", "demons", "hell", "inferno", "dante", "fire", "horns", "pentagram", "occult", "underworld"],
    // 4: Lettera di Dio
    ["lamp", "chandelier", "light", "god", "fragility", "poetry", "notes", "glass", "crystal", "illumination", "handwriting", "broken"],
    // 5: Installazione Morte
    ["death", "ants", "insects", "anthill", "computer", "genocide", "war_crimes", "skeleton", "decay", "colony", "biology", "human_extinction"],
    // 6: Appunti di Dio
    ["devil", "teeth", "dentist", "bombing", "horror", "presence", "delirium", "mental_asylum", "shouting", "pain", "claws", "extraction"],
    // 7: Radio KaOsS
    ["radio", "cinema", "suicide", "psychiatry", "pain", "entropy", "anguish", "microphone", "theater", "electroshock", "isolation", "static"],
    // 8: Margherita
    ["daisy", "margherita", "flower", "imaginary_friend", "kids_drawing", "garden", "innocence", "memory", "petal", "sunlight", "friendship"],
    // 9: Luna e Stelle
    ["moon", "stars", "bathroom", "vomit", "snail", "falling_star", "rabbits", "night_sky", "astronomy", "disgust", "slime", "cosmic"],
    // 10: Fanciullo e Bosco
    ["child", "boy", "rabbit", "fox", "death", "evening", "woods", "forest", "dark_woods", "animals", "fairy_tale", "dusk"],
    // 11: Fiaba e Tragedia
    ["rabbit", "snail", "spider", "god", "nietzsche", "fair", "comedy", "tragedy", "fantasy", "fairy_tale", "roses", "carnival", "philosophy"],
    // 12: Simbolo
    ["rabbit", "spider", "disco", "dance", "trump", "powerful", "mass", "dancing", "politicians", "party", "clubbing", "crowd"],
    // 13: Assedio
    ["rabbits", "snails", "symbols", "cartoons", "clown", "fear", "brain", "wheat_ears", "clown_horror", "mickey_mouse", "occult_symbols", "mind"],
    // 14: È Sempre Vero
    ["fear", "rabbits", "snails", "spiders", "isolation", "depression", "alcoholism", "whiskey", "loneliness", "web", "basement", "trapped"],
    // 15: Conigli e Ragni
    ["rabbits", "snails", "spiders", "infestation", "multiplication", "swarm", "web", "fur", "shell", "garden_horror", "nature_dark", "creepy_crawly"]
];

const tueImmaginiCreate = [
    "immagini/1 (1).jpeg", "immagini/1 (1).jpg", "immagini/1 (1).png",
    "immagini/1 (10).jpg", "immagini/1 (10).png", "immagini/1 (11).jpg",
    "immagini/1 (11).png", "immagini/1 (12).jpg", "immagini/1 (12).png",
    "immagini/1 (13).png", "immagini/1 (2).jpeg", "immagini/1 (2).jpg",
    "immagini/1 (2).png", "immagini/1 (3).jpeg", "immagini/1 (3).jpg",
    "immagini/1 (3).png", "immagini/1 (4).jpeg", "immagini/1 (4).jpg",
    "immagini/1 (4).png", "immagini/1 (5).jpg", "immagini/1 (5).png",
    "immagini/1 (6).jpg", "immagini/1 (6).png", "immagini/1 (7).jpg",
    "immagini/1 (7).png", "immagini/1 (8).jpg", "immagini/1 (8).png",
    "immagini/1 (9).jpg", "immagini/1 (9).png"
];

for(let i = 2; i <= 15; i++) {
    let tags = temiOrizzontali[i-2];
    const titoli = [
        "Memorie del Bosco",   // 2
        "Satan",               // 3
        "Lettera di Dio",      // 4
        "Installazione Morte", // 5
        "Appunti di Dio",      // 6
        "Radio KaOsS",         // 7
        "Margherita",          // 8
        "Luna e Vomito",       // 9
        "Il Fanciullo",        // 10
        "Commedia e Tragedia", // 11
        "Simbolo",             // 12
        "Assedio",             // 13
        "È Sempre Vero",       // 14
        "Infestazione"         // 15
    ];
    RADIO_CONFIG.push({
        cartella: `cartella${i}`,
        titolo: titoli[i-2],
        audio: `audio${i}.MP3`,
        immagini: [
            ...tags.map(t => `https://loremflickr.com/800/600/${t}`),
            ...tueImmaginiCreate
        ]
    });
}
