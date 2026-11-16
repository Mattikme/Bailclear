import { MAX_BODY_BYTES } from '../../../lib/config.js';
import { ID_RE } from '../../../lib/crypto.js';
import { bearer, error, handle, json, readJson } from '../../../lib/http.js';
import { checkToken, deletePage, deletePhotosFrom, getPage, publicView, savePage } from '../../../lib/store.js';
import { validateContent, ValidationError } from '../../../lib/validate.js';

async function load(params, env) {
  const id = String(params.id || '');
  if (!ID_RE.test(id)) return null;
  return getPage(env, id);
}

export const onRequestGet = handle(async ({ request, env, params }) => {
  const page = await load(params, env);
  if (!page) return error('Page introuvable.', 404);
  if (page.status === 'removed') return error('Cette page a été retirée.', 410);
  const owner = await checkToken(page, bearer(request));
  if (owner) return json({ ...publicView(page), owner: true, updatedAt: page.updatedAt });
  if (page.status !== 'paid') return error('Page introuvable.', 404);
  return json({ ...publicView(page), updatedAt: page.updatedAt });
});

export const onRequestPut = handle(async ({ request, env, params }) => {
  const page = await load(params, env);
  if (!page || page.status === 'removed') return error('Page introuvable.', 404);
  if (!(await checkToken(page, bearer(request)))) return error('Lien de modification invalide.', 403);
  const body = await readJson(request, MAX_BODY_BYTES);
  let content;
  try {
    content = validateContent(body.content);
  } catch (e) {
    if (e instanceof ValidationError) return error(e.message, 422);
    throw e;
  }
  const before = page.photoCount;
  page.content = content;
  page.photoCount = content.photos.length;
  await savePage(env, page);
  if (page.photoCount < before) await deletePhotosFrom(env, page.id, page.photoCount, before);
  return json({ ok: true, status: page.status });
});

export const onRequestDelete = handle(async ({ request, env, params }) => {
  const page = await load(params, env);
  if (!page || page.status === 'removed') return error('Page introuvable.', 404);
  if (!(await checkToken(page, bearer(request)))) return error('Lien de modification invalide.', 403);
  await deletePage(env, page);
  return json({ ok: true });
});
