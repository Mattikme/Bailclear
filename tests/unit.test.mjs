import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { validateContent, ValidationError, imageType, musicEmbed } from '../lib/validate.js';
import { verifyWebhook, buildCheckoutParams } from '../lib/stripe.js';
import { hmacSha256Hex, randomId, ID_RE, safeEqual } from '../lib/crypto.js';
import { PRICE_CENTS, PRICE_LABEL, PREMIUM_LABEL, MAX_PHOTOS, priceFor } from '../lib/config.js';
import { normalizeAnswer, daysSince } from '../public/assets/js/render.js';

const base = { occasion: 'saint-valentin', theme: 'rose', to: 'Léa', title: 'Coucou' };

test('validateContent : champs obligatoires', () => {
  assert.throws(() => validateContent({ ...base, to: '' }), ValidationError);
  assert.throws(() => validateContent({ ...base, title: '  ' }), ValidationError);
  assert.throws(() => validateContent(null), ValidationError);
});

test('validateContent : nettoyage et valeurs par défaut', () => {
  const c = validateContent({ ...base, occasion: 'inconnue', theme: 'xxx', to: ' Léa‮ ', letter: 'a\r\nb\u0000', date: '2022-13-45' });
  assert.equal(c.occasion, 'saint-valentin');
  assert.equal(c.theme, 'rose');
  assert.equal(c.to, 'Léa');
  assert.equal(c.letter, 'a\nb');
  assert.equal(c.date, '');
  assert.equal(c.secret, null);
});

test('validateContent : limites', () => {
  assert.throws(() => validateContent({ ...base, letter: 'x'.repeat(5001) }), ValidationError);
  assert.throws(() => validateContent({ ...base, photos: Array(MAX_PHOTOS + 1).fill({}) }), ValidationError);
  assert.throws(() => validateContent({ ...base, to: 123 }), ValidationError);
  const c = validateContent({ ...base, reasons: ['a', '', '  '], timeline: [{ when: '', text: '' }, { when: '2020', text: 'x' }] });
  assert.deepEqual(c.reasons, ['a']);
  assert.equal(c.timeline.length, 1);
});

test('validateContent : question secrète et musique', () => {
  const h = 'a'.repeat(64);
  assert.deepEqual(validateContent({ ...base, secret: { question: 'Où ?', answerHash: h } }).secret, { question: 'Où ?', answerHash: h });
  assert.equal(validateContent({ ...base, secret: { question: 'Où ?', answerHash: 'nope' } }).secret, null);
  assert.throws(() => validateContent({ ...base, music: 'https://evil.example/x' }), ValidationError);
  assert.ok(validateContent({ ...base, music: 'https://youtu.be/dQw4w9WgXcQ' }));
});

test('musicEmbed', () => {
  assert.equal(musicEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3').provider, 'youtube');
  assert.equal(musicEmbed('https://open.spotify.com/intl-fr/track/4uLU6hMCjMI75M1A2tKUQC?si=1').provider, 'spotify');
  assert.equal(musicEmbed('javascript:alert(1)'), null);
  assert.equal(musicEmbed('https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ'), null);
});

test('imageType reconnaît les signatures', () => {
  assert.equal(imageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]).buffer), 'image/jpeg');
  assert.equal(imageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]).buffer), 'image/png');
  assert.equal(imageType(new TextEncoder().encode('<svg onload=alert(1)>').buffer), null);
});

test('webhook Stripe : signature', async () => {
  const secret = 'whsec_test';
  const payload = '{"id":"evt_1"}';
  const t = 1_700_000_000;
  const sig = await hmacSha256Hex(secret, `${t}.${payload}`);
  assert.equal(await verifyWebhook(secret, payload, `t=${t},v1=${sig}`, t + 10), true);
  assert.equal(await verifyWebhook(secret, payload + ' ', `t=${t},v1=${sig}`, t + 10), false);
  assert.equal(await verifyWebhook(secret, payload, `t=${t},v1=${sig}`, t + 1000), false);
  assert.equal(await verifyWebhook('autre', payload, `t=${t},v1=${sig}`, t + 10), false);
  assert.equal(await verifyWebhook(secret, payload, null), false);
});

test('paramètres Checkout', () => {
  const p = buildCheckoutParams({ pageId: 'abcdefghijkm', origin: 'https://x.fr', priceCents: PRICE_CENTS, productName: 'P', invoice: true, termsVersion: '2026-11-16', expiresAt: 123 });
  assert.equal(p.expires_at, 123);
  assert.match(p.invoice_creation.invoice_data.footer, /2026-11-16/);
  assert.equal(p.metadata.page_id, 'abcdefghijkm');
  assert.equal(p.line_items[0].price_data.unit_amount, PRICE_CENTS);
  assert.match(p.success_url, /^https:\/\/x\.fr\/merci\?id=abcdefghijkm&session_id=\{CHECKOUT_SESSION_ID\}$/);
  assert.match(p.invoice_creation.invoice_data.footer, /293 B/);
});

