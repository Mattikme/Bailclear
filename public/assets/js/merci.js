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

  $('copy-btn').onclick = async () => {
    try { await navigator.clipboard.writeText(url); $('copy-btn').textContent = 'Copié ✓'; } catch { $('page-url').select(); }
  };
  if (navigator.share) {
    $('share-btn').hidden = false;
    $('share-btn').onclick = () => navigator.share({ title: 'Une surprise pour toi 💌', url }).catch(() => {});
  }
  $('print-btn').onclick = () => window.print();
  $('download-qr').onclick = () => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `qr-code-${id}.svg`;
    a.click();
  };
}

main();
