// Offre de lancement : bandeau, prix barré et mention « 1 page offerte par personne » sur les pages du site.
// Tout disparaît automatiquement à la fin de l'offre (le prix normal réapparaît seul).
import { isFreeLaunch, FREE_UNTIL_LABEL } from './launch.js';

if (isFreeLaunch()) {
  const bar = document.createElement('div');
  bar.className = 'launch-bar';
  const a = document.createElement('a');
  a.href = '/creer';
  a.textContent = `Offre de lancement : une page offerte par personne jusqu’au ${FREE_UNTIL_LABEL}. Créer ma page`;
  bar.append(a);
  document.body.prepend(bar);

  const priceLabel = (document.querySelector('[data-free-note]') || {}).dataset;
  const price = priceLabel ? priceLabel.freeNote : '';

  // Encart de prix : prix normal barré + « Offert »
  document.querySelectorAll('.price-box .amount').forEach((el) => {
    const was = document.createElement('s');
    was.className = 'was';
    was.textContent = el.textContent.trim();
    const now = document.createElement('span');
    now.className = 'now';
    now.textContent = 'Offert';
    el.replaceChildren(was, now);
  });

  // Lignes « 9,90 € · aperçu gratuit… » : prix barré + « offert »
  if (price) {
    document.querySelectorAll('.price-note:not(.free-note)').forEach((el) => {
      const t = el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild.textContent : '';
      if (!t.startsWith(price)) return;
      const was = document.createElement('s');
      was.textContent = price;
      const now = document.createElement('strong');
      now.textContent = ' offert';
      el.firstChild.textContent = t.slice(price.length);
      el.prepend(was, now);
    });
  }

  document.querySelectorAll('[data-free-note]').forEach((el) => {
    el.textContent = `Offre de lancement : une page offerte par personne jusqu’au ${FREE_UNTIL_LABEL}, puis ${el.dataset.freeNote} la page.`;
    el.hidden = false;
  });
}
