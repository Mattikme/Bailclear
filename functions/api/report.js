import { REPORT_TTL_SECONDS } from '../../lib/config.js';
import { ID_RE, randomId } from '../../lib/crypto.js';
import { error, handle, json, readJson } from '../../lib/http.js';

const REASONS = ['illicite', 'vie-privee', 'haine', 'enfant', 'autre'];

// Point de contact de signalement (LCEN art. 6 / DSA art. 16).
export const onRequestPost = handle(async ({ request, env }) => {
  const b = await readJson(request, 8 * 1024);
  const id = String(b.id || '');
  if (!ID_RE.test(id)) return error('Page invalide.', 400);
  if (!REASONS.includes(b.reason)) return error('Motif invalide.', 400);
  const details = String(b.details || '').slice(0, 2000);
  const email = String(b.email || '').slice(0, 200);
  if (details.trim().length < 10) return error('Décris le problème en quelques mots (10 caractères minimum).', 400);
  const report = { id, reason: b.reason, details, email, at: new Date().toISOString() };
  await env.PAGES_KV.put(`report:${Date.now()}:${randomId(6)}`, JSON.stringify(report), { expirationTtl: REPORT_TTL_SECONDS });
  return json({ ok: true });
});
