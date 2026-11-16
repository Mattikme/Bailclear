import { FREE_PER_IP_PER_DAY, MAX_BODY_BYTES, PUBLISHED_DAYS, TERMS_VERSION, freeLaunch } from '../../../lib/config.js';
import { randomId, randomToken, sha256Hex } from '../../../lib/crypto.js';
import { devFakePayment, handle, json, error, readJson, paymentDisabled, PAYMENT_DISABLED_MSG } from '../../../lib/http.js';
import { logAction, newDraft, savePage } from '../../../lib/store.js';
import { validateContent, ValidationError } from '../../../lib/validate.js';

// Crée un brouillon juste avant le paiement (le contenu n'est public qu'une fois payé),
// ou publie directement la page pendant l'offre de lancement gratuite.
export const onRequestPost = handle(async ({ request, env }) => {
  const free = freeLaunch(env);
  if (!free && paymentDisabled(env, request)) return error(PAYMENT_DISABLED_MSG, 503);
  if (env.CREATE_LIMITER) {
    const { success } = await env.CREATE_LIMITER.limit({ key: request.headers.get('cf-connecting-ip') || 'local' });
    if (!success) return error('Trop de pages créées en peu de temps. Réessaie dans une minute.', 429);
  }
  const body = await readJson(request, MAX_BODY_BYTES);
  if (!body.consent || body.consent.terms !== true || (!free && body.consent.waiver !== true)) {
    return error(free ? 'Tu dois accepter les conditions d’utilisation.' : 'Tu dois accepter les CGV et la renonciation au droit de rétractation.', 400);
  }
  // Offre de lancement : 2 pages gratuites max par connexion et par 24 h (adresse IP hachée, effacée après 24 h).
  let freeKey = null;
  let freeCount = 0;
  if (free && !devFakePayment(env, request)) {
    freeKey = `freeip:${(await sha256Hex(`upt-free:${request.headers.get('cf-connecting-ip') || 'local'}`)).slice(0, 32)}`;
    freeCount = Number(await env.PAGES_KV.get(freeKey)) || 0;
    if (freeCount >= FREE_PER_IP_PER_DAY) {
      return error('Offre de lancement : une page gratuite par personne. Tu as déjà créé la tienne depuis cette connexion. Tu peux toujours la modifier avec ton lien de modification.', 429);
    }
  }
  let content;
  try {
    content = validateContent(body.content);
  } catch (e) {
    if (e instanceof ValidationError) return error(e.message, 422);
    throw e;
  }
  const id = randomId();
  const token = randomToken();
  const consent = { terms: true, waiver: !free, termsVersion: TERMS_VERSION, at: new Date().toISOString(), freeLaunch: free };
  const page = newDraft(id, await sha256Hex(token), content, consent);
  if (free) {
    // Offre de lancement : publiée tout de suite, hébergée comme une page payée.
    page.status = 'paid';
    page.free = true;
    page.paidAt = new Date().toISOString();
    page.expiresAt = Math.floor(Date.now() / 1000) + PUBLISHED_DAYS * 86400;
  }
  await savePage(env, page);
  await logAction(env, request, id, free ? 'create-free' : 'create');
  if (freeKey) await env.PAGES_KV.put(freeKey, String(freeCount + 1), { expirationTtl: 86400 });
  return json({ id, token, expiresAt: page.expiresAt, free }, 201);
});
