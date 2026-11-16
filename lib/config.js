// Paramètres commerciaux et techniques. Le prix affiché dans les pages HTML doit correspondre (vérifié par les tests).
export const PRICE_CENTS = 990;
export const PRICE_LABEL = '9,90 €';
export const PRODUCT_NAME = 'Page cadeau personnalisée — Une page pour toi';
export const SITE_NAME = 'Une page pour toi';

export const DRAFT_TTL_SECONDS = 48 * 3600; // brouillon envoyé mais non payé : effacé après 48 h
export const PUBLISHED_DAYS = 730; // page payée : hébergée 2 ans
export const REMOVED_TTL_SECONDS = 30 * 24 * 3600; // trace d'une page retirée (modération), sans contenu
export const REPORT_TTL_SECONDS = 365 * 24 * 3600;

export const MAX_PHOTOS = 10;
export const MAX_PHOTO_BYTES = 900 * 1024;
export const MAX_BODY_BYTES = 64 * 1024;

// Version des CGV acceptées (à changer à chaque modification des CGV).
export const TERMS_VERSION = '2026-11-16';
export const LOG_TTL_SECONDS = 365 * 24 * 3600; // données d'identification des créateurs (LCEN art. 6)
export const PROOF_TTL_SECONDS = 5 * 365 * 24 * 3600; // preuve de commande et de renonciation (prescription)

// Offre de lancement (voir public/assets/js/launch.js). La variable d'environnement FREE_UNTIL peut la prolonger.
export { FREE_UNTIL } from '../public/assets/js/launch.js';
import { FREE_UNTIL as DEFAULT_FREE_UNTIL } from '../public/assets/js/launch.js';
export function freeLaunch(env, now = Date.now()) {
  const until = Date.parse((env && env.FREE_UNTIL) || DEFAULT_FREE_UNTIL);
  return Number.isFinite(until) && now < until;
}

// Offre de lancement : pages gratuites maximum par connexion (adresse IP) et par 24 h.
export const FREE_PER_IP_PER_DAY = 2;
