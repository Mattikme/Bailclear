import { ID_RE, safeEqual } from '../../../lib/crypto.js';
import { bearer, error, handle, json, readJson } from '../../../lib/http.js';
import { getPage, removePage } from '../../../lib/store.js';
import { summary } from '../../../lib/stats.js';

// Mini-console de modération : /admin (jeton ADMIN_TOKEN à définir dans les variables d'environnement).
export const onRequest = handle(async ({ request, env, params }) => {
  const token = bearer(request);
  if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < 32 || !token || !safeEqual(token, env.ADMIN_TOKEN)) {
    return error('Accès refusé.', 401);
  }
  const path = (params.path || []).join('/');
  const kv = env.PAGES_KV;

  if (request.method === 'GET' && path === 'stats') {
    return json({ stats: await summary(env) });
  }
  if (request.method === 'GET' && path === 'reports') {
    const list = await kv.list({ prefix: 'report:', limit: 200 });
    const reports = [];
    for (const k of list.keys) {
      const r = await kv.get(k.name, { type: 'json' });
      if (r) reports.push({ key: k.name, ...r });
    }
    return json({ reports, more: !list.list_complete });
  }
  if (request.method === 'GET' && path === 'page') {
    const id = new URL(request.url).searchParams.get('id') || '';
    if (!ID_RE.test(id)) return error('Identifiant invalide.', 400);
    const page = await getPage(env, id);
    if (!page) return error('Page introuvable.', 404);
    const { tokenHash, ...safe } = page;
    return json({ page: safe });
  }
  if (request.method === 'POST' && path === 'remove') {
    const b = await readJson(request, 4096);
    if (!ID_RE.test(String(b.id))) return error('Identifiant invalide.', 400);
    const page = await getPage(env, b.id);
    if (!page) return error('Page introuvable.', 404);
    await removePage(env, page, String(b.reason || 'modération').slice(0, 200));
    return json({ ok: true });
  }
  if (request.method === 'POST' && path === 'dismiss') {
    const b = await readJson(request, 4096);
    if (!/^report:\d{13}:[a-zA-Z0-9]{6}$/.test(String(b.key))) return error('Clé invalide.', 400);
    await kv.delete(b.key);
    return json({ ok: true });
  }
  return error('Introuvable.', 404);
});