test('identifiants et comparaisons', () => {
  for (let i = 0; i < 50; i++) assert.match(randomId(), ID_RE);
  assert.equal(safeEqual('abc', 'abc'), true);
  assert.equal(safeEqual('abc', 'abd'), false);
  assert.equal(safeEqual('abc', 'ab'), false);
});

test('réponse secrète normalisée', () => {
  assert.equal(normalizeAnswer('  Café de la PLACE ! '), 'cafe de la place');
  assert.equal(normalizeAnswer('Saint-Étienne'), 'saint etienne');
});

test('compteur de jours', () => {
  assert.equal(daysSince('2026-01-01', new Date(2026, 0, 11)), 10);
  assert.equal(daysSince(''), null);
});

test('le prix affiché dans les pages correspond au prix facturé', () => {
  assert.equal(PRICE_LABEL, (PRICE_CENTS / 100).toFixed(2).replace('.', ',') + ' €');
  const dir = new URL('../public/', import.meta.url);
  for (const f of ['index.html', 'creer.html', 'cgv.html', 'saint-valentin.html']) {
    const html = readFileSync(new URL(f, dir), 'utf8');
    assert.ok(html.includes(PRICE_LABEL), `${f} doit afficher ${PRICE_LABEL}`);
    const others = [...html.matchAll(/(\d+,\d{2}) €/g)].map((m) => m[1] + ' €').filter((x) => x !== PRICE_LABEL && x !== PREMIUM_LABEL);
    assert.deepEqual(others, [], `${f} contient un autre prix`);
  }
  assert.ok(readdirSync(dir).includes('_headers'));
});

test('les occasions ne masquent aucune page système', async () => {
  const { OCCASION_IDS } = await import('../public/assets/js/occasions.js');
  const reserved = ['index', 'creer', 'merci', 'admin', 'voir', 'cgv', 'confidentialite', 'mentions-legales', 'regles-de-contenu', '404', 'p', 'api', 'assets'];
  for (const id of OCCASION_IDS) assert.ok(!reserved.includes(id), `occasion « ${id} » réservée`);
  assert.equal(new Set(OCCASION_IDS).size, OCCASION_IDS.length);
});

test('paiement abouti (y compris code promo à 100 %)', async () => {
  const { isSessionPaid } = await import('../lib/stripe.js');
  assert.equal(isSessionPaid({ payment_status: 'paid', status: 'complete' }), true);
  assert.equal(isSessionPaid({ payment_status: 'no_payment_required', status: 'complete' }), true);
  assert.equal(isSessionPaid({ payment_status: 'no_payment_required', status: 'open' }), false);
  assert.equal(isSessionPaid({ payment_status: 'unpaid', status: 'complete' }), false);
});

test('paiement simulé refusé hors localhost ou avec une clé réelle', async () => {
  const { devFakePayment } = await import('../lib/http.js');
  const req = (host) => new Request(`http://${host}/api/checkout`);
  assert.equal(devFakePayment({ DEV_FAKE_PAYMENT: '1' }, req('localhost:8788')), true);
  assert.equal(devFakePayment({ DEV_FAKE_PAYMENT: '1' }, req('unepagepourtoi.fr')), false);
  assert.equal(devFakePayment({ DEV_FAKE_PAYMENT: '1', STRIPE_SECRET_KEY: 'sk_live_x' }, req('localhost')), false);
  assert.equal(devFakePayment({}, req('localhost')), false);
});

test('moment de départ de la musique', async () => {
  const { startFromUrl, parseTime, formatTime } = await import('../public/assets/js/render.js');
  assert.equal(startFromUrl('https://youtu.be/2Vv-BfVoq4g?t=65'), 65);
  assert.equal(startFromUrl('https://www.youtube.com/watch?v=2Vv-BfVoq4g&t=1m05s'), 65);
  assert.equal(startFromUrl('https://www.youtube.com/watch?v=2Vv-BfVoq4g'), 0);
  assert.equal(parseTime('1:05'), 65);
  assert.equal(parseTime('90'), 90);
  assert.equal(parseTime(''), 0);
  assert.equal(parseTime('1:75'), null);
  assert.equal(formatTime(65), '1:05');
  assert.equal(validateContent({ ...base, music: 'https://youtu.be/dQw4w9WgXcQ', musicStart: 65 }).musicStart, 65);
  assert.equal(validateContent({ ...base, music: 'https://youtu.be/dQw4w9WgXcQ', musicStart: -3 }).musicStart, 0);
  assert.equal(validateContent({ ...base, musicStart: 65 }).musicStart, 0);
});

test('offre de lancement gratuite jusqu’au 30 novembre inclus (heure de Paris)', async () => {
  const { freeLaunch } = await import('../lib/config.js');
  assert.equal(freeLaunch({}, Date.parse('2026-11-30T23:59:00+01:00')), true);
  assert.equal(freeLaunch({}, Date.parse('2026-12-01T00:00:00+01:00')), false);
  assert.equal(freeLaunch({ FREE_UNTIL: '2026-12-15T00:00:00+01:00' }, Date.parse('2026-12-05T12:00:00+01:00')), true);
});

