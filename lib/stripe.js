import { hmacSha256Hex, safeEqual } from './crypto.js';

const API = 'https://api.stripe.com/v1';

function form(obj, prefix = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object') form(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}

async function stripe(env, method, path, params) {
  if (!env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY manquant.');
  const res = await fetch(API + path, {
    method,
    headers: {
      authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'content-type': 'application/x-www-form-urlencoded',
      'stripe-version': '2024-06-20',
    },
    body: params ? form(params).toString() : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('Stripe error', res.status, data && data.error && data.error.message);
    throw new Error('Erreur Stripe');
  }
  return data;
}

export function buildCheckoutParams({ pageId, origin, priceCents, productName, invoice }) {
  const params = {
    mode: 'payment',
    locale: 'fr',
    client_reference_id: pageId,
    success_url: `${origin}/merci?id=${pageId}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/creer?annule=1`,
    allow_promotion_codes: 'true',
    line_items: { 0: { quantity: 1, price_data: { currency: 'eur', unit_amount: priceCents, product_data: { name: productName } } } },
    metadata: { page_id: pageId },
    payment_intent_data: { metadata: { page_id: pageId } },
    custom_text: {
      submit: { message: 'En payant, tu demandes la mise en ligne immédiate de ta page et tu renonces à ton droit de rétractation (art. L221-28 13° du Code de la consommation), comme accepté à l’étape précédente.' },
    },
  };
  if (invoice) {
    params.invoice_creation = {
      enabled: 'true',
      invoice_data: {
        footer: 'TVA non applicable, art. 293 B du CGI. Contenu numérique fourni immédiatement à la demande du client, qui a renoncé à son droit de rétractation (art. L221-28 13° C. consom.).',
        metadata: { page_id: pageId },
      },
    };
  }
  return params;
}

export function createCheckoutSession(env, opts) {
  return stripe(env, 'POST', '/checkout/sessions', buildCheckoutParams(opts));
}

export function retrieveSession(env, sessionId) {
  return stripe(env, 'GET', `/checkout/sessions/${encodeURIComponent(sessionId)}`);
}

// Vérifie l'en-tête Stripe-Signature (schéma v1, tolérance 5 min).
export async function verifyWebhook(secret, payload, header, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!secret || !header) return false;
  const parts = Object.fromEntries([]);
  const sigs = [];
  for (const item of header.split(',')) {
    const [k, v] = item.split('=');
    if (k === 't') parts.t = v;
    if (k === 'v1') sigs.push(v);
  }
  const t = Number(parts.t);
  if (!t || Math.abs(nowSeconds - t) > 300 || sigs.length === 0) return false;
  const expected = await hmacSha256Hex(secret, `${parts.t}.${payload}`);
  return sigs.some((s) => safeEqual(s, expected));
}
