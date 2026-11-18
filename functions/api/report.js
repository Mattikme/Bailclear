import { REPORT_TTL_SECONDS } from '../../lib/config.js';
import { ID_RE, randomId } from '../../lib/crypto.js';
import { error, handle, json, readJson } from '../../lib/http.js';
import { getPage, putReport } from '../../lib/store.js';

const REASONS = ['illicite', 'vie-privee', 'haine', 'enfant', 'autre'];

// Point de contact de signalement (LCEN art. 6 / DSA art. 16).
export const onRequestPost = handle(async ({ request, env }) => {
  const b = await readJson(request, 8 * 1024);
  const id = String(b.id || '');
  if (!ID_RE.test(id)) return error('Page invalide.', 400);
  if (!REASONS.includes(b.reason)) return error('Motif invalide.', 400);
  const details = String(b.details || '').slice(0, 2000);
  const email = String(b.email || '').slice(0, 200);
  if (b.goodFaith !== true) return error('Merci de confirmer que ton signalement est fait de bonne foi.', 400);
  const name = String(b.name || '').slice(0, 120);
  if (details.trim().length < 10) return error('Décris le problème en quelques mots (10 caractères minimum).', 400);
  const page = await getPage(env, id);
  if (!page || page.status !== 'paid') return error('Page introuvable.', 404);
  const report = { id, reason: b.reason, details, name, email, at: new Date().toISOString() };
  await putReport(env, report, REPORT_TTL_SECONDS, randomId(6));
  return json({ ok: true });
});
