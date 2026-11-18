const $ = (id) => document.getElementById(id);
let token = sessionStorage.getItem('upt:admin') || '';

async function api(path, opts = {}) {
  const res = await fetch(`/api/admin/${path}`, { ...opts, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.status);
  return data;
}

function cell(text) { const td = document.createElement('td'); td.textContent = text; return td; }

const nf = (x) => Number(x || 0).toLocaleString('fr-FR');
async function loadStats() {
  try {
    const { stats } = await api('stats');
    if (!stats) { $('stats-out').textContent = 'Compteur indisponible (non activé sur cet environnement).'; return; }
    try { localStorage.setItem('upt:owner', '1'); } catch { /* facultatif */ }
    $('stats-out').textContent = 'Ton appareil est reconnu : le compteur s’affiche en bas de chaque page et tes visites ne sont plus comptées.';
    $('stats-section').hidden = false;
    const card = (label, a, b) => { const d = document.createElement('div'); d.className = 'stat-card'; const l = document.createElement('div'); l.className = 'stat-label'; l.textContent = label; const v = document.createElement('div'); v.className = 'stat-value'; v.textContent = a; const s = document.createElement('div'); s.className = 'stat-sub'; s.textContent = b; d.append(l, v, s); return d; };
    $('stat-cards').replaceChildren(
      card('Visiteurs aujourd’hui', nf(stats.today.visitors), `${nf(stats.today.views)} pages vues`),
      card('Visiteurs ce mois-ci', nf(stats.monthly.visitors), `${nf(stats.monthly.views)} pages vues`),
      card('Pages créées ce mois-ci', nf(stats.monthly.creations), `${nf(stats.total.creations)} depuis le début`),
    );
    $('stat-days').replaceChildren(...Object.keys(stats.series).sort().reverse().map((day) => {
      const tr = document.createElement('tr');
      const s = stats.series[day];
      tr.append(cell(new Date(day + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })), cell(nf(s.visitors)), cell(nf(s.views)), cell(nf(s.creations)));
      return tr;
    }));
    $('stat-top').replaceChildren(...stats.top.map((t) => { const li = document.createElement('li'); li.textContent = `${t.path === '/' ? 'Accueil' : t.path} : ${nf(t.n)} vues`; return li; }));
  } catch (e) {
    $('stats-out').textContent = `Erreur : ${e.message}`;
  }
}

const STATUS = { paid: 'en ligne', draft: 'brouillon (non publiée)', removed: 'retirée' };
async function loadPages() {
  try {
    const { pages, total } = await api('pages');
    $('pages-section').hidden = false;
    $('pages-out').textContent = total ? `${total} page${total > 1 ? 's' : ''} au total${total > pages.length ? ` (les ${pages.length} plus récentes affichées)` : ''}.` : 'Aucune page pour l’instant.';
    $('pages').replaceChildren(...pages.map((p) => {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      if (p.status !== 'removed') { const a = document.createElement('a'); a.href = `/p/${p.id}`; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Ouvrir'; td.append(a); }
      tr.append(cell(p.createdAt ? new Date(p.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—'), cell(p.title || '—'), cell(p.occasion || '—'), cell(`${STATUS[p.status] || p.status}${p.free ? ', gratuite' : ''}`), td);
      return tr;
    }));
  } catch (e) { $('pages-out').textContent = `Erreur : ${e.message}`; }
}

async function load() {
  loadStats();
  loadPages();
  $('out').textContent = 'Chargement…';
  try {
    const { reports, more } = await api('reports');
    $('out').textContent = reports.length ? (more ? 'Plus de 200 signalements : traite ceux-ci pour voir les suivants.' : '') : 'Aucun signalement.';
    const tbody = $('reports');
    tbody.replaceChildren(...reports.map((r) => {
      const tr = document.createElement('tr');
      const actions = document.createElement('td');
      const view = document.createElement('a'); view.href = `/p/${r.id}`; view.target = '_blank'; view.textContent = 'Voir';
      const rm = document.createElement('button'); rm.className = 'btn small'; rm.textContent = 'Retirer la page';
      rm.onclick = async () => {
        const reason = prompt('Motif du retrait (conservé 30 jours) :', r.reason);
        if (reason == null) return;
        try {
          await api('remove', { method: 'POST', body: JSON.stringify({ id: r.id, reason }) }).catch((e) => { if (!/introuvable/i.test(e.message)) throw e; });
          await api('dismiss', { method: 'POST', body: JSON.stringify({ key: r.key }) });
          alert('Page retirée. Pense à informer l’acheteur par e-mail (motif, règle enfreinte, recours).');
        } catch (e) { alert(`Erreur : ${e.message}`); }
        load();
      };
      const ok = document.createElement('button'); ok.className = 'btn small ghost'; ok.textContent = 'Classer sans suite';
      ok.onclick = async () => { await api('dismiss', { method: 'POST', body: JSON.stringify({ key: r.key }) }); load(); };
      actions.append(view, ' ', rm, ' ', ok);
      tr.append(cell(new Date(r.at).toLocaleString('fr-FR')), cell(r.id), cell(r.reason), cell(r.details), cell([r.name, r.email].filter(Boolean).join(' — ') || '—'), actions);
      return tr;
    }));
  } catch (e) {
    $('out').textContent = `Erreur : ${e.message}`;
  }
}

$('login').onsubmit = (e) => {
  e.preventDefault();
  token = $('token').value.trim();
  sessionStorage.setItem('upt:admin', token);
  load();
};
if (token) load();
