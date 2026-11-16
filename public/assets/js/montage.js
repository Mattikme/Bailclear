// Vidéo souvenir « pro » : montage animé dessiné sur un <canvas> et enregistré par le navigateur (MediaRecorder).
// Principes : accroche dès la 1re seconde, coupes calées sur un tempo, transitions variées, typographie animée,
// mises en page photo variées, grain + vignettage, zones de sécurité TikTok/Reels, musique générée libre de droits.
// Tout se passe sur l'appareil : aucune photo ni texte n'est envoyé.
import { THEMES, getOccasion } from './occasions.js';
import { daysSince } from './render.js';

const W = 720;
const H = 1280;
const FPS = 30;
const BPM = 96;
const BEAT = 60 / BPM; // 0,625 s : toutes les durées sont des multiples de temps
let TR = BEAT * 0.75; // durée des transitions (ajustée selon le rythme choisi)
// Rythme : « posé » laisse le temps de lire chaque texte ; « dynamique » suit le tempo TikTok.
let POSE = true;
const KIN = { stagger: 0.06, dur: 0.45 };
const nWords = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const readTime = (s) => (POSE ? nWords(s) / 2.8 + 1.2 : nWords(s) / 4 + 0.5); // secondes pour lire confortablement
const SAFE_TOP = 170;
const SAFE_BOTTOM = H - 260; // l'interface de TikTok/Reels couvre le bas
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';
const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
const easeInOut = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const easeExpo = (t) => (clamp(t) === 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t)));
const easeBack = (t) => { const c = 1.7; const x = clamp(t) - 1; return 1 + (c + 1) * x * x * x + c * x * x; };

export function recorderSupport() {
  if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) return null;
  // H.264 d'abord (lu partout, accepté par TikTok/Instagram), puis WebM en dernier recours.
  const types = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4;codecs=avc1.42E01E,opus', 'video/mp4;codecs=avc1,opus',
    'video/mp4;codecs=avc1.42E01E', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/mp4', 'video/webm'];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || null;
}

