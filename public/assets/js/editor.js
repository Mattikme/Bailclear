import { OCCASIONS, THEMES, getOccasion } from './occasions.js';
import { musicEmbed, sha256Hex, normalizeAnswer, startFromUrl } from './render.js';
import { idbGet, idbSet, idbDel, listPages, rememberPage } from './storage.js';
import { isFreeLaunch, FREE_UNTIL_LABEL } from './launch.js';
import { LIMITS } from './limits.js';
import { inviteLink, inviteText } from './invite.js';

const FREE = isFreeLaunch();

const MAX_PHOTOS = 10;
const $ = (id) => document.getElementById(id);
const form = $('editor-form');
const params = new URLSearchParams(location.search);
const editId = params.get('edit');
const editToken = new URLSearchParams(location.hash.slice(1)).get('t');
const isEdit = Boolean(editId && editToken);

let state = blankState(params.get('occasion'));
let photoBlobs = [];
let photoUrls = [];
let serverStatus = null;
let dirty = false;
let voiceBlob = null;
let voiceUrl = null;
let voiceDirty = false;
let serverHadVoice = false;
let pendingOccasion = null;
let groupMessages = [];

function blankState(occId) {
  const occ = getOccasion(occId);
  return {
    occasion: occ.id, theme: occ.theme, to: '', from: '',
    title: occ.defaults.title, intro: occ.defaults.intro, date: '', dateLabel: occ.defaults.dateLabel,
    letter: '', photos: [], timeline: [], reasons: [], music: '', musicStart: 0, voice: null, openAt: '', quiz: [], group: false, finalMessage: occ.defaults.finalMessage,
    secret: { question: '', answer: '', answerHash: '' },
  };
}

/* ---------- Aperçu ---------- */
const iframe = $('preview-frame');
let previewReady = false;
window.addEventListener('message', (e) => {
  if (e.origin !== location.origin || !e.data) return;
  if (e.data.type === 'preview-ready') { previewReady = true; pushPreview(); }
});
let previewTimer;
function pushPreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    if (!previewReady) return;
    const content = { ...state, secret: null };
    iframe.contentWindow.postMessage({ type: 'preview', content, photoUrls, voiceUrl, messages: groupMessages.map(({ name, text }) => ({ name, text })) }, location.origin);
  }, 200);
}

/* ---------- Sauvegarde locale ---------- */
let saveTimer;
function changed() {
  dirty = true;
  pushPreview();
  if (isEdit) { setStatus('Modifications non enregistrées'); return; }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await idbSet('draft', { state, photos: photoBlobs, voice: voiceBlob, savedAt: Date.now() });
      setStatus('Brouillon enregistré sur cet appareil');
    } catch { setStatus('Brouillon non enregistré (stockage indisponible)'); }
  }, 400);
}
function setStatus(t) { $('save-status').textContent = t; }

/* ---------- Champs simples ---------- */
function bindFields() {
  form.querySelectorAll('[data-field]').forEach((input) => {
    const key = input.dataset.field;
    input.value = state[key] || '';
    input.oninput = () => {
      state[key] = input.value;
      if (key === 'music') { const t = startFromUrl(input.value); if (t) { state.musicStart = t; setStartFields(t); } checkMusic(); }
      updateCounters(); changed();
    };
  });
  setStartFields(state.musicStart);
  const readStart = () => {
    const m = Math.min(59, Math.max(0, parseInt($('f-musicMin').value, 10) || 0));
    const sec = Math.min(59, Math.max(0, parseInt($('f-musicSec').value, 10) || 0));
    state.musicStart = m * 60 + sec;
    changed();
  };
  $('f-musicMin').oninput = readStart;
  $('f-musicSec').oninput = readStart;
  $('f-question').value = state.secret.question || '';
  $('f-answer').value = state.secret.answer || '';
  $('f-question').oninput = (e) => { state.secret.question = e.target.value; changed(); };
  $('f-answer').oninput = (e) => { state.secret.answer = e.target.value; changed(); };
  if (isEdit && state.secret.answerHash) $('f-answer').placeholder = 'Réponse inchangée (laisse vide pour la garder)';
  updateCounters();
  checkMusic();
  attachCounters();
}
function setStartFields(total) {
  const t = Math.max(0, Math.floor(total || 0));
  $('f-musicMin').value = t ? String(Math.floor(t / 60)) : '';
  $('f-musicSec').value = t ? String(t % 60).padStart(2, '0') : '';
}
// Compteur « 45 / 90 » sous un champ, visible à partir de 60 % de la limite (toujours visible pour la lettre).
function counterFor(input) {
  if (!input || input.dataset.counted) return;
  input.dataset.counted = '1';
  const c = document.createElement('div');
  c.className = 'counter-hint';
  input.after(c);
  const upd = () => {
    const max = input.maxLength;
    const n = input.value.length;
    c.textContent = `${n} / ${max}`;
    c.hidden = input.id !== 'f-letter' && n < max * 0.6;
    c.classList.toggle('full', n >= max);
  };
  input.addEventListener('input', upd);
  upd();
}
function attachCounters() {
  form.querySelectorAll('input[type="text"], textarea').forEach((el) => { if (el.maxLength > 0 && el.id !== 'f-answer') counterFor(el); });
}

