// Vidéo souvenir : montage animé de la page, dessiné sur un <canvas> et enregistré par le navigateur
// (MediaRecorder). Tout se passe sur l'appareil : aucune photo ni texte n'est envoyé.
import { THEMES, getOccasion } from './occasions.js';
import { daysSince } from './render.js';

const W = 720;
const H = 1280;
const FPS = 30;
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';
const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => 1 - Math.pow(1 - clamp(t), 3);
const easeBack = (t) => { const c = 1.6; const x = clamp(t) - 1; return 1 + (c + 1) * x * x * x + c * x * x; };
const seg = (t, a, b) => clamp((t - a) / (b - a));

export function recorderSupport() {
  if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) return null;
  const types = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || null;
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrap(ctx, text, maxWidth) {
  const lines = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test;
    }
    lines.push(line);
  }
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, { size = 40, font = SANS, weight = 600, color, align = 'center', italic = false } = {}) {
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (color) ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function drawCover(ctx, img, x, y, w, h, zoom = 1) {
  const r = Math.max(w / img.width, h / img.height) * zoom;
  const iw = img.width * r;
  const ih = img.height * r;
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
}

// Construit la liste des scènes à partir du contenu de la page.
function buildScenes(content, images, theme, occ) {
  const { accent, ink, soft } = theme;
  const symbol = occ.id === 'noel' ? '❄' : occ.id === 'anniversaire' ? '✦' : '♥';
  const scenes = [];

  // 1. L'enveloppe s'ouvre
  scenes.push({ d: 3.0, draw(ctx, t) {
    const ew = 520; const eh = 340; const ex = (W - ew) / 2; const ey = 520;
    text(ctx, content.from ? `${content.from} t’a préparé` : 'Une surprise', W / 2, 300, { size: 44, font: SERIF, color: ink });
    text(ctx, content.from ? 'quelque chose…' : `pour ${content.to}`, W / 2, 360, { size: 44, font: SERIF, color: ink });
    const open = ease(seg(t, 0.7, 1.5));
    const slide = easeBack(seg(t, 1.4, 2.4));
    // carte qui sort
    ctx.save();
    ctx.beginPath(); ctx.rect(ex - 40, 0, ew + 80, ey + eh * 0.45); ctx.clip();
    const cy = ey + 40 - slide * 230;
    ctx.shadowColor = 'rgba(0,0,0,.15)'; ctx.shadowBlur = 20;
    roundRect(ctx, ex + 40, cy, ew - 80, 300, 16); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.shadowBlur = 0;
    text(ctx, `Pour ${content.to}`, W / 2, cy + 90, { size: 46, font: SERIF, color: ink });
    text(ctx, symbol, W / 2, cy + 170, { size: 54, color: accent });
    ctx.restore();
    // corps de l'enveloppe
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20;
    roundRect(ctx, ex, ey, ew, eh, 18); ctx.fillStyle = soft; ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(ex, ey + eh); ctx.lineTo(W / 2, ey + eh * 0.45); ctx.lineTo(ex + ew, ey + eh); ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,.05)'; ctx.fill();
    // rabat qui s'ouvre (se replie vers le haut)
    const k = 1 - 2 * open; // 1 fermé → -1 ouvert
    ctx.save();
    ctx.translate(0, ey);
    ctx.scale(1, k);
    ctx.beginPath(); ctx.moveTo(ex, 0); ctx.lineTo(ex + ew, 0); ctx.lineTo(W / 2, eh * 0.58); ctx.closePath();
    ctx.fillStyle = accent; ctx.fill();
    ctx.restore();
    if (open < 0.5) { // sceau
      ctx.beginPath(); ctx.arc(W / 2, ey + eh * 0.5, 40, 0, Math.PI * 2); ctx.fillStyle = accent; ctx.fill();
      ctx.lineWidth = 8; ctx.strokeStyle = soft; ctx.stroke();
      text(ctx, '♥', W / 2, ey + eh * 0.5 + 2, { size: 38, color: '#fff' });
    }
  } });

  // 2. Titre + compteur
  const days = daysSince(content.date);
  scenes.push({ d: content.date && days > 0 ? 2.8 : 2.2, draw(ctx, t) {
    const a = ease(seg(t, 0, 0.6));
    ctx.globalAlpha *= a;
    text(ctx, `${occ.emoji} Pour ${content.to}`, W / 2, 380, { size: 34, color: accent, weight: 700 });
    ctx.font = `600 76px ${SERIF}`;
    const lines = wrap(ctx, content.title, W - 120).slice(0, 4);
    lines.forEach((l, i) => text(ctx, l, W / 2, 480 + i * 88 + (1 - a) * 30, { size: 76, font: SERIF, color: ink }));
    let y = 480 + lines.length * 88 + 20;
    if (content.from) { text(ctx, `de la part de ${content.from}`, W / 2, y, { size: 36, font: SERIF, italic: true, weight: 400, color: ink }); y += 90; }
    if (content.date && days > 0) {
      const n = Math.round(days * ease(seg(t, 0.5, 2.0)));
      roundRect(ctx, W / 2 - 220, y, 440, 190, 28); ctx.fillStyle = soft; ctx.fill();
      text(ctx, `${content.dateLabel || 'Depuis'}`, W / 2, y + 45, { size: 28, weight: 500, color: ink });
      text(ctx, n.toLocaleString('fr-FR'), W / 2, y + 112, { size: 78, font: SERIF, weight: 700, color: accent });
      text(ctx, 'jours', W / 2, y + 163, { size: 28, weight: 500, color: ink });
    }
  } });

  // 3. La lettre s'écrit
  if (content.letter) {
    const excerpt = content.letter.length > 260 ? `${content.letter.slice(0, 260).replace(/\s+\S*$/, '')}…` : content.letter;
    const d = clamp(excerpt.length / 60, 3, 4.6);
    scenes.push({ d, draw(ctx, t) {
      const px = 70; const py = 260; const pw = W - 140; const ph = 760;
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
      roundRect(ctx, px, py, pw, ph, 12); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
      ctx.fillStyle = accent; ctx.fillRect(px, py, 8, ph);
      const shown = excerpt.slice(0, Math.floor(excerpt.length * seg(t, 0.2, d - 0.7)));
      ctx.font = `400 36px ${SERIF}`;
      const lines = wrap(ctx, shown, pw - 100).slice(0, 15);
      lines.forEach((l, i) => text(ctx, l, px + 50, py + 70 + i * 46, { size: 36, font: SERIF, weight: 400, color: '#2b2326', align: 'left' }));
      if (content.from && t > d - 1) text(ctx, `— ${content.from}`, px + pw - 50, py + ph - 60, { size: 34, font: SERIF, italic: true, weight: 400, color: '#2b2326', align: 'right' });
    } });
  }

  // 4. Photos (effet Ken Burns)
  images.slice(0, 5).forEach((img, i) => {
    if (!img) return;
    const caption = (content.photos[i] && content.photos[i].caption) || '';
    const rot = (i % 2 ? 1 : -1) * 0.03;
    scenes.push({ d: 1.9, draw(ctx, t) {
      const fw = 580; const fh = 760; const fx = (W - fw) / 2; const fy = 210;
      const enter = easeBack(seg(t, 0, 0.6));
      ctx.save();
      ctx.translate(W / 2, fy + fh / 2 + (1 - enter) * 120);
      ctx.rotate(rot * enter);
      ctx.translate(-W / 2, -(fy + fh / 2));
      ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20;
      ctx.fillStyle = '#fff'; ctx.fillRect(fx, fy, fw, fh);
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.save(); ctx.beginPath(); ctx.rect(fx + 24, fy + 24, fw - 48, fh - 150); ctx.clip();
      drawCover(ctx, img, fx + 24, fy + 24, fw - 48, fh - 150, 1 + 0.08 * t / 1.9);
      ctx.restore();
      if (caption) {
        ctx.font = `italic 400 32px ${SERIF}`;
        const l = wrap(ctx, caption, fw - 60)[0];
        text(ctx, l, W / 2, fy + fh - 62, { size: 32, font: SERIF, italic: true, weight: 400, color: '#3a3134' });
      }
      ctx.restore();
    } });
  });

  // 5. Souvenirs
  const tl = content.timeline.slice(0, 3);
  if (tl.length) {
    scenes.push({ d: 0.9 + tl.length * 0.95, draw(ctx, t) {
      text(ctx, occ.timelineTitle, W / 2, 230, { size: 58, font: SERIF, color: ink });
      const x = 140;
      ctx.fillStyle = soft; ctx.fillRect(x - 3, 320, 6, 160 * tl.length - 40);
      tl.forEach((item, i) => {
        const a = ease(seg(t, 0.3 + i * 0.95, 0.8 + i * 0.95));
        if (!a) return;
        const y = 330 + i * 160;
        ctx.save(); ctx.globalAlpha *= a; ctx.translate((1 - a) * 40, 0);
        ctx.beginPath(); ctx.arc(x, y + 10, 16, 0, Math.PI * 2); ctx.fillStyle = accent; ctx.fill();
        if (item.when) text(ctx, item.when.toUpperCase(), x + 50, y + 8, { size: 28, weight: 800, color: accent, align: 'left' });
        ctx.font = `500 32px ${SANS}`;
        wrap(ctx, item.text, W - x - 110).slice(0, 2).forEach((l, j) => text(ctx, l, x + 50, y + 56 + j * 40, { size: 32, weight: 500, color: ink, align: 'left' }));
        ctx.restore();
      });
    } });
  }

  // 6. Les cartes se retournent
  const rs = content.reasons.slice(0, 4);
  if (rs.length) {
    scenes.push({ d: 1.1 + rs.length * 0.8, draw(ctx, t) {
      text(ctx, occ.reasonsTitle, W / 2, 210, { size: 54, font: SERIF, color: ink });
      const cw = 290; const ch = 230; const gap = 26; const x0 = (W - cw * 2 - gap) / 2; const y0 = 300;
      rs.forEach((r, i) => {
        const x = x0 + (i % 2) * (cw + gap);
        const y = y0 + Math.floor(i / 2) * (ch + gap);
        const appear = easeBack(seg(t, i * 0.12, 0.5 + i * 0.12));
        const flip = ease(seg(t, 0.7 + i * 0.8, 1.2 + i * 0.8));
        const sx = Math.abs(Math.cos(flip * Math.PI)) || 0.001;
        const back = flip > 0.5;
        ctx.save();
        ctx.translate(x + cw / 2, y + ch / 2);
        ctx.scale(sx * appear, appear);
        ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
        roundRect(ctx, -cw / 2, -ch / 2, cw, ch, 22);
        ctx.fillStyle = back ? '#fff' : accent; ctx.fill();
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        if (back) {
          ctx.font = `400 30px ${SERIF}`;
          const lines = wrap(ctx, r, cw - 40).slice(0, 4);
          lines.forEach((l, j) => text(ctx, l, 0, (j - (lines.length - 1) / 2) * 38, { size: 30, font: SERIF, weight: 400, color: '#2b2326' }));
        } else {
          text(ctx, symbol, 0, -12, { size: 54, color: '#fff' });
          text(ctx, String(i + 1), 0, 48, { size: 28, font: SERIF, color: 'rgba(255,255,255,.85)' });
        }
        ctx.restore();
      });
    } });
  }

  // 7. Le mot de la fin
  if (content.finalMessage) {
    scenes.push({ d: 2.6, draw(ctx, t) {
      ctx.font = `500 56px ${SERIF}`;
      const lines = wrap(ctx, content.finalMessage, W - 140).slice(0, 7);
      const y0 = H / 2 - 120 - (lines.length - 1) * 34;
      lines.forEach((l, i) => text(ctx, l, W / 2, y0 + i * 68, { size: 56, font: SERIF, weight: 500, color: ink }));
      const beat = 1 + 0.12 * Math.max(0, Math.sin(t * 7));
      ctx.save(); ctx.translate(W / 2, y0 + lines.length * 68 + 110); ctx.scale(beat, beat);
      text(ctx, '♥', 0, 0, { size: 130, color: accent }); ctx.restore();
    } });
  }

  // 8. Signature (fait connaître le site)
  scenes.push({ d: 2.1, draw(ctx) {
    roundRect(ctx, W / 2 - 60, 470, 120, 120, 30); ctx.fillStyle = accent; ctx.fill();
    text(ctx, '♥', W / 2, 532, { size: 70, color: '#fff' });
    text(ctx, 'Une page pour toi', W / 2, 680, { size: 56, font: SERIF, weight: 700, color: ink });
    text(ctx, 'Crée la tienne sur', W / 2, 770, { size: 32, weight: 500, color: ink });
    text(ctx, location.host.replace(/^www\./, ''), W / 2, 822, { size: 34, weight: 700, color: accent });
  } });

  return scenes;
}

