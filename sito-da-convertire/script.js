// ==========================================
// LUCIDUS - STATE MANAGEMENT & CORE LOGIC
// ==========================================

// 1. INITIAL STATE DEFAULT
const initialState = {
    isLoggedIn: false,
    balance: 0,
    currency: '€',
    purchaseCount: 0,
    isEvilMode: false,
    inventory: [],
    hasDiscount: false,
    baptismName: '',
    cart: [],
    teethPurchaseCount: 0,
    teethPurchaseCount: 0,
    orders: [],
    pendingCartItem: null,
    shippingAddress: null, // [NEW] Saved shipping info
    tutorials: { intro: false, cart: false, evil: false }
};

// 2. STATE RESTORATION
let state = JSON.parse(localStorage.getItem('lucidusState'));

if (!state) {
    state = initialState;
}

// Polyfill for old states
if (typeof state.teethPurchaseCount === 'undefined') state.teethPurchaseCount = 0;
if (typeof state.tutorials === 'undefined') state.tutorials = { intro: false, cart: false, evil: false };
if (typeof state.orders === 'undefined') state.orders = [];

// ==========================================
// DATA: PRODUCTS & LOCALIZATION
// ==========================================

const productsBase = [
    { id: 1, name: "Goccia di Luce", type: "lampade", price: 20, desc: "Una lacrima di luce pura intrappolata nel vetro.", img: "assets/images/1.png" },
    { id: 2, name: "Il Serpente", type: "lampade", price: 25, desc: "Sinuosa come un serpente, questa lampada avvolge i tuoi sogni.,", img: "assets/images/2.png" },
    { id: 3, name: "Rami Intrecciati", type: "lampade", price: 30, desc: "La natura si fa luce in questo intreccio luminoso.", img: "assets/images/3.png" },
    { id: 4, name: "Foglia Notturna", type: "comodino", price: 15, desc: "Perfetta per il comodino, una foglia che non cade mai.", img: "assets/images/4.png" },
    { id: 5, name: "Fiore Eterno", type: "comodino", price: 18, desc: "Un fiore che sboccia solo al buio.", img: "assets/images/5.png" },
    { id: 6, name: "Mela proibita", type: "comodino", price: 22, desc: "La tentazione della conoscenza in una forma luminosa.", img: "assets/images/6.png" },
    { id: 7, name: "Rami del Cielo", type: "lampadari", price: 45, desc: "Un lampadario che porta il bosco sul soffitto.", img: "assets/images/7.png" },
    { id: 8, name: "Pioggia di Luce", type: "lampadari", price: 50, desc: "Gocce di cristallo che illuminano la stanza.", img: "assets/images/8.png" },
    { id: 9, name: "Il Sole Nero", type: "lampadari", price: 60, desc: "Un sole che non brucia, ma illumina l'anima.", img: "assets/images/9.png" }
];

const latinProducts = [
    { name: "Lacrima Angeli Caduti", desc: "Lux quae cecidit de caelo." },
    { name: "Serpens Mendax", desc: "Susurrus in tenebris aeternis." },
    { name: "Rami Mortui", desc: "Natura quae non vivit, sed ardet." },
    { name: "Folium Gehennae", desc: "In umbrae mortis floret." },
    { name: "Flos Sepulchri", desc: "Radices in ossibus haerentes." },
    { name: "Pomum Peccati", desc: "Scientia boni et mali." },
    { name: "Radices Inferni", desc: "Descensus ad inferos facilis est." },
    { name: "Pluvia Sanguinis", desc: "Guttae rubeae in nocte." },
    { name: "Sol Niger", desc: "Finis dierum appropinquat." }
];

const latinUI = {
    "nav-home": "Domus",
    "nav-shop": "Emporium",
    "nav-about": "De Nobis",
    "nav-legal": "Leges Mortis",
    "nav-login-btn": "Intra",
    "hero-title": "Lux Aeterna Tenebris",
    "hero-desc": "Lucifer illuminat viam tuam in aeternum.",
    "hero-cta": "Veni ad Lucem",
    "shop-title": "Collectio Tenebris",
    "filter-all": "Omnia",
    "filter-lampade": "Lux",
    "filter-comodino": "Somnus",
    "filter-lampadari": "Aether",
    "about-title": "Prophetia",
    "footer-brand": "Lucidus Infernalis",
    "footer-legal": "Pactum Sanguinis",
    "link-terms": "Termini Pacti",
    "link-privacy": "Anima Tua",
    "link-cookies": "Signum Bestiae",
    "footer-payment": "Pretium Animae",
    "copyright-text": "Omnia iura in tenebris reservata sunt."
};