function updateCounters() {
  form.querySelectorAll('[data-count]').forEach((c) => {
    const input = $(c.dataset.count);
    c.textContent = `${input.value.length} / ${input.maxLength}`;
  });
}
function checkMusic() {
  const v = state.music.trim();
  const s = $('music-status');
  if (!v) s.textContent = '';
  else s.textContent = musicEmbed(v) ? '✓ Lien reconnu' : 'Lien non reconnu : colle un lien YouTube ou Spotify (morceau, album ou playlist).';
  const spotify = musicEmbed(v) && musicEmbed(v).provider === 'spotify';
  $('f-musicMin').disabled = Boolean(spotify);
  $('f-musicSec').disabled = Boolean(spotify);
  if (spotify) s.textContent += ' — avec Spotify, la musique démarre au début et la personne doit appuyer sur ▶.';
}

/* ---------- Occasion & thème ---------- */
function renderOccasions() {
  const box = $('occasion-chips');
  box.replaceChildren(...OCCASIONS.map((o) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip';
    b.textContent = `${o.emoji} ${o.label}`;
    b.setAttribute('aria-pressed', String(o.id === state.occasion));
    b.onclick = () => switchOccasion(o.id);
    return b;
  }));
  const sw = $('theme-swatches');
  sw.replaceChildren(...Object.entries(THEMES).map(([id, t]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'swatch';
    b.title = t.label; b.setAttribute('aria-label', `Thème ${t.label}`);
    b.style.background = `linear-gradient(135deg, ${t.bg} 0 50%, ${t.accent} 50% 100%)`;
    b.setAttribute('aria-pressed', String(id === state.theme));
    b.onclick = () => { state.theme = id; renderOccasions(); changed(); };
    return b;
  }));
  const occ = getOccasion(state.occasion);
  $('reasons-legend').textContent = `Liste « ${occ.reasonsTitle} »`;
  $('timeline-legend').textContent = `Frise « ${occ.timelineTitle} »`;
  renderIdeas();
}
function switchOccasion(id) {
  const prev = getOccasion(state.occasion).defaults;
  const next = getOccasion(id);
  for (const k of ['title', 'intro', 'dateLabel', 'finalMessage']) {
    if (!state[k] || state[k] === prev[k]) state[k] = next.defaults[k];
  }
  state.occasion = id;
  state.theme = next.theme;
  renderOccasions();
  bindFields();
  changed();
}
function renderIdeas() {
  const occ = getOccasion(state.occasion);
  const mk = (text, onClick) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'idea'; b.textContent = '+ ' + text; b.onclick = onClick; return b; };
  $('letter-ideas').replaceChildren(...occ.letterIdeas.map((t) => mk(t, () => {
    const ta = $('f-letter');
    ta.value = (ta.value ? ta.value.replace(/\s*$/, '\n\n') : '') + t;
    state.letter = ta.value; updateCounters(); changed(); ta.focus();
  })));
  $('reason-ideas').replaceChildren(...occ.reasonIdeas.map((t) => mk(t, () => {
    if (state.reasons.length >= LIMITS.reasons) return;
    state.reasons.push(t); renderReasons(); changed();
  })));
}

/* ---------- Listes ---------- */
function iconBtn(label, text, onClick) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'icon-btn'; b.textContent = text; b.title = label; b.setAttribute('aria-label', label);
  b.onclick = onClick;
  return b;
}
function move(arr, i, d) { const j = i + d; if (j < 0 || j >= arr.length) return false; [arr[i], arr[j]] = [arr[j], arr[i]]; return true; }

