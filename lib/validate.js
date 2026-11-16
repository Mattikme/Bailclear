import { OCCASION_IDS, THEME_IDS } from '../public/assets/js/occasions.js';
import { MAX_PHOTOS } from './config.js';
import { musicEmbed } from '../public/assets/js/render.js';

// Limites de longueur (en caractères) des champs du contenu.
export const LIMITS = {
  to: 60, from: 60, title: 120, intro: 160, dateLabel: 40, letter: 5000,
  caption: 140, when: 40, timelineText: 300, timeline: 12, reason: 140, reasons: 20,
  music: 300, finalMessage: 600, question: 140,
};

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
  if (music && !musicEmbed(music)) throw new ValidationError('Lien musique non reconnu : utilise un lien YouTube ou Spotify.');

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
    photos, timeline, reasons, music,
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
