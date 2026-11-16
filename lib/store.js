import { DRAFT_TTL_SECONDS, PUBLISHED_DAYS, REMOVED_TTL_SECONDS } from './config.js';
import { sha256Hex, safeEqual } from './crypto.js';

const nowS = () => Math.floor(Date.now() / 1000);
const pageKey = (id) => `page:${id}`;
const photoKey = (id, n) => `photo:${id}:${n}`;

function kv(env) {
  if (!env.PAGES_KV) throw new Error('Binding KV « PAGES_KV » manquant.');
  return env.PAGES_KV;
}

export async function getPage(env, id) {
  return kv(env).get(pageKey(id), { type: 'json' });
}

export async function savePage(env, page) {
  page.updatedAt = new Date().toISOString();
  const expiration = Math.max(page.expiresAt, nowS() + 120);
  await kv(env).put(pageKey(page.id), JSON.stringify(page), { expiration });
}

export function newDraft(id, tokenHash, content, consent) {
  const now = new Date().toISOString();
  return {
    id, status: 'draft', content, tokenHash, consent,
    photoCount: content.photos.length,
    createdAt: now, updatedAt: now, paidAt: null,
    expiresAt: nowS() + DRAFT_TTL_SECONDS,
  };
}

export async function checkToken(page, token) {
  if (!page || !token) return false;
  return safeEqual(await sha256Hex(token), page.tokenHash);
}

export async function putPhoto(env, page, n, bytes, type) {
  const expiration = Math.max(page.expiresAt, nowS() + 120);
  await kv(env).put(photoKey(page.id, n), bytes, { expiration, metadata: { type } });
}

export async function getPhoto(env, id, n) {
  return kv(env).getWithMetadata(photoKey(id, n), { type: 'arrayBuffer' });
}

export async function deletePhotosFrom(env, id, from, to) {
  for (let n = from; n < to; n++) await kv(env).delete(photoKey(id, n));
}

// Marque la page comme payée et prolonge la conservation de la page et des photos (idempotent).
export async function markPaid(env, page, sessionId) {
  if (page.status === 'paid') return page;
  if (page.status !== 'draft') return page;
  page.status = 'paid';
  page.paidAt = new Date().toISOString();
  page.stripeSessionId = sessionId;
  page.expiresAt = nowS() + PUBLISHED_DAYS * 86400;
  await savePage(env, page);
  for (let n = 0; n < page.photoCount; n++) {
    const { value, metadata } = await getPhoto(env, page.id, n);
    if (value) await putPhoto(env, page, n, value, metadata && metadata.type);
  }
  return page;
}

// Suppression par le propriétaire : on efface tout.
export async function deletePage(env, page) {
  await deletePhotosFrom(env, page.id, 0, page.photoCount);
  await kv(env).delete(pageKey(page.id));
}

// Retrait par modération : on efface le contenu mais on garde une trace minimale 30 jours.
export async function removePage(env, page, reason) {
  await deletePhotosFrom(env, page.id, 0, page.photoCount);
  const tomb = { id: page.id, status: 'removed', removedAt: new Date().toISOString(), reason, stripeSessionId: page.stripeSessionId || null, expiresAt: nowS() + REMOVED_TTL_SECONDS };
  await kv(env).put(pageKey(page.id), JSON.stringify(tomb), { expiration: tomb.expiresAt });
}

export function publicView(page) {
  const { content, photoCount, expiresAt } = page;
  return { id: page.id, status: page.status, content, photoCount, expiresAt };
}
