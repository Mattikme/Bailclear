// Fenêtre « fond d'écran » (page offerte et page de confirmation). Tout est fabriqué sur l'appareil.
import { STYLES, loadImages, renderWallpaper, toJpeg } from './wallpaper.js';

const HTML = `
  <h2 id="wp-title">📱 Ton fond d'écran</h2>
  <p id="wp-status" role="status">Choisis un style : l’heure de ton téléphone restera bien lisible en haut.</p>
  <div class="chips wp-styles" id="wp-styles"></div>
  <div class="montage-stage wp-stage"><canvas id="wp-canvas" role="img" aria-label="Aperçu du fond d'écran"></canvas><div class="wp-clock" aria-hidden="true"><span>9:41</span><small>mardi 24 décembre</small></div></div>
  <label class="montage-opt wp-opt"><input type="checkbox" id="wp-text" checked><span>Avec le prénom et la date en bas</span></label>
  <div class="row">
    <button class="btn" type="button" id="wp-share" hidden>Partager / Enregistrer</button>
    <a class="btn" id="wp-download" href="#">Télécharger</a>
  </div>
  <p class="montage-note">Ensuite : Réglages › Fond d’écran (iPhone) ou appui long sur l’écran d’accueil (Android). Rien n’est envoyé, l’image est créée sur ton téléphone.</p>
  <div class="row"><button class="btn secondary" type="button" id="wp-close">Fermer</button></div>`;

let dlg = null;
let state = null;
let url = null;
const q = (id) => dlg.querySelector(`#${id}`);

function ensureDialog() {
  if (dlg) return;
  dlg = document.createElement('dialog');
  dlg.className = 'montage wallpaper';
  dlg.setAttribute('aria-labelledby', 'wp-title');
  dlg.innerHTML = HTML;
  document.body.append(dlg);
  q('wp-close').onclick = () => dlg.close();
  q('wp-text').onchange = draw;
  q('wp-styles').replaceChildren(...STYLES.map((s) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.dataset.style = s.id; b.textContent = s.label;
    b.onclick = () => { state.style = s.id; draw(); };
    return b;
  }));
}

async function draw() {
  if (!state || !state.imgs.length) return;
  dlg.querySelectorAll('#wp-styles .chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.style === state.style)));
  const canvas = q('wp-canvas');
  renderWallpaper(canvas, state.imgs, state.content, { style: state.style, text: q('wp-text').checked });
  const blob = await toJpeg(canvas);
  if (url) URL.revokeObjectURL(url);
  url = URL.createObjectURL(blob);
  const dl = q('wp-download');
  dl.href = url; dl.download = 'fond-ecran.jpg';
  const file = new File([blob], 'fond-ecran.jpg', { type: 'image/jpeg' });
  const share = q('wp-share');
  share.hidden = !(navigator.canShare && navigator.canShare({ files: [file] }));
  share.onclick = () => navigator.share({ files: [file] }).catch(() => {});
}

export async function openWallpaper(content, photoUrl) {
  ensureDialog();
  q('wp-status').textContent = 'Chargement des photos…';
  dlg.showModal();
  const imgs = await loadImages(Math.min(10, (content.photos || []).length), photoUrl);
  state = { content, imgs, style: imgs.length >= 3 ? 'polaroid' : 'coeur' };
  if (!imgs.length) { q('wp-status').textContent = 'Ajoute au moins une photo à ta page pour créer un fond d’écran.'; return; }
  q('wp-status').textContent = 'Choisis un style : l’heure de ton téléphone restera bien lisible en haut.';
  await draw();
}