function renderReasons() {
  const box = $('reasons-list');
  box.replaceChildren(...state.reasons.map((r, i) => {
    const row = document.createElement('div'); row.className = 'list-item';
    const input = document.createElement('input'); input.type = 'text'; input.maxLength = LIMITS.reason; input.value = r;
    input.setAttribute('aria-label', `Élément ${i + 1}`);
    input.oninput = () => { state.reasons[i] = input.value; changed(); };
    row.append(input, iconBtn('Supprimer', '✕', () => { state.reasons.splice(i, 1); renderReasons(); changed(); }));
    return row;
  }));
  $('add-reason').disabled = state.reasons.length >= LIMITS.reasons;
  attachCounters();
}
function renderTimeline() {
  const box = $('timeline-list');
  box.replaceChildren(...state.timeline.map((t, i) => {
    const row = document.createElement('div'); row.className = 'tl-item';
    const when = document.createElement('input'); when.type = 'text'; when.maxLength = LIMITS.when; when.placeholder = 'Juin 2022'; when.value = t.when;
    when.setAttribute('aria-label', `Date du souvenir ${i + 1}`);
    const text = document.createElement('textarea'); text.maxLength = LIMITS.timelineText; text.rows = 2; text.placeholder = 'Ce qui s’est passé…'; text.value = t.text;
    text.setAttribute('aria-label', `Texte du souvenir ${i + 1}`);
    when.oninput = () => { state.timeline[i].when = when.value; changed(); };
    text.oninput = () => { state.timeline[i].text = text.value; changed(); };
    const btns = document.createElement('div'); btns.className = 'icon-btns';
    btns.append(
      iconBtn('Monter', '↑', () => { if (move(state.timeline, i, -1)) { renderTimeline(); changed(); } }),
      iconBtn('Supprimer', '✕', () => { state.timeline.splice(i, 1); renderTimeline(); changed(); }),
    );
    row.append(when, text, btns);
    return row;
  }));
  $('add-timeline').disabled = state.timeline.length >= LIMITS.timeline;
  attachCounters();
}

/* ---------- Quiz ---------- */
function renderQuiz() {
  const box = $('quiz-list');
  box.replaceChildren(...state.quiz.map((q, i) => {
    const row = document.createElement('div'); row.className = 'quiz-item';
    const qi = document.createElement('input'); qi.type = 'text'; qi.maxLength = LIMITS.quizQuestion; qi.value = q.q; qi.placeholder = 'Où s’est passé notre premier rendez-vous ?';
    qi.setAttribute('aria-label', `Question ${i + 1}`);
    qi.oninput = () => { q.q = qi.value; changed(); };
    const head = document.createElement('div'); head.className = 'quiz-head';
    head.append(qi, iconBtn('Supprimer la question', '✕', () => { state.quiz.splice(i, 1); renderQuiz(); changed(); }));
    const answers = document.createElement('div'); answers.className = 'quiz-answers-edit';
    q.answers.forEach((a, k) => {
      const line = document.createElement('label'); line.className = 'quiz-ans';
      const r = document.createElement('input'); r.type = 'radio'; r.name = `quiz-${i}`; r.checked = q.correct === k;
      r.title = 'Bonne réponse'; r.setAttribute('aria-label', `Réponse ${k + 1} est la bonne`);
      r.onchange = () => { q.correct = k; changed(); };
      const t = document.createElement('input'); t.type = 'text'; t.maxLength = LIMITS.quizAnswer; t.value = a; t.placeholder = k === 0 ? 'Au cinéma' : k === 1 ? 'Au restaurant' : 'Autre réponse';
      t.setAttribute('aria-label', `Réponse ${k + 1} de la question ${i + 1}`);
      t.oninput = () => { q.answers[k] = t.value; changed(); };
      line.append(r, t);
      answers.append(line);
    });
    if (q.answers.length < 4) {
      const more = document.createElement('button'); more.type = 'button'; more.className = 'linklike'; more.textContent = '+ une réponse';
      more.onclick = () => { q.answers.push(''); renderQuiz(); changed(); };
      answers.append(more);
    }
    const tip = document.createElement('p'); tip.className = 'help'; tip.textContent = 'Coche le rond de la bonne réponse.';
    row.append(head, answers, tip);
    return row;
  }));
  $('add-quiz').disabled = state.quiz.length >= LIMITS.quiz;
}

