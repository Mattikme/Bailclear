import { PRICE_CENTS, PRODUCT_NAME } from '../../lib/config.js';
import { ID_RE } from '../../lib/crypto.js';
import { bearer, error, handle, isLocalhost, json, readJson } from '../../lib/http.js';
import { checkToken, getPage, savePage } from '../../lib/store.js';
import { createCheckoutSession } from '../../lib/stripe.js';

export const onRequestPost = handle(async ({ request, env }) => {
  const { id } = await readJson(request, 1024);
  if (!ID_RE.test(String(id))) return error('Page invalide.', 400);
  const page = await getPage(env, id);
  if (!page || page.status !== 'draft') return error('Cette page n’est plus en attente de paiement.', 409);
  if (!(await checkToken(page, bearer(request)))) return error('Lien de modification invalide.', 403);

  // Mode test local uniquement : simule le paiement sans Stripe.
  if (env.DEV_FAKE_PAYMENT === '1' && isLocalhost(request)) {
    return json({ url: `/merci?id=${id}&session_id=dev_fake` });
  }
  const origin = env.SITE_URL || new URL(request.url).origin;
  const session = await createCheckoutSession(env, {
    pageId: id, origin, priceCents: PRICE_CENTS, productName: PRODUCT_NAME,
    invoice: env.STRIPE_INVOICE !== '0',
  });
  page.stripeSessionId = session.id;
  await savePage(env, page);
  return json({ url: session.url });
});
