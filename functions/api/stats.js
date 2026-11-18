import { json } from '../../lib/http.js';
import { summary } from '../../lib/stats.js';

// Totaux publics (aujourd'hui et ce mois-ci) : ne contient aucune donnée personnelle.
export const onRequestGet = async ({ env }) => {
  let s = null;
  try { s = await summary(env); } catch (e) { console.error('stats', e && e.message); }
  const pick = (o = {}) => ({ visitors: o.visitors || 0, views: o.views || 0, creations: o.creations || 0 });
  return json(s ? { today: pick(s.today), month: pick(s.monthly) } : { today: pick(), month: pick() }, 200, { 'cache-control': 'public, max-age=60' });
};
