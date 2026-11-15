# BailClear (`bailclear.fr`) — Livraison Production v1.0

Application web statique de calcul de révision annuelle de loyer (IRL INSEE), contrôle de conformité juridique (Loi ALUR prescription 1 an & gel DPE F/G), calcul de prorata temporis et génération de courrier officiel + quittance au format A4.

## Configuration avant mise en ligne (2 minutes)
1. **Stripe Payment Link (9,00 € TTC)** :
   - Créez un lien de paiement sur Stripe.
   - Configurez la redirection après paiement vers : `https://bailclear.fr/?unlocked=BAILCLEAR-PRO-2026`
   - Ouvrez `assets/js/app.js` (ligne 11) et remplacez `STRIPE_PAYMENT_LINK` par votre lien Stripe.
2. **Mentions légales** :
   - Renseignez votre nom/statut et e-mail de contact dans `mentions-legales.html`, `confidentialite.html` et `cgv.html`.

## Déploiement Cloudflare Pages (0 €/mois)
- **Méthode 1 (Direct Upload)** : Glissez-déposez directement ce fichier `.zip` dans Cloudflare Pages > *Create a project* > *Upload assets*.
- **Méthode 2 (GitHub)** : Poussez le contenu du dossier sur un dépôt GitHub, puis connectez-le à Cloudflare Pages (Framework preset : `None`, Build command : vide, Output directory : `/`).
