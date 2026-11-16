# Guide de démarrage : de zéro à la première vente

Compte environ une demi-journée de démarches et 1 à 2 heures de configuration technique. Coût fixe : nom de domaine (environ 10 € par an) et médiateur de la consommation (quelques dizaines d'euros par an selon l'organisme). Pas d'abonnement obligatoire au départ.

---

## 1. Créer la micro-entreprise (avant la première vente)

1. **Déclaration** sur le guichet unique de l'INPI : https://formalites.entreprises.gouv.fr (gratuit).
   - Activité proposée : « création et vente en ligne de pages web personnalisées (contenus numériques) ».
   - La catégorie (BIC prestations de services ou BNC) détermine le taux de cotisations : **fais-la confirmer par l'Urssaf** au moment de la déclaration.
   - Options à étudier : ACRE (aide à la création) et versement libératoire de l'impôt.
2. **Franchise en base de TVA** : tu ne factures pas de TVA tant que ton chiffre d'affaires reste sous le seuil des services (37 500 € en 2026). La mention « TVA non applicable, art. 293 B du CGI » est déjà présente sur le site et sur les factures Stripe.
3. **Compte bancaire** : un compte dédié n'est obligatoire qu'après deux années consécutives au-dessus de 10 000 € de chiffre d'affaires, mais c'est plus simple dès le début (Shine, Qonto, ou un compte courant séparé).
4. **Médiateur de la consommation** : il est obligatoire pour vendre à des particuliers.
   - Adhère à un médiateur agréé, par exemple CM2C ou Médicys. Compare les tarifs.
   - La liste officielle est sur https://www.economie.gouv.fr/mediation-conso.
5. **Livre des recettes** : note chaque vente (date, montant, client, mode de paiement). L'export CSV du tableau de bord Stripe suffit.
6. **Déclare ton chiffre d'affaires** chaque mois ou chaque trimestre sur autoentrepreneur.urssaf.fr.
   - Cette déclaration se fait **sur les montants encaissés, et non sur les virements reçus** de Stripe (ceux-ci arrivent déjà diminués des frais Stripe).

## 2. Compléter les informations légales du site

Ouvre `site.config.json` et remplis :

```json
{
  "siteUrl": "https://unepagepourtoi.fr",
  "contactEmail": "contact@unepagepourtoi.fr",
  "editor": { "name": "Prénom Nom", "status": "Entrepreneur individuel (micro-entreprise)", "siret": "123 456 789 00012", "address": "…", "phone": "06 …" },
  "mediator": { "name": "Nom du médiateur", "url": "https://…", "address": "…" }
}
```

Le **téléphone est obligatoire** dans les mentions légales (loi LCEN) : tu peux utiliser un numéro secondaire (ligne virtuelle, forfait à 2 €).

Puis lance `npm run build`. La commande affiche un avertissement tant qu'une information manque.

> ⚠️ Les textes juridiques (CGV, confidentialité, règles de contenu) sont un **modèle sérieux**, mais ils n'ont pas été relus par un avocat. Une relecture par un juriste ou par la CCI (souvent gratuite pour les créateurs) est recommandée.

## 3. Nom de domaine

- `unepagepourtoi.fr` était **libre le 16/11/2026**. Achète-le vite, chez OVH, Gandi, IONOS ou un autre registrar (environ 7 à 12 € par an).
- Crée une adresse e-mail de contact sur ce domaine. La plupart des registrars proposent une redirection gratuite vers ta boîte Gmail.

## 4. Mettre le site en ligne (Cloudflare Pages, gratuit)

1. Crée un compte sur https://dash.cloudflare.com.
2. **Stockage** : Workers & Pages → KV → *Create namespace*, nommé `upt-pages`.
3. **Projet** : Workers & Pages → Create → Pages → *Connect to Git*, puis choisis ce dépôt GitHub. Réglages :
   - Build command : `npm run build`
   - Build output directory : `public`
   - Branche de production : celle qui contient ce code