const defaultUI = {
    "nav-home": "Home",
    "nav-shop": "Catalogo",
    "nav-about": "Chi Siamo",
    "nav-legal": "Legal",
    "nav-login-btn": "Login", // Dynamic
    "hero-title": "Illumina l'Oscurità",
    "hero-desc": "Lampade che custodiscono la luce eterna in un mondo destinato al buio.",
    "hero-cta": "Esplora la Collezione",
    "shop-title": "La Nostra Collezione",
    "filter-all": "Tutti",
    "filter-lampade": "Lampade",
    "filter-comodino": "Da Comodino",
    "filter-lampadari": "Lampadari",
    "about-title": "Chi Siamo",
    "footer-brand": "Lucidus S.r.l.",
    "footer-legal": "Patti e Condizioni",
    "footer-payment": "Pagamenti Accettati",
    "copyright-text": "Tutti i diritti riservati nel buio."
};

// ==========================================
// DOM ELEMENTS
// ==========================================
// Using getters or checking existence before use to prevent crashes
const getEl = (id) => document.getElementById(id);
const getSel = (sel) => document.querySelector(sel);
const getAll = (sel) => document.querySelectorAll(sel);

// Key Elements
const productGrid = getEl('product-grid');
const loginModal = getEl('login-modal');
const cartModal = getEl('cart-modal');
const contractModal = getEl('contract-modal');
const ordersModal = getEl('orders-modal');
const productModal = getEl('product-modal');
const currencyModal = getEl('currency-modal');

// ==========================================
// CORE FUNCTIONS
// ==========================================

function init() {
    console.log("Initializing Lucidus...");

    // Cookie Banner
    const banner = getEl('cookie-banner');
    if (banner) {
        if (!localStorage.getItem('cookiesAccepted')) {
            banner.classList.remove('hidden');
        } else {
            banner.classList.add('hidden');
        }
    }

    // Apply Corruption Level (Visuals)
    applyCorruption(state.teethPurchaseCount);

    // Initial Renders
    updateUI();
    renderProducts();
    setupEventListeners();
    setupAudio(); // [NEW] Init Audio

    // Check Tutorial Phase 1
    if (!state.tutorials.intro) {
        setTimeout(() => runTutorial('intro'), 1500);
    }

    // Start activity feed
    startActivityFeed();
}

// ==========================================
// AUDIO SYSTEM
// ==========================================
const audioFiles = {
    click: 'assets/audio/click.mp3', // Generic interaction
    glitch: 'assets/audio/glitch.mp3', // Contract/Scary
    login: 'assets/audio/login.mp3',   // Login success
    popup: 'assets/audio/popup.mp3'    // Tutorial step
};

const audioCache = {};

