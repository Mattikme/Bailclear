import { MAX_PHOTO_BYTES } from '../../../../lib/config.js';
import { ID_RE } from '../../../../lib/crypto.js';
import { bearer, error, handle, json } from '../../../../lib/http.js';
import { checkToken, getPage, getPhoto, putPhoto } from '../../../../lib/store.js';
import { imageType } from '../../../../lib/validate.js';

function parse(params) {
  const id = String(params.id || '');
  const n = Number(params.n);
  if (!ID_RE.test(id) || !Number.isInteger(n) || n < 0 || n > 99) return null;
  return { id, n };
}

export const onRequestGet = handle(async ({ request, env, params }) => {
  const p = parse(params);
  if (!p) return error('Photo introuvable.', 404);
  const page = await getPage(env, p.id);
  if (!page || page.status === 'removed' || p.n >= page.photoCount) return error('Photo introuvable.', 404);
  const owner = page.status !== 'paid' ? await checkToken(page, bearer(request)) : false;
  if (page.status !== 'paid' && !owner) return error('Photo introuvable.', 404);
  const { value, metadata } = await getPhoto(env, p.id, p.n);
  if (!value) return error('Photo introuvable.', 404);
  return new Response(value, {
    headers: {
      'content-type': (metadata && metadata.type) || 'image/jpeg',
      'cache-control': page.status === 'paid' && !bearer(request) ? 'public, max-age=300' : 'private, no-store',
      'x-robots-tag': 'noindex',
      'x-content-type-options': 'nosniff',
      'content-security-policy': "default-src 'none'; sandbox",
      'content-disposition': 'inline',
    },
  });
});

export const onRequestPut = handle(async ({ request, env, params }) => {
  const p = parse(params);
  if (!p) return error('Photo invalide.', 400);
  const page = await getPage(env, p.id);
  if (!page || page.status === 'removed') return error('Page introuvable.', 404);
  if (!(await checkToken(page, bearer(request)))) return error('Lien de modification invalide.', 403);
  if (p.n >= page.photoCount) return error('Numéro de photo hors limite.', 400);
  const len = Number(request.headers.get('content-length') || 0);
  if (len > MAX_PHOTO_BYTES) return error('Photo trop lourde.', 413);
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_PHOTO_BYTES) return error('Photo vide ou trop lourde.', 413);
  const type = imageType(bytes);
  if (!type) return error('Format non pris en charge (JPEG, PNG ou WebP).', 415);
  await putPhoto(env, page, p.n, bytes, type);
  return json({ ok: true });
});
