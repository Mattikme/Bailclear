// Mesure d'audience maison, sans cookie ni donnée personnelle : seuls des totaux par jour et par page sont conservés
// (13 mois maximum) dans un Durable Object SQLite. Voir worker/stats.js.

// Jour calendaire à Paris (YYYY-MM-DD).
export function parisDay(ts = Date.now()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(new Date(ts));
}

// Chemin de page accepté pour le comptage (évite de remplir le stockage avec des chemins arbitraires).
export function cleanPath(p) {
  const s = String(p || '');
  if (!/^\/(?:[a-z0-9-]{1,40})?$/.test(s)) return null;
  if (/^\/(admin|merci|voir|p|api|assets)(\/|$)/.test(s)) return null;
  return s;
}

const BOT = /bot|crawl|spider|slurp|headless|preview|facebookexternalhit|lighthouse|pingdom|uptime|monitor/i;
export const isBot = (ua) => BOT.test(String(ua || ''));

export function statsStub(env) {
  return env && env.STATS ? env.STATS.get(env.STATS.idFromName('main')) : null;
}

export async function track(env, keys) {
  const stub = statsStub(env);
  if (!stub) return;
  try {
    await stub.add(parisDay(), keys);
  } catch (e) {
    console.error('stats', e && e.message);
  }
}

export async function summary(env) {
  const stub = statsStub(env);
  if (!stub) return null;
  const day = parisDay();
  return stub.summary(day, day.slice(0, 7));
}
