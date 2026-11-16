// Rendu d'une page cadeau. Uniquement des API DOM (textContent) : aucun HTML utilisateur n'est interprété.
import { THEMES, getOccasion } from './occasions.js';

const YT = /^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/watch\?(?:[^#]*&)?v=|youtu\.be\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/;
const SPOTIFY = /^https:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album|playlist)\/([A-Za-z0-9]{22})/;

export function musicEmbed(url) {
  if (!url) return null;
  const y = YT.exec(url);
  if (y) return { provider: 'youtube', id: y[1] };
  const s = SPOTIFY.exec(url);
  if (s) return { provider: 'spotify', kind: s[1], id: s[2] };
  return null;
}

// Lit le moment de départ dans un lien YouTube (?t=65, t=1m05s, start=65). Renvoie des secondes ou 0.
export function startFromUrl(url) {
  try {
    const u = new URL(url);
    const t = u.searchParams.get('t') || u.searchParams.get('start') || '';
    if (/^\d+s?$/.test(t)) return parseInt(t, 10);
    const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(t);
    if (m && t) return (+(m[1] || 0)) * 3600 + (+(m[2] || 0)) * 60 + (+(m[3] || 0));
  } catch { /* lien invalide */ }
  return 0;
}

// « 1:05 » ↔ 65 secondes
export function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
export function parseTime(text) {
  const v = String(text || '').trim();
  if (!v) return 0;
  if (/^\d+$/.test(v)) return parseInt(v, 10);
  const m = /^(\d{1,3})[:'h](\d{1,2})$/.exec(v);
  return m && +m[2] < 60 ? +m[1] * 60 + +m[2] : null;
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of children.flat()) if (c != null && c !== false) node.append(c);
  return node;
}

function paragraphs(text) {
  return text.split(/\n{2,}/).map((block) => {
    const p = el('p');
    block.split('\n').forEach((line, i) => {
      if (i) p.append(el('br'));
      p.append(line);
    });
    return p;
  });
}

export function applyTheme(themeId, root = document.documentElement) {
  const t = THEMES[themeId] || THEMES.rose;
  root.style.setProperty('--bg', t.bg);
  root.style.setProperty('--ink', t.ink);
  root.style.setProperty('--accent', t.accent);
  root.style.setProperty('--soft', t.soft);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t.bg);
}

export function daysSince(dateStr, now = new Date()) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today - d) / 86400000);
}

function counter(content) {
  const days = daysSince(content.date);
  if (days == null || days < 0) return null;
  const label = content.dateLabel || 'Depuis';
  const dateFr = new Date(content.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  return el('div', { class: 'counter reveal pop' },
    el('div', { class: 'counter-label', text: `${label} le ${dateFr}` }),
    el('div', { class: 'counter-value' }, el('strong', { class: 'count-up', 'data-target': String(days), text: days.toLocaleString('fr-FR') }), ' jours'),
  );
}

function gallery(content, photoUrl) {
  if (!content.photos.length) return null;
  const figs = content.photos.map((p, n) => {
    const img = el('img', { src: photoUrl(n), alt: p.caption || `Photo ${n + 1}`, loading: n < 2 ? 'eager' : 'lazy', decoding: 'async' });
    return el('figure', { class: `photo reveal ${n === 0 ? 'zoom-in' : n % 2 ? 'from-right' : 'from-left'}`, tabindex: '0', onclick: () => lightbox(content, photoUrl, n), onkeydown: (e) => { if (e.key === 'Enter') lightbox(content, photoUrl, n); } },
      img, p.caption ? el('figcaption', { text: p.caption }) : null);
  });
  return el('section', { class: 'gallery' }, figs);
}

function lightbox(content, photoUrl, start) {
  let i = start;
  const img = el('img', { alt: '' });
  const cap = el('p', { class: 'lb-cap' });
  const show = () => {
    img.src = photoUrl(i);
    img.alt = content.photos[i].caption || `Photo ${i + 1}`;
    cap.textContent = content.photos[i].caption || '';
  };
  const close = () => { box.remove(); document.removeEventListener('keydown', onKey); };
  const move = (d) => { i = (i + d + content.photos.length) % content.photos.length; show(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') move(1); if (e.key === 'ArrowLeft') move(-1); };
  const many = content.photos.length > 1;
  const box = el('div', { class: 'lightbox', role: 'dialog', 'aria-modal': 'true', onclick: (e) => { if (e.target === box) close(); } },
    el('button', { class: 'lb-close', 'aria-label': 'Fermer', onclick: close, text: '×' }),
    many ? el('button', { class: 'lb-prev', 'aria-label': 'Photo précédente', onclick: () => move(-1), text: '‹' }) : null,
    img,
    many ? el('button', { class: 'lb-next', 'aria-label': 'Photo suivante', onclick: () => move(1), text: '›' }) : null,
    cap);
  let x0 = null;
  box.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) move(dx < 0 ? 1 : -1); x0 = null; });
  document.addEventListener('keydown', onKey);
  document.body.append(box);
  show();
  box.querySelector('.lb-close').focus();
}

