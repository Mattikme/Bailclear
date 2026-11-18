# Affiliation : gagner une commission sur les idées cadeaux

Les guides `/idees/...` contiennent des fiches cadeaux avec des liens vers Amazon, Cdiscount et Fnac.
Tant que tu n'es pas inscrit, les liens marchent mais ne rapportent rien.

## 1. S'inscrire

**Amazon Partenaires** : https://partenaires.amazon.fr
- Gratuit.
- Tu reçois un identifiant (« tag »), du type `unepagepourtoi-21`.
- ⚠️ Il faut **3 ventes dans les 180 jours** après l'inscription, sinon le compte est refusé et l'identifiant ne peut pas être réactivé. Inscris-toi donc juste avant un pic de trafic (Noël, Saint-Valentin).
- Commission : quelques % selon la catégorie de produit.

**Awin** (Cdiscount, Fnac, et beaucoup d'autres marchands) : https://www.awin.com/fr
- Inscription éditeur gratuite.
- Tu demandes ensuite à rejoindre les programmes Cdiscount (id 6948) et Fnac.

## 2. Activer les liens

Dans `site.config.json`, rubrique `affiliate`, remplis `amazonTag` et `awinPublisherId` (et `awinFnacId` si accepté), puis lance `npm run deploy:worker`.

Une fois les identifiants remplis, ces mentions apparaissent automatiquement :
- la mention obligatoire « En tant que Partenaire Amazon… » ;
- la mention « liens affiliés » près des fiches ;
- la rubrique correspondante dans les mentions légales.

## 3. Règles à respecter (Amazon)

- **Pas de prix ni de photos Amazon copiés** : les fiches utilisent nos propres illustrations et des tranches de budget. Les vraies photos ne sont possibles qu'avec l'API produit (ouverte après 3 ventes).
- **Pas de liens Amazon hors ligne** : carte imprimée, PDF, livre, ni dans la vidéo souvenir.
- **Pas de lien raccourci**, pas d'envoi de liens par e-mail ou SMS non sollicité.
- **Pas de publicité payante** sur la marque Amazon.

## 4. Statut et impôts

- Les commissions sont un revenu imposable : il faut une micro-entreprise. La même que pour la vente des pages suffit, en ajoutant l'activité.
- **TVA** : si le contrat est signé avec Amazon Europe Core (Luxembourg), il faut mentionner « Autoliquidation » sur les factures et faire une déclaration européenne de services dès le premier euro, même en franchise de TVA.
- Fais valider ces points par l'Urssaf ou un comptable.
