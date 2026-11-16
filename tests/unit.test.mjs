import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { validateContent, ValidationError, imageType, musicEmbed } from '../lib/validate.js';
import { verifyWebhook, buildCheckoutParams } from '../lib/stripe.js';
import { hmacSha256Hex, randomId, ID_RE, safeEqual } from '../lib/crypto.js';
import { PRICE_CENTS, PRICE_LABEL, MAX_PHOTOS } from '../lib/config.js';
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
    const others = [...html.matchAll(/(\d+,\d{2}) €/g)].map((m) => m[1] + ' €').filter((x) => x !== PRICE_LABEL);
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
