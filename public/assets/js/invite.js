// Lien d'invitation d'une carte de groupe, calculé dans le navigateur à partir du jeton du créateur.
import { sha256Hex } from './render.js';

export async function inviteLink(id, token) {
  const key = (await sha256Hex(`${await sha256Hex(token)}:invite`)).slice(0, 24);
  return `${location.origin}/ecrire?p=${id}#k=${key}`;
}

export function inviteText(to, from, link) {
  return `${from ? `${from} prépare` : 'Je prépare'} une page surprise pour ${to || 'quelqu’un de cher'} 🎁 Tu veux y écrire un petit mot ? Ça prend 1 minute :\n${link}\n(Chut, c’est une surprise 🤫)`;
}
