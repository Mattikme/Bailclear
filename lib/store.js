import { DRAFT_TTL_SECONDS, LOG_TTL_SECONDS, PROOF_TTL_SECONDS, PUBLISHED_DAYS, REMOVED_TTL_SECONDS } from './config.js';
import { sha256Hex, safeEqual } from './crypto.js';

const nowS = () => Math.floor(Date.now() / 1000);
const pageKey = (id) => `page:${id}`;
const photoKey = (id, n) => `photo:${id}:${n}`;

function kv(env) {
  if (!env.PAGES_KV) throw new Error('Binding KV « PAGES_KV » manquant.');
  return env.PAGES_KV;
}

// KV limite à 1 écriture/seconde par clé : on réessaie en cas de 429.
async function put(env, key, value, opts) {
  for (let i = 0; ; i++) {
    try {
      return await kv(env).put(key, value, opts);
    } catch (e) {
      if (i >= 3 || !/429|too many/i.test(String(e && e.message))) throw e;
      await new Promise((r) => setTimeout(r, 1100 * (i + 1)));
    }
  }
}

export async function getPage(env, id) {
  return kv(env).get(pageKey(id), { type: 'json' });
}

export async function savePage(env, page) {
  page.updatedAt = new Date().toISOString();
  const expiration = Math.max(page.expiresAt, nowS() + 120);
  await put(env, pageKey(page.id), JSON.stringify(page), { expiration });
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
  await put(env, photoKey(page.id, n), bytes, { expiration, metadata: { type } });
}

export async function getPhoto(env, id, n) {
  return kv(env).getWithMetadata(photoKey(id, n), { type: 'arrayBuffer' });
}

// Message vocal (un seul par page), même durée de conservation que la page.
const audioKey = (id) => `audio:${id}`;
export async function putAudio(env, page, bytes, type) {
  const expiration = Math.max(page.expiresAt, nowS() + 120);
  await put(env, audioKey(page.id), bytes, { expiration, metadata: { type } });
}
export async function getAudio(env, id) {
  return kv(env).getWithMetadata(audioKey(id), { type: 'arrayBuffer' });
}
export async function deleteAudio(env, id) {
  await kv(env).delete(audioKey(id));
}

export async function deletePhotosFrom(env, id, from, to) {
  for (let n = from; n < to; n++) await kv(env).delete(photoKey(id, n));
}

// Marque la page comme payée et prolonge la conservation de la page et des photos (idempotent).
export async function markPaid(env, page, sessionId) {
  if (page.status !== 'draft') return page;
  const expiresAt = nowS() + PUBLISHED_DAYS * 86400;
  // 1) Prolonger d'abord les photos : si cela échoue, la page reste « draft » et un nouvel appel recommencera.
  for (let n = 0; n < page.photoCount; n++) {
    const { value, metadata } = await getPhoto(env, page.id, n);
    if (value) await putPhoto(env, { ...page, expiresAt }, n, value, metadata && metadata.type);
  }
  if (page.content && page.content.voice) {
    const { value, metadata } = await getAudio(env, page.id);
    if (value) await putAudio(env, { ...page, expiresAt }, value, metadata && metadata.type);
  }
  // 2) Publier.
  page.status = 'paid';
  page.paidAt = new Date().toISOString();
  page.stripeSessionId = sessionId;
  page.expiresAt = expiresAt;
  await savePage(env, page);
  // 3) Preuve de commande sans contenu, conservée 5 ans même si la page est supprimée.
  const proof = { id: page.id, paidAt: page.paidAt, stripeSessionId: sessionId, consent: page.consent };
  await put(env, `proof:${page.id}`, JSON.stringify(proof), { expirationTtl: PROOF_TTL_SECONDS });
  return page;
}

// Suppression par le propriétaire : on efface tout.
export async function deletePage(env, page) {
  await deletePhotosFrom(env, page.id, 0, page.photoCount);
  await deleteAudio(env, page.id);
  await kv(env).delete(pageKey(page.id));
}

// Retrait par modération : on efface le contenu mais on garde une trace minimale 30 jours.
export async function removePage(env, page, reason) {
  await deletePhotosFrom(env, page.id, 0, page.photoCount);
  await deleteAudio(env, page.id);
  const tomb = { id: page.id, status: 'removed', removedAt: new Date().toISOString(), reason, stripeSessionId: page.stripeSessionId || null, expiresAt: nowS() + REMOVED_TTL_SECONDS };
  await put(env, pageKey(page.id), JSON.stringify(tomb), { expiration: tomb.expiresAt });
}

export function publicView(page) {
  const { content, photoCount, expiresAt } = page;
  return { id: page.id, status: page.status, content, photoCount, expiresAt };
}

// Données d'identification des créateurs de contenu (LCEN art. 6, décret 2021-1362) : 1 an.
export async function logAction(env, request, id, action) {
  const entry = { id, action, ip: request.headers.get('cf-connecting-ip') || '', at: new Date().toISOString() };
  await put(env, `log:${id}:${Date.now()}`, JSON.stringify(entry), { expirationTtl: LOG_TTL_SECONDS });
}

// Signalements : clés en ordre chronologique inverse pour que kv.list renvoie d'abord les plus récents.
export function reportKey(rand) {
  return `report:${String(9999999999999 - Date.now()).padStart(13, '0')}:${rand}`;
}
export async function putReport(env, report, ttl, rand) {
  await put(env, reportKey(rand), JSON.stringify(report), { expirationTtl: ttl });
}