/* ---------- Carte de groupe ---------- */
function renderGroupList() {
  $('group-count').textContent = groupMessages.length ? `${groupMessages.length} message${groupMessages.length > 1 ? 's' : ''} reçu${groupMessages.length > 1 ? 's' : ''} :` : 'Aucun message pour l’instant. Partage le lien !';
  $('group-list').replaceChildren(...groupMessages.map((m) => {
    const li = document.createElement('li');
    const t = document.createElement('div');
    const b = document.createElement('strong'); b.textContent = m.name;
    t.append(b, document.createTextNode(` : ${m.text}`));
    li.append(t, iconBtn(`Retirer le message de ${m.name}`, '✕', async () => {
      if (!confirm(`Retirer le message de ${m.name} ?`)) return;
      try {
        await api(`/api/group/${editId}?m=${m.id}`, { method: 'DELETE' }, editToken);
        groupMessages = groupMessages.filter((x) => x.id !== m.id);
        renderGroupList(); pushPreview();
      } catch (e) { notice(e.message, 'error'); }
    }));
    return li;
  }));
}
async function setupGroup() {
  const box = $('f-group');
  box.checked = Boolean(state.group);
  box.onchange = () => { state.group = box.checked; $('group-admin').hidden = !(box.checked && isEdit && serverStatus === 'paid'); changed(); };
  if (!isEdit) return;
  try {
    const link = await inviteLink(editId, editToken);
    $('group-link').value = link;
    $('group-wa').href = `https://wa.me/?text=${encodeURIComponent(inviteText(state.to, state.from, link))}`;
    $('group-copy').onclick = async () => { try { await navigator.clipboard.writeText(link); $('group-copy').textContent = 'Copié ✓'; } catch { $('group-link').select(); } };
    const d = await api(`/api/group/${editId}`, { cache: 'no-store' }, editToken);
    groupMessages = d.messages || [];
    renderGroupList(); pushPreview();
  } catch { /* carte de groupe indisponible */ }
  $('group-admin').hidden = !(state.group && serverStatus === 'paid');
}

/* ---------- Ouverture programmée ---------- */
function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso); if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function renderOpenAt() {
  const input = $('f-openAt');
  input.value = toLocalInput(state.openAt);
  input.min = toLocalInput(new Date().toISOString());
  $('openat-clear').hidden = !state.openAt;
  const s = $('openat-status');
  if (!state.openAt) { s.textContent = ''; return; }
  const t = Date.parse(state.openAt);
  s.textContent = t <= Date.now()
    ? 'Cette date est passée : la page s’ouvrira tout de suite.'
    : `La page restera fermée jusqu’au ${new Date(t).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.`;
}
function setupOpenAt() {
  $('f-openAt').onchange = (e) => {
    const t = Date.parse(e.target.value);
    state.openAt = e.target.value && Number.isFinite(t) ? new Date(t).toISOString() : '';
    renderOpenAt(); changed();
  };
  $('openat-clear').onclick = () => { state.openAt = ''; renderOpenAt(); changed(); };
  renderOpenAt();
}

/* ---------- Photos ---------- */
async function compress(file) {
  let source;
  try {
    source = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    source = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('format'));
      img.src = URL.createObjectURL(file);
    });
  }
  const attempt = (max, quality) => new Promise((resolve) => {
    const w0 = source.width, h0 = source.height;
    const scale = Math.min(1, max / Math.max(w0, h0));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w0 * scale); canvas.height = Math.round(h0 * scale);
    canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(resolve, 'image/jpeg', quality);
  });
  let blob = await attempt(1600, 0.82);
  if (blob && blob.size > 850 * 1024) blob = await attempt(1280, 0.72);
  if (blob && blob.size > 850 * 1024) blob = await attempt(1024, 0.65);
  if (!blob) throw new Error('format');
  return blob;
}

async function addFiles(files) {
  const list = [...files].filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
  const room = MAX_PHOTOS - state.photos.length;
  if (list.length > room) notice(`Maximum ${MAX_PHOTOS} photos : seules les ${room} premières ont été ajoutées.`, 'error');
  for (const f of list.slice(0, room)) {
    try {
      $('photo-status').textContent = 'Préparation de la photo…';
      const blob = await compress(f);
      photoBlobs.push(blob);
      photoUrls.push(URL.createObjectURL(blob));
      state.photos.push({ caption: '' });
    } catch {
      notice(`Impossible de lire « ${f.name} ». Essaie une photo JPEG ou PNG (les photos HEIC d’iPhone s’ouvrent sur iPhone).`, 'error');
    }
  }
  $('photo-status').textContent = '';
  renderPhotos(); changed();
}

