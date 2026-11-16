import { MAX_BODY_BYTES, TERMS_VERSION } from '../../../lib/config.js';
import { randomId, randomToken, sha256Hex } from '../../../lib/crypto.js';
import { handle, json, error, readJson } from '../../../lib/http.js';
import { newDraft, savePage } from '../../../lib/store.js';
import { validateContent, ValidationError } from '../../../lib/validate.js';

// Crée un brouillon juste avant le paiement. Le contenu n'est jamais public tant qu'il n'est pas payé.
export const onRequestPost = handle(async ({ request, env }) => {
  const body = await readJson(request, MAX_BODY_BYTES);
  if (!body.consent || body.consent.terms !== true || body.consent.waiver !== true) {
    return error('Tu dois accepter les CGV et la renonciation au droit de rétractation.', 400);
  }
  let content;
  try {
    content = validateContent(body.content);
  } catch (e) {
    if (e instanceof ValidationError) return error(e.message, 422);
    throw e;
  }
  const id = randomId();
  const token = randomToken();
  const consent = { terms: true, waiver: true, termsVersion: TERMS_VERSION, at: new Date().toISOString() };
  const page = newDraft(id, await sha256Hex(token), content, consent);
  await savePage(env, page);
  return json({ id, token, expiresAt: page.expiresAt }, 201);
});
