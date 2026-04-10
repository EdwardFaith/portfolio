// RADIO KAOSS - Database File Audio & Sequenziazione Visiva Procedurale (30 Keywords per Cartella)
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

// ESPANSIONE DATABASE LOREMFLICKR: ALMENO 30 PAROLE PER CARTELLA (Dalla 2 alla 15)
const temiOrizzontali = [
    // 2: Sottosuolo
    ["dark_cave", "catacombs", "bunker", "mine_shaft", "underground", "skulls", "fossils", "subway_tunnel", "sewer", "creepy_tunnel", "abyss", "black_pit", "descent", "occult", "bones", "subterranean", "dark_basement", "dirt", "roots", "burial", "grave", "crypt", "claustrophobia", "trapped", "shadows", "creepy_stairs", "abandoned_station", "torch_light", "hole", "creepy_well"],
    // 3: Morte / Pozzo
    ["cemetery", "grim_reaper", "tombstone", "ghost_town", "funerals", "skeleton", "dead_tree", "skull", "coffin", "urn", "graveyard", "ashes", "decay", "rotten", "abandoned_house", "dark_forest", "fog", "mist", "raven", "crow", "vulture", "black_cat", "hearse", "mourning", "sadness", "grief", "ghost", "spirit", "phantom", "specter"],
    // 4: Il Diavolo
    ["satan", "hell_fire", "demonic_face", "blood", "pentagram", "goat_head", "horns", "demons", "lucifer", "pitchfork", "burning", "flames", "sulfur", "ritual", "sacrifice", "altar", "dark_priest", "possession", "exorcism", "evil_eye", "wicked", "monster", "hell", "inferno", "damned", "torture", "sin", "evil_grin", "creepy_smile"],
    // 5: Malattia / Orrore Biologico
    ["virus", "biohazard", "plague_doctor", "hospital", "disease", "infection", "pandemic", "quarantine", "hazmat_suit", "patient", "surgery", "blood_sample", "microscope", "bacteria", "mutation", "infected", "syringe", "needle", "medicine", "pills", "toxic", "poison", "radiation_burn", "sick_person", "fever", "cough", "mask", "medical_ward", "asylum"],
    // 6: Controllo Mentale
    ["cctv", "brainwash", "surveillance", "human_eye", "mk_ultra", "hypnosis", "spiral", "tv_static", "screens", "glitch", "mind_control", "propaganda_poster", "obey", "watching", "spying", "camera_lens", "microchip", "wires", "helmet", "experiment", "laboratory", "mad_scientist", "electrode", "strapped_to_chair", "monitor", "barcode", "drone", "security_camera", "eye"],
    // 7: Rovina / Distruzione
    ["ruined_city", "wasteland", "destruction", "earthquake", "famine", "poverty", "rubble", "collapse", "destroyed_building", "abandoned_city", "post_apocalyptic", "desert", "dry_land", "drought", "starvation", "homeless", "refugees", "ruins", "broken_glass", "debris", "wreckage", "crash", "explosion_aftermath", "fire_damage", "ash_covered", "smog", "pollution", "garbage", "dump"],
    // 8: Ribellione Civile
    ["riot", "anarchy", "protest", "molotov", "police_clash", "street_fight", "barricade", "fire", "burning_car", "rebellion", "uprising", "angry_mob", "shouting", "megaphones", "banners", "strike", "tear_gas_canister", "gas_mask", "combat", "fist", "resistance", "freedom_fighter", "insurgency", "violence", "chaos", "looting", "smashed_window", "street_gang", "hoodie"],
    // 9: Carne e Corpo (Gore)
    ["creepy_basement", "chainsaw", "butcher", "meat", "slaughterhouse", "blood_splatter", "knife", "cleaver", "hook", "flesh", "mutilation", "scars", "stitches", "body_horror", "creepy_doll", "mannequin", "dismembered", "veins", "muscle", "teeth", "jaw", "nails", "surgery_tools", "scalpel", "gore", "gruesome", "horror_movie", "scream", "pain"],
    // 10: Cosmo Alieno
    ["ufo", "monolith", "alien", "space_void", "strange_signal", "spaceship", "abduction", "galaxy_chaos", "nebula", "black_hole", "planet", "stars", "meteor", "asteroid", "crater", "moon_surface", "milky_way", "telescope", "observatory", "extraterrestrial", "greys", "flying_saucer", "crop_circle", "laser_beam", "teleport", "portal", "wormhole", "dimension", "multiverse", "void"],
    // 11: Piaghe (Insetti e Bestie)
    ["spider_web", "rats", "snake", "locust_swarm", "creepy_crawly", "maggots", "flies", "cockroach", "bugs", "insects", "venom", "fangs", "scales", "reptile", "serpent", "scorpion", "centipede", "worms", "parasite", "leech", "bat", "swarm", "hive", "nest", "web", "tarantula", "infested", "plague", "vermin"],
    // 12: Macchina / Cyberpunk
    ["hacker", "binary_code", "server", "cyberpunk", "motherboard", "cpu", "wires", "circuit_board", "robot", "cyborg", "artificial_intelligence", "android", "computer_virus", "glitch_art", "dark_web", "terminal", "code_screen", "matrix", "neon_lights", "dystopia", "drone", "cyber_attack", "data_breach", "password", "encryption", "system_failure", "error", "blue_screen"],
    // 13: Inverno Nucleare / Fallout
    ["gas_mask", "nuclear", "fallout_shelter", "chernobyl", "radiation", "toxic_waste", "hazmat", "mushroom_cloud", "atomic_test", "nuclear_winter", "frozen_city", "ice", "snow_storm", "blizzard", "frostbite", "abandoned_factory", "reactor", "cooling_tower", "siren", "warning_sign", "bunker_door", "survival", "canned_food", "geiger_counter", "mutant", "toxic_sludge", "green_glow"],
    // 14: Culto / Magia Oscura
    ["cult_ritual", "dark_magic", "witch", "spell", "cauldron", "coven", "hooded_figure", "candles", "sacrifice", "altar", "blood_moon", "eclipse", "tarot", "ouija", "seance", "voodoo", "curse", "amulet", "talisman", "runes", "pagan", "wicca", "magic_circle", "chanting", "robes", "dagger", "chalice", "mystic", "oracle", "prophecy"],
    // 15: Pazzia / Il Vuoto
    ["insanity", "nightmare", "screaming_face", "sleep_paralysis", "hallucination", "madness", "straight_jacket", "padded_cell", "psychiatrist", "schizophrenia", "voices", "shadow_person", "anxiety", "panic", "fear", "terror", "paranoia", "delirium", "maze", "confusion", "dizzy", "vertigo", "falling", "endless_corridor", "mirrors", "distorted_face", "blur", "static", "amnesia"]
];

// Il tuo pool personale di Immagini Inedite e Fatate
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
        "Il Sottosuolo",       // 2
        "La Morte",            // 3
        "Il Diavolo",          // 4
        "La Malattia",         // 5
        "Il Controllo",        // 6
        "La Rovina",           // 7
        "La Ribellione",       // 8
        "La Carne",            // 9
        "Il Cosmo Alieno",     // 10
        "Le Piaghe",           // 11
        "La Macchina",         // 12
        "L'Inverno Nucleare",  // 13
        "Il Culto",            // 14
        "La Pazzia"            // 15
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
