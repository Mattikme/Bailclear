// Fond d'écran de téléphone fabriqué sur l'appareil à partir des photos de la page.
// Le haut (heure, widgets) et le bas (lampe, appareil photo) de l'écran verrouillé restent dégagés.
import { THEMES, getOccasion } from './occasions.js';
import { langOf, locale } from './i18n.js';

export const W = 1179;
export const H = 2556;
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';
const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const SAFE_TOP = 0.36 * H; // sous l'horloge et les widgets
const SAFE_BOTTOM = 0.86 * H; // au-dessus des boutons de l'écran verrouillé

export const STYLES = [
  { id: 'polaroid', label: 'Polaroïds' },
  { id: 'coeur', label: 'Cœur' },
  { id: 'mosaique', label: 'Mosaïque' },
  { id: 'photo', label: 'Une photo' },
];

export function loadImages(count, photoUrl) {
  return Promise.all(Array.from({ length: count }, (_, i) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = photoUrl(i);
  }))).then((list) => list.filter(Boolean));
}

// Petit générateur pseudo-aléatoire : même rendu à chaque fois pour un même style.
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function cover(ctx, img, x, y, w, h) {
  const r = Math.max(w / img.width, h / img.height);
  const sw = w / r; const sh = h / r;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

function heartPath(ctx, cx, cy, size) {
  ctx.beginPath();
  for (let i = 0; i <= 200; i++) {
    const t = (i / 200) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    const px = cx + (x / 17) * size; const py = cy + (y / 17) * size;
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
  }
  ctx.closePath();
}

function background(ctx, theme) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, theme.soft);
  g.addColorStop(0.55, theme.bg);
  g.addColorStop(1, theme.soft);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // petits cœurs discrets
  const r = rng(7);
  ctx.fillStyle = theme.accent;
  ctx.font = `60px ${SERIF}`;
  ctx.textAlign = 'center';
  for (let i = 0; i < 26; i++) {
    ctx.globalAlpha = 0.05 + r() * 0.07;
    ctx.fillText('♥', r() * W, r() * H);
  }
  ctx.globalAlpha = 1;
}

function caption(ctx, text, theme, { light = false } = {}) {
  if (!text) return;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let size = 64;
  ctx.font = `italic 600 ${size}px ${SERIF}`;
  while (ctx.measureText(text).width > W * 0.82 && size > 34) { size -= 2; ctx.font = `italic 600 ${size}px ${SERIF}`; }
  const y = SAFE_BOTTOM + 0.035 * H;
  if (light) { ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 24; }
  ctx.fillStyle = light ? '#fff' : theme.ink;
  ctx.fillText(text, W / 2, y);
  ctx.restore();
}

function polaroids(ctx, imgs, theme) {
  background(ctx, theme);
  const r = rng(42);
  const n = Math.min(imgs.length, 5);
  const area = { top: SAFE_TOP, bottom: SAFE_BOTTOM };
  const slots = [
    [[0.5, 0.5, 0]],
    [[0.36, 0.35, -7], [0.64, 0.68, 6]],
    [[0.32, 0.27, -8], [0.68, 0.5, 7], [0.38, 0.76, -4]],
    [[0.3, 0.24, -9], [0.7, 0.33, 8], [0.32, 0.66, 5], [0.68, 0.78, -6]],
    [[0.28, 0.2, -9], [0.72, 0.27, 7], [0.5, 0.5, -3], [0.27, 0.78, 6], [0.73, 0.8, -7]],
  ][n - 1];
  const size = [760, 620, 560, 500, 470][n - 1];
  slots.forEach(([fx, fy, rot], i) => {
    const img = imgs[i];
    const cx = fx * W;
    const cy = area.top + fy * (area.bottom - area.top);
    const pw = size; const ph = size * 1.18; const pad = size * 0.06;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(((rot + (r() - 0.5) * 3) * Math.PI) / 180);
    ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
    ctx.fillStyle = '#fff';
    ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
    ctx.shadowColor = 'transparent';
    cover(ctx, img, -pw / 2 + pad, -ph / 2 + pad, pw - 2 * pad, pw - 2 * pad);
    // ruban adhésif
    ctx.rotate(((r() - 0.5) * 10 * Math.PI) / 180);
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.fillRect(-pw * 0.16, -ph / 2 - 26, pw * 0.32, 60);
    ctx.restore();
  });
}

