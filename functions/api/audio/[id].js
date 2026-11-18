import { ID_RE } from '../../../lib/crypto.js';
import { bearer, error, handle, json } from '../../../lib/http.js';
import { checkToken, deleteAudio, getAudio, getPage, isLocked, putAudio } from '../../../lib/store.js';
import { audioType, MAX_AUDIO_BYTES } from '../../../lib/validate.js';

// Message vocal d'une page : lecture publique une fois la page publiée, envoi et suppression par le créateur.
async function load(params, env) {
  const id = String(params.id || '');
  return ID_RE.test(id) ? getPage(env, id) : null;
}

export const onRequestGet = handle(async ({ request, env, params }) => {
  const page = await load(params, env);
  if (!page || page.status === 'removed' || !page.content || !page.content.voice) return error('Audio introuvable.', 404);
  if ((page.status !== 'paid' || isLocked(page)) && !(await checkToken(page, bearer(request)))) return error('Audio introuvable.', 404);
  const { value, metadata } = await getAudio(env, page.id);
  if (!value) return error('Audio introuvable.', 404);
  const headers = {
    'content-type': (metadata && metadata.type) || 'audio/mp4',
    'cache-control': page.status === 'paid' && !bearer(request) ? 'public, max-age=300' : 'private, no-store',
    'x-content-type-options': 'nosniff',
    'content-security-policy': "default-src 'none'; sandbox",
    'accept-ranges': 'bytes',
    'x-robots-tag': 'noindex',
  };
  // Safari lit l'audio par morceaux : on gère les requêtes partielles.
  const range = /bytes=(\d*)-(\d*)/.exec(request.headers.get('range') || '');
  if (range) {
    const size = value.byteLength;
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start >= size) return new Response(null, { status: 416, headers: { 'content-range': `bytes */${size}` } });
    return new Response(value.slice(start, end + 1), { status: 206, headers: { ...headers, 'content-range': `bytes ${start}-${end}/${size}` } });
  }
  return new Response(value, { headers });
});

export const onRequestPut = handle(async ({ request, env, params }) => {
  const page = await load(params, env);
  if (!page || page.status === 'removed') return error('Page introuvable.', 404);
  if (!(await checkToken(page, bearer(request)))) return error('Lien de modification invalide.', 403);
  if (!page.content || !page.content.voice) return error('Ajoute d’abord le message vocal à la page.', 400);
  if (env.UPLOAD_LIMITER) {
    const { success } = await env.UPLOAD_LIMITER.limit({ key: request.headers.get('cf-connecting-ip') || 'local' });
    if (!success) return error('Trop d’envois en peu de temps. Réessaie dans une minute.', 429);
  }
  const len = Number(request.headers.get('content-length') || 0);
  if (len > MAX_AUDIO_BYTES) return error('Message vocal trop lourd (3 Mo maximum).', 413);
  const bytes = await request.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > MAX_AUDIO_BYTES) return error('Message vocal vide ou trop lourd (3 Mo maximum).', 413);
  const type = audioType(bytes);
  if (!type) return error('Format audio non pris en charge.', 415);
  await putAudio(env, page, bytes, type);
  return json({ ok: true });
});

export const onRequestDelete = handle(async ({ request, env, params }) => {
  const page = await load(params, env);
  if (!page || page.status === 'removed') return error('Page introuvable.', 404);
  if (!(await checkToken(page, bearer(request)))) return error('Lien de modification invalide.', 403);
  await deleteAudio(env, page.id);
  return json({ ok: true });
});
