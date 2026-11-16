import { PRICE_CENTS, PRODUCT_NAME, TERMS_VERSION } from '../../lib/config.js';
import { ID_RE } from '../../lib/crypto.js';
import { bearer, devFakePayment, error, handle, json, paymentDisabled, PAYMENT_DISABLED_MSG, readJson } from '../../lib/http.js';
import { checkToken, getPage } from '../../lib/store.js';
import { createCheckoutSession } from '../../lib/stripe.js';

export const onRequestPost = handle(async ({ request, env }) => {
  if (paymentDisabled(env, request)) return error(PAYMENT_DISABLED_MSG, 503);
  const { id } = await readJson(request, 1024);
  if (!ID_RE.test(String(id))) return error('Page invalide.', 400);
  const page = await getPage(env, id);
  if (!page || page.status !== 'draft') return error('Cette page n’est plus en attente de paiement.', 409);
  if (!(await checkToken(page, bearer(request)))) return error('Lien de modification invalide.', 403);

  // Mode test local uniquement : simule le paiement sans Stripe.
  if (devFakePayment(env, request)) {
    return json({ url: `/merci?id=${id}&session_id=dev_fake` });
  }
  // La session Stripe doit expirer avant le brouillon (Stripe impose entre 30 min et 24 h).
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = Math.min(now + 23 * 3600, page.expiresAt - 15 * 60);
  if (expiresAt < now + 31 * 60) return error('Ce brouillon a presque expiré : recrée ta page pour la publier.', 409);
  const origin = env.SITE_URL || new URL(request.url).origin;
  const session = await createCheckoutSession(env, {
    pageId: id, origin, priceCents: PRICE_CENTS, productName: PRODUCT_NAME,
    invoice: env.STRIPE_INVOICE !== '0', termsVersion: (page.consent && page.consent.termsVersion) || TERMS_VERSION, expiresAt,
  });
  return json({ url: session.url });
});