/* ---------- Outils de dessin ---------- */
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrap(ctx, str, maxWidth) {
  const lines = [];
  for (const para of String(str).split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test;
    }
    if (line) lines.push(line);
  }
  return lines;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function setFont(ctx, size, { font = SANS, weight = 600, italic = false } = {}) {
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${font}`;
}

function txt(ctx, s, x, y, o = {}) {
  setFont(ctx, o.size || 40, o);
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = 'middle';
  if (o.shadow) { ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4; }
  ctx.fillStyle = o.color || '#000';
  ctx.fillText(s, x, y);
  if (o.shadow) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; }
}

// Typographie cinétique : chaque mot monte et apparaît avec un léger décalage.
function kinetic(ctx, lines, cx, y0, lineH, t, o = {}) {
  const per = o.stagger || KIN.stagger;
  const dur = o.dur || KIN.dur;
  let k = 0;
  setFont(ctx, o.size || 40, o);
  lines.forEach((line, li) => {
    const words = line.split(' ');
    const widths = words.map((w) => ctx.measureText(w).width);
    const space = ctx.measureText(' ').width;
    const total = widths.reduce((a, b) => a + b, 0) + space * (words.length - 1);
    let x = o.align === 'left' ? cx : cx - total / 2;
    words.forEach((w, wi) => {
      const p = easeBack(seg(t, (o.delay || 0) + k * per, (o.delay || 0) + k * per + dur));
      k++;
      if (p > 0) {
        ctx.save();
        ctx.globalAlpha *= clamp(p);
        txt(ctx, w, x + widths[wi] / 2, y0 + li * lineH + (1 - p) * 26, { ...o, align: 'center' });
        ctx.restore();
      }
      x += widths[wi] + space;
    });
  });
}

function drawCover(ctx, img, x, y, w, h, zoom = 1, panX = 0, panY = 0) {
  const r = Math.max(w / img.width, h / img.height) * zoom;
  const iw = img.width * r;
  const ih = img.height * r;
  ctx.drawImage(img, x + (w - iw) / 2 + panX * (iw - w) / 2, y + (h - ih) / 2 + panY * (ih - h) / 2, iw, ih);
}

// Version floutée d'une image (réduction puis agrandissement : marche sur tous les navigateurs).
function blurred(img) {
  const c = document.createElement('canvas');
  c.width = 36; c.height = Math.max(1, Math.round(36 * img.height / img.width));
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c;
}

function grainTile() {
  const c = document.createElement('canvas');
  c.width = c.height = 160;
  const g = c.getContext('2d');
  const d = g.createImageData(160, 160);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = Math.random() * 255;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  g.putImageData(d, 0, 0);
  return c;
}

/* ---------- Transitions ---------- */
const TRANSITIONS = {
  fade(ctx, out, inn, p) {
    ctx.save(); ctx.globalAlpha = 1 - p; out(); ctx.restore();
    ctx.save(); ctx.globalAlpha = p; inn(); ctx.restore();
  },
  zoom(ctx, out, inn, p) {
    const e = easeInOut(p);
    ctx.save(); ctx.globalAlpha = 1 - e; ctx.translate(W / 2, H / 2); ctx.scale(1 + 0.35 * e, 1 + 0.35 * e); ctx.translate(-W / 2, -H / 2); out(); ctx.restore();
    ctx.save(); ctx.globalAlpha = e; ctx.translate(W / 2, H / 2); ctx.scale(0.8 + 0.2 * e, 0.8 + 0.2 * e); ctx.translate(-W / 2, -H / 2); inn(); ctx.restore();
  },
  pushUp(ctx, out, inn, p) {
    const e = easeExpo(p);
    ctx.save(); ctx.translate(0, -H * e); out(); ctx.restore();
    ctx.save(); ctx.translate(0, H * (1 - e)); inn(); ctx.restore();
  },
  whip(ctx, out, inn, p) {
    // glissé rapide avec flou de mouvement simulé (copies fantômes)
    const e = easeInOut(p);
    const ghosts = [0, 0.04, 0.08];
    ghosts.forEach((g, i) => {
      const a = i ? 0.25 : 1;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(-W * clamp(e + g), 0); out(); ctx.restore();
      ctx.save(); ctx.globalAlpha = a; ctx.translate(W * (1 - clamp(e - g)), 0); inn(); ctx.restore();
    });
  },
  iris(ctx, out, inn, p) {
    out();
    const r = easeInOut(p) * Math.hypot(W, H) * 0.6;
    ctx.save(); ctx.beginPath(); ctx.arc(W / 2, H / 2, Math.max(1, r), 0, Math.PI * 2); ctx.clip(); inn(); ctx.restore();
  },
  flash(ctx, out, inn, p) {
    if (p < 0.5) out(); else inn();
    const a = Math.sin(p * Math.PI);
    const g = ctx.createRadialGradient(W * 0.7, H * 0.3, 20, W * 0.6, H * 0.4, H);
    g.addColorStop(0, `rgba(255,248,235,${0.95 * a})`);
    g.addColorStop(0.5, `rgba(255,214,170,${0.6 * a})`);
    g.addColorStop(1, `rgba(255,190,200,${0.3 * a})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  },
  wipe(ctx, out, inn, p) {
    out();
    const e = easeInOut(p);
    const x = -W * 0.6 + (W * 2.2) * e;
    ctx.save(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(x, 0); ctx.lineTo(x - W * 0.6, H); ctx.lineTo(0, H); ctx.closePath(); ctx.clip(); inn(); ctx.restore();
  },
};
const CYCLE = ['zoom', 'whip', 'iris', 'flash', 'pushUp', 'wipe', 'fade'];