function timeline(content, occ) {
  if (!content.timeline.length) return null;
  return el('section', { class: 'block' },
    el('h2', { text: occ.timelineTitle }),
    el('ol', { class: 'timeline' }, content.timeline.map((t, i) =>
      el('li', { class: 'reveal slide-in', style: `--i:${i}` }, t.when ? el('span', { class: 'when', text: t.when }) : null, el('p', { text: t.text })))));
}

// Petite explosion de cœurs au centre d'une carte qu'on retourne.
function cardBurst(card, symbol = '♥', count = 10) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const d = 45 + Math.random() * 45;
    const p = el('span', { class: 'spark', 'aria-hidden': 'true', text: symbol });
    p.style.setProperty('--dx', `${Math.cos(a) * d}px`);
    p.style.setProperty('--dy', `${Math.sin(a) * d - 20}px`);
    p.style.fontSize = `${10 + Math.random() * 12}px`;
    card.append(p);
    setTimeout(() => p.remove(), 900);
  }
}

function reasons(content, occ) {
  if (!content.reasons.length) return null;
  const symbol = occ.id === 'noel' ? '❄' : occ.id === 'anniversaire' ? '✦' : '♥';
  const total = content.reasons.length;
  const hint = el('p', { class: 'hint', text: 'Touche les cartes pour les découvrir' });
  const grid = el('div', { class: 'reasons reveal' });
  const flip = (card) => {
    const opening = !card.classList.contains('flipped');
    card.classList.toggle('flipped');
    card.setAttribute('aria-pressed', String(opening));
    if (!opening) return;
    grid.classList.add('touched');
    cardBurst(card, symbol);
    const done = grid.querySelectorAll('.reason.flipped').length;
    hint.textContent = done === total ? 'Toutes les cartes sont découvertes ' + symbol : `${done} / ${total} découvertes`;
    if (done === total) setTimeout(() => burst(document.body, symbol, 36), 450);
  };
  content.reasons.forEach((r, i) => {
    const card = el('button', { class: 'reason', type: 'button', 'aria-pressed': 'false', 'aria-label': `Carte ${i + 1} : ${r}`, onclick: (e) => flip(e.currentTarget) },
      el('span', { class: 'face front' }, el('span', { class: 'card-heart', 'aria-hidden': 'true', text: symbol }), el('span', { class: 'card-n', text: String(i + 1) })),
      el('span', { class: 'face back', text: r }));
    card.style.setProperty('--i', i);
    grid.append(card);
  });
  return el('section', { class: 'block' }, el('h2', { text: occ.reasonsTitle }), hint, grid);
}

const YT_ORIGIN = 'https://www.youtube-nocookie.com';

// Bandeau musique fixé en haut de la page. Le lecteur est préchargé (sans son) dès l'affichage,
// puis play() le lance au moment du clic sur « Ouvrir » : le démarrage est quasi immédiat.
export function mountMusic(content) {
  const m = musicEmbed(content && content.music);
  const start = Math.max(0, Math.floor((content && content.musicStart) || 0));
  const key = m ? `${m.provider}:${m.id}:${start}` : '';
  const existing = document.querySelector('.music-bar');
  if (existing && existing.dataset.key === key) return existing._ctrl;
  if (existing) existing.remove();
  if (!m) return null;

  const common = {
    title: 'Notre chanson',
    allow: 'autoplay; encrypted-media; clipboard-write; fullscreen; picture-in-picture',
    // YouTube exige l'origine du site (erreur 153 sinon) ; on n'envoie que le domaine, jamais l'adresse secrète de la page.
    referrerpolicy: 'strict-origin-when-cross-origin',
  };
  let ctrl;
  let bar;
  if (m.provider === 'spotify') {
    const iframe = el('iframe', { ...common, src: `https://open.spotify.com/embed/${m.kind}/${m.id}?theme=0` });
    bar = el('div', { class: 'music-bar spotify', 'aria-label': 'Notre chanson' }, iframe);
    ctrl = { play() {} }; // Spotify ne permet pas de lancer la lecture à distance.
  } else {
    const params = new URLSearchParams({ enablejsapi: '1', rel: '0', playsinline: '1', loop: '1', playlist: m.id, origin: location.origin });
    if (start) params.set('start', String(start));
    const iframe = el('iframe', { ...common, src: `${YT_ORIGIN}/embed/${m.id}?${params}` });
    const status = el('span', { class: 'mb-status', text: 'Prête à jouer' });
    bar = el('div', { class: 'music-bar youtube', 'aria-label': 'Notre chanson' },
      el('div', { class: 'mb-player' }, iframe),
      el('div', { class: 'mb-info' },
        el('span', { class: 'mb-title' }, el('span', { class: 'mb-eq', 'aria-hidden': 'true' }, el('i'), el('i'), el('i')), 'Notre chanson'),
        status));
    let ready = false;
    let wanted = false;
    let tries = 0;
    const post = (msg) => { try { iframe.contentWindow.postMessage(JSON.stringify(msg), YT_ORIGIN); } catch { /* lecteur pas prêt */ } };
    const playNow = () => post({ event: 'command', func: 'playVideo', args: [] });
    const hello = setInterval(() => {
      if (ready || ++tries > 40) return clearInterval(hello);
      post({ event: 'listening', id: 'upt', channel: 'widget' });
    }, 250);
    const onMsg = (e) => {
      if (e.origin !== YT_ORIGIN || e.source !== iframe.contentWindow) return;
      let d;
      try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch { return; }
      if (!d || !d.event) return;
      if ((d.event === 'onReady' || d.event === 'initialDelivery') && !ready) {
        ready = true;
        if (wanted) playNow();
      }
      const state = d.event === 'onStateChange' ? d.info : d.info && d.info.playerState;
      if (state === 1) { bar.classList.add('playing'); status.textContent = 'En cours de lecture'; }
      if (state === 2) { bar.classList.remove('playing'); status.textContent = 'En pause'; }
    };
    window.addEventListener('message', onMsg);
    ctrl = {
      play() {
        wanted = true;
        if (ready) playNow();
        setTimeout(() => { if (!bar.classList.contains('playing')) status.textContent = 'Appuie sur ▶ pour écouter'; }, 2500);
      },
    };
  }
  bar.dataset.key = key;
  bar._ctrl = ctrl;
  const main = document.querySelector('main');
  if (main && main.parentNode) main.parentNode.insertBefore(bar, main); else document.body.prepend(bar);
  return ctrl;
}