function renderPhotos() {
  const box = $('photo-list');
  box.replaceChildren(...state.photos.map((p, i) => {
    const row = document.createElement('div'); row.className = 'photo-item';
    const img = document.createElement('img'); img.src = photoUrls[i]; img.alt = '';
    const cap = document.createElement('input'); cap.type = 'text'; cap.maxLength = LIMITS.caption; cap.placeholder = 'Légende (facultatif)'; cap.value = p.caption;
    cap.setAttribute('aria-label', `Légende de la photo ${i + 1}`);
    cap.oninput = () => { state.photos[i].caption = cap.value; changed(); };
    const btns = document.createElement('div'); btns.className = 'icon-btns';
    const swap = (d) => { if (move(state.photos, i, d)) { move(photoBlobs, i, d); move(photoUrls, i, d); renderPhotos(); changed(); } };
    btns.append(
      iconBtn('Monter', '↑', () => swap(-1)),
      iconBtn('Descendre', '↓', () => swap(1)),
      iconBtn('Supprimer', '✕', () => { state.photos.splice(i, 1); photoBlobs.splice(i, 1); URL.revokeObjectURL(photoUrls[i]); photoUrls.splice(i, 1); renderPhotos(); changed(); }),
    );
    const mid = document.createElement('div'); mid.append(cap);
    row.append(img, mid, btns);
    return row;
  }));
  $('photo-count').textContent = `${state.photos.length} / ${MAX_PHOTOS}`;
  $('photo-input').disabled = state.photos.length >= MAX_PHOTOS;
  attachCounters();
}

function setupDropzone() {
  const dz = $('dropzone');
  $('photo-input').onchange = (e) => { addFiles(e.target.files); e.target.value = ''; };
  dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
  dz.addEventListener('drop', (e) => { e.preventDefault(); dz.classList.remove('drag'); addFiles(e.dataTransfer.files); });
}