/* ---------- Scènes ---------- */
function buildScenes(content, images, theme, occ) {
  const { accent, ink, soft } = theme;
  const symbol = occ.id === 'noel' ? '❄' : occ.id === 'anniversaire' ? '✦' : '♥';
  const imgs = images.filter(Boolean);
  const blur = new Map(imgs.map((im) => [im, blurred(im)]));
  const scenes = [];
  const add = (sec, draw, transition) => scenes.push({ d: sec, draw, transition });
  const PH = POSE ? 3.2 : 4 * BEAT; // durée d'une photo
  const TS = POSE ? 2.5 : 2 * BEAT; // durée d'un souvenir

  // 0. Accroche : la plus belle photo plein écran + « Pour toi, Léa »
  add(POSE ? 3.4 : 3 * BEAT, (ctx, t) => {
    if (imgs[0]) {
      drawCover(ctx, imgs[0], 0, 0, W, H, 1.18 - 0.1 * easeOut(t / 1.9), 0, -0.2);
      const g = ctx.createLinearGradient(0, H * 0.35, 0, H);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.65)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      kinetic(ctx, ['Pour toi,'], W / 2, 760, 90, t, { size: 64, font: SERIF, weight: 500, color: '#fff', shadow: true, delay: 0.15 });
      kinetic(ctx, [`${content.to} ${symbol}`], W / 2, 860, 90, t, { size: 104, font: SERIF, weight: 700, color: '#fff', shadow: true, delay: 0.35 });
    } else {
      kinetic(ctx, ['Pour toi,'], W / 2, 560, 90, t, { size: 64, font: SERIF, weight: 500, color: ink, delay: 0.15 });
      kinetic(ctx, [`${content.to} ${symbol}`], W / 2, 670, 90, t, { size: 104, font: SERIF, weight: 700, color: accent, delay: 0.35 });
    }
  }, 'flash');

  // 1. L'enveloppe s'ouvre
  add(POSE ? 4.6 : 5 * BEAT, (ctx, t) => {
    const ew = 520; const eh = 340; const ex = (W - ew) / 2; const ey = 640;
    kinetic(ctx, [content.from ? `${content.from} t’a écrit` : 'Une surprise', 'quelque chose…'], W / 2, 250, 66, t, { size: 52, font: SERIF, weight: 600, color: ink, stagger: 0.07 });
    const open = easeInOut(seg(t, 0.8, 1.5));
    const slide = easeBack(seg(t, 1.4, 2.4));
    const float = Math.sin(t * 2.4) * 6;
    ctx.save(); ctx.translate(0, float);
    ctx.save(); ctx.beginPath(); ctx.rect(ex - 40, 0, ew + 80, ey + eh * 0.45); ctx.clip();
    const cy = ey + 40 - slide * 200;
    ctx.shadowColor = 'rgba(0,0,0,.15)'; ctx.shadowBlur = 20;
    rr(ctx, ex + 40, cy, ew - 80, 300, 16); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.shadowBlur = 0;
    txt(ctx, `Pour ${content.to}`, W / 2, cy + 95, { size: 46, font: SERIF, color: ink });
    txt(ctx, symbol, W / 2, cy + 175, { size: 56, color: accent });
    ctx.restore();
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20;
    rr(ctx, ex, ey, ew, eh, 18); ctx.fillStyle = soft; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.moveTo(ex, ey + eh); ctx.lineTo(W / 2, ey + eh * 0.45); ctx.lineTo(ex + ew, ey + eh); ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,.06)'; ctx.fill();
    ctx.save(); ctx.translate(0, ey); ctx.scale(1, 1 - 2 * open);
    ctx.beginPath(); ctx.moveTo(ex, 0); ctx.lineTo(ex + ew, 0); ctx.lineTo(W / 2, eh * 0.58); ctx.closePath();
    ctx.fillStyle = accent; ctx.fill(); ctx.restore();
    if (open < 0.5) {
      ctx.beginPath(); ctx.arc(W / 2, ey + eh * 0.5, 40, 0, Math.PI * 2); ctx.fillStyle = accent; ctx.fill();
      ctx.lineWidth = 8; ctx.strokeStyle = soft; ctx.stroke();
      txt(ctx, '♥', W / 2, ey + eh * 0.5 + 2, { size: 38, color: '#fff' });
    }
    ctx.restore();
  }, 'iris');

  // 2. Titre + compteur
  const days = daysSince(content.date);
  add(POSE ? Math.max(content.date && days > 0 ? 6 : 4.5, readTime(`${content.title} ${content.from || ''}`) + (content.date ? 2.5 : 0.8)) : (content.date && days > 0 ? 5 : 4) * BEAT, (ctx, t) => {
    txt(ctx, `${occ.emoji}  ${occ.label.split(' (')[0].toUpperCase()}`, W / 2, 330, { size: 26, weight: 800, color: accent });
    setFont(ctx, 78, { font: SERIF, weight: 700 });
    const lines = wrap(ctx, content.title, W - 140).slice(0, 4);
    kinetic(ctx, lines, W / 2, 440, 92, t, { size: 78, font: SERIF, weight: 700, color: ink, delay: 0.1 });
    let y = 440 + lines.length * 92 + 10;
    if (content.from) { kinetic(ctx, [`de la part de ${content.from}`], W / 2, y, 50, t, { size: 36, font: SERIF, weight: 400, italic: true, color: ink, delay: 0.6 }); y += 90; }
    if (content.date && days > 0) {
      const a = easeBack(seg(t, 0.9, 1.5));
      ctx.save(); ctx.globalAlpha *= clamp(a); ctx.translate(W / 2, y + 95); ctx.scale(a, a);
      rr(ctx, -220, -95, 440, 190, 28); ctx.fillStyle = soft; ctx.fill();
      txt(ctx, content.dateLabel || 'Depuis', 0, -50, { size: 28, weight: 500, color: ink });
      txt(ctx, Math.round(days * easeExpo(seg(t, 1.1, 2.6))).toLocaleString('fr-FR'), 0, 17, { size: 80, font: SERIF, weight: 700, color: accent });
      txt(ctx, 'jours', 0, 68, { size: 28, weight: 500, color: ink });
      ctx.restore();
    }
  }, 'pushUp');

  // 3. La lettre : lignes révélées une à une, la caméra descend doucement
  if (content.letter) {
    const max = POSE ? 200 : 260;
    const excerpt = content.letter.length > max ? `${content.letter.slice(0, max).replace(/\s+\S*$/, '')}…` : content.letter;
    // posé : ~15 caractères/s (vitesse de lecture) + 3 s pour finir de lire ; dynamique : 6 à 8 temps
    const d = POSE ? clamp(excerpt.length / 18 + 2.6, 6, 14) : clamp(Math.round(excerpt.length / 38), 6, 8) * BEAT;
    add(d, (ctx, t) => {
      const px = 66; const py = SAFE_TOP + 30; const pw = W - 132; const ph = 800;
      ctx.save();
      ctx.translate(W / 2, H / 2); ctx.rotate(-0.012 + 0.012 * t / d); ctx.scale(1.03 - 0.03 * t / d, 1.03 - 0.03 * t / d); ctx.translate(-W / 2, -H / 2);
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.2)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 18;
      rr(ctx, px, py, pw, ph, 10); ctx.fillStyle = '#fffdf8'; ctx.fill(); ctx.restore();
      ctx.strokeStyle = 'rgba(214, 60, 114, .08)'; ctx.lineWidth = 2;
      for (let ly = py + 116; ly < py + ph - 40; ly += 46) { ctx.beginPath(); ctx.moveTo(px + 40, ly); ctx.lineTo(px + pw - 40, ly); ctx.stroke(); }
      ctx.fillStyle = accent; ctx.fillRect(px, py, 8, ph);
      setFont(ctx, 35, { font: SERIF, weight: 400 });
      const lines = wrap(ctx, excerpt, pw - 100).slice(0, 14);
      const per = (d - (POSE ? 2.6 : 1.2)) / Math.max(lines.length, 1);
      lines.forEach((l, i) => {
        const p = seg(t, 0.3 + i * per, 0.3 + (i + 1) * per);
        if (!p) return;
        const y = py + 92 + i * 46;
        ctx.save(); ctx.beginPath(); ctx.rect(px + 46, y - 30, (pw - 92) * easeOut(p) + 4, 60); ctx.clip();
        txt(ctx, l, px + 50, y, { size: 35, font: SERIF, weight: 400, color: '#2b2326', align: 'left' });
        ctx.restore();
      });
      if (content.from && t > d - (POSE ? 2.6 : 1.2)) txt(ctx, `— ${content.from}`, px + pw - 50, py + ph - 60, { size: 36, font: SERIF, italic: true, weight: 400, color: '#2b2326', align: 'right' });
      ctx.restore();
    }, 'whip');
  }

  // 4. Photos : mises en page qui alternent
  const caps = content.photos.map((p) => (p && p.caption) || '');
  const capFor = (img) => caps[images.indexOf(img)] || '';
  const captionKinetic = (ctx, c, t, y, color, shadow) => {
    if (!c) return;
    setFont(ctx, 38, { font: SERIF, italic: true, weight: 500 });
    kinetic(ctx, wrap(ctx, c, W - 140).slice(0, 2), W / 2, y, 50, t, { size: 38, font: SERIF, italic: true, weight: 500, color, shadow, delay: 0.35 });
  };
  const layouts = [
    // A. Plein écran, mouvement de caméra
    (img, dir) => (ctx, t) => {
      const d = PH;
      drawCover(ctx, img, 0, 0, W, H, 1.06 + 0.1 * (t / d), dir * (0.6 - 1.2 * t / d), 0);
      const g = ctx.createLinearGradient(0, H * 0.45, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.6)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      captionKinetic(ctx, capFor(img), t, SAFE_BOTTOM - 60, '#fff', true);
    },
    // B. Polaroïd qui tombe sur un fond flouté
    (img, dir) => (ctx, t) => {
      ctx.save(); ctx.globalAlpha *= 0.55; drawCover(ctx, blur.get(img), 0, 0, W, H, 1.2); ctx.restore();
      const fw = 560; const fh = 720; const fx = (W - fw) / 2; const fy = 230;
      const e = easeBack(seg(t, 0, 0.6));
      ctx.save(); ctx.translate(W / 2, fy + fh / 2 - (1 - e) * 500); ctx.rotate(dir * (0.12 - 0.08 * e)); ctx.translate(-W / 2, -(fy + fh / 2));
      ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 26;
      ctx.fillStyle = '#fff'; ctx.fillRect(fx, fy, fw, fh); ctx.shadowColor = 'transparent';
      ctx.save(); ctx.beginPath(); ctx.rect(fx + 22, fy + 22, fw - 44, fh - 140); ctx.clip();
      drawCover(ctx, img, fx + 22, fy + 22, fw - 44, fh - 140, 1.04 + 0.04 * t);
      ctx.restore();
      const c = capFor(img);
      if (c) { setFont(ctx, 30, { font: SERIF, italic: true, weight: 400 }); txt(ctx, wrap(ctx, c, fw - 60)[0], W / 2, fy + fh - 58, { size: 30, font: SERIF, italic: true, weight: 400, color: '#3a3134' }); }
      ctx.restore();
    },
    // C. Photo nette encadrée sur sa version floutée (format « reel »)
    (img) => (ctx, t) => {
      drawCover(ctx, blur.get(img), 0, 0, W, H, 1.3);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, 0, W, H);
      const s = 0.92 + 0.06 * easeOut(t / PH);
      const bw = W - 80; const bh = 820; const by = 210;
      ctx.save(); ctx.translate(W / 2, by + bh / 2); ctx.scale(s, s); ctx.translate(-W / 2, -(by + bh / 2));
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 40; rr(ctx, 40, by, bw, bh, 26); ctx.fillStyle = '#000'; ctx.fill(); ctx.restore();
      ctx.save(); rr(ctx, 40, by, bw, bh, 26); ctx.clip(); drawCover(ctx, img, 40, by, bw, bh, 1.05); ctx.restore();
      ctx.restore();
      captionKinetic(ctx, capFor(img), t, by + bh + 70, '#fff', true);
    },
  ];
  // D. Écran partagé : deux photos qui glissent en sens opposé
  const duo = (a, b) => (ctx, t) => {
    const e = easeExpo(seg(t, 0, 0.7));
    const h2 = H / 2 - 6;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, h2); ctx.clip(); ctx.translate(-W * (1 - e), 0); drawCover(ctx, a, 0, 0, W, h2, 1.08 + 0.05 * t, -0.3); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(0, h2 + 12, W, h2); ctx.clip(); ctx.translate(W * (1 - e), 0); drawCover(ctx, b, 0, h2 + 12, W, h2, 1.08 + 0.05 * t, 0.3); ctx.restore();
    ctx.fillStyle = soft; ctx.fillRect(0, h2, W, 12);
    const c = capFor(a) || capFor(b);
    if (c) {
      setFont(ctx, 34, { font: SERIF, italic: true, weight: 600 });
      const w = Math.min(W - 80, ctx.measureText(c).width + 60);
      ctx.save(); ctx.globalAlpha *= easeOut(seg(t, 0.5, 0.9)); rr(ctx, (W - w) / 2, H / 2 - 34, w, 68, 34); ctx.fillStyle = '#fff'; ctx.fill();
      txt(ctx, wrap(ctx, c, W - 140)[0], W / 2, H / 2, { size: 34, font: SERIF, italic: true, weight: 600, color: ink }); ctx.restore();
    }
  };
  const list = imgs.slice(0, 6);
  let li = 0;
  let k = 0;
  while (li < list.length) {
    if (k % 4 === 3 && li + 1 < list.length) { add(PH + (POSE ? 0.6 : 0), duo(list[li], list[li + 1]), CYCLE[(k + 2) % CYCLE.length]); li += 2; }
    else { add(PH, layouts[k % 3](list[li], k % 2 ? 1 : -1), CYCLE[(k + 2) % CYCLE.length]); li += 1; }
    k++;
  }

  // 5. Souvenirs : une ligne se dessine et chaque étape apparaît
  const tl = content.timeline.slice(0, 3);
  if (tl.length) {
    add((POSE ? 1.8 : 2 * BEAT) + tl.length * TS, (ctx, t) => {
      kinetic(ctx, [occ.timelineTitle], W / 2, SAFE_TOP + 60, 70, t, { size: 60, font: SERIF, weight: 700, color: ink });
      const x = 130; const y0 = 360; const step = 200;
      const lineP = easeInOut(seg(t, 0.2, 0.4 + tl.length * TS));
      ctx.fillStyle = soft; ctx.fillRect(x - 3, y0, 6, (step * tl.length - 60) * lineP);
      tl.forEach((item, i) => {
        const p = easeBack(seg(t, 0.4 + i * TS, (POSE ? 1.1 : 0.9) + i * TS));
        if (!p) return;
        const y = y0 + i * step;
        ctx.save(); ctx.globalAlpha *= clamp(p); ctx.translate((1 - p) * 60, 0);
        ctx.beginPath(); ctx.arc(x, y + 12, Math.max(0.5, 18 * p), 0, Math.PI * 2); ctx.fillStyle = accent; ctx.fill();
        if (item.when) txt(ctx, item.when.toUpperCase(), x + 50, y + 10, { size: 28, weight: 800, color: accent, align: 'left' });
        setFont(ctx, 34, { weight: 500 });
        wrap(ctx, item.text, W - x - 110).slice(0, 2).forEach((l, j) => txt(ctx, l, x + 50, y + 60 + j * 42, { size: 34, weight: 500, color: ink, align: 'left' }));
        ctx.restore();
      });
    }, 'wipe');
  }

  // 6. « Ce que j'aime chez toi » : une carte géante par raison, retournée en 3D
  const nR = POSE ? 3 : 4;
  content.reasons.slice(0, nR).forEach((r, i) => {
    add(POSE ? Math.max(3.6, readTime(r) + 1.4) : 2.5 * BEAT, (ctx, t) => {
      if (i === 0 || t < 0.6) txt(ctx, occ.reasonsTitle, W / 2, SAFE_TOP + 50, { size: 46, font: SERIF, weight: 700, color: ink });
      txt(ctx, `${i + 1} / ${Math.min(content.reasons.length, nR)}`, W / 2, SAFE_TOP + 110, { size: 26, weight: 700, color: accent });
      const flip = easeInOut(POSE ? seg(t, 0.5, 1.4) : seg(t, 0.25, 0.85));
      const sx = Math.max(0.001, Math.abs(Math.cos(flip * Math.PI)));
      const back = flip > 0.5;
      const cw = 500; const ch = 620; const cy = 330;
      ctx.save(); ctx.translate(W / 2, cy + ch / 2); ctx.rotate((i % 2 ? 1 : -1) * 0.03);
      ctx.scale(sx * (1 + 0.08 * Math.sin(flip * Math.PI)), 1 + 0.04 * Math.sin(flip * Math.PI));
      ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
      rr(ctx, -cw / 2, -ch / 2, cw, ch, 34);
      if (back) { ctx.fillStyle = '#fff'; ctx.fill(); } else {
        const g = ctx.createLinearGradient(-cw / 2, -ch / 2, cw / 2, ch / 2); g.addColorStop(0, accent); g.addColorStop(1, ink);
        ctx.fillStyle = g; ctx.fill();
      }
      ctx.shadowColor = 'transparent';
      if (back) {
        txt(ctx, symbol, 0, -ch / 2 + 90, { size: 54, color: accent });
        setFont(ctx, 44, { font: SERIF, weight: 500 });
        const lines = wrap(ctx, r, cw - 80).slice(0, 6);
        lines.forEach((l, j) => txt(ctx, l, 0, (j - (lines.length - 1) / 2) * 56 + 20, { size: 44, font: SERIF, weight: 500, color: '#2b2326' }));
      } else {
        txt(ctx, symbol, 0, -10, { size: 120, color: '#fff' });
      }
      ctx.restore();
    }, i === 0 ? 'zoom' : 'whip');
  });

  // 7. Le mot de la fin
  if (content.finalMessage) {
    add(POSE ? Math.max(5, readTime(content.finalMessage) + 2) : 5 * BEAT, (ctx, t) => {
      setFont(ctx, 58, { font: SERIF, weight: 600 });
      const lines = wrap(ctx, content.finalMessage, W - 140).slice(0, 7);
      const y0 = H / 2 - 150 - (lines.length - 1) * 36;
      kinetic(ctx, lines, W / 2, y0, 72, t, { size: 58, font: SERIF, weight: 600, color: ink, stagger: 0.09, dur: 0.55 });
      const beat = 1 + 0.14 * Math.pow(Math.max(0, Math.sin((t / BEAT) * Math.PI)), 6);
      const a = easeBack(seg(t, 1.2, 1.8));
      ctx.save(); ctx.globalAlpha *= clamp(a); ctx.translate(W / 2, y0 + lines.length * 72 + 120); ctx.scale(beat * a, beat * a);
      txt(ctx, '♥', 0, 0, { size: 150, color: accent }); ctx.restore();
    }, 'flash');
  }

  // 8. Signature (fait connaître le site)
  add(POSE ? 4 : 4 * BEAT, (ctx, t) => {
    const a = easeBack(seg(t, 0, 0.6));
    ctx.save(); ctx.translate(W / 2, 520); ctx.scale(a, a); ctx.rotate((1 - a) * 0.4);
    rr(ctx, -64, -64, 128, 128, 32); ctx.fillStyle = accent; ctx.fill();
    txt(ctx, '♥', 0, 4, { size: 72, color: '#fff' }); ctx.restore();
    kinetic(ctx, ['Une page pour toi'], W / 2, 680, 70, t, { size: 58, font: SERIF, weight: 700, color: ink, delay: 0.3 });
    kinetic(ctx, ['Crée la tienne sur'], W / 2, 770, 50, t, { size: 32, weight: 500, color: ink, delay: 0.6 });
    kinetic(ctx, [location.host.replace(/^www\./, '')], W / 2, 822, 50, t, { size: 34, weight: 800, color: accent, delay: 0.75 });
  }, 'zoom');

  return scenes;
}