// Construit la page complète dans `root`.
export function renderPage(root, content, { photoUrl, preview = false } = {}) {
  const occ = getOccasion(content.occasion);
  applyTheme(content.theme);
  document.title = content.title || 'Une page pour toi';
  const sections = [
    preview ? el('div', { class: 'preview-banner', text: 'Aperçu — page non publiée' }) : null,
    el('header', { class: 'hero' },
      el('p', { class: 'eyebrow', text: `${occ.emoji} Pour ${content.to || '…'}` }),
      el('h1', { 'aria-label': content.title || '' }, words(content.title || '', 0.25)),
      content.from ? el('p', { class: 'from', text: `de la part de ${content.from}` }) : null,
      counter(content)),
    content.letter ? el('section', { class: 'block letter reveal unfold' }, paragraphs(content.letter), content.from ? el('p', { class: 'signature', text: `— ${content.from}` }) : null) : null,
    gallery(content, photoUrl),
    timeline(content, occ),
    reasons(content, occ),
    content.finalMessage ? el('section', { class: 'block final reveal words-in' }, el('p', { 'aria-label': content.finalMessage }, words(content.finalMessage, 0)), el('div', { class: 'big-heart', 'aria-hidden': 'true', text: '♥' })) : null,
  ];
  root.replaceChildren(...sections.filter(Boolean));
  if (preview) document.body.classList.add('opened');
  mountMusic(content);
  observeReveal(root);
}

// Découpe un texte en mots animables (décalage --i) ; le texte reste lisible par les lecteurs d'écran via aria-label.
function words(text, delay) {
  const out = [];
  text.split(/(\s+)/).forEach((w, i) => {
    if (/^\s+$/.test(w)) { out.push(w.includes('\n') ? el('br') : ' '); return; }
    if (w) out.push(el('span', { class: 'w', 'aria-hidden': 'true', style: `--i:${i / 2};--d:${delay}s`, text: w }));
  });
  return out;
}

function countUp(node) {
  const n = node.querySelector && node.querySelector('.count-up');
  if (!n || n.dataset.done) return;
  n.dataset.done = '1';
  const target = Number(n.dataset.target) || 0;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || target < 2) return;
  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / 1600);
    n.textContent = Math.round(target * (1 - Math.pow(1 - p, 4))).toLocaleString('fr-FR');
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function observeReveal(root) {
  const items = root.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach((i) => i.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('visible'); countUp(e.target); io.unobserve(e.target); }
  }, { threshold: 0.12 });
  items.forEach((i) => io.observe(i));
}

export function burst(container, symbol = '♥', count = 28) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = el('div', { class: 'burst', 'aria-hidden': 'true' });
  for (let i = 0; i < count; i++) {
    const s = el('span', { text: symbol });
    s.style.left = Math.random() * 100 + 'vw';
    s.style.animationDelay = Math.random() * 1.2 + 's';
    s.style.fontSize = 14 + Math.random() * 22 + 'px';
    layer.append(s);
  }
  container.append(layer);
  setTimeout(() => layer.remove(), 5000);
}

export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Normalise une réponse secrète : minuscules, sans accents ni ponctuation, espaces simplifiés.
export function normalizeAnswer(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

export { el };
