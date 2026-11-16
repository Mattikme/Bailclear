// Worker Cloudflare : sert le site statique embarqué + les fonctions /api (mêmes modules que Cloudflare Pages).
import { ASSETS } from './assets.generated.js';
import * as pagesIndex from '../functions/api/pages/index.js';
import * as pagesId from '../functions/api/pages/[id].js';
import * as photos from '../functions/api/photos/[id]/[n].js';
import * as checkout from '../functions/api/checkout.js';
import * as confirm from '../functions/api/confirm.js';
import * as webhook from '../functions/api/stripe-webhook.js';
import * as report from '../functions/api/report.js';
import * as admin from '../functions/api/admin/[[path]].js';

const ROUTES = [
  [/^\/api\/pages\/?$/, pagesIndex, []],
  [/^\/api\/pages\/([^/]+)$/, pagesId, ['id']],
  [/^\/api\/photos\/([^/]+)\/([^/]+)$/, photos, ['id', 'n']],
  [/^\/api\/checkout$/, checkout, []],
  [/^\/api\/confirm$/, confirm, []],
  [/^\/api\/stripe-webhook$/, webhook, []],
  [/^\/api\/report$/, report, []],
  [/^\/api\/admin\/(.+)$/, admin, ['path']],
];

const SECURITY = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'content-security-policy': "default-src 'self'; img-src 'self' data: blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-src 'self' https://www.youtube-nocookie.com https://open.spotify.com; form-action 'self'; base-uri 'self'; frame-ancestors 'self'; object-src 'none'",
};
const NOINDEX = /^\/(p\/|voir|merci|admin)/;
const NO_REFERRER = /^\/(p\/|merci|creer)/;

async function api(request, env, ctx, url) {
  for (const [re, mod, names] of ROUTES) {
    const m = re.exec(url.pathname);
    if (!m) continue;
    const params = {};
    names.forEach((n, i) => { params[n] = n === 'path' ? m[i + 1].split('/') : decodeURIComponent(m[i + 1]); });
    const method = request.method.charAt(0) + request.method.slice(1).toLowerCase();
    const handler = mod[`onRequest${method}`] || mod.onRequest;
    if (!handler) return new Response(JSON.stringify({ error: 'Méthode non autorisée.' }), { status: 405, headers: { 'content-type': 'application/json' } });
    return handler({ request, env, params, waitUntil: ctx.waitUntil.bind(ctx) });
  }
  return new Response(JSON.stringify({ error: 'Introuvable.' }), { status: 404, headers: { 'content-type': 'application/json' } });
}

function resolveAsset(pathname) {
  if (pathname === '/') return '/index.html';
  if (/^\/p\/[^/]+\/?$/.test(pathname)) return '/voir.html';
  if (ASSETS[pathname]) return pathname;
  const clean = pathname.replace(/\/$/, '');
  if (ASSETS[`${clean}.html`]) return `${clean}.html`;
  return null;
}

function serve(request, url) {
  if (url.pathname.endsWith('.html') && url.pathname !== '/404.html' && ASSETS[url.pathname]) {
    const to = url.pathname === '/index.html' ? '/' : url.pathname.slice(0, -5);
    return Response.redirect(new URL(to + url.search, url), 308);
  }
  const key = resolveAsset(url.pathname);
  const asset = ASSETS[key || '/404.html'];
  const headers = new Headers({ 'content-type': asset.type, ...SECURITY });
  const longCache = key && key.startsWith('/assets/') && /\.(png|jpg|svg|mp4)$/.test(key) && !key.startsWith('/assets/demo/');
  headers.set('cache-control', longCache ? 'public, max-age=3600' : 'no-cache');
  if (NOINDEX.test(url.pathname) || url.hostname.endsWith('.workers.dev')) headers.set('x-robots-tag', 'noindex, nofollow');
  if (NO_REFERRER.test(url.pathname)) headers.set('referrer-policy', 'no-referrer');
  const status = key ? 200 : 404;
  const range = request.headers.get('range');
  const body = asset.body;
  if (range && body instanceof ArrayBuffer) {
    // Lecture vidéo (Safari exige les requêtes partielles).
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const size = body.byteLength;
    const start = m && m[1] ? Number(m[1]) : 0;
    const end = m && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    headers.set('content-range', `bytes ${start}-${end}/${size}`);
    headers.set('accept-ranges', 'bytes');
    return new Response(request.method === 'HEAD' ? null : body.slice(start, end + 1), { status: 206, headers });
  }
  if (body instanceof ArrayBuffer) headers.set('accept-ranges', 'bytes');
  return new Response(request.method === 'HEAD' ? null : body, { status, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return api(request, env, ctx, url);
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Méthode non autorisée.', { status: 405 });
    return serve(request, url);
  },
};