function setupAudio() {
    // Preload (optional/lazy)
    Object.keys(audioFiles).forEach(key => {
        audioCache[key] = new Audio(audioFiles[key]);
        audioCache[key].volume = 0.5;
    });

    // Create Glitch Overlay if not exists
    if (!document.querySelector('.glitch-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'glitch-overlay';
        document.body.appendChild(overlay);
    }
}

function playSfx(type) {
    try {
        const sound = audioCache[type] ? audioCache[type].cloneNode() : new Audio(audioFiles[type]);
        sound.volume = 0.4;
        sound.play().catch(e => console.warn("Audio autoplay blocked/missing:", e));
    } catch (e) {
        console.warn("Audio error:", e);
    }
}

// ==========================================
// GLITCH FX
// ==========================================
function triggerGlitch(duration = 200) {
    document.body.classList.add('glitch-active');
    playSfx('glitch');
    setTimeout(() => {
        document.body.classList.remove('glitch-active');
    }, duration);
}

// ==========================================
// ACTIVITY FEED SYSTEM
// ==========================================
const fakeNames = ['Marco', 'Giulia', 'Alessandro', 'Sofia', 'Luca', 'Francesca', 'Matteo', 'Chiara', 'Lorenzo', 'Valentina'];
const fakeCities = ['Roma', 'Milano', 'Napoli', 'Torino', 'Firenze', 'Bologna', 'Venezia', 'Palermo', 'Genova', 'Verona'];

function showActivityNotification(message, type = 'purchase') {
    const feed = getEl('activity-feed');
    if (!feed) return;

    const notif = document.createElement('div');
    notif.className = `activity-notification${type === 'bonus' ? ' bonus' : ''}`;
    notif.innerHTML = message;

    feed.appendChild(notif);
    playSfx('popup');

    // Auto-remove after 4 seconds
    setTimeout(() => {
        notif.style.animation = 'slideOutToLeft 0.3s ease-in forwards';
        setTimeout(() => notif.remove(), 300);
    }, 4000);

    // Click to dismiss
    notif.onclick = () => {
        notif.style.animation = 'slideOutToLeft 0.3s ease-in forwards';
        setTimeout(() => notif.remove(), 300);
    };
}

function generateFakeActivity() {
    const rand = Math.random();

    if (rand < 0.3 && !state.isLoggedIn) {
        // Bonus reminder if not logged in
        showActivityNotification(
            '<strong>Bonus Benvenuto!</strong> Accedi ora per ricevere <strong>50€</strong> gratuiti.',
            'bonus'
        );
    } else {
        // Simulated purchase
        const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
        const city = fakeCities[Math.floor(Math.random() * fakeCities.length)];
        const product = productsBase[Math.floor(Math.random() * productsBase.length)];

        showActivityNotification(
            `<strong>${name}</strong> da ${city} ha acquistato <strong>${product.name}</strong>`,
            'purchase'
        );
    }
}

// Start activity feed timer
let activityInterval;
function startActivityFeed() {
    if (activityInterval) clearInterval(activityInterval);

    // First notification after 3 seconds
    setTimeout(generateFakeActivity, 3000);

    // Then every 7-12 seconds
    activityInterval = setInterval(() => {
        generateFakeActivity();
    }, 7000 + Math.random() * 5000);
}

function saveState() {
    localStorage.setItem('lucidusState', JSON.stringify(state));
}

// ==========================================
// PROGRESSIVE CORRUPTION SYSTEM
// ==========================================

function applyCorruption(level) {
    if (level === undefined) level = 0;

    // Elements
    const body = document.body;
    const videoBox = getEl('video-box');
    const hero = getEl('home');
    const aboutImgNormal = getEl('about-img-normal');
    const aboutImgEvil = getEl('about-img-evil');
    const aboutContent = getEl('about-content');

    // LEVEL 0: PURITY (Strict Reset)
    if (level < 1) {
        body.classList.remove('dark-theme', 'latin-mode');
        // Video hidden by default in purity
        if (videoBox) videoBox.classList.add('hidden');

        if (hero) {
            hero.style.backgroundImage = "radial-gradient(circle at center, rgba(0,0,0,0.2) 0%, #000 100%), url('assets/images/0.png')";
            hero.style.backgroundSize = "cover";
            hero.style.border = "none";
        }

        if (aboutImgNormal) aboutImgNormal.style.opacity = '1';
        if (aboutImgEvil) aboutImgEvil.style.opacity = '0';

        // Reset Text
        for (const [id, text] of Object.entries(defaultUI)) {
            const el = getEl(id);
            if (el) el.textContent = (id === 'nav-login-btn' && state.isLoggedIn) ? "Esci" : text;
        }

        if (aboutContent) {
            aboutContent.innerHTML = `
                <p><strong>La Nostra Missione</strong></p>
                <p>In un mondo sempre più frenetico, Lucidus porta la pace attraverso la luce.
                Ogni lampada è creata artigianalmente per durare per sempre.</p>
                <p>Ma non temete, poiché Lucidus, custode delle fiamme primordiali, garantirà a tutti la luce eterna attraverso le sue creazioni uniche.</p>
                <p class="shipping-note">Nota: A causa della natura eterna dei nostri prodotti, i tempi di spedizione sono stimati in <strong>66 anni</strong>.</p>
            `;
        }
    }

    // LEVEL 1: LATIN TEXTS (Nav & Footer)
    if (level >= 1) {
        for (const [id, text] of Object.entries(latinUI)) {
            const el = getEl(id);
            if (el) el.textContent = text;
        }
    }

    // LEVEL 2: DARK THEME
    if (level >= 2) {
        body.classList.add('dark-theme');
    }

    // LEVEL 5: ABOUT SECTION CORRUPTION
    if (level >= 5) {
        if (aboutContent) {
            aboutContent.innerHTML = `
                <p><strong>Prophetia Tenebris</strong></p>
                <p>In mundo ubi lux moritur, Lucidus stat sicut pharus aeternitatis. 
                Antiquae prophetiae dicunt solem periturum esse.</p>
                <p>Sed nolite timere, quia Lucifer, custos flammarum, garantabit lucem aeternam per creationes suas.</p>
                <p class="shipping-note">Nota: Tempus mittendi est <strong>66 anni</strong>.</p>
            `;
        }
        if (aboutImgEvil) aboutImgEvil.style.opacity = '1';
    }

    // LEVEL 6: TOTAL CORRUPTION (Video Reveal)
    if (level >= 1) { // Changed: Video appears earlier if contract signed (which implies level >=1 usually)
        // But logic says "video appare in home... appena firmi il contratto".
        // Contract signing sets teethPurchaseCount++ (so level >=1).
        if (state.currency !== '€') {
            if (videoBox) videoBox.classList.remove('hidden');
        }
    }

    if (level >= 6) {
        body.classList.add('latin-mode');
        if (hero) {
            hero.style.backgroundImage = "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url('assets/images/19.png')";
        }
        state.isEvilMode = true;
    }
}


// ==========================================
// RENDERING LOGIC
// ==========================================

function updateUI() {
    const balanceSpan = getEl('user-balance');
    const balanceSpanMobile = getEl('user-balance-mobile');
    const loginBtn = getEl('nav-login-btn');
    const loginBtnMobile = getEl('nav-login-btn-mobile');
    const cartCount = getEl('cart-count');

    if (state.isLoggedIn) {
        // Currency Display Logic
        let suffix = '€';
        if (state.currency !== '€') {
            suffix = state.teethPurchaseCount >= 1 ? 'Dentes' : 'Denti';
        }

        const balanceText = `Saldo: ${state.currency === '€' ? '€' : ''}${state.balance}${state.currency !== '€' ? ' ' + suffix : ''}`;
        balanceSpan.textContent = balanceText;
        if (balanceSpanMobile) balanceSpanMobile.textContent = balanceText;

        // Button Logic
        if (loginBtn) {
            loginBtn.textContent = (state.teethPurchaseCount >= 1) ? "Exitus" : "Esci";
        }
        if (loginBtnMobile) loginBtnMobile.textContent = loginBtn ? loginBtn.textContent : "Esci";

        // Cart Count
        if (cartCount) cartCount.textContent = state.cart.length;
    } else {
        balanceSpan.textContent = "Accedi per acquistare";
        if (balanceSpanMobile) balanceSpanMobile.textContent = "Accedi per acquistare";
        if (cartCount) cartCount.textContent = '0';
        if (loginBtn) loginBtn.textContent = "Login";
        if (loginBtnMobile) loginBtnMobile.textContent = "Login";
    }

    // Stylistic override for evil balance
    if (state.currency !== '€') {
        if (balanceSpan) balanceSpan.style.color = '#ff3e3e';
        if (balanceSpanMobile) balanceSpanMobile.style.color = '#ff3e3e';
    } else {
        if (balanceSpan) balanceSpan.style.color = '';
        if (balanceSpanMobile) balanceSpanMobile.style.color = '';
    }
}

function renderProducts() {
    if (!productGrid) return;

    // Determine active filter
    const activeBtn = getSel('.filter-btn.active');
    const filter = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';

    // Map base products based on corruption level
    const level = state.teethPurchaseCount || 0;

    const displayList = productsBase.map((p, i) => {
        let pName = p.name;
        let pDesc = p.desc;
        let pImg = p.img;

        const contractSigned = state.teethPurchaseCount > 0 || state.currency !== '€';

        // Image Evolution Logic:
        // 1. If contract NOT signed: All normal.
        // 2. If contract SIGNED: 
        //    - First lamp (id 1) becomes corrupted immediately.
        //    - Next lamps (id 2, 3...) obey purchaseCount.

        if (contractSigned) {
            // Logic: Lamp 1 is always corrupted if contract signed.
            // Additional lamps depend on total purchases (purchaseCount).

            // Index 0 (Lamp 1): Corrupted if contractSigned.
            // Index 1 (Lamp 2): Corrupted if purchaseCount >= 1
            // Index 2 (Lamp 3): Corrupted if purchaseCount >= 2
            // ...

            if (i === 0) { // Lamp 1
                pImg = `assets/images/${p.id + 9}.png`;
            } else {
                // Other lamps evolve with purchases
                // FIX: Requires more purchased than index. 
                // If purchaseCount = 1 (just contract), index 1 should NOT change yet.
                // So we need purchaseCount > index.

                if (state.purchaseCount > i) {
                    pImg = `assets/images/${p.id + 9}.png`;
                }
            }

            // Names also change if deep in madness
            if (state.isEvilMode || state.purchaseCount > 2) {
                pName = latinProducts[i].name;
                pDesc = latinProducts[i].desc;
            }
        }

        return { ...p, name: pName, desc: pDesc, img: pImg, originalType: p.type };
    });

    // Filter
    const filtered = (filter === 'all')
        ? displayList
        : displayList.filter(p => p.originalType === filter);

    // Render
    productGrid.innerHTML = '';
    filtered.forEach(prod => {
        // Price Calculation
        let displayPrice = prod.price;
        let discountHtml = '';
        if (state.hasDiscount && state.currency === '€') {
            displayPrice = Math.round(prod.price * 0.85);
            discountHtml = `<span style="text-decoration:line-through; color:#888; font-size:0.8em; margin-right:5px;">€${prod.price}</span>`;
        }

        const card = document.createElement('div');
        card.className = 'product-card';
        // Currency visual for card
        const priceSuffix = state.currency !== '€' ? (level >= 1 ? 'Dentes' : 'Denti') : '';
        const pricePrefix = state.currency === '€' ? '€' : '';

        card.innerHTML = `
            <img src="${prod.img}" alt="${prod.name}" class="product-img">
            <div class="product-info">
                <h3 class="product-title">${prod.name}</h3>
                <p class="product-price">${discountHtml}${pricePrefix}${displayPrice} ${priceSuffix}</p>
            </div>
        `;

        card.onclick = () => openProductModal(prod);
        productGrid.appendChild(card);
    });
}

// Product Modal Logic
let currentProduct = null;
function openProductModal(prod) {
    currentProduct = prod;
    const modal = getEl('product-modal');
    if (!modal) return;

    getEl('detail-img').src = prod.img;
    getEl('detail-title').textContent = prod.name;
    getEl('detail-desc').textContent = prod.desc;

    let price = prod.price;
    if (state.hasDiscount && state.currency === '€') price = Math.round(price * 0.85);

    const suffix = state.currency !== '€' ? (state.teethPurchaseCount >= 1 ? ' Dentes' : ' Denti') : '';
    const prefix = state.currency === '€' ? '€' : '';
    getEl('detail-price').textContent = `${prefix}${price}${suffix}`;

    // Button Text
    const btn = getEl('buy-btn');
    if (btn) btn.textContent = (state.teethPurchaseCount >= 1) ? "Adquire Anima" : "Aggiungi al Carrello";

    modal.classList.remove('hidden');
}


// ==========================================
// ACTION LOGIC
// ==========================================

function handleBuyClick() {
    if (!state.isLoggedIn) {
        // [NEW] Save intent
        state.pendingCartItem = currentProduct.id;
        saveState();
        productModal.classList.add('hidden');
        alert("Devi accedere per acquistare. L'oggetto sarà aggiunto al carrello dopo l'accesso.");
        loginModal.classList.remove('hidden');
        return;
    }
    if (!currentProduct) return;

    let finalPrice = currentProduct.price;
    if (state.hasDiscount && state.currency === '€') {
        finalPrice = Math.round(finalPrice * 0.85);
    }

    // Add to Cart
    state.cart.push({
        id: currentProduct.id,
        name: currentProduct.name,
        price: finalPrice,
        img: currentProduct.img,
        currency: state.currency,
        timestamp: Date.now()
    });

    saveState();
    updateUI();

    // Feedback
    const btn = getEl('buy-btn');
    const oldText = btn.textContent;
    btn.textContent = "Aggiunto!";
    btn.style.background = "#4CAF50";
    setTimeout(() => {
        btn.textContent = oldText;
        btn.style.background = "";
        productModal.classList.add('hidden');
    }, 800);
}


// CART & CHECKOUT
function openCart() {
    if (!state.isLoggedIn) {
        loginModal.classList.remove('hidden');
        return;
    }

    const list = getEl('cart-list');
    list.innerHTML = '';
    let total = 0;

    if (state.cart.length === 0) {
        list.innerHTML = '<p class="empty-cart-msg">Il carrello è vuoto.</p>';
        getEl('bonus-payment-ui').classList.add('hidden');
        getEl('teeth-payment-ui').classList.add('hidden');
        getEl('card-form-container').classList.add('hidden');
    } else {
        // Render Items
        state.cart.forEach((item, index) => {
            total += item.price;
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <div style="display:flex; align-items:center;">
                    <img src="${item.img}" class="cart-item-img">
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">${item.currency === '€' ? '€' : ''}${item.price}</div>
                    </div>
                </div>
                <button onclick="removeFromCart(${index})" style="color:red; background:none; border:none; cursor:pointer;">&times;</button>
            `;
            list.appendChild(div);
        });

        // Show Payment Options based on Balance
        const bonusUI = getEl('bonus-payment-ui');
        const teethUI = getEl('teeth-payment-ui');
        const cardUI = getEl('card-form-container');

        getEl('current-bonus-display').textContent = '€' + state.balance;

        // Reset Visibilities
        bonusUI.classList.add('hidden');
        teethUI.classList.add('hidden');
        cardUI.classList.remove('hidden'); // Default card always visible

        if (state.currency === '€') {
            if (state.balance >= total) {
                // Solvent
                bonusUI.classList.remove('hidden');
                getEl('pay-bonus-btn').onclick = () => checkout('bonus');
            } else {
                // Insolvent -> Show Teeth Option
                teethUI.classList.remove('hidden');
                getEl('pay-teeth-btn').onclick = () => {
                    cartModal.classList.add('hidden');
                    contractModal.classList.remove('hidden');
                };
            }
        } else {
            // Teeth Mode
            cardUI.classList.add('hidden'); // Card useless here
            teethUI.classList.remove('hidden');
            getSel('#teeth-payment-ui p').textContent = "Pagamento in Denti da Latte";
            getSel('#teeth-payment-ui p:first-child').style.display = 'none';

            const btn = getEl('pay-teeth-btn');
            btn.textContent = "Concludi Sacrificio";
            btn.onclick = () => checkout('teeth');
        }
    }

    getEl('cart-total-price').textContent = (state.currency === '€' ? '€' : '') + total;
    cartModal.classList.remove('hidden');

    // SHIPPING: Always show, pre-fill if saved
    const shippingForm = getEl('shipping-form');
    if (shippingForm) {
        shippingForm.style.display = 'block';

        if (state.shippingAddress) {
            getEl('ship-address').value = state.shippingAddress.address || '';
            getEl('ship-city').value = state.shippingAddress.city || '';
            getEl('ship-zip').value = state.shippingAddress.zip || '';
        } else {
            getEl('ship-address').value = '';
            getEl('ship-city').value = '';
            getEl('ship-zip').value = '';
        }
    }
}

window.removeFromCart = function (index) {
    state.cart.splice(index, 1);
    saveState();
    updateUI();
    openCart();
};

function checkout(method) {
    let total = state.cart.reduce((sum, item) => sum + item.price, 0);

    // Validation Indirizzo
    const addr = getEl('ship-address').value;
    const city = getEl('ship-city').value;
    const zip = getEl('ship-zip').value;

    if (!addr || !city) {
        alert("Per favore, inserisci un indirizzo di spedizione valido.");
        return;
    }

    // Save shipping address
    state.shippingAddress = { address: addr, city: city, zip: zip };
    saveState();
    if (state.currency === '€') {
        if (method === 'card') {
            // Fake decline logic for story
            if (state.balance < total) {
                alert("Transazione Negata: Saldo Insufficiente.");
                return;
            }
            // If balance represents 'real money' in this logic, we assume card works if 'balance' allows it?
            // Or user just pays. Let's assume Card simply works if they have balance (which is weird but ok),
            // OR card fails if balance < total to force teeth.

            if (state.balance < total) {
                alert("Transazione Negata dalla Banca.");
                return;
            }
        }
        if (method === 'bonus' && state.balance < total) {
            alert("Fondi Bonus insufficienti.");
            return;
        }
        if (method === 'bonus' || method === 'card') {
            state.balance -= total;
        }
    }

    // Process
    state.cart.forEach(item => {
        state.inventory.push(item.id);
        state.orders.push({
            name: item.name,
            img: item.img,
            purchaseTime: Date.now(),
            shippingAddress: state.shippingAddress // [NEW] Save address with order
        });
    });

    state.cart = [];
    state.purchaseCount++;

    if (method === 'teeth') {
        state.teethPurchaseCount++;
    }

    saveState();

    // Close Modals
    cartModal.classList.add('hidden');
    contractModal.classList.add('hidden');

    // Feedback
    if (method === 'teeth') {
        triggerGlitch(1500); // Long glitch for contract
        alert("Transazione completata. I denti verranno prelevati stanotte.");
        setTimeout(checkEvilTrigger, 2000); // Trigger disturbing tutorial
    } else {
        playSfx('click');
        alert("Ordine Confermato.");
    }

    // Refresh
    updateUI();
    renderProducts(); // Refresh in case corruption happened
    applyCorruption(state.teethPurchaseCount);
}

// Contract Sign
if (getEl('sign-contract-btn')) {
    getEl('sign-contract-btn').addEventListener('click', () => {
        // [NEW] GLITCH & SOUND
        triggerGlitch(800);

        alert("Patto Siglato. Il tuo sangue è nostro.");
        state.currency = 'Denti da Latte';
        state.balance = '∞';
        contractModal.classList.add('hidden');
        checkout('teeth');
    });
}

// Card Form
if (getEl('checkout-card-btn')) {
    getEl('checkout-card-btn').addEventListener('click', () => {
        const num = getEl('card-number').value;
        if (num.length < 10) { alert("Carta non valida"); return; }
        checkout('card');
    });
}
// Input Format
const cNum = getEl('card-number');
if (cNum) cNum.addEventListener('input', e => {
    e.target.value = e.target.value.replace(/\W/gi, '').replace(/(.{4})/g, '$1 ').trim();
    getSel('.card-number-display').textContent = e.target.value || '####...';
});


// ORDERS
function openOrdersModal() {
    if (!state.isLoggedIn) {
        loginModal.classList.remove('hidden');
        return;
    }
    renderOrders();
    ordersModal.classList.remove('hidden');
    startOrderTimer();
}

let orderInterval;
function renderOrders() {
    const list = getEl('orders-list');
    list.innerHTML = '';

    if (state.orders.length === 0) {
        list.innerHTML = '<p class="empty-cart-msg">Nessun ordine attivo.</p>';
        return;
    }

    state.orders.forEach((order, index) => {
        const div = document.createElement('div');
        div.className = 'order-item';
        div.style.cssText = "display:flex; flex-direction:column; padding:15px; border-bottom:1px solid #444;";

        const shippingInfo = order.shippingAddress
            ? `${order.shippingAddress.address}, ${order.shippingAddress.city}${order.shippingAddress.zip ? ' ' + order.shippingAddress.zip : ''}`
            : 'Indirizzo non disponibile';

        div.innerHTML = `
            <div style="display:flex; align-items:center; margin-bottom:10px;">
                <img src="${order.img}" style="width:50px; height:50px; object-fit:cover; border-radius:4px; margin-right:15px;">
                <div style="text-align:left; flex:1;">
                    <div style="font-weight:bold; color:var(--text-color);">${order.name}</div>
                    <div id="timer-${index}" style="font-family:'Courier New'; color:var(--accent-color); font-size:0.9em;">...</div>
                </div>
            </div>
            <div style="font-size:0.85em; color:#888; padding-left:65px;">
                <i class="fas fa-map-marker-alt"></i> ${shippingInfo}
            </div>
        `;
        list.appendChild(div);
    });
}

function startOrderTimer() {
    if (orderInterval) clearInterval(orderInterval);
    const update = () => {
        const now = Date.now();
        state.orders.forEach((order, index) => {
            const el = getEl(`timer-${index}`);
            if (!el) return;
            // 66 years
            const target = order.purchaseTime + (66 * 365.25 * 24 * 3600 * 1000);
            const diff = target - now;

            if (diff <= 0) el.textContent = "Consegnato (?)";
            else {
                const y = Math.floor(diff / (1000 * 3600 * 24 * 365.25));
                const d = Math.floor((diff % (1000 * 3600 * 24 * 365.25)) / (1000 * 3600 * 24));
                const h = Math.floor((diff % (1000 * 3600 * 24)) / (1000 * 3600));
                const m = Math.floor((diff % (1000 * 3600)) / (1000 * 60));
                const s = Math.floor((diff % (1000 * 60)) / 1000);
                el.textContent = `Arrivo in: ${y} Anni, ${d}g ${h}h ${m}m ${s}s`;
            }
        });
    };
    update();
    orderInterval = setInterval(update, 1000);
}


// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {
    // Nav Click
    getEl('nav-cart-btn')?.addEventListener('click', e => {
        e.preventDefault();
        openCart();
    });

    getEl('nav-orders-btn')?.addEventListener('click', e => {
        e.preventDefault();
        openOrdersModal();
    });

    getEl('close-orders')?.addEventListener('click', () => {
        ordersModal.classList.add('hidden');
        clearInterval(orderInterval);
    });

    getEl('close-cart')?.addEventListener('click', () => {
        cartModal.classList.add('hidden');
    });

    // Login
    const handleLoginClick = () => {
        if (!state.isLoggedIn) loginModal.classList.remove('hidden');
        else {
            if (confirm("Vuoi davvero uscire?")) {
                state.isLoggedIn = false;
                state.balance = 0;
                saveState();
                location.reload();
            }
        }
    };
    getEl('nav-login-btn')?.addEventListener('click', handleLoginClick);
    getEl('nav-login-btn-mobile')?.addEventListener('click', handleLoginClick);

    // Mobile Menu Toggle
    const mobileBtn = getEl('mobile-menu-btn');
    const navLinks = getEl('nav-links');
    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        // Close menu on link click
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }

    // Login Modal
    const lBtn = getEl('login-btn');
    if (lBtn) {
        // Remove old listeners by cloning
        const newBtn = lBtn.cloneNode(true);
        lBtn.parentNode.replaceChild(newBtn, lBtn);
        newBtn.addEventListener('click', () => {
            const name = getEl('baptism-name').value;
            // Checkbox
            const notBapt = getEl('no-baptism-check').checked;
            if (!name && !notBapt) { alert("Inserisci dati!"); return; }

            state.isLoggedIn = true;
            state.baptismName = name;
            state.hasDiscount = notBapt;
            // Grant bonus if new
            if (state.purchaseCount === 0 && state.balance === 0) state.balance = 50;

            // Check Pending Item
            if (state.pendingCartItem) {
                const prod = productsBase.find(p => p.id === state.pendingCartItem);
                if (prod) {
                    // Auto-add
                    let finalPrice = prod.price;
                    if (state.hasDiscount) finalPrice = Math.round(finalPrice * 0.85);

                    state.cart.push({
                        id: prod.id,
                        name: prod.name,
                        price: finalPrice,
                        img: prod.img,
                        currency: state.currency,
                        timestamp: Date.now()
                    });
                    alert(`Accesso effettuato! "${prod.name}" è stato aggiunto al carrello.`);
                }
                state.pendingCartItem = null;
            }

            saveState();
            loginModal.classList.add('hidden');
            playSfx('login'); // [NEW]
            // Refresh
            init();
        });
    }

    // Product Buy in Modal
    const buyBtn = getEl('buy-btn');
    if (buyBtn) {
        const newBtn = buyBtn.cloneNode(true);
        buyBtn.parentNode.replaceChild(newBtn, buyBtn);
        newBtn.addEventListener('click', handleBuyClick);
    }

    // Filters
    const btns = getAll('.filter-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', e => {
            btns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderProducts();
        });
    });

    // Cookie
    getEl('accept-cookies')?.addEventListener('click', () => {
        localStorage.setItem('cookiesAccepted', 'true');
        getEl('cookie-banner').classList.add('hidden');
    });

    // Global Modal Close
    const closeBtns = getAll('.close-modal');
    closeBtns.forEach(btn => btn.addEventListener('click', () => {
        btn.closest('.modal').classList.add('hidden');
    }));
    window.addEventListener('click', e => {
        if (e.target.classList.contains('modal')) e.target.classList.add('hidden');
    });
}

// ==========================================
// TUTORIAL SYSTEM (EVOLUTIVE)
// ==========================================
function runTutorial(phase) {
    if (state.tutorials[phase]) return;

    let steps = [];

    // FASE 1: INTRO (SOBER/USEFUL)
    if (phase === 'intro') {
        steps = [
            { el: 'hero-title', text: "Benvenuto in Lucidus. Una luce per l'eternità." },
            { el: 'nav-shop', text: "Usa il tuo bonus per richiedere una lampada gratuita." }
        ];
    }
    // FASE 2: REMOVED (shipping is now just a form section)
    // FASE 3: EVIL (ENTROPIC)
    else if (phase === 'evil') {
        steps = [
            { el: 'hero-title', text: "Pensi davvero che questo importi?" },
            { el: 'nav-shop', text: "Accumuli oggetti per riempire il vuoto interiore." },
            { el: 'user-balance', text: "Il tuo tempo sta scadendo, non il tuo saldo." }
        ];
    }

    if (steps.length === 0) return;

    let currentStep = 0;

    const createPopup = (stepObj) => {
        const old = document.getElementById('tutorial-popup');
        if (old) old.remove();

        const target = document.getElementById(stepObj.el);
        if (!target) {
            nextStep();
            return;
        }

        const rect = target.getBoundingClientRect();
        playSfx('popup');

        const popup = document.createElement('div');
        popup.id = 'tutorial-popup';
        popup.className = 'aesthetic-popup';

        let top = window.scrollY + rect.bottom + 15;
        let left = window.scrollX + rect.left;
        if (left < 10) left = 10;

        popup.style.top = top + 'px';
        popup.style.left = left + 'px';

        popup.innerHTML = `
            <div class="popup-content">
                <p>${stepObj.text}</p>
            </div>
            <div class="popup-actions">
                <button id="skip-tut-btn" class="popup-skip">Chiudi</button>
                <button id="next-tut-btn" class="popup-btn">Avanti</button>
            </div>
        `;

        document.body.appendChild(popup);

        document.getElementById('next-tut-btn').onclick = nextStep;
        document.getElementById('skip-tut-btn').onclick = endTutorial;
    };

    const nextStep = () => {
        playSfx('click');
        currentStep++;
        if (currentStep < steps.length) {
            createPopup(steps[currentStep]);
        } else {
            endTutorial();
        }
    };

    const endTutorial = () => {
        const p = document.getElementById('tutorial-popup');
        if (p) p.remove();
        state.tutorials[phase] = true;
        saveState();
        playSfx('click');
    };

    // Start
    setTimeout(() => createPopup(steps[0]), 500);
}

// Trigger Evil Tutorial randomly after interaction if evil
function checkEvilTrigger() {
    if (state.isEvilMode && !state.tutorials.evil && Math.random() > 0.5) {
        runTutorial('evil');
    }
}

// Add fadeIn animation (Removed old injection, used CSS class instead)
// OLD CODE REMOVAL:
// const styleSheet = document.createElement("style"); ...
window.reset = function () { localStorage.clear(); location.reload(); };

// LAUNCH
try {
    init();
} catch (e) {
    console.error("CRITICAL ERROR IN INIT:", e);
    alert("System Failure: " + e.message);
}
