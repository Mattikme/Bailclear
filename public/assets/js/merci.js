import { findPage, idbDel } from './storage.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const id = params.get('id') || '';
const sessionId = params.get('session_id') || '';

function qrSvg(text) {
  /* global qrcode */
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
}

async function confirm() {
  if (sessionId === 'gratuit') {
    const res = await fetch(`/api/pages/${encodeURIComponent(id)}`);
    if (res.ok) return true;
    throw new Error('Page introuvable.');
  }
  for (let i = 0; i < 12; i++) {
    const res = await fetch(`/api/confirm?id=${encodeURIComponent(id)}&session_id=${encodeURIComponent(sessionId)}`);
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.status === 'paid') return true;
    if (res.status !== 202) throw new Error(data.error || 'Paiement introuvable.');
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error('Le paiement est encore en cours de validation. Recharge cette page dans une minute.');
}

async function main() {
  if (!/^[A-Za-z0-9]{12}$/.test(id) || !sessionId) {
    $('status').textContent = 'Lien incomplet.';
    return;
  }
  try {
    await confirm();
  } catch (e) {
    $('status').textContent = e.message;
    $('status').className = 'notice error';
    return;
  }
  idbDel('draft').catch(() => {});
  const url = `${location.origin}/p/${id}`;
  $('status').hidden = true;
  $('done').hidden = false;
  $('page-url').value = url;
  $('open-link').href = `/p/${id}`;
  const svg = qrSvg(url);
  $('qr').innerHTML = svg;
  $('card-qr').innerHTML = svg;

  const mine = findPage(id);
  if (mine) {
    const edit = `${location.origin}/creer?edit=${id}#t=${mine.token}`;
    $('edit-link').textContent = edit;
    $('edit-link').href = edit;
    $('edit-box').hidden = false;
    $('card-to').textContent = `Pour ${mine.to || 'toi'}`;
  }

  setupSend(url, mine);

  $('copy-btn').onclick = async () => {
    try { await navigator.clipboard.writeText(url); $('copy-btn').textContent = 'Copié ✓'; } catch { $('page-url').select(); }
  };
  $('print-btn').onclick = () => window.print();
  $('download-qr').onclick = () => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `qr-code-${id}.svg`;
    a.click();
  };
}

// Vidéo souvenir directement depuis la page de confirmation (gratuite).
function setupVideo(data) {
  const box = $('video-box');
  if (!box) return;
  box.hidden = false;
  const v = encodeURIComponent(data.updatedAt || '');
  const photoUrl = (n) => `/api/photos/${id}/${n}?v=${v}`;
  $('video-btn').onclick = async () => {
    const { openMontage } = await import('./montage-ui.js');
    openMontage(data.content, photoUrl);
  };
}

async function setupSend(url, mine) {
  if (sessionId === 'gratuit') $('invoice-note').hidden = true;
  let to = (mine && mine.to) || '';
  let from = '';
  try {
    const res = await fetch(`/api/pages/${encodeURIComponent(id)}`);
    if (res.ok) {
      const d = await res.json();
      to = d.content.to || to; from = d.content.from || '';
      setupVideo(d);
    }
  } catch { /* hors ligne */ }
  const sig = from ? `\n— ${from}` : '';
  const TEMPLATES = {
    mystere: () => `${to ? `${to}, j’ai` : 'J’ai'} préparé quelque chose rien que pour toi… 💌\nOuvre-le quand tu seras tranquille :\n${url}${sig}`,
    tendre: () => `Pour toi${to ? ` ${to}` : ''} ❤️\nJ’ai mis dans cette page tout ce que je ne te dis pas assez.\n${url}${sig}`,
    complice: () => `Psst${to ? ` ${to}` : ''} 👀 J’ai un petit truc pour toi. Interdiction de spoiler !\n${url}${sig}`,
    lien: () => url,
  };
  const msg = $('send-msg');
  const update = () => {
    const text = msg.value;
    $('send-wa').href = `https://wa.me/?text=${encodeURIComponent(text)}`;
    $('send-sms').href = `sms:?&body=${encodeURIComponent(text)}`;
    $('send-mail').href = `mailto:?subject=${encodeURIComponent('Une surprise pour toi 💌')}&body=${encodeURIComponent(text)}`;
  };
  const choose = (style) => {
    document.querySelectorAll('#msg-styles .chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.style === style)));
    msg.value = TEMPLATES[style]();
    update();
  };
  document.querySelectorAll('#msg-styles .chip').forEach((c) => { c.onclick = () => choose(c.dataset.style); });
  msg.oninput = update;
  choose('mystere');
  $('send-copy').onclick = async () => {
    try { await navigator.clipboard.writeText(msg.value); $('send-copy').textContent = 'Copié ✓'; setTimeout(() => { $('send-copy').textContent = 'Copier le message'; }, 2000); }
    catch { msg.select(); }
  };
  if (navigator.share) {
    $('share-btn').hidden = false;
    $('share-btn').onclick = () => navigator.share({ text: msg.value }).catch(() => {});
  }
}

main();
