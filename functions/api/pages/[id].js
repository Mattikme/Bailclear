import { MAX_BODY_BYTES } from '../../../lib/config.js';
import { ID_RE } from '../../../lib/crypto.js';
import { bearer, error, handle, json, readJson } from '../../../lib/http.js';
import { checkToken, deletePage, deletePhotosFrom, getPage, isLocked, logAction, publicView, savePage } from '../../../lib/store.js';
import { validateContent, ValidationError } from '../../../lib/validate.js';
import { listMessages } from '../../../lib/group.js';

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
  const messages = async () => (page.content.group ? (await listMessages(env, page.id)).map(({ name, text }) => ({ name, text })) : []);
  if (owner) return json({ ...publicView(page), owner: true, messages: await messages(), updatedAt: page.updatedAt });
  if (page.status !== 'paid') return error('Page introuvable.', 404);
  if (isLocked(page)) {
    const { occasion, theme, to, from, intro, lang } = page.content;
    return json({ id: page.id, status: page.status, locked: true, openAt: page.content.openAt, content: { occasion, theme, to, from, intro, lang } });
  }
  return json({ ...publicView(page), messages: await messages(), updatedAt: page.updatedAt });
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
  // Relecture juste avant l'écriture : on ne modifie que le contenu (jamais le statut ni l'expiration).
  const fresh = await getPage(env, page.id);
  if (!fresh || fresh.status === 'removed') return error('Page introuvable.', 404);
  const before = fresh.photoCount;
  fresh.content = content;
  fresh.photoCount = content.photos.length;
  await savePage(env, fresh);
  if (fresh.photoCount < before) await deletePhotosFrom(env, fresh.id, fresh.photoCount, before);
  await logAction(env, request, page.id, 'update');
  return json({ ok: true, status: fresh.status });
});

export const onRequestDelete = handle(async ({ request, env, params }) => {
  const page = await load(params, env);
  if (!page || page.status === 'removed') return error('Page introuvable.', 404);
  if (!(await checkToken(page, bearer(request)))) return error('Lien de modification invalide.', 403);
  await deletePage(env, page);
  await logAction(env, request, page.id, 'delete');
  return json({ ok: true });
});
