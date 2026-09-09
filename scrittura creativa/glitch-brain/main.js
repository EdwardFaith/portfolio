// ==========================================
// GLITCH MIND - NEURAL NETWORK VISUALIZER
// ==========================================

const canvas        = document.getElementById('canvas');
const mindContainer = document.getElementById('mind-container');
const synapsesSvg   = document.getElementById('synapses');

// Pan / zoom state
let autoPan    = true;
let autoPanVelX = 0.4;
let autoPanVelY = 0.25;
let scale       = 1;
let translateX  = window.innerWidth  / 2;
let translateY  = window.innerHeight / 2;
let isDragging  = false;
let startDragX  = 0;
let startDragY  = 0;

// Node data
const nodes        = [];
const nodeElements = [];

// Images
const getSurrealImage = (id) => `https://picsum.photos/seed/${id}/400/300`;

// -----------------------------------------------------------------------
//  SIZING CONSTANTS
//  RABBIT_PX: world-space width of the rabbit.
//  At EYE_SCALE zoom, rabbit appears ≈ RABBIT_PX * EYE_SCALE px wide.
//  12000 * 0.10 = 1200px → clearly visible on any screen.
//  NODE_W must match .node { width } in style.css
// -----------------------------------------------------------------------
const RABBIT_PX = 12000;
const SCALE_F   = RABBIT_PX / 800; // = 15px per canvas pixel
const NODE_W    = 200;
// The rabbit is fully visible when scale ≈ 0.08–0.12
// At scale=0.08: 12000*0.08 = 960px wide on screen — clear silhouette
const RABBIT_VISIBLE_SCALE = 0.12; // above this: zoomed in (reading mode)
                                   // below this: zoomed out (rabbit visible)
const SVG_HALF  = RABBIT_PX * 1.5;

// -----------------------------------------------------------------------
//  TEXT SPLITTING — breaks long paragraphs into readable short chunks
//  (max ~110 chars, split on sentence boundaries)
// -----------------------------------------------------------------------
function splitLongText(text, maxLen = 110) {
    if (text.length <= maxLen) return [text];

    // Try to split at Italian sentence-ending punctuation
    const parts = text.split(/(?<=[.!?…»])\s+/);
    const chunks = [];
    let current = '';

    for (const part of parts) {
        if (part.length > maxLen) {
            // Part itself too long — break at word boundary
            if (current.trim()) { chunks.push(current.trim()); current = ''; }
            const words = part.split(' ');
            let line = '';
            for (const w of words) {
                if ((line + ' ' + w).trim().length > maxLen) {
                    if (line.trim()) chunks.push(line.trim());
                    line = w;
                } else {
                    line = (line + ' ' + w).trim();
                }
            }
            if (line.trim()) chunks.push(line.trim());
        } else if ((current + ' ' + part).trim().length > maxLen) {
            if (current.trim()) chunks.push(current.trim());
            current = part;
        } else {
            current = (current + ' ' + part).trim();
        }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks.length ? chunks : [text.substring(0, maxLen)];
}

function init() {
    if (!window.bookData || !window.bookData.length) {
        console.error('Book data not loaded.');
        return;
    }

    // Split ALL paragraphs into short chunks, filter empties
    let allChunks = [];
    window.bookData.forEach(paragraph => {
        const p = paragraph.trim();
        if (p.length > 5) {
            splitLongText(p, 110).forEach(chunk => {
                if (chunk.trim().length > 5) allChunks.push(chunk.trim());
            });
        }
    });

    // Shuffle for chaotic mix of both books
    for (let i = allChunks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allChunks[i], allChunks[j]] = [allChunks[j], allChunks[i]];
    }

    const validCoords = getRabbitCoordinates();

    // Bounding box for centering
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    validCoords.forEach(c => {
        if (c.x < minX) minX = c.x;
        if (c.x > maxX) maxX = c.x;
        if (c.y < minY) minY = c.y;
        if (c.y > maxY) maxY = c.y;
    });

    const centerX = ((minX + maxX) / 2) * SCALE_F;
    const centerY = ((minY + maxY) / 2) * SCALE_F;

    // Use all chunks (cap at a browser-safe limit)
    const numNodes = Math.min(allChunks.length, 1200);

    for (let i = 0; i < numNodes; i++) {
        const coord = validCoords[Math.floor(Math.random() * validCoords.length)];
        const jX = (Math.random() - 0.5) * SCALE_F * 0.3;
        const jY = (Math.random() - 0.5) * SCALE_F * 0.3;
        const x  = coord.x * SCALE_F + jX - centerX;
        const y  = coord.y * SCALE_F + jY - centerY;

        nodes.push({
            id:          i,
            text:        allChunks[i % allChunks.length],
            x,  y,
            hasImage:    Math.random() > 0.97,
            floatSpeed:  0.00012 + Math.random() * 0.00025,
            floatPhaseX: Math.random() * Math.PI * 2,
            floatPhaseY: Math.random() * Math.PI * 2,
            floatAmpX:   3 + Math.random() * 5,
            floatAmpY:   3 + Math.random() * 5
        });
    }

    renderNodes();
    updateTransform();
    setTimeout(drawSynapses, 800);
    setupInteractions();
    animate();
}