function heart(ctx, imgs, theme) {
  background(ctx, theme);
  const cx = W / 2;
  const cy = (SAFE_TOP + SAFE_BOTTOM) / 2 + 30;
  const size = W * 0.47;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20;
  heartPath(ctx, cx, cy, size);
  ctx.fillStyle = theme.accent;
  ctx.fill();
  ctx.restore();
  ctx.save();
  heartPath(ctx, cx, cy, size);
  ctx.clip();
  const cell = imgs.length <= 2 ? size : imgs.length <= 6 ? size * 0.55 : size * 0.4;
  const x0 = cx - size * 1.05; const y0 = cy - size * 0.95;
  let k = 0;
  for (let y = y0; y < cy + size * 1.05; y += cell) {
    for (let x = x0; x < cx + size * 1.05; x += cell) {
      cover(ctx, imgs[k % imgs.length], x, y, cell + 1, cell + 1);
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 6;
      ctx.strokeRect(x, y, cell, cell);
      k++;
    }
  }
  ctx.restore();
  heartPath(ctx, cx, cy, size);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 14; ctx.stroke();
}

function mosaic(ctx, imgs) {
  const n = imgs.length;
  const cols = n <= 2 ? 1 : 2;
  const rows = Math.ceil(Math.max(n, cols * 3) / cols);
  const cw = W / cols; const rh = H / rows;
  let k = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cover(ctx, imgs[k++ % n], c * cw, r * rh, cw, rh);
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 10;
  for (let c = 1; c < cols; c++) { ctx.beginPath(); ctx.moveTo(c * cw, 0); ctx.lineTo(c * cw, H); ctx.stroke(); }
  for (let r = 1; r < rows; r++) { ctx.beginPath(); ctx.moveTo(0, r * rh); ctx.lineTo(W, r * rh); ctx.stroke(); }
  shade(ctx);
}

function single(ctx, imgs) {
  cover(ctx, imgs[0], 0, 0, W, H);
  shade(ctx);
}

// Assombrit le haut (lisibilité de l'heure) et le bas (texte).
function shade(ctx) {
  let g = ctx.createLinearGradient(0, 0, 0, SAFE_TOP);
  g.addColorStop(0, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, SAFE_TOP);
  g = ctx.createLinearGradient(0, SAFE_BOTTOM - 200, 0, H);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.fillStyle = g; ctx.fillRect(0, SAFE_BOTTOM - 200, W, H - SAFE_BOTTOM + 200);
}

export function wallpaperText(content) {
  const symbol = getOccasion(content.occasion).id === 'noel' ? '❄' : '♥';
  if (content.date) {
    const d = new Date(`${content.date}T12:00:00`);
    return `${content.to} · ${d.toLocaleDateString(locale(langOf(content)), { day: 'numeric', month: 'long', year: 'numeric' })} ${symbol}`;
  }
  return content.from ? `${content.to} & ${content.from} ${symbol}` : `${content.to} ${symbol}`;
}

export function renderWallpaper(canvas, imgs, content, { style = 'polaroid', text = true } = {}) {
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const theme = THEMES[content.theme] || THEMES.rose;
  if (style === 'coeur') heart(ctx, imgs, theme);
  else if (style === 'mosaique') mosaic(ctx, imgs);
  else if (style === 'photo') single(ctx, imgs);
  else polaroids(ctx, imgs, theme);
  if (text) caption(ctx, wallpaperText(content), theme, { light: style === 'mosaique' || style === 'photo' });
  return canvas;
}

export function toJpeg(canvas) {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Image impossible à créer.'))), 'image/jpeg', 0.9));
}
