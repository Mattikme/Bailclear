// Prix d'une page selon les options utilisées (partagé par le navigateur et le serveur).
export const BASE_CENTS = 490;
export const BASE_LABEL = '4,90 €';
export const PREMIUM_CENTS = 990;
export const PREMIUM_LABEL = '9,90 €';

// Options premium : celles qui coûtent du stockage ou de la modération.
export const PREMIUM_OPTIONS = [
  { key: 'voice', label: 'message vocal', used: (c) => Boolean(c.voice) },
  { key: 'group', label: 'carte de groupe', used: (c) => Boolean(c.group) },
  { key: 'openAt', label: 'ouverture programmée', used: (c) => Boolean(c.openAt) },
];

export function premiumUsed(content) {
  return content ? PREMIUM_OPTIONS.filter((o) => o.used(content)).map((o) => o.label) : [];
}

export function priceFor(content) {
  const premium = premiumUsed(content);
  return premium.length
    ? { cents: PREMIUM_CENTS, label: PREMIUM_LABEL, premium }
    : { cents: BASE_CENTS, label: BASE_LABEL, premium };
}
