const $ = (id) => document.getElementById(id);
let token = sessionStorage.getItem('upt:admin') || '';

async function api(path, opts = {}) {
  const res = await fetch(`/api/admin/${path}`, { ...opts, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.status);
  return data;
}

function cell(text) { const td = document.createElement('td'); td.textContent = text; return td; }

async function load() {
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
