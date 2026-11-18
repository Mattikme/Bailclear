// Fenêtre « vidéo souvenir » partagée par la page offerte (/p/…) et la page de confirmation (/merci).
// La fenêtre est créée à la volée ; la vidéo est fabriquée sur l'appareil (montage.js).
const HTML = `
  <h2 id="montage-title">🎬 Ta vidéo souvenir</h2>
  <p id="montage-status" role="status">Préparation…</p>
  <div class="montage-stage">
    <canvas id="montage-canvas" aria-hidden="true"></canvas>
    <video id="montage-video" playsinline controls loop hidden></video>
  </div>
  <progress id="montage-progress" max="1" value="0"></progress>
  <div class="row" id="montage-actions" hidden>
    <button class="btn" type="button" id="montage-share" hidden>Partager</button>
    <a class="btn" id="montage-download" href="#">Télécharger</a>
  </div>
  <div class="montage-last" id="montage-last-box">
    <label for="montage-last">✍️ Un dernier mot pour finir la vidéo <span>(facultatif)</span></label>
    <input id="montage-last" type="text" maxlength="120" placeholder="Je t’aime, aujourd’hui et pour toujours">
  </div>
  <label class="montage-opt" id="montage-opt"><input type="checkbox" id="montage-music" checked> 🎵 Avec une musique douce (composée automatiquement, libre de droits)</label>
  <p class="montage-note">Tu peux aussi la remplacer par ta chanson dans TikTok, Instagram ou Snapchat. Fabriquée sur ton téléphone, rien n’est envoyé.</p>
  <div class="row"><button class="btn" type="button" id="montage-start">Créer la vidéo</button><button class="btn secondary" type="button" id="montage-close">Fermer</button></div>`;

let dlg = null;
let current = null;
let busy = false;
let url = null;
const q = (id) => dlg.querySelector(`#${id}`);

function ensureDialog() {
  if (dlg) return dlg;
  dlg = document.createElement('dialog');
  dlg.id = 'montage-dialog';
  dlg.className = 'montage';
  dlg.setAttribute('aria-labelledby', 'montage-title');
  dlg.innerHTML = HTML;
  document.body.append(dlg);
  q('montage-close').addEventListener('click', () => { if (!busy) dlg.close(); });
  dlg.addEventListener('cancel', (e) => { if (busy) e.preventDefault(); });
  q('montage-start').addEventListener('click', start);
  return dlg;
}

function reset() {
  q('montage-actions').hidden = true;
  q('montage-video').hidden = true;
  q('montage-canvas').hidden = false;
  q('montage-progress').value = 0;
  q('montage-start').hidden = false;
  q('montage-opt').hidden = false;
  q('montage-last-box').hidden = false;
  q('montage-status').textContent = 'Un petit film avec tes photos, ta lettre et vos souvenirs. Gratuit, à télécharger ou partager.';
}

async function start() {
  if (busy || !current) return;
  busy = true;
  q('montage-start').hidden = true;
  q('montage-opt').hidden = true;
  q('montage-last-box').hidden = true;
  q('montage-close').disabled = true;
  q('montage-status').textContent = 'Création du montage… garde cet écran ouvert.';
  let lock = null;
  try { lock = await navigator.wakeLock.request('screen'); } catch { /* facultatif */ }
  try {
    const { renderMontage } = await import('./montage.js');
    const { blob, ext, withMusic } = await renderMontage(current.content, current.photoUrl, q('montage-canvas'), {
      music: q('montage-music').checked,
      pace: 'pose',
      lastWord: q('montage-last').value,
      onProgress: (x) => { q('montage-progress').value = x; },
    });
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(blob);
    const video = q('montage-video');
    video.src = url; video.hidden = false; q('montage-canvas').hidden = true;
    video.play().catch(() => {});
    const name = `video-souvenir.${ext}`;
    const dl = q('montage-download');
    dl.href = url; dl.download = name;
    const file = new File([blob], name, { type: blob.type });
    const share = q('montage-share');
    share.hidden = !(navigator.canShare && navigator.canShare({ files: [file] }));
    share.onclick = () => navigator.share({ files: [file], title: 'Notre vidéo souvenir' }).catch(() => {});
    q('montage-actions').hidden = false;
    let msg = 'Ta vidéo est prête ! Télécharge-la ou partage-la directement.';
    if (!withMusic && q('montage-music').checked) msg += ' (Sans musique : ton navigateur ne l’a pas permis.)';
    if (ext !== 'mp4') msg += ' Format WebM : si une appli le refuse, télécharge-la puis importe-la.';
    q('montage-status').textContent = msg;
  } catch (err) {
    q('montage-status').textContent = err.message || 'La création de la vidéo a échoué.';
    q('montage-start').hidden = false;
    q('montage-last-box').hidden = false;
  } finally {
    busy = false;
    q('montage-close').disabled = false;
    if (lock) lock.release().catch(() => {});
  }
}

// Ouvre la fenêtre de création pour ce contenu.
export function openMontage(content, photoUrl) {
  ensureDialog();
  if (busy) { dlg.showModal(); return; }
  current = { content, photoUrl };
  reset();
  dlg.showModal();
}