4. Dans le projet, ouvre **Settings → Bindings** (« Functions » selon l'interface), puis ajoute un **KV namespace binding** :
   - Variable name : `PAGES_KV`
   - Namespace : `upt-pages`
   - À faire pour *Production* **et** pour *Preview*.
5. Dans **Settings → Variables and Secrets**, ajoute (en type *Secret* pour les clés) :

   | Nom | Valeur |
   |---|---|
   | `STRIPE_SECRET_KEY` | clé secrète Stripe (`sk_test_…` pour tester, puis `sk_live_…`) |
   | `STRIPE_WEBHOOK_SECRET` | `whsec_…` (étape 5) |
   | `ADMIN_TOKEN` | une longue chaîne aléatoire (voir ci-dessous) |
   | `SITE_URL` | `https://unepagepourtoi.fr` |

   ⚠️ **Ne définis jamais `DEV_FAKE_PAYMENT` en production.** Ce mode ne fonctionne de toute façon que sur `localhost`.

   Pour générer un `ADMIN_TOKEN` de 64 caractères : `openssl rand -hex 32`. Garde-le précieusement : il ouvre la page `/admin`.
6. **Domaine** : Custom domains → ajoute `unepagepourtoi.fr`, puis suis les instructions DNS.
7. **Protection anti-abus (OBLIGATOIRE avant le lancement, gratuit)** : Security → WAF → *Rate limiting rules*. Crée une règle sur les requêtes dont le chemin commence par `/api/` et la méthode est `POST` ou `PUT`, limitée à environ 40 requêtes par minute et par adresse IP, avec blocage pendant 10 minutes. Sans cette règle, un petit malin peut épuiser le quota d’écritures gratuit en quelques minutes et bloquer les publications.

### Limites du plan gratuit
- **Cloudflare KV gratuit** : 1 000 écritures par jour. Une page avec 10 photos consomme environ 22 écritures (brouillon, photos, puis prolongation au paiement), soit **environ 40 à 80 pages par jour**.
- Au-delà, passe au plan **Workers Paid** à 5 $ par mois (1 million d'écritures par mois).

## 5. Stripe

1. Crée un compte sur https://dashboard.stripe.com, en France, avec le statut « entreprise individuelle ».
   - Renseigne ton SIRET, ton IBAN et le nom public affiché (« Une page pour toi »).
2. **Mode test d'abord** :
   1. Mets la clé `sk_test_…` dans Cloudflare.
   2. Achète une page avec la carte de test `4242 4242 4242 4242` (n'importe quelle date future, n'importe quel code CVC).
   3. Vérifie que la page s'affiche.
3. **Webhook** : Developers → Webhooks → *Add endpoint*.
   - URL : `https://unepagepourtoi.fr/api/stripe-webhook`
   - Événements : `checkout.session.completed` et `checkout.session.async_payment_succeeded`
   - Copie le *Signing secret* (`whsec_…`) dans `STRIPE_WEBHOOK_SECRET`.
   - Le webhook sert de filet de sécurité si l'acheteur ferme l'onglet avant la page « merci ».
4. **E-mails clients** : Settings → Customer emails → active « Successful payments » **et** l’envoi des factures payées. La facture contient la confirmation de la renonciation au droit de rétractation et la version des CGV : c’est ta preuve sur « support durable », exigée par la loi. Fais un achat test et vérifie que la facture arrive bien par e-mail.
5. **Factures** : le site demande à Stripe de générer une facture à chaque vente. Elle porte la mention 293 B et la renonciation au droit de rétractation.
   - Stripe peut facturer ce service : vérifie leur grille.
   - Pour le désactiver, ajoute la variable `STRIPE_INVOICE=0`. Garde-le de préférence : c'est ta preuve de renonciation.
6. **Codes promo pour les influenceurs** : Products → Coupons → crée un coupon (par exemple −30 %), puis un *Promotion code* (par exemple `LEA30`). Le champ code promo apparaît automatiquement au paiement.
7. Passe en **mode live** : remplace la clé par `sk_live_…` et recrée le webhook en mode live (le secret change).

## 6. Tester en local (facultatif)

```bash
npm install
printf 'DEV_FAKE_PAYMENT=1\nADMIN_TOKEN=un_jeton_de_test_tres_long_0123456789abcdef\n' > .dev.vars
npm run dev        # http://localhost:8788 — le paiement est simulé
npm test           # tests unitaires
```

## 7. Au quotidien

- **Modération** : ouvre `https://ton-domaine/admin` et colle ton `ADMIN_TOKEN`.
  - Traite les signalements **sous 24 à 48 heures**.
  - « Retirer la page » supprime le contenu et les photos.
  - Si tu retires une page, préviens l'acheteur par e-mail (adresse visible dans Stripe) avec le motif.
- **Demandes RGPD ou de suppression** : une personne qui apparaît sur une page sans son accord ? Retire la page depuis `/admin`.
- **« Satisfait ou remboursé 14 jours »** (promis dans les CGV) : sur demande par e-mail dans les 14 jours, rembourse depuis Stripe (Paiements → Rembourser), puis retire la page depuis `/admin` (ou demande au client de la supprimer avec son lien de modification).
- **Paiement sans page** : si les journaux Cloudflare affichent « PAIEMENT SANS PAGE », rembourse ce paiement dans Stripe (cas rarissime : brouillon expiré ou supprimé pendant le paiement).
- **Double paiement** (le client a payé deux fois la même page) : rembourse le second paiement dans Stripe.
- **Retrait d’une page** : préviens l’acheteur par e-mail (adresse dans Stripe) en indiquant la mesure prise, les faits, la règle enfreinte, que la décision n’est pas automatisée, et ses recours (te répondre, médiateur, juge). Obligation du DSA.
- **Lien de modification perdu** : il n'existe pas de récupération automatique en V1. Tu peux retrouver l'identifiant de la page dans Stripe (métadonnée `page_id`), mais pas le jeton. Améliore ce point en V2 : envoi du lien par e-mail, via Brevo ou Resend.
