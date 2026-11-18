// Carte de groupe : accès au Durable Object « Guestbook » de la page, et clé d'invitation.
import { sha256Hex, safeEqual } from './crypto.js';

export const GROUP_MAX = 50;
export const GROUP_NAME_MAX = 40;
export const GROUP_TEXT_MAX = 300;

function stub(env, id) {
  return env && env.GUESTBOOK ? env.GUESTBOOK.get(env.GUESTBOOK.idFromName(id)) : null;
}

// La clé d'invitation dérive de l'empreinte du jeton du créateur : rien à stocker, et le créateur la recalcule
// dans son navigateur (sha256(sha256(jeton) + ':invite')). Elle ne permet pas de modifier la page.
export async function inviteKey(page) {
  return (await sha256Hex(`${page.tokenHash}:invite`)).slice(0, 24);
}
export async function checkInvite(page, key) {
  if (!page || typeof key !== 'string' || key.length !== 24) return false;
  return safeEqual(key, await inviteKey(page));
}

export async function listMessages(env, id) {
  const s = stub(env, id);
  if (!s) return [];
  try { return await s.list(); } catch (e) { console.error('guestbook', e); return []; }
}
export async function countMessages(env, id) {
  const s = stub(env, id);
  return s ? s.count() : 0;
}
export async function addMessage(env, page, msg) {
  const s = stub(env, page.id);
  if (!s) throw new Error('Carte de groupe indisponible.');
  return s.add(msg, GROUP_MAX, page.expiresAt * 1000);
}
export async function removeMessage(env, id, mid) {
  const s = stub(env, id);
  if (s) await s.remove(mid);
}
export async function purgeMessages(env, id) {
  const s = stub(env, id);
  if (!s) return;
  try { await s.purge(); } catch (e) { console.error('guestbook purge', e); }
}
