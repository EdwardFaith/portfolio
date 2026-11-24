/* =========================================================
   IL LETTORE DEL CONCEPT — leggere il muro dall'inizio alla fine.
   Cliccando sul muro la telecamera si avvicina e il testo si apre
   a pagine grandi, scritto a mano sul nero, con i nomi in rosso.
   Avanti e indietro con le frecce, col tocco o col dito; si chiude
   con la croce o con Esc. Si resta nella stanza.
   ========================================================= */
const RED = ['Charles', 'Edward Faith', 'Edward', 'Radio KaOsS', 'fanciullo', 'conigli'];

function paginate(paragraphs, budget) {
  const pages = []; let cur = [], len = 0;
  paragraphs.forEach(p => {
    if (len && len + p.length > budget) { pages.push(cur); cur = []; len = 0; }
    cur.push(p); len += p.length;
  });
  if (cur.length) pages.push(cur);
  return pages;
}
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const paint = s => esc(s).replace(new RegExp(`(${RED.join('|')})`, 'g'), '<span class="r">$1</span>');

export function createReader({ title, paragraphs, onOpen, onClose }) {
  const root = document.createElement('div'); root.className = 'lettore'; root.hidden = true;
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', title);
  root.innerHTML = `
    <div class="l-foglio">
      <div class="l-testa"><span class="l-titolo">${esc(title)}</span><button class="l-chiudi" type="button" aria-label="chiudi">✕</button></div>
      <div class="l-testo" tabindex="0"></div>
      <div class="l-piede">
        <button class="l-prec" type="button">‹ indietro</button>
        <span class="l-num"></span>
        <button class="l-succ" type="button">avanti ›</button>
      </div>
    </div>`;
  document.body.appendChild(root);
  const $ = s => root.querySelector(s);
  let pages = [], page = 0;

  function layout() { pages = paginate(paragraphs, innerWidth < 700 ? 520 : 900); }
  function show() {
    page = Math.max(0, Math.min(pages.length - 1, page));
    $('.l-testo').innerHTML = pages[page].map(p => `<p>${paint(p)}</p>`).join('');
    $('.l-num').textContent = `pagina ${page + 1} di ${pages.length}`;
    $('.l-prec').disabled = page === 0;
    $('.l-succ').textContent = page === pages.length - 1 ? 'fine ✕' : 'avanti ›';
    $('.l-testo').scrollTop = 0;
  }
  function open(fraction = 0) {
    layout(); page = Math.floor(fraction * pages.length); show();
    root.hidden = false; requestAnimationFrame(() => root.classList.add('on'));
    $('.l-testo').focus({ preventScroll: true });
    if (onOpen) onOpen();
  }
  function close() { root.classList.remove('on'); setTimeout(() => { root.hidden = true; }, 350); if (onClose) onClose(); }
  const next = () => { if (page >= pages.length - 1) close(); else { page++; show(); } };
  const prev = () => { if (page > 0) { page--; show(); } };

  $('.l-chiudi').addEventListener('click', close);
  $('.l-succ').addEventListener('click', next);
  $('.l-prec').addEventListener('click', prev);
  addEventListener('keydown', e => {
    if (root.hidden) return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === 'Escape') close();
  });
  // col dito: scorri a sinistra per andare avanti
  let sx = null;
  root.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  root.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 60) (dx < 0 ? next : prev)(); sx = null; });
  addEventListener('resize', () => { if (!root.hidden) { const f = page / pages.length; layout(); page = Math.floor(f * pages.length); show(); } });

  return { open, close, get isOpen() { return !root.hidden; } };
}
