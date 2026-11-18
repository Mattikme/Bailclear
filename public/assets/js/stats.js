// Mesure d'audience sans cookie : on envoie seulement « une page vue » et « première visite du jour sur cet appareil ».
// Aucun identifiant n'est transmis ; la date de dernière visite reste dans le stockage local du navigateur.
// Rien n'est compté si le navigateur envoie « Ne pas suivre » / Global Privacy Control, ni pour le propriétaire du site.
const path = location.pathname.replace(/\/+$/, '') || '/';
const SKIP = /^\/(admin|merci|voir|p\/|api\/)/;

function today() {
  try { return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(new Date()); } catch { return new Date().toISOString().slice(0, 10); }
}
let owner = false;
try { owner = localStorage.getItem('upt:owner') === '1'; } catch { /* stockage indisponible */ }

// Compteur visible uniquement sur l'appareil du propriétaire (réglé en se connectant une fois à /admin).
async function ownerLine() {
  const foot = document.querySelector('.site-footer .wrap');
  if (!foot) return;
  try {
    const d = await (await fetch('/api/stats')).json();
    const p = document.createElement('p');
    p.className = 'owner-stats';
    const n = (x) => Number(x || 0).toLocaleString('fr-FR');
    p.textContent = `Visible par toi seul : ${n(d.today.visitors)} visiteurs aujourd’hui, ${n(d.month.visitors)} ce mois-ci, ${n(d.month.creations)} pages créées ce mois-ci. `;
    const a = document.createElement('a');
    a.href = '/admin';
    a.textContent = 'Voir le détail et la liste des pages';
    p.append(a);
    foot.after(p);
  } catch { /* hors ligne */ }
}

if (owner) ownerLine();
if (!owner && !SKIP.test(path) && !navigator.doNotTrack?.startsWith?.('1') && navigator.doNotTrack !== 'yes' && !navigator.globalPrivacyControl && !navigator.webdriver) {
  let newDay = 0;
  try {
    const d = today();
    if (localStorage.getItem('upt:seen') !== d) { localStorage.setItem('upt:seen', d); newDay = 1; }
  } catch { newDay = 0; }
  const body = JSON.stringify({ p: path, v: newDay });
  if (navigator.sendBeacon) navigator.sendBeacon('/api/hit', new Blob([body], { type: 'application/json' }));
  else fetch('/api/hit', { method: 'POST', body, keepalive: true, headers: { 'content-type': 'application/json' } }).catch(() => {});
}
