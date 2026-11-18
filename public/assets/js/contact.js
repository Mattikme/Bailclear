const $ = (id) => document.getElementById(id);
const form = $('contact-form');
const status = (text, kind = '') => { const s = $('contact-status'); s.textContent = text; s.className = `notice ${kind}`; s.hidden = !text; };

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('c-email').value.trim();
  const message = $('c-message').value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { status('Indique une adresse e-mail valide pour qu’on puisse te répondre.', 'error'); $('c-email').focus(); return; }
  if (message.length < 10) { status('Ton message est un peu court (10 caractères minimum).', 'error'); $('c-message').focus(); return; }
  $('contact-send').disabled = true;
  status('Envoi…');
  try {
    const res = await fetch('/api/contact', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: $('c-name').value, email, message, website: $('c-website').value }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'L’envoi a échoué.');
    form.reset();
    status('Merci, ton message est bien parti ! On te répond très vite.', 'ok');
  } catch (err) {
    status(err.message, 'error');
  } finally {
    $('contact-send').disabled = false;
  }
});
