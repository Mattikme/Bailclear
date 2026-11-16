import { renderPage, burst, sha256Hex, normalizeAnswer, applyTheme, mountMusic } from './render.js';
import { getOccasion } from './occasions.js';

const $ = (id) => document.getElementById(id);
const main = $('page');
const params = new URLSearchParams(location.search);

function showState(title, text) {
  main.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'state';
  const h = document.createElement('h1');
  h.textContent = title;
  const p = document.createElement('p');
  p.textContent = text;
  const a = document.createElement('a');
  a.className = 'btn';
  a.href = '/';
  a.textContent = 'Découvrir Une page pour toi';
  box.append(h, p, a);
  main.append(box);
}

function envelope(content, onOpen) {
  const env = $('envelope');
  const occ = getOccasion(content.occasion);
  $('env-title').textContent = content.from ? `${content.from} t’a préparé quelque chose ${occ.emoji}` : `Une surprise pour ${content.to} ${occ.emoji}`;
  $('env-intro').textContent = content.intro || '';
  env.hidden = false;
  const open = () => {
    env.classList.add('gone');
    document.body.classList.add('opened');
    const music = mountMusic(content); // lecteur déjà préchargé par renderPage
    if (music) music.play(); // dans le geste « Ouvrir » : le navigateur autorise le son
    onOpen();
    burst(document.body, occ.id === 'noel' ? '❄' : occ.id === 'anniversaire' ? '✦' : '♥');
    setTimeout(() => { env.hidden = true; }, 800);
  };
  if (content.secret && content.secret.question) {
    $('open-btn').hidden = true;
    const form = $('secret-form');
    form.hidden = false;
    $('secret-question').textContent = content.secret.question;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const h = await sha256Hex(normalizeAnswer($('secret-answer').value));
      if (h === content.secret.answerHash) open();
      else $('secret-error').textContent = 'Ce n’est pas ça… essaie encore 😉';
    });
  } else {
    $('open-btn').addEventListener('click', open);
  }
}

function setupReport(id) {
  const dlg = $('report-dialog');
  $('report-btn').addEventListener('click', () => dlg.showModal());
  $('report-cancel').addEventListener('click', () => dlg.close());
  $('report-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = $('report-status');
    status.textContent = 'Envoi…';
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, reason: $('report-reason').value, details: $('report-details').value, name: $('report-name').value, email: $('report-email').value, goodFaith: $('report-goodfaith').checked }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      status.textContent = 'Merci, ton signalement a bien été reçu. Il sera examiné rapidement.';
      setTimeout(() => dlg.close(), 1800);
    } catch (err) {
      status.textContent = err.message;
    }
  });
}

async function loadPublished(id) {
  if (id === 'demo') {
    const content = await (await fetch('/assets/demo/demo.json')).json();
    return { content, photoUrl: (n) => `/assets/demo/photo-${n + 1}.svg` };
  }
  const res = await fetch(`/api/pages/${encodeURIComponent(id)}`);
  if (res.status === 410) throw Object.assign(new Error('removed'), { code: 410 });
  if (!res.ok) throw Object.assign(new Error('notfound'), { code: 404 });
  const data = await res.json();
  const v = encodeURIComponent(data.updatedAt || '');
  return { content: data.content, photoUrl: (n) => `/api/photos/${id}/${n}?v=${v}` };
}

