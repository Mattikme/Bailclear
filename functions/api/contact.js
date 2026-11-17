// Formulaire de contact : envoie le message par e-mail à l'éditeur (Cloudflare Email Routing, binding send_email).
import { EmailMessage } from 'cloudflare:email';
import { error, handle, json, readJson } from '../../lib/http.js';

const FROM = 'contact@unepagepourtoi.fr';
const clean = (s, max) => String(s || '').replace(/[\r\n]+/g, ' ').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);

function b64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export function buildRaw({ to, replyTo, subject, body, now = new Date(), id = crypto.randomUUID() }) {
  const lines = (b64(body).match(/.{1,76}/g) || []).join('\r\n');
  return [
    `From: "Une page pour toi" <${FROM}>`,
    `To: <${to}>`,
    `Reply-To: <${replyTo}>`,
    `Subject: =?UTF-8?B?${b64(subject)}?=`,
    `Message-ID: <${id}@unepagepourtoi.fr>`,
    `Date: ${now.toUTCString()}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    lines,
  ].join('\r\n');
}

export const onRequestPost = handle(async ({ request, env }) => {
  if (env.CREATE_LIMITER) {
    const { success } = await env.CREATE_LIMITER.limit({ key: `contact:${request.headers.get('cf-connecting-ip') || 'local'}` });
    if (!success) return error('Trop de messages en peu de temps. Réessaie dans une minute.', 429);
  }
  const b = await readJson(request, 8 * 1024);
  if (b.website) return json({ ok: true }); // pot de miel : robot
  const email = clean(b.email, 200);
  const name = clean(b.name, 80);
  const message = String(b.message || '').replace(/\r\n?/g, '\n').slice(0, 3000).trim();
  if (!/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(email)) return error('Adresse e-mail invalide.', 400);
  if (message.length < 10) return error('Message trop court.', 400);
  if (!env.CONTACT_EMAIL || !env.CONTACT_TO) return error(`Le formulaire est momentanément indisponible : écris-nous à ${FROM}.`, 503);
  const body = `Nouveau message depuis le formulaire de contact\n\nDe : ${name || '(sans prénom)'} <${email}>\nDate : ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}\n\n${message}\n\n— Réponds directement à cet e-mail pour lui écrire.`;
  const raw = buildRaw({ to: env.CONTACT_TO, replyTo: email, subject: `Contact : ${name || email}`, body });
  await env.CONTACT_EMAIL.send(new EmailMessage(FROM, env.CONTACT_TO, raw));
  return json({ ok: true });
});