/* ---------- Musique générée (libre de droits) ---------- */
// Progression douce I–V–vi–IV en do majeur, nappe + arpège + basse, au tempo des coupes.
function scheduleMusic(ac, dest, total) {
  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, ac.currentTime);
  master.gain.exponentialRampToValueAtTime(1.0, ac.currentTime + 1.2);
  master.gain.setValueAtTime(1.0, ac.currentTime + total - 1.8);
  master.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + total);
  const comp = ac.createDynamicsCompressor();
  master.connect(comp);
  comp.connect(dest);
  const delay = ac.createDelay(); delay.delayTime.value = BEAT * 0.75;
  const fb = ac.createGain(); fb.gain.value = 0.28;
  const wet = ac.createGain(); wet.gain.value = 0.25;
  delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(master);

  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const chords = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]; // C G Am F
  const t0 = ac.currentTime + 0.05;
  const bars = Math.ceil(total / (BEAT * 4)) + 1;
  for (let b = 0; b < bars; b++) {
    const chord = chords[b % 4];
    const start = t0 + b * BEAT * 4;
    // nappe
    chord.forEach((n) => {
      [-6, 6].forEach((det) => {
        const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(n); o.detune.value = det;
        const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
        const g = ac.createGain(); g.gain.setValueAtTime(0.0001, start);
        g.gain.linearRampToValueAtTime(0.022, start + 0.6); g.gain.linearRampToValueAtTime(0.0001, start + BEAT * 4 + 0.3);
        o.connect(f); f.connect(g); g.connect(master); o.start(start); o.stop(start + BEAT * 4 + 0.4);
      });
    });
    // basse
    const bo = ac.createOscillator(); bo.type = 'sine'; bo.frequency.value = hz(chord[0] - 24);
    const bg = ac.createGain(); bg.gain.setValueAtTime(0.0001, start); bg.gain.linearRampToValueAtTime(0.16, start + 0.05); bg.gain.exponentialRampToValueAtTime(0.0001, start + BEAT * 3.8);
    bo.connect(bg); bg.connect(master); bo.start(start); bo.stop(start + BEAT * 4);
    // arpège façon piano
    const notes = [chord[0] + 12, chord[1] + 12, chord[2] + 12, chord[1] + 12, chord[0] + 24, chord[2] + 12, chord[1] + 12, chord[2] + 12];
    notes.forEach((n, i) => {
      const s = start + i * BEAT / 2;
      const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = hz(n);
      const g = ac.createGain(); g.gain.setValueAtTime(0.0001, s); g.gain.linearRampToValueAtTime(0.07, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.9);
      o.connect(g); g.connect(master); g.connect(delay); o.start(s); o.stop(s + 1);
    });
  }
}

