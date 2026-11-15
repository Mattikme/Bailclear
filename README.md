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


## État des fonctionnalités et limites techniques

- Espace bailleur : plusieurs dossiers, historique des révisions, import/export JSON et rappel visible à l'ouverture du site dans les 30 jours précédant la date anniversaire. Les données restent dans le stockage local du navigateur ; pas de synchronisation ni d'alerte lorsque le site est fermé.
- Le document de seconde page est un avis d'échéance, pas une quittance. Il ne certifie pas le paiement. Une quittance ne doit être émise qu'après encaissement intégral.
- L'ancien déverrouillage Pro par code JavaScript et paramètre URL est désactivé : un code public est contournable. L'activation payante exige une vérification Stripe côté serveur.
- La synchronisation automatique des IRL exige une source INSEE/API intégrée avec une politique d'accès adaptée. Vérifier les indices avant toute notification.
- Comptes, synchronisation multi-appareils, alertes e-mail et paiements vérifiés nécessitent un backend, une base de données et des secrets de déploiement. Ces services ne sont pas présents dans ce dépôt et ne sont pas annoncés comme actifs.

Le site reste une application statique Cloudflare Pages. Ne stockez pas de pièces d'identité ou de données sensibles dans les dossiers locaux.
