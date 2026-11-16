// Rendu d'une page cadeau. Uniquement des API DOM (textContent) : aucun HTML utilisateur n'est interprété.
import { THEMES, getOccasion } from './occasions.js';

const YT = /^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/watch\?(?:[^#]*&)?v=|youtu\.be\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/;
const SPOTIFY = /^https:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album|playlist)\/([A-Za-z0-9]{22})/;

export function musicEmbed(url) {
  if (!url) return null;
  const y = YT.exec(url);
  if (y) return { provider: 'youtube', src: `https://www.youtube-nocookie.com/embed/${y[1]}?autoplay=1&rel=0` };
  const s = SPOTIFY.exec(url);
  if (s) return { provider: 'spotify', src: `https://open.spotify.com/embed/${s[1]}/${s[2]}` };
  return null;
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
  return el('div', { class: 'counter reveal' },
    el('div', { class: 'counter-label', text: `${label} le ${dateFr}` }),
    el('div', { class: 'counter-value' }, el('strong', { text: days.toLocaleString('fr-FR') }), ' jours'),
  );
}

function gallery(content, photoUrl) {
  if (!content.photos.length) return null;
  const figs = content.photos.map((p, n) => {
    const img = el('img', { src: photoUrl(n), alt: p.caption || `Photo ${n + 1}`, loading: n < 2 ? 'eager' : 'lazy', decoding: 'async' });
    return el('figure', { class: 'photo reveal', tabindex: '0', onclick: () => lightbox(content, photoUrl, n), onkeydown: (e) => { if (e.key === 'Enter') lightbox(content, photoUrl, n); } },
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
    el('ol', { class: 'timeline' }, content.timeline.map((t) =>
      el('li', { class: 'reveal' }, t.when ? el('span', { class: 'when', text: t.when }) : null, el('p', { text: t.text })))));
}

function reasons(content, occ) {
  if (!content.reasons.length) return null;
  return el('section', { class: 'block' },
    el('h2', { text: occ.reasonsTitle }),
    el('p', { class: 'hint', text: 'Touche les cartes pour les retourner' }),
    el('div', { class: 'reasons' }, content.reasons.map((r, i) =>
      el('button', { class: 'reason reveal', type: 'button', 'aria-label': `Carte ${i + 1}`, onclick: (e) => e.currentTarget.classList.add('flipped') },
        el('span', { class: 'front', text: String(i + 1) }),
        el('span', { class: 'back', text: r })))));
}

function music(content) {
  const m = musicEmbed(content.music);
  if (!m) return null;
  const holder = el('div', { class: 'music-holder' });
  const btn = el('button', { class: 'btn music-btn', type: 'button', text: '▶ Écouter notre chanson' });
  btn.addEventListener('click', () => {
    const iframe = el('iframe', {
      src: m.src, title: 'Musique', loading: 'lazy',
      allow: 'autoplay; encrypted-media; clipboard-write; fullscreen; picture-in-picture',
      class: m.provider === 'spotify' ? 'spotify' : 'youtube',
    });
    holder.replaceChildren(iframe);
  });
  holder.append(btn, el('p', { class: 'hint', text: m.provider === 'youtube' ? 'Lecture via YouTube' : 'Lecture via Spotify' }));
  return el('section', { class: 'block music reveal' }, holder);
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
      el('h1', { text: content.title || '' }),
      content.from ? el('p', { class: 'from', text: `de la part de ${content.from}` }) : null,
      counter(content)),
    content.letter ? el('section', { class: 'block letter reveal' }, paragraphs(content.letter), content.from ? el('p', { class: 'signature', text: `— ${content.from}` }) : null) : null,
    gallery(content, photoUrl),
    timeline(content, occ),
    reasons(content, occ),
    music(content),
    content.finalMessage ? el('section', { class: 'block final reveal' }, el('p', { text: content.finalMessage }), el('div', { class: 'big-heart', 'aria-hidden': 'true', text: '♥' })) : null,
  ];
  root.replaceChildren(...sections.filter(Boolean));
  observeReveal(root);
}

function observeReveal(root) {
  const items = root.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach((i) => i.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
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
