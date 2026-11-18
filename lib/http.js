export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

export function error(message, status = 400, extra = {}) {
  return json({ error: message, ...extra }, status);
}

export async function readJson(request, maxBytes) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > maxBytes) throw new HttpError('Requête trop volumineuse.', 413);
  const buf = await request.arrayBuffer();
  if (buf.byteLength > maxBytes) throw new HttpError('Requête trop volumineuse.', 413);
  const text = new TextDecoder().decode(buf);
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError('JSON invalide.', 400);
  }
}

export class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function handle(fn) {
  return async (ctx) => {
    try {
      return await fn(ctx);
    } catch (e) {
      if (e instanceof HttpError) return error(e.message, e.status);
      console.error(e);
      return error('Erreur interne. Réessaie dans un instant.', 500);
    }
  };
}

export function bearer(request) {
  const h = request.headers.get('authorization') || '';
  const m = /^Bearer\s+([A-Za-z0-9_\-+/=.]{20,200})$/.exec(h);
  return m ? m[1] : null;
}

export function isLocalhost(request) {
  const host = new URL(request.url).hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

// Paiement pas encore configuré (clé Stripe absente) : on prévient avant de stocker quoi que ce soit.
export function paymentDisabled(env, request) {
  return !env.STRIPE_SECRET_KEY && !devFakePayment(env, request);
}
export const PAYMENT_DISABLED_MSG = 'Le paiement n’est pas encore ouvert sur ce site : reviens très bientôt ! Ton brouillon reste enregistré sur cet appareil.';

// Paiement simulé : uniquement en local, jamais avec une clé Stripe réelle.
export function devFakePayment(env, request) {
  return env.DEV_FAKE_PAYMENT === '1' && isLocalhost(request) && !String(env.STRIPE_SECRET_KEY || '').startsWith('sk_live');
}
