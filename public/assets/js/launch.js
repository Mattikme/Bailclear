// Offre de lancement : publication gratuite jusqu'à cette date (exclue), puis payante automatiquement.
// Partagé par le navigateur (bandeau, éditeur) et le serveur (qui fait foi).
export const FREE_UNTIL = '2026-12-01T00:00:00+01:00'; // = jusqu'au 30 novembre 2026 inclus, heure de Paris
export const FREE_UNTIL_LABEL = '30 novembre';

export function isFreeLaunch(now = Date.now()) {
  return now < Date.parse(FREE_UNTIL);
}
