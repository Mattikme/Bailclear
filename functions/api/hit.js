import { cleanPath, isBot, track } from '../../lib/stats.js';

// Reçoit un « ping » de page vue (sans cookie, sans identifiant). Toujours 204 : le visiteur n'a pas à le savoir.
export const onRequestPost = async ({ request, env }) => {
  try {
    if (isBot(request.headers.get('user-agent'))) return new Response(null, { status: 204 });
    const len = Number(request.headers.get('content-length') || 0);
    if (len > 512) return new Response(null, { status: 204 });
    const b = JSON.parse(await request.text());
    const path = cleanPath(b.p);
    if (path) {
      const keys = ['views', `p:${path}`];
      if (b.v === 1) keys.push('visitors');
      await track(env, keys);
    }
  } catch { /* ignoré */ }
  return new Response(null, { status: 204 });
};