/* ---------- Message vocal ---------- */
const MAX_VOICE = 120; // secondes
const MAX_VOICE_BYTES = 3 * 1024 * 1024;
const fmtSec = (x) => { const v = Math.max(0, Math.round(x || 0)); return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`; };
function voiceStatus(t, err = false) { const s = $('voice-status'); s.textContent = t; s.classList.toggle('error-text', err); }

function setVoiceBlob(blob, duration, markDirty = true) {
  if (voiceUrl) URL.revokeObjectURL(voiceUrl);
  voiceBlob = blob;
  voiceUrl = blob ? URL.createObjectURL(blob) : null;
  state.voice = blob ? { duration: Math.max(1, Math.min(MAX_VOICE, Math.round(duration))) } : null;
  if (markDirty) voiceDirty = true;
  renderVoice();
}
function renderVoice() {
  const has = Boolean(voiceBlob);
  $('voice-preview').hidden = !has;
  if (has) { $('voice-audio').src = voiceUrl; voiceStatus(`Message vocal de ${fmtSec(state.voice.duration)} prêt. Il apparaît sous la lettre.`); }
  $('voice-rec').textContent = has ? '● Réenregistrer' : '● Enregistrer';
}
function audioDuration(blob) {
  return new Promise((resolve) => {
    const a = new Audio();
    a.preload = 'metadata';
    a.onloadedmetadata = () => {
      if (Number.isFinite(a.duration)) return resolve(a.duration);
      // WebM enregistré : la durée n'est connue qu'après un saut à la fin
      a.currentTime = 1e7;
      a.ontimeupdate = () => { a.ontimeupdate = null; resolve(a.duration); };
    };
    a.onerror = () => resolve(0);
    a.src = URL.createObjectURL(blob);
  });
}

function setupVoice() {
  let rec = null;
  let stream = null;
  let timer = null;
  let t0 = 0;
  const stop = () => { if (rec && rec.state !== 'inactive') rec.stop(); };
  $('voice-rec').onclick = async () => {
    if (rec && rec.state === 'recording') return stop();
    if (!navigator.mediaDevices || !window.MediaRecorder) { voiceStatus('Ton navigateur ne permet pas d’enregistrer ici : importe plutôt un fichier audio (mémo vocal).', true); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      voiceStatus('Micro refusé : autorise le micro pour ce site dans ton navigateur, ou importe un mémo vocal.', true);
      return;
    }
    const type = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'].find((t) => MediaRecorder.isTypeSupported(t)) || '';
    rec = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 64000 } : undefined);
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      clearInterval(timer);
      stream.getTracks().forEach((tr) => tr.stop());
      $('voice-rec').classList.remove('recording');
      $('voice-timer').hidden = true;
      const secs = (Date.now() - t0) / 1000;
      const blob = new Blob(chunks, { type: (rec.mimeType || type || 'audio/webm').split(';')[0] });
      rec = null;
      if (secs < 1 || !blob.size) { voiceStatus('Enregistrement trop court, réessaie.', true); renderVoice(); return; }
      if (blob.size > MAX_VOICE_BYTES) { voiceStatus('Enregistrement trop lourd, fais plus court.', true); renderVoice(); return; }
      setVoiceBlob(blob, secs);
      changed();
    };
    rec.start(250);
    t0 = Date.now();
    $('voice-rec').textContent = '■ Arrêter';
    $('voice-rec').classList.add('recording');
    $('voice-timer').hidden = false;
    $('voice-timer').textContent = '0:00';
    voiceStatus(`Enregistrement en cours… (${fmtSec(MAX_VOICE)} maximum)`);
    timer = setInterval(() => {
      const s = (Date.now() - t0) / 1000;
      $('voice-timer').textContent = fmtSec(s);
      if (s >= MAX_VOICE) stop();
    }, 250);
  };
  $('voice-file').onchange = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('audio/') && !/\.(m4a|mp3|wav|ogg|webm|aac)$/i.test(f.name)) { voiceStatus('Ce fichier n’est pas un audio.', true); return; }
    if (f.size > MAX_VOICE_BYTES) { voiceStatus('Fichier trop lourd (3 Mo maximum, soit environ 2 minutes).', true); return; }
    const d = await audioDuration(f);
    if (!d) { voiceStatus('Impossible de lire ce fichier audio. Essaie un mémo vocal en .m4a ou .mp3.', true); return; }
    if (d > MAX_VOICE + 1) { voiceStatus(`Ce message dure ${fmtSec(d)} : 2 minutes maximum.`, true); return; }
    setVoiceBlob(f, d);
    changed();
  };
  $('voice-del').onclick = () => { setVoiceBlob(null, 0); voiceStatus('Message vocal supprimé.'); changed(); };
  renderVoice();
}

async function uploadVoice(id, token) {
  await api(`/api/audio/${id}`, { method: 'PUT', headers: { 'content-type': voiceBlob.type || 'audio/mp4' }, body: voiceBlob }, token);
}

/* ---------- Envoi ---------- */
function notice(text, kind = '') {
  const n = $('notice');
  n.textContent = text; n.className = `notice ${kind}`; n.hidden = !text;
  if (text) n.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function serverContent() {
  const { secret, ...rest } = state;
  let s = null;
  const q = secret.question.trim();
  if (q && secret.answer.trim()) s = { question: q, answerHash: await sha256Hex(normalizeAnswer(secret.answer)) };
  else if (q && secret.answerHash) s = { question: q, answerHash: secret.answerHash };
  return {
    ...rest,
    timeline: rest.timeline.filter((t) => t.when.trim() || t.text.trim()),
    reasons: rest.reasons.filter((r) => r.trim()),
    secret: s,
  };
}

function checkReady() {
  if (!state.to.trim()) { notice('Indique le prénom de la personne à qui tu offres la page.', 'error'); $('f-to').focus(); return false; }
  if (!state.title.trim()) { notice('Ajoute un titre.', 'error'); $('f-title').focus(); return false; }
  const badQuiz = state.quiz.findIndex((q) => (q.q.trim() || q.answers.some((a) => a.trim())) && (!q.q.trim() || q.answers.filter((a) => a.trim()).length < 2 || !(q.answers[q.correct] || '').trim()));
  if (badQuiz >= 0) { notice(`Quiz, question ${badQuiz + 1} : il faut une question, au moins 2 réponses et la bonne réponse cochée.`, 'error'); $('quiz-fieldset').scrollIntoView({ block: 'center' }); return false; }
  if (state.secret.question.trim() && !state.secret.answer.trim() && !state.secret.answerHash) { notice('Tu as écrit une question secrète sans réponse.', 'error'); $('f-answer').focus(); return false; }
  if (state.music.trim() && !musicEmbed(state.music.trim())) { notice('Le lien musique n’est pas reconnu.', 'error'); $('f-music').focus(); return false; }
  if (!state.letter.trim() && !state.photos.length) { notice('Ajoute au moins une lettre ou une photo : la page serait vide !', 'error'); return false; }
  return true;
}

async function api(path, opts = {}, token) {
  const headers = { ...(opts.headers || {}) };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(path, { ...opts, headers });
  let data = {};
  try { data = await res.json(); } catch { /* vide */ }
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
}

async function uploadPhotos(id, token, progress) {
  for (let n = 0; n < photoBlobs.length; n++) {
    progress(`Envoi des photos (${n + 1}/${photoBlobs.length})…`);
    await api(`/api/photos/${id}/${n}`, { method: 'PUT', headers: { 'content-type': photoBlobs[n].type || 'image/jpeg' }, body: photoBlobs[n] }, token);
  }
}

function setupPublish() {
  const dlg = $('publish-dialog');
  const confirmBtn = $('publish-confirm');
  const terms = $('c-terms'), waiver = $('c-waiver');
  if (FREE) {
    $('publish-btn').textContent = 'Publier gratuitement';
    confirmBtn.textContent = 'Publier ma page';
    waiver.closest('label').hidden = true;
    document.querySelectorAll('.pay-only').forEach((x) => { x.hidden = true; });
    $('free-info').hidden = false;
    $('free-info').querySelector('span').textContent = FREE_UNTIL_LABEL;
  }
  const sync = () => { confirmBtn.disabled = !(terms.checked && (FREE || waiver.checked)); };
  terms.onchange = sync; waiver.onchange = sync; sync();
  $('publish-cancel').onclick = () => dlg.close();

  $('publish-btn').onclick = async () => {
    notice('');
    if (!checkReady()) return;
    if (isEdit) return saveEdit();
    let owner = false;
    try { owner = localStorage.getItem('upt:owner') === '1'; } catch { /* stockage indisponible */ }
    const already = FREE && !owner && listPages().find((x) => x.free);
    if (already) {
      notice(`Offre de lancement : une page gratuite par personne, et tu as déjà créé la tienne (« ${already.title || 'ta page'} »). Tu peux la modifier autant que tu veux depuis « Tes pages » en haut de cette page. Les pages suivantes seront à 9,90 € à partir du 1er décembre.`, 'error');
      return;
    }
    dlg.showModal();
  };

  confirmBtn.onclick = async () => {
    const progress = (t) => { $('publish-progress').textContent = t; };
    confirmBtn.disabled = true;
    try {
      progress('Envoi de ta page…');
      const content = await serverContent();
      const created = await api('/api/pages', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content, consent: { terms: true, waiver: !FREE } }),
      });
      const { id, token } = created;
      rememberPage({ id, token, title: state.title, to: state.to, createdAt: Date.now(), free: Boolean(created.free) });
      await uploadPhotos(id, token, progress);
      if (voiceBlob) { progress('Envoi du message vocal…'); await uploadVoice(id, token); }
      if (created.free) { dirty = false; location.href = `/merci?id=${id}&session_id=gratuit`; return; }
      progress('Redirection vers le paiement sécurisé…');
      const { url } = await api('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) }, token);
      dirty = false;
      location.href = url;
    } catch (e) {
      progress('');
      confirmBtn.disabled = false;
      dlg.close();
      notice(`Oups : ${e.message}`, 'error');
    }
  };
}

async function saveEdit() {
  if (!checkReady()) return false;
  const btn = $('publish-btn');
  btn.disabled = true;
  try {
    setStatus('Enregistrement…');
    await api(`/api/pages/${editId}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: await serverContent() }) }, editToken);
    await uploadPhotos(editId, editToken, setStatus);
    if (voiceBlob && voiceDirty) { setStatus('Envoi du message vocal…'); await uploadVoice(editId, editToken); }
    if (!voiceBlob && serverHadVoice) { await api(`/api/audio/${editId}`, { method: 'DELETE' }, editToken); serverHadVoice = false; }
    voiceDirty = false;
    dirty = false;
    setStatus('Modifications enregistrées ✓');
    notice(serverStatus === 'paid' ? 'Modifications enregistrées. Elles peuvent mettre quelques minutes à apparaître sur la page.' : 'Modifications enregistrées.', 'ok');
    return true;
  } catch (e) {
    notice(`Oups : ${e.message}`, 'error');
    setStatus('Échec de l’enregistrement');
    return false;
  } finally { btn.disabled = false; }
}

