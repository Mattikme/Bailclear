import { ID_RE } from '../../lib/crypto.js';
import { error, handle, isLocalhost, json } from '../../lib/http.js';
import { getPage, markPaid } from '../../lib/store.js';
import { retrieveSession } from '../../lib/stripe.js';

// Appelée par la page « merci » au retour de Stripe : vérifie le paiement côté serveur.
export const onRequestGet = handle(async ({ request, env }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '';
  const sessionId = url.searchParams.get('session_id') || '';
  if (!ID_RE.test(id) || !/^[A-Za-z0-9_]{6,255}$/.test(sessionId)) return error('Paramètres invalides.', 400);
  const page = await getPage(env, id);
  if (!page) return error('Page introuvable (le brouillon a peut-être expiré).', 404);
  if (page.status === 'paid') return json({ status: 'paid' });
  if (page.status !== 'draft') return error('Page indisponible.', 410);

  if (sessionId === 'dev_fake') {
    if (env.DEV_FAKE_PAYMENT === '1' && isLocalhost(request)) {
      await markPaid(env, page, 'dev_fake');
      return json({ status: 'paid' });
    }
    return error('Paiement introuvable.', 402);
  }
  const session = await retrieveSession(env, sessionId);
  const ok = session.payment_status === 'paid' && session.metadata && session.metadata.page_id === id;
  if (!ok) return json({ status: 'pending' }, 202);
  await markPaid(env, page, session.id);
  return json({ status: 'paid' });
});