/* ---------- Rendu ---------- */
export async function renderMontage(content, photoUrl, canvas, { onProgress, music = true, pace = 'pose' } = {}) {
  POSE = pace !== 'dynamique';
  TR = POSE ? 0.75 : BEAT * 0.75;
  KIN.stagger = POSE ? 0.11 : 0.06;
  KIN.dur = POSE ? 0.7 : 0.45;
  const mimeType = recorderSupport();
  if (!mimeType) throw new Error('Ton navigateur ne sait pas fabriquer de vidéo. Essaie avec Chrome ou Safari à jour.');
  const theme = THEMES[content.theme] || THEMES.rose;
  const occ = getOccasion(content.occasion);
  const symbol = occ.id === 'noel' ? '❄' : occ.id === 'anniversaire' ? '✦' : '♥';
  const images = await Promise.all(content.photos.slice(0, 6).map((_, i) => loadImage(photoUrl(i))));
  const scenes = buildScenes(content, images, theme, occ);
  // Les scènes se chevauchent pendant les transitions
  let acc = 0;
  scenes.forEach((s, i) => { s.start = acc; acc += s.d - (i < scenes.length - 1 ? TR : 0); });
  const total = acc;

  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const grain = grainTile();
  const bokeh = Array.from({ length: 14 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 30 + Math.random() * 90, v: 8 + Math.random() * 18, a: 0.05 + Math.random() * 0.08 }));
  const hearts = Array.from({ length: 12 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 16 + Math.random() * 20, v: 25 + Math.random() * 35, a: 0.1 + Math.random() * 0.12 }));

  const background = (time) => {
    const g = ctx.createRadialGradient(W / 2, H * 0.3, 60, W / 2, H / 2, H * 0.85);
    g.addColorStop(0, theme.bg); g.addColorStop(1, theme.soft);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const b of bokeh) {
      const y = (b.y - time * b.v + H * 20) % (H + 200) - 100;
      const rg = ctx.createRadialGradient(b.x, y, 0, b.x, y, b.r);
      rg.addColorStop(0, `rgba(255,255,255,${b.a * 2})`); rg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = rg; ctx.fillRect(b.x - b.r, y - b.r, b.r * 2, b.r * 2);
    }
    for (const h of hearts) {
      const y = (h.y - time * h.v + H * 20) % (H + 60) - 30;
      ctx.globalAlpha = h.a; txt(ctx, symbol, h.x + Math.sin(time + h.x) * 12, y, { size: h.s, color: theme.accent });
    }
    ctx.globalAlpha = 1;
  };
  const finish = () => {
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.28)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = 0.055; ctx.globalCompositeOperation = 'overlay';
    const ox = Math.floor(Math.random() * 160); const oy = Math.floor(Math.random() * 160);
    for (let x = -ox; x < W; x += 160) for (let y = -oy; y < H; y += 160) ctx.drawImage(grain, x, y);
    ctx.restore();
  };
  const drawFrame = (time) => {
    ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    background(time);
    const active = scenes.filter((s) => time >= s.start && time < s.start + s.d);
    const layer = (s) => () => { s.draw(ctx, time - s.start); };
    if (active.length >= 2) {
      const [a, b] = active;
      const p = clamp((time - b.start) / TR);
      (TRANSITIONS[b.transition] || TRANSITIONS.fade)(ctx, layer(a), layer(b), p);
    } else if (active.length === 1) {
      const s = active[0];
      const fadeOut = s === scenes[scenes.length - 1] ? clamp((s.start + s.d - time) / 0.6) : 1;
      ctx.save(); ctx.globalAlpha = fadeOut; s.draw(ctx, time - s.start); ctx.restore();
    }
    finish();
  };

  drawFrame(0);
  const stream = canvas.captureStream(FPS);
  let ac = null;
  if (music && (window.AudioContext || window.webkitAudioContext)) {
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      await ac.resume();
      const dest = ac.createMediaStreamDestination();
      const out = ac.createGain(); out.connect(dest); out.connect(ac.destination);
      scheduleMusic(ac, out, total);
      dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
    } catch { ac = null; }
  }
  const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5_000_000 });
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  const stopped = new Promise((resolve) => { rec.onstop = resolve; });
  rec.start(500);
  const start = performance.now();
  await new Promise((resolve) => {
    const tick = () => {
      const time = (performance.now() - start) / 1000;
      try { drawFrame(Math.min(time, total - 0.001)); } catch (e) { console.error(e); } // une image ratée ne doit pas bloquer la vidéo
      if (onProgress) onProgress(Math.min(1, time / total));
      if (time >= total + 0.15) return resolve();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  rec.stop();
  await stopped;
  stream.getTracks().forEach((tr) => tr.stop());
  if (ac) ac.close().catch(() => {});
  const type = mimeType.split(';')[0];
  return { blob: new Blob(chunks, { type }), ext: type === 'video/mp4' ? 'mp4' : 'webm', duration: total, withMusic: Boolean(ac) };
}