async function loadEdit() {
  $('edit-banner').hidden = false;
  $('publish-btn').textContent = 'Enregistrer les modifications';
  try {
    const data = await api(`/api/pages/${editId}`, {}, editToken);
    if (!data.owner) throw new Error('Lien de modification invalide.');
    serverStatus = data.status;
    const c = data.content;
    state = { ...blankState(c.occasion), ...c, secret: { question: c.secret ? c.secret.question : '', answer: '', answerHash: c.secret ? c.secret.answerHash : '' } };
    $('view-link').href = `/p/${editId}`;
    $('view-link').hidden = data.status !== 'paid';
    if (data.status === 'draft') $('pay-btn').hidden = false;
    setStatus('Chargement des photos…');
    for (let n = 0; n < data.photoCount; n++) {
      const res = await fetch(`/api/photos/${editId}/${n}`, { headers: { authorization: `Bearer ${editToken}` }, cache: 'no-store' });
      if (!res.ok) throw new Error('Une photo n’a pas pu être chargée.');
      const blob = await res.blob();
      photoBlobs.push(blob); photoUrls.push(URL.createObjectURL(blob));
    }
    state.photos = state.photos.slice(0, photoBlobs.length);
    if (c.voice) {
      const res = await fetch(`/api/audio/${editId}`, { headers: { authorization: `Bearer ${editToken}` }, cache: 'no-store' });
      if (res.ok) { setVoiceBlob(await res.blob(), c.voice.duration, false); serverHadVoice = true; } else state.voice = null;
    }
    setStatus('Page chargée');
  } catch (e) {
    notice(e.message, 'error');
    $('publish-btn').disabled = true;
  }
  $('delete-btn').hidden = false;
  $('delete-btn').onclick = async () => {
    if (!confirm('Supprimer définitivement cette page et ses photos ? Le lien ne fonctionnera plus. Cette action est irréversible.')) return;
    try {
      await api(`/api/pages/${editId}`, { method: 'DELETE' }, editToken);
      dirty = false;
      location.href = '/creer?supprime=1';
    } catch (e) { notice(e.message, 'error'); }
  };
  $('pay-btn').onclick = async () => {
    try {
      if (!(await saveEdit())) return;
      const { url } = await api('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: editId }) }, editToken);
      location.href = url;
    } catch (e) { notice(e.message, 'error'); }
  };
}

async function loadDraft() {
  try {
    const d = await idbGet('draft');
    if (d && d.state) {
      state = { ...blankState(d.state.occasion), ...d.state };
      photoBlobs = d.photos || [];
      if (d.voice && d.state.voice) setVoiceBlob(d.voice, d.state.voice.duration, false); else state.voice = null;
      photoUrls = photoBlobs.map((b) => URL.createObjectURL(b));
      state.photos = state.photos.slice(0, photoBlobs.length);
      setStatus('Brouillon retrouvé sur cet appareil');
      $('reset-btn').hidden = false;
      notice('Ton brouillon précédent a été retrouvé. Tu peux continuer, ou cliquer sur « Recommencer à zéro » en bas du formulaire.');
      const wanted = params.get('occasion');
      if (wanted && wanted !== state.occasion) pendingOccasion = wanted;
    }
  } catch { /* stockage indisponible */ }
}

function renderMyPages() {
  const pages = listPages();
  if (!pages.length || isEdit) return;
  const box = $('my-pages');
  box.hidden = false;
  const ul = box.querySelector('ul');
  ul.replaceChildren(...pages.map((p) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `/creer?edit=${p.id}#t=${p.token}`;
    a.textContent = `${p.title || 'Page'} — pour ${p.to || '…'}`;
    li.append(a);
    return li;
  }));
}