test('compteur de visites : chemins, robots et jour à Paris', async () => {
  const { cleanPath, isBot, parisDay } = await import('../lib/stats.js');
  assert.equal(cleanPath('/'), '/');
  assert.equal(cleanPath('/saint-valentin'), '/saint-valentin');
  for (const bad of ['/p/abc', '/admin', '/api/hit', '/assets/x', '/a/b', '/UPPER', '/' + 'a'.repeat(41), '', null, '//x']) assert.equal(cleanPath(bad), null, String(bad));
  assert.equal(isBot('Mozilla/5.0 (compatible; Googlebot/2.1)'), true);
  assert.equal(isBot('Mozilla/5.0 (Linux; Android 14) Chrome/120 Mobile Safari/537.36'), false);
  assert.equal(parisDay(Date.parse('2026-11-30T23:30:00Z')), '2026-12-01'); // 00 h 30 à Paris
  assert.equal(parisDay(Date.parse('2026-11-30T12:00:00Z')), '2026-11-30');
});

test('vidéo : un texte trop long est coupé à la fin d’une phrase', async () => {
  const { cutAtSentence } = await import('../public/assets/js/montage.js');
  assert.equal(cutAtSentence('Court.', 100), 'Court.');
  const t = 'Première phrase complète. Deuxième phrase qui continue encore longtemps sans fin';
  assert.equal(cutAtSentence(t, 60), 'Première phrase complète.');
  assert.ok(!cutAtSentence('mots '.repeat(40), 50).endsWith(' '));
});

test('quiz : réponses vides retirées, bonne réponse suivie, questions incomplètes ignorées', () => {
  const c = validateContent({ ...base, quiz: [
    { q: 'Premier rendez-vous ?', answers: ['', 'Cinéma', 'Resto'], correct: 2 },
    { q: 'Sans réponses', answers: ['A'], correct: 0 },
    { q: 'Bonne réponse vide', answers: ['A', 'B', ''], correct: 2 },
    ...Array.from({ length: 6 }, (_, i) => ({ q: `Q${i}`, answers: ['x', 'y'], correct: 1 })),
  ] });
  assert.deepEqual(c.quiz[0], { q: 'Premier rendez-vous ?', answers: ['Cinéma', 'Resto'], correct: 1 });
  assert.equal(c.quiz.length, 3); // 5 premières entrées examinées, 2 invalides
  assert.throws(() => validateContent({ ...base, quiz: [{ q: 'x'.repeat(101), answers: ['a', 'b'], correct: 0 }] }), ValidationError);
});

test('ouverture programmée : date valide gardée, absurde ignorée, page verrouillée avant l’heure', async () => {
  const { isLocked } = await import('../lib/store.js');
  const soon = new Date(Date.now() + 86400000).toISOString();
  assert.equal(validateContent({ ...base, openAt: soon }).openAt, soon);
  assert.equal(validateContent({ ...base, openAt: 'demain' }).openAt, '');
  assert.equal(validateContent({ ...base, openAt: '2099-01-01T00:00:00Z' }).openAt, '');
  assert.equal(isLocked({ content: { openAt: soon } }), true);
  assert.equal(isLocked({ content: { openAt: soon } }, Date.now() + 2 * 86400000), false);
  assert.equal(isLocked({ content: { openAt: '' } }), false);
});

test('langues : toutes les traductions sont complètes, langue inconnue → français', async () => {
  const { LANG_IDS, t, sectionTitles } = await import('../public/assets/js/i18n.js');
  const { OCCASIONS } = await import('../public/assets/js/occasions.js');
  const src = readFileSync(new URL('../public/assets/js/i18n.js', import.meta.url), 'utf8');
  const block = (l) => { const i = src.indexOf(`  ${l}: {`); return src.slice(i, src.indexOf('\n  },', i)); };
  const keys = [...block('fr').matchAll(/(\w+): '/g)].map((m) => m[1]);
  assert.ok(keys.length > 30);
  for (const lang of LANG_IDS) {
    for (const k of keys) assert.match(block(lang), new RegExp(`\\b${k}: '`), `${lang}.${k}`);
    for (const o of OCCASIONS) { const s = sectionTitles(lang, o); assert.ok(s.timeline && s.reasons, `${lang} ${o.id}`); }
  }
  assert.equal(t('en', 'for', { to: 'Léa' }), 'For Léa');
  assert.equal(validateContent({ ...base, lang: 'de' }).lang, 'de');
  assert.equal(validateContent({ ...base, lang: 'xx' }).lang, 'fr');
});

test('prix : 4,90 € de base, 9,90 € dès qu’une option premium est utilisée', () => {
  const plain = validateContent({ ...base, quiz: [{ q: 'Q', answers: ['a', 'b'], correct: 0 }], lang: 'en' });
  assert.equal(priceFor(plain).cents, 490);
  assert.equal(priceFor(validateContent({ ...base, voice: { duration: 12 } })).cents, 990);
  assert.equal(priceFor(validateContent({ ...base, group: true })).cents, 990);
  const p = priceFor(validateContent({ ...base, openAt: new Date(Date.now() + 3600e3).toISOString(), group: true }));
  assert.deepEqual([p.cents, p.premium], [990, ['carte de groupe', 'ouverture programmée']]);
});
