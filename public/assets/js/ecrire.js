// Page invité d'une carte de groupe : /ecrire?p=ID#k=CLE
import { getOccasion } from './occasions.js';

const $ = (id) => document.getElementById(id);
const id = new URLSearchParams(location.search).get('p') || '';
const key = new URLSearchParams(location.hash.slice(1)).get('k') || '';
const fail = (t) => { $('g-status').textContent = t; $('g-status').className = 'notice error'; };

async function main() {
  if (!/^[A-Za-z0-9]{12}$/.test(id) || !key) return fail('Ce lien d’invitation est incomplet. Demande-le à nouveau à la personne qui t’a invité(e).');
  let info;
  try {
    const res = await fetch(`/api/group/${id}?k=${encodeURIComponent(key)}`, { cache: 'no-store' });
    info = await res.json();
    if (!res.ok) throw new Error(info.error || 'Lien invalide.');
  } catch (e) { return fail(e.message); }
  const occ = getOccasion(info.occasion);
  $('g-status').hidden = true;
  $('g-box').hidden = false;
  $('g-title').textContent = `${occ.emoji} Un mot pour ${info.to}`;
  const by = info.from ? `${info.from} prépare` : 'Quelqu’un prépare';
  $('g-intro').textContent = `${by} une page surprise pour ${info.to} et t’invite à y laisser un petit message. ${info.count ? `${info.count} personne${info.count > 1 ? 's ont' : ' a'} déjà écrit.` : 'Tu es le premier ou la première !'}`;
  if (!info.open) { $('g-form').hidden = true; fail('Cette carte n’accepte pas (ou plus) de nouveaux messages.'); $('g-status').hidden = false; return; }
  if (info.count >= info.max) { $('g-form').hidden = true; fail('La carte est complète.'); $('g-status').hidden = false; return; }
  const text = $('g-text');
  text.addEventListener('input', () => { $('g-count').textContent = `${text.value.length} / 300`; });
  $('g-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('g-err');
    err.hidden = true;
    const name = $('g-name').value.trim();
    if (!name) { err.textContent = 'Indique ton prénom.'; err.hidden = false; $('g-name').focus(); return; }
    if (text.value.trim().length < 2) { err.textContent = 'Écris ton message.'; err.hidden = false; text.focus(); return; }
    $('g-send').disabled = true;
    try {
      const res = await fetch(`/api/group/${id}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ k: key, name, text: text.value, website: $('g-website').value }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'L’envoi a échoué.');
      $('g-box').hidden = true;
      $('g-done').hidden = false;
      const when = info.openAt && Date.parse(info.openAt) > Date.now() ? ` le ${new Date(info.openAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}` : '';
      $('g-done-text').textContent = `Ton mot est bien ajouté ! ${info.to} le découvrira${when}, avec tous les autres.`;
    } catch (e2) { err.textContent = e2.message; err.hidden = false; }
    finally { $('g-send').disabled = false; }
  });
}
main();