function setupMisc() {
  form.addEventListener('submit', (e) => e.preventDefault());
  $('add-reason').onclick = () => { state.reasons.push(''); renderReasons(); changed(); $('reasons-list').querySelector('.list-item:last-child input').focus(); };
  $('add-quiz').onclick = () => { state.quiz.push({ q: '', answers: ['', ''], correct: 0 }); renderQuiz(); changed(); $('quiz-list').querySelector('.quiz-item:last-child input').focus(); };
  $('add-timeline').onclick = () => { state.timeline.push({ when: '', text: '' }); renderTimeline(); changed(); $('timeline-list').querySelector('.tl-item:last-child input').focus(); };
  $('preview-toggle').onclick = () => $('preview-pane').classList.add('open');
  $('close-preview').onclick = () => $('preview-pane').classList.remove('open');
  $('reset-btn').onclick = async () => {
    if (!confirm('Effacer ce brouillon et recommencer ?')) return;
    await idbDel('draft').catch(() => {});
    location.href = '/creer';
  };
  window.addEventListener('beforeunload', (e) => { if (dirty && isEdit) { e.preventDefault(); e.returnValue = ''; } });
  if (params.get('annule')) notice('Paiement annulé : ta page n’a pas été publiée et rien n’a été débité. Ton brouillon est toujours là.', '');
  if (params.get('supprime')) notice('Ta page a bien été supprimée.', 'ok');
}

async function init() {
  if (isEdit) await loadEdit(); else await loadDraft();
  renderOccasions(); bindFields(); renderPhotos(); renderTimeline(); renderReasons(); renderQuiz(); setupOpenAt(); setupGroup();
  if (pendingOccasion) switchOccasion(pendingOccasion);
  setupDropzone(); setupVoice(); setupPublish(); setupMisc(); renderMyPages();
  iframe.src = '/voir?preview=1';
  dirty = false;
}

init();