// -----------------------------------------------------------------------
//  RABBIT SILHOUETTE — emoji on hidden canvas
//  Also detects the actual EYE position (the dark pupil pixel cluster)
// -----------------------------------------------------------------------
function getRabbitCoordinates() {
    const c   = document.createElement('canvas');
    c.width   = 800;
    c.height  = 800;
    const ctx = c.getContext('2d');

    ctx.font         = '580px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign    = 'center';
    ctx.fillText('🐇', 400, 400);

    const imgData = ctx.getImageData(0, 0, 800, 800).data;
    const coords  = [];
    const step    = 7;

    // Bounding box for centering
    let minX = 800, minY = 800, maxX = 0, maxY = 0;
    for (let y = 0; y < 800; y++) {
        for (let x = 0; x < 800; x++) {
            if (imgData[(y * 800 + x) * 4 + 3] > 128) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    // Phase 2: collect silhouette coords (edge-weighted)
    for (let y = 0; y < 800; y += step) {
        for (let x = 0; x < 800; x += step) {
            const idx   = (y * 800 + x) * 4;
            const alpha = imgData[idx + 3];
            if (alpha > 128) {
                coords.push({ x, y });
                // Edge pixels: neighbour is transparent → add extra weight
                const l = x >= step   ? imgData[(y * 800 + x - step) * 4 + 3]       : 0;
                const r = x < 800-step? imgData[(y * 800 + x + step) * 4 + 3]       : 0;
                const u = y >= step   ? imgData[((y - step) * 800 + x) * 4 + 3]     : 0;
                const d = y < 800-step? imgData[((y + step) * 800 + x) * 4 + 3]     : 0;
                if (l < 128 || r < 128 || u < 128 || d < 128) {
                    coords.push({ x, y });
                    coords.push({ x, y });
                }
            }
        }
    }

    if (coords.length === 0) coords.push({ x: 400, y: 400 });

    return coords;
}

// -----------------------------------------------------------------------
//  RENDER
// -----------------------------------------------------------------------
function renderNodes() {
    canvas.innerHTML = '';

    nodes.forEach((node, idx) => {
        const el = document.createElement('div');
        el.className  = 'node';
        el.style.left = `${node.x}px`;
        el.style.top  = `${node.y}px`;

        let html = '';
        if (node.hasImage) {
            html += `<img src="${getSurrealImage(node.id)}" class="node-img" alt="" loading="lazy">`;
        }
        html += `<p>${node.text}</p>`;
        el.innerHTML = html;

        canvas.appendChild(el);
        nodeElements[idx] = el;

        el.addEventListener('click', e => {
            e.stopPropagation();
            autoPan = false;
            nodeElements.forEach(n => { if(n) { n.style.opacity = '0.12'; n.style.zIndex = '10'; } });
            el.style.opacity = '1';
            el.style.zIndex  = '1000';
            translateX = window.innerWidth  / 2 - node.x * scale;
            translateY = window.innerHeight / 2 - node.y * scale;
            updateTransform();
        });

        if (Math.random() > 0.95) {
            setInterval(() => {
                el.classList.add('glitch-anim');
                setTimeout(() => el.classList.remove('glitch-anim'), 300);
            }, 6000 + Math.random() * 10000);
        }
    });
}

// -----------------------------------------------------------------------
//  SYNAPSES
// -----------------------------------------------------------------------
function drawSynapses() {
    const svgSize = SVG_HALF * 2;
    synapsesSvg.style.width  = `${svgSize}px`;
    synapsesSvg.style.height = `${svgSize}px`;

    const K  = 4;  // every node connects to its 4 nearest neighbours
    const ox = SVG_HALF + NODE_W / 2;
    const oy = SVG_HALF + 40;
    const N  = nodes.length;

    // Track drawn pairs to avoid duplicates
    const drawn = new Set();

    for (let i = 0; i < N; i++) {
        // Compute squared distance to every other node (no sqrt needed for sort)
        const dists = [];
        for (let j = 0; j < N; j++) {
            if (i === j) continue;
            const dx = nodes[j].x - nodes[i].x;
            const dy = nodes[j].y - nodes[i].y;
            dists.push({ j, d: dx*dx + dy*dy });
        }
        dists.sort((a, b) => a.d - b.d);

        for (const { j } of dists.slice(0, K)) {
            const key = i < j ? `${i}-${j}` : `${j}-${i}`;
            if (drawn.has(key)) continue;
            drawn.add(key);

            const n1 = nodes[i], n2 = nodes[j];
            const x1 = n1.x + ox, y1 = n1.y + oy;
            const x2 = n2.x + ox, y2 = n2.y + oy;
            const cx = (x1 + x2) / 2 + (Math.random() - 0.5) * 300;
            const cy = (y1 + y2) / 2 + (Math.random() - 0.5) * 300;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            line.setAttribute('d', `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
            line.setAttribute('class', 'synapse-line');
            if (Math.random() > 0.75) line.classList.add('active');
            synapsesSvg.appendChild(line);
        }
    }
    console.log(`Synapses: ${drawn.size} connections for ${N} nodes.`);
}

// -----------------------------------------------------------------------
//  TRANSFORM
// -----------------------------------------------------------------------
function updateTransform() {
    const t = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    canvas.style.transform      = t;
    synapsesSvg.style.transform = t + ` translate(-${SVG_HALF}px, -${SVG_HALF}px)`;
}

// -----------------------------------------------------------------------
//  INTERACTIONS
// -----------------------------------------------------------------------
function setupInteractions() {
    mindContainer.addEventListener('mousedown', e => {
        isDragging = true;
        startDragX = e.clientX - translateX;
        startDragY = e.clientY - translateY;
    });
    window.addEventListener('mouseup',   () => { isDragging = false; });
    window.addEventListener('mousemove', e => {
        if (!isDragging) return;
        translateX = e.clientX - startDragX;
        translateY = e.clientY - startDragY;
        updateTransform();
    });

    mindContainer.addEventListener('wheel', e => {
        e.preventDefault();
        const factor = Math.exp((e.deltaY < 0 ? 1 : -1) * 0.06);
        translateX = e.clientX - (e.clientX - translateX) * factor;
        translateY = e.clientY - (e.clientY - translateY) * factor;
        scale     *= factor;
        // Min zoom: rabbit is ~480px wide (12000*0.04) — clearly a shape
        // Max zoom: read individual words
        scale      = Math.max(0.04, Math.min(scale, 4));
        updateTransform();
    }, { passive: false });

    mindContainer.addEventListener('click', () => {
        autoPan = true;
        nodeElements.forEach(n => { if(n) { n.style.opacity = '1'; n.style.zIndex = '10'; } });
    });
}

// -----------------------------------------------------------------------
//  ANIMATION LOOP
// -----------------------------------------------------------------------
function animate() {
    // Auto-pan only when zoomed IN to reading level, not when viewing the rabbit
    if (autoPan && !isDragging && scale > RABBIT_VISIBLE_SCALE) {
        if (Math.random() < 0.015) {
            autoPanVelX += (Math.random() - 0.5) * 0.08;
            autoPanVelY += (Math.random() - 0.5) * 0.08;
            autoPanVelX  = Math.max(-0.8, Math.min(0.8, autoPanVelX));
            autoPanVelY  = Math.max(-0.8, Math.min(0.8, autoPanVelY));
        }
        translateX -= autoPanVelX;
        translateY -= autoPanVelY;
        updateTransform();
    }

    const t = Date.now();
    for (let i = 0; i < nodes.length; i++) {
        const n  = nodes[i];
        const el = nodeElements[i];
        if (!el) continue;
        const ox = Math.sin(t * n.floatSpeed + n.floatPhaseX) * n.floatAmpX;
        const oy = Math.cos(t * n.floatSpeed + n.floatPhaseY) * n.floatAmpY;
        el.style.setProperty('--float-x', ox + 'px');
        el.style.setProperty('--float-y', oy + 'px');
    }

    requestAnimationFrame(animate);
}

// Start
window.addEventListener('DOMContentLoaded', init);
