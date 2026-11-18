// Carte de groupe : les invités (lien avec clé) laissent un mot ; le créateur (jeton) lit et modère.
import { ID_RE, randomId } from '../../../lib/crypto.js';
import { bearer, error, handle, json, readJson } from '../../../lib/http.js';
import { checkToken, getPage } from '../../../lib/store.js';
import { addMessage, checkInvite, countMessages, GROUP_MAX, GROUP_NAME_MAX, GROUP_TEXT_MAX, inviteKey, listMessages, removeMessage } from '../../../lib/group.js';

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g;
const clean = (v, max, multiline) => {
  if (typeof v !== 'string') return '';
  let s = v.replace(/\r\n?/g, '\n').replace(CONTROL, '');
  s = multiline ? s.replace(/\n{3,}/g, '\n\n') : s.replace(/\n+/g, ' ');
  s = s.trim();
  return s.length > max ? null : s;
};

async function load(params, env) {
  const id = String(params.id || '');
  if (!ID_RE.test(id)) return null;
  const page = await getPage(env, id);
  return page && page.status !== 'removed' ? page : null;
}

export const onRequestGet = handle(async ({ request, env, params }) => {
  const page = await load(params, env);
  if (!page) return error('Page introuvable.', 404);
  if (await checkToken(page, bearer(request))) {
    return json({ messages: await listMessages(env, page.id), inviteKey: await inviteKey(page), max: GROUP_MAX });
  }
  const k = new URL(request.url).searchParams.get('k') || '';
  if (!(await checkInvite(page, k))) return error('Lien d’invitation invalide.', 403);
  const { to, from, occasion, theme, title, group, openAt } = page.content;
  return json({ to, from, occasion, theme, title, open: Boolean(group) && page.status === 'paid', openAt: openAt || '', count: await countMessages(env, page.id), max: GROUP_MAX });
});

export const onRequestPost = handle(async ({ request, env, params }) => {
  const page = await load(params, env);
  if (!page) return error('Page introuvable.', 404);
  const body = await readJson(request, 4096);
  if (body.website) return json({ ok: true }); // pot de miel anti-robots
  if (!(await checkInvite(page, body.k))) return error('Lien d’invitation invalide.', 403);
  if (!page.content.group || page.status !== 'paid') return error('Cette carte de groupe n’accepte plus de messages.', 403);
  if (env.CREATE_LIMITER) {
    const { success } = await env.CREATE_LIMITER.limit({ key: `g:${request.headers.get('cf-connecting-ip') || ''}` });
    if (!success) return error('Trop d’envois d’un coup, réessaie dans une minute.', 429);
  }
  const name = clean(body.name, GROUP_NAME_MAX, false);
  const text = clean(body.text, GROUP_TEXT_MAX, true);
  if (name === null || text === null) return error('Texte trop long.', 422);
  if (!name) return error('Indique ton prénom.', 422);
  if (text.length < 2) return error('Écris ton message.', 422);
  const res = await addMessage(env, page, { id: randomId(10), name, text, created: new Date().toISOString() });
  if (!res.ok) return error(`La carte est complète (${GROUP_MAX} messages maximum).`, 409);
  return json({ ok: true, count: res.count });
});

export const onRequestDelete = handle(async ({ request, env, params }) => {
  const page = await load(params, env);
  if (!page) return error('Page introuvable.', 404);
  if (!(await checkToken(page, bearer(request)))) return error('Lien de modification invalide.', 403);
  const mid = new URL(request.url).searchParams.get('m') || '';
  if (!/^[A-Za-z0-9]{10}$/.test(mid)) return error('Message introuvable.', 404);
  await removeMessage(env, page.id, mid);
  return json({ ok: true });
});
