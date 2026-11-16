// Bandeau « offre de lancement » sur les pages du site (pas sur les pages offertes).
import { isFreeLaunch, FREE_UNTIL_LABEL } from './launch.js';

if (isFreeLaunch()) {
  const bar = document.createElement('div');
  bar.className = 'launch-bar';
  const a = document.createElement('a');
  a.href = '/creer';
  a.textContent = `🎉 Ouverture du site : la création de pages est gratuite jusqu’au ${FREE_UNTIL_LABEL} ! Crée la tienne →`;
  bar.append(a);
  document.body.prepend(bar);
  document.querySelectorAll('[data-free-note]').forEach((el) => {
    el.textContent = `Offre de lancement : gratuit jusqu’au ${FREE_UNTIL_LABEL}, puis ${el.dataset.freeNote}.`;
    el.hidden = false;
  });
}
