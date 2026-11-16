import { ID_RE } from '../../lib/crypto.js';
import { devFakePayment, error, handle, json } from '../../lib/http.js';
import { getPage, markPaid } from '../../lib/store.js';
import { isSessionPaid, retrieveSession } from '../../lib/stripe.js';

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
    if (devFakePayment(env, request)) {
      await markPaid(env, page, 'dev_fake');
      return json({ status: 'paid' });
    }
    return error('Paiement introuvable.', 402);
  }
  const session = await retrieveSession(env, sessionId);
  const ok = isSessionPaid(session) && session.metadata && session.metadata.page_id === id;
  if (!ok) return json({ status: 'pending' }, 202);
  await markPaid(env, page, session.id);
  return json({ status: 'paid' });
});