// Particules d'ambiance qui montent doucement
function makeParticles(n) {
  return Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 14 + Math.random() * 22, v: 20 + Math.random() * 40, a: 0.08 + Math.random() * 0.14 }));
}

export async function renderMontage(content, photoUrl, canvas, { onProgress, onFrame } = {}) {
  const mimeType = recorderSupport();
  if (!mimeType) throw new Error('Ton navigateur ne sait pas fabriquer de vidéo. Essaie avec Chrome ou Safari à jour.');
  const theme = THEMES[content.theme] || THEMES.rose;
  const occ = getOccasion(content.occasion);
  const symbol = occ.id === 'noel' ? '❄' : occ.id === 'anniversaire' ? '✦' : '♥';
  const images = await Promise.all(content.photos.slice(0, 5).map((_, i) => loadImage(photoUrl(i))));
  const scenes = buildScenes(content, images, theme, occ);
  const total = scenes.reduce((s, x) => s + x.d, 0);
  const particles = makeParticles(18);

  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  const drawFrame = (time) => {
    ctx.globalAlpha = 1;
    const g = ctx.createRadialGradient(W / 2, H * 0.35, 80, W / 2, H / 2, H * 0.8);
    g.addColorStop(0, theme.bg); g.addColorStop(1, theme.soft);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const p of particles) {
      const y = (p.y - time * p.v + H * 10) % (H + 60) - 30;
      ctx.globalAlpha = p.a;
      text(ctx, symbol, p.x, y, { size: p.s, color: theme.accent });
    }
    ctx.globalAlpha = 1;
    let t0 = 0;
    for (const sc of scenes) {
      if (time < t0 + sc.d) {
        const t = time - t0;
        const fade = Math.min(1, t / 0.35, (sc.d - t) / 0.35);
        ctx.save(); ctx.globalAlpha = clamp(fade); sc.draw(ctx, t); ctx.restore();
        break;
      }
      t0 += sc.d;
    }
  };

  drawFrame(0);
  const stream = canvas.captureStream(FPS);
  const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  const stopped = new Promise((resolve) => { rec.onstop = resolve; });
  rec.start(500);
  const start = performance.now();
  await new Promise((resolve) => {
    const tick = () => {
      const time = (performance.now() - start) / 1000;
      drawFrame(Math.min(time, total));
      if (onFrame) onFrame();
      if (onProgress) onProgress(Math.min(1, time / total));
      if (time >= total + 0.2) return resolve();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  rec.stop();
  await stopped;
  stream.getTracks().forEach((tr) => tr.stop());
  const type = mimeType.split(';')[0];
  return { blob: new Blob(chunks, { type }), ext: type === 'video/mp4' ? 'mp4' : 'webm', duration: total };
}
