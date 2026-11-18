import { renderPage, burst, sha256Hex, normalizeAnswer, applyTheme, mountMusic } from './render.js';
import { getOccasion } from './occasions.js';
import { t, langOf, locale } from './i18n.js';

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

// Libellés fixes de voir.html dans la langue de la page.
function applyLabels(L) {
  document.documentElement.lang = L;
  if (L === 'fr') return;
  $('open-btn').textContent = t(L, 'open');
  const sb = document.querySelector('#secret-form button[type="submit"]'); if (sb) sb.textContent = t(L, 'openShort');
  const units = document.querySelectorAll('.cd-grid span');
  ['days', 'hours', 'min', 'sec'].forEach((k, i) => { if (units[i]) units[i].textContent = t(L, k); });
  const made = document.querySelector('#footer .made'); if (made) made.textContent = t(L, 'made');
  $('report-btn').textContent = t(L, 'report');
}

function envelope(content, onOpen) {
  const env = $('envelope');
  const occ = getOccasion(content.occasion);
  const L = langOf(content);
  applyLabels(L);
  $('env-title').textContent = content.from ? t(L, 'envFrom', { from: content.from, emoji: occ.emoji }) : t(L, 'envTo', { to: content.to, emoji: occ.emoji });
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
      else $('secret-error').textContent = t(L, 'secretWrong');
    });
  } else {
    $('open-btn').addEventListener('click', open);
  }
}

// Page à ouverture programmée : enveloppe fermée + compte à rebours, puis rechargement à l'heure dite.
function countdown(content, openAt) {
  const occ = getOccasion(content.occasion);
  const L = langOf(content);
  applyLabels(L);
  $('env-title').textContent = content.from ? t(L, 'envFrom', { from: content.from, emoji: occ.emoji }) : t(L, 'envTo', { to: content.to, emoji: occ.emoji });
  $('env-intro').textContent = content.intro || '';
  $('open-btn').hidden = true;
  $('envelope').hidden = false;
  $('envelope').classList.add('locked');
  main.replaceChildren();
  const target = Date.parse(openAt);
  const when = new Date(target).toLocaleString(locale(L), { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  $('cd-label').textContent = t(L, 'countdown', { when });
  $('countdown').hidden = false;
  const tick = () => {
    const left = Math.max(0, target - Date.now());
    const s = Math.floor(left / 1000);
    $('cd-d').textContent = String(Math.floor(s / 86400));
    $('cd-h').textContent = String(Math.floor((s % 86400) / 3600)).padStart(2, '0');
    $('cd-m').textContent = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    $('cd-s').textContent = String(s % 60).padStart(2, '0');
    if (left <= 0) { clearInterval(timer); setTimeout(() => location.reload(), 1500); }
  };
  const timer = setInterval(tick, 1000);
  tick();
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
  if (data.locked) return { locked: true, openAt: data.openAt, content: data.content };
  const v = encodeURIComponent(data.updatedAt || '');
  return { content: data.content, messages: data.messages || [], photoUrl: (n) => `/api/photos/${id}/${n}?v=${v}`, voiceUrl: data.content.voice ? `/api/audio/${id}?v=${v}` : null };
}

function setupMontage(content, photoUrl) {
  const L = langOf(content);
  const block = document.createElement('section');
  block.className = 'block share-block';
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'btn';
  btn.textContent = t(L, 'video');
  const p = document.createElement('p');
  p.className = 'hint';
  p.textContent = t(L, 'videoHint');
  block.append(btn, p);
  if (content.photos && content.photos.length) {
    const wp = document.createElement('button');
    wp.type = 'button'; wp.className = 'btn secondary';
    wp.textContent = t(L, 'wp');
    wp.addEventListener('click', async () => { const { openWallpaper } = await import('./wallpaper-ui.js'); openWallpaper(content, photoUrl); });
    const p2 = document.createElement('p');
    p2.className = 'hint';
    p2.textContent = t(L, 'wpHint');
    block.append(wp, p2);
  }
  main.append(block);
  btn.addEventListener('click', async () => {
    const { openMontage } = await import('./montage-ui.js');
    openMontage(content, photoUrl);
  });
}

async function main_() {
  // Mode aperçu : l'éditeur (même origine) envoie le contenu par postMessage.
  if (params.get('preview') === '1') {
    window.addEventListener('message', (e) => {
      if (e.origin !== location.origin || !e.data || e.data.type !== 'preview') return;
      const { content, photoUrls, voiceUrl, messages } = e.data;
      renderPage(main, content, { photoUrl: (n) => photoUrls[n], preview: true, voiceUrl, messages });
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
    const loaded = await loadPublished(id);
    if (loaded.locked) { applyTheme(loaded.content.theme); countdown(loaded.content, loaded.openAt); $('footer').hidden = false; setupReport(id); return; }
    const { content, photoUrl, voiceUrl, messages } = loaded;
    applyTheme(content.theme);
    envelope(content, () => {});
    renderPage(main, content, { photoUrl, voiceUrl, messages });
    setupMontage(content, photoUrl);
    $('footer').hidden = false;
    setupReport(id);
  } catch (err) {
    if (err.code === 410) showState('Page retirée', 'Cette page n’est plus disponible.');
    else showState('Page introuvable', 'Ce lien n’existe pas, a expiré, ou la page n’est pas encore publiée.');
  }
}

main_();