function setupMontage(content, photoUrl) {
  const block = document.createElement('section');
  block.className = 'block share-block';
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'btn';
  btn.textContent = '🎬 Créer la vidéo souvenir';
  const p = document.createElement('p');
  p.className = 'hint';
  p.textContent = 'Un petit film de cette page (environ 30 s) à télécharger ou à partager sur TikTok, Instagram, Snapchat…';
  block.append(btn, p);
  main.append(block);

  const dlg = $('montage-dialog');
  let busy = false;
  let url = null;
  $('montage-close').addEventListener('click', () => { if (!busy) dlg.close(); });
  dlg.addEventListener('cancel', (e) => { if (busy) e.preventDefault(); });
  const reset = () => {
    $('montage-actions').hidden = true;
    $('montage-video').hidden = true;
    $('montage-canvas').hidden = false;
    $('montage-progress').value = 0;
    $('montage-start').hidden = false;
    $('montage-opt').hidden = false;
    $('montage-pace').hidden = false;
    $('montage-status').textContent = 'Un petit film avec tes photos, ta lettre et vos souvenirs.';
  };
  btn.addEventListener('click', () => { if (!busy) { reset(); dlg.showModal(); } });
  $('montage-start').addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    $('montage-start').hidden = true;
    $('montage-opt').hidden = true;
    $('montage-pace').hidden = true;
    $('montage-close').disabled = true;
    $('montage-status').textContent = 'Création du montage… garde cet écran ouvert.';
    let lock = null;
    try { lock = await navigator.wakeLock.request('screen'); } catch { /* facultatif */ }
    try {
      const { renderMontage } = await import('./montage.js');
      const { blob, ext, withMusic } = await renderMontage(content, photoUrl, $('montage-canvas'), {
        music: $('montage-music').checked,
        pace: (document.querySelector('input[name="pace"]:checked') || {}).value || 'pose',
        onProgress: (x) => { $('montage-progress').value = x; },
      });
      if (url) URL.revokeObjectURL(url);
      url = URL.createObjectURL(blob);
      const video = $('montage-video');
      video.src = url; video.hidden = false; $('montage-canvas').hidden = true;
      video.play().catch(() => {});
      const name = `video-souvenir.${ext}`;
      const dl = $('montage-download');
      dl.href = url; dl.download = name;
      const file = new File([blob], name, { type: blob.type });
      const share = $('montage-share');
      share.hidden = !(navigator.canShare && navigator.canShare({ files: [file] }));
      share.onclick = () => navigator.share({ files: [file], title: 'Notre vidéo souvenir' }).catch(() => {});
      $('montage-actions').hidden = false;
      let msg = 'Ta vidéo est prête !';
      if (!withMusic && $('montage-music').checked) msg += ' (Sans musique : ton navigateur ne l’a pas permis.)';
      if (ext !== 'mp4') msg += ' Format WebM : si une appli le refuse, télécharge-la puis importe-la.';
      $('montage-status').textContent = msg;
    } catch (err) {
      $('montage-status').textContent = err.message || 'La création de la vidéo a échoué.';
      $('montage-start').hidden = false;
    } finally {
      busy = false;
      $('montage-close').disabled = false;
      if (lock) lock.release().catch(() => {});
    }
  });
}

async function main_() {
  // Mode aperçu : l'éditeur (même origine) envoie le contenu par postMessage.
  if (params.get('preview') === '1') {
    window.addEventListener('message', (e) => {
      if (e.origin !== location.origin || !e.data || e.data.type !== 'preview') return;
      const { content, photoUrls } = e.data;
      renderPage(main, content, { photoUrl: (n) => photoUrls[n], preview: true });
      $('footer').hidden = false;
      $('report-btn').hidden = true;
    });
    window.parent.postMessage({ type: 'preview-ready' }, location.origin);
    return;
  }

  const m = /^\/p\/([A-Za-z0-9]{4,12})\/?$/.exec(location.pathname);
  const id = m ? m[1] : params.get('id');
  if (!id) return showState('Page introuvable', 'Le lien semble incomplet.');
  try {
    const { content, photoUrl } = await loadPublished(id);
    applyTheme(content.theme);
    envelope(content, () => {});
    renderPage(main, content, { photoUrl });
    setupMontage(content, photoUrl);
    $('footer').hidden = false;
    setupReport(id);
  } catch (err) {
    if (err.code === 410) showState('Page retirée', 'Cette page n’est plus disponible.');
    else showState('Page introuvable', 'Ce lien n’existe pas, a expiré, ou la page n’est pas encore publiée.');
  }
}

main_();
