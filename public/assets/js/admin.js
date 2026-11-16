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
    const { reports } = await api('reports');
    $('out').textContent = reports.length ? '' : 'Aucun signalement.';
    const tbody = $('reports');
    tbody.replaceChildren(...reports.map((r) => {
      const tr = document.createElement('tr');
      const actions = document.createElement('td');
      const view = document.createElement('a'); view.href = `/p/${r.id}`; view.target = '_blank'; view.textContent = 'Voir';
      const rm = document.createElement('button'); rm.className = 'btn small'; rm.textContent = 'Retirer la page';
      rm.onclick = async () => {
        const reason = prompt('Motif du retrait (conservé 30 jours) :', r.reason);
        if (reason == null) return;
        await api('remove', { method: 'POST', body: JSON.stringify({ id: r.id, reason }) });
        await api('dismiss', { method: 'POST', body: JSON.stringify({ key: r.key }) });
        load();
      };
      const ok = document.createElement('button'); ok.className = 'btn small ghost'; ok.textContent = 'Classer sans suite';
      ok.onclick = async () => { await api('dismiss', { method: 'POST', body: JSON.stringify({ key: r.key }) }); load(); };
      actions.append(view, ' ', rm, ' ', ok);
      tr.append(cell(new Date(r.at).toLocaleString('fr-FR')), cell(r.id), cell(r.reason), cell(r.details), cell(r.email || '—'), actions);
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
