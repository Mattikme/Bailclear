import { ID_RE } from '../../lib/crypto.js';
import { error, handle, json } from '../../lib/http.js';
import { getPage, markPaid } from '../../lib/store.js';
import { verifyWebhook } from '../../lib/stripe.js';

// Filet de sécurité si l'acheteur ferme l'onglet avant la page « merci ».
export const onRequestPost = handle(async ({ request, env }) => {
  const payload = await request.text();
  const ok = await verifyWebhook(env.STRIPE_WEBHOOK_SECRET, payload, request.headers.get('stripe-signature'));
  if (!ok) return error('Signature invalide.', 400);
  const event = JSON.parse(payload);
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object;
    const id = session.metadata && session.metadata.page_id;
    if (session.payment_status === 'paid' && ID_RE.test(String(id))) {
      const page = await getPage(env, id);
      if (page) await markPaid(env, page, session.id);
      else console.error('Paiement reçu pour une page introuvable', id, session.id);
    }
  }
  return json({ received: true });
});
