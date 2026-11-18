import { OCCASION_IDS, THEME_IDS } from '../public/assets/js/occasions.js';
import { MAX_PHOTOS } from './config.js';
import { musicEmbed } from '../public/assets/js/render.js';

import { LIMITS } from '../public/assets/js/limits.js';
export { LIMITS };

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g;

function str(value, max, { multiline = false } = {}) {
  if (value == null) return '';
  if (typeof value !== 'string') throw new ValidationError('Champ texte invalide.');
  let s = value.replace(/\r\n?/g, '\n').replace(CONTROL, '');
  if (!multiline) s = s.replace(/\n+/g, ' ');
  s = s.trim();
  if (s.length > max) throw new ValidationError(`Un texte dépasse ${max} caractères.`);
  return s;
}

export class ValidationError extends Error {}

export const MAX_VOICE_SECONDS = 120;
export const MAX_AUDIO_BYTES = 3 * 1024 * 1024;

export { musicEmbed };

export function validateContent(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ValidationError('Contenu manquant.');
  const occasion = OCCASION_IDS.includes(input.occasion) ? input.occasion : OCCASION_IDS[0];
  const theme = THEME_IDS.includes(input.theme) ? input.theme : 'rose';

  const date = typeof input.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.date) && !Number.isNaN(Date.parse(input.date)) ? input.date : '';

  const photosIn = Array.isArray(input.photos) ? input.photos : [];
  if (photosIn.length > MAX_PHOTOS) throw new ValidationError(`${MAX_PHOTOS} photos maximum.`);
  const photos = photosIn.map((p) => ({ caption: str(p && p.caption, LIMITS.caption) }));

  const timelineIn = Array.isArray(input.timeline) ? input.timeline : [];
  if (timelineIn.length > LIMITS.timeline) throw new ValidationError(`${LIMITS.timeline} souvenirs maximum.`);
  const timeline = timelineIn
    .map((t) => ({ when: str(t && t.when, LIMITS.when), text: str(t && t.text, LIMITS.timelineText, { multiline: true }) }))
    .filter((t) => t.when || t.text);

  const reasonsIn = Array.isArray(input.reasons) ? input.reasons : [];
  if (reasonsIn.length > LIMITS.reasons) throw new ValidationError(`${LIMITS.reasons} éléments maximum dans la liste.`);
  const reasons = reasonsIn.map((r) => str(r, LIMITS.reason)).filter(Boolean);

  const music = str(input.music, LIMITS.music);
  const startN = Number(input.musicStart);
  const musicStart = music && Number.isInteger(startN) && startN > 0 && startN < 36000 ? startN : 0;
  if (music && !musicEmbed(music)) throw new ValidationError('Lien musique non reconnu : utilise un lien YouTube ou Spotify.');

  const vIn = input.voice && typeof input.voice === 'object' ? input.voice : null;
  const vd = vIn ? Math.round(Number(vIn.duration)) : 0;
  const voice = vIn && vd >= 1 && vd <= MAX_VOICE_SECONDS ? { duration: vd } : null;

  // Ouverture programmée : date ISO (UTC) entre hier et dans 400 jours.
  let openAt = '';
  if (typeof input.openAt === 'string' && input.openAt) {
    const t = Date.parse(input.openAt);
    if (Number.isFinite(t) && t > Date.now() - 2 * 86400000 && t < Date.now() + 400 * 86400000) openAt = new Date(t).toISOString();
  }

  // Quiz : 5 questions max, 2 à 4 réponses, une bonne réponse.
  const quizIn = Array.isArray(input.quiz) ? input.quiz.slice(0, LIMITS.quiz) : [];
  const quiz = [];
  for (const q of quizIn) {
    if (!q || typeof q !== 'object') continue;
    const question = str(q.q, LIMITS.quizQuestion);
    const raw = Array.isArray(q.answers) ? q.answers.slice(0, 4) : [];
    const answers = raw.map((a) => str(a, LIMITS.quizAnswer));
    const correctText = answers[Number(q.correct)] || '';
    const kept = answers.filter(Boolean);
    if (!question || kept.length < 2 || !correctText) continue;
    quiz.push({ q: question, answers: kept, correct: kept.indexOf(correctText) });
  }

  const secretIn = input.secret && typeof input.secret === 'object' ? input.secret : {};
  const question = str(secretIn.question, LIMITS.question);
  const answerHash = typeof secretIn.answerHash === 'string' && /^[a-f0-9]{64}$/.test(secretIn.answerHash) ? secretIn.answerHash : '';
  const secret = question && answerHash ? { question, answerHash } : null;

  const content = {
    occasion, theme,
    to: str(input.to, LIMITS.to),
    from: str(input.from, LIMITS.from),
    title: str(input.title, LIMITS.title),
    intro: str(input.intro, LIMITS.intro),
    date,
    dateLabel: str(input.dateLabel, LIMITS.dateLabel),
    letter: str(input.letter, LIMITS.letter, { multiline: true }),
    photos, timeline, reasons, music, musicStart, voice, openAt, quiz,
    group: input.group === true,
    finalMessage: str(input.finalMessage, LIMITS.finalMessage, { multiline: true }),
    secret,
  };
  if (!content.to) throw new ValidationError('Indique le prénom de la personne à qui tu offres la page.');
  if (!content.title) throw new ValidationError('Ajoute un titre.');
  return content;
}

// Vérifie la signature binaire d'une image (JPEG, PNG, WebP).
export function imageType(bytes) {
  const b = new Uint8Array(bytes.slice ? bytes.slice(0, 12) : bytes);
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  return null;
}

// Vérifie la signature binaire d'un fichier audio (WebM, Ogg, MP4/M4A, MP3, WAV).
export function audioType(bytes) {
  const b = new Uint8Array(bytes.slice ? bytes.slice(0, 12) : bytes);
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return 'audio/webm';
  if (b[0] === 0x4f && b[1] === 0x67 && b[2] === 0x67 && b[3] === 0x53) return 'audio/ogg';
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) return 'audio/mp4';
  if ((b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return 'audio/mpeg';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x41) return 'audio/wav';
  return null;
}
