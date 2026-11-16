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
