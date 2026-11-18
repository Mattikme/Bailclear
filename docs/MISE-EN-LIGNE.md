# Mise en ligne : domaine, e-mail, Google, visibilité

Chaque étape indique qui la fait : 👤 toi ou 🤖 Claude.

## Étape 1 — Acheter le domaine 👤 (10 min, environ 7 à 12 € par an)

1. Va chez un registrar français, par exemple **OVHcloud** (ovhcloud.com) ou **Gandi** (gandi.net).
2. Cherche **`unepagepourtoi.fr`**. Il était libre le 16/11/2026.
3. Prends **uniquement le nom de domaine**. Refuse l'hébergement, l'e-mail payant et le « site web » : on a déjà tout.
4. **Données personnelles** : pour un particulier, l'AFNIC masque par défaut ton nom et ton adresse dans l'annuaire public (Whois) des .fr.
5. Si une option **DNSSEC** est activée par défaut, désactive-la pour l'instant. On la réactivera chez Cloudflare.

## Étape 2 — Confier le domaine à Cloudflare 👤 (5 min, puis jusqu'à 24 h d'attente, souvent moins d'1 h)

1. dash.cloudflare.com → **Add a domain** → `unepagepourtoi.fr` → plan **Free**.
2. Cloudflare affiche **deux serveurs de noms** (par exemple `xxx.ns.cloudflare.com`).
3. Chez OVH : Domaines → `unepagepourtoi.fr` → **Serveurs DNS** → **Modifier** → remplace les serveurs d'OVH par les deux de Cloudflare.
4. Attends l'e-mail de Cloudflare « Your domain is now active ».

## Étape 3 — Brancher le domaine sur le site 🤖 ou 👤 (2 min)

**Option 1 — tu le fais toi-même :** Workers & Pages → `unepagepourtoi` → Settings → **Domains & Routes** → **Add** → Custom domain :
- `unepagepourtoi.fr`
- puis `www.unepagepourtoi.fr`

**Option 2 — je le fais :** ajoute à ta clé API Cloudflare les droits **Zone → Zone : Read** et **Zone → DNS : Edit** pour `unepagepourtoi.fr`. Ensuite, je branche les deux adresses et je règle `SITE_URL`.

Le certificat HTTPS est automatique.

## Étape 4 — Une adresse e-mail pro gratuite 👤 (5 min)

1. Dans Cloudflare : `unepagepourtoi.fr` → **Email** → **Email Routing** → activer.
2. Crée `contact@unepagepourtoi.fr` → transfert vers ta boîte Gmail.
3. Tu reçois tout dans Gmail sans payer d'hébergement e-mail.

C'est cette adresse qui ira dans les mentions légales.

## Étape 5 — Infos légales et déploiement final 🤖

Tu me donnes ton nom et l'e-mail de l'étape 4. Je mets alors à jour `site.config.json` (et `siteUrl` = `https://unepagepourtoi.fr`), je régénère le site, je déploie et je vérifie le domaine. Une fois l'adresse `.workers.dev` abandonnée, le site devient indexable par Google.

## Étape 6 — Google Search Console 👤 avec mon aide (10 min)

**Plusieurs sites dans un même compte Search Console : oui, aucun souci.** Chaque site est une « propriété » séparée, et un compte peut en gérer jusqu'à 1 000.

1. search.google.com/search-console → menu des propriétés → **Ajouter une propriété** → type **Domaine** → `unepagepourtoi.fr`.
2. Vérification : Google propose un enregistrement DNS TXT. Avec Cloudflare, il y a souvent un bouton de vérification automatique. Sinon, tu me donnes le code et je l'ajoute, si ta clé API a le droit « DNS : Edit ».
3. **Sitemaps** → ajoute `https://unepagepourtoi.fr/sitemap.xml`.
4. **Inspection de l'URL** → demande l'indexation de :
   - `https://unepagepourtoi.fr/`
   - `/saint-valentin`
   - `/noel`
   - `/fete-des-meres`
5. **Bing Webmaster Tools** (bing.com/webmasters) → « Importer depuis Google Search Console ». C'est 2 minutes, et Bing alimente aussi DuckDuckGo et la recherche de ChatGPT.

À savoir :
- Google met **de quelques jours à quelques semaines** à afficher un nouveau site, et plusieurs mois pour le classer correctement.
- Les pages offertes (`/p/…`) ne sont **jamais** indexées : c'est voulu, elles sont privées.

## Étape 7 — Se faire connaître (le vrai travail)

Le détail est dans `docs/STRATEGIE.md`. L'essentiel :

1. **Les 15 jours gratuits** : fais créer une page à 10 à 20 proches. Récupère leurs réactions filmées, avec leur accord. Ce sont tes premières vidéos TikTok/Reels.
2. **TikTok + Instagram Reels, 1 à 2 vidéos par jour** :
   - réaction à l'ouverture de la page ;
   - écran qui défile ;
   - vidéo souvenir générée par le site ;
   - « cadeau de dernière minute à moins de 10 € ».
   La vidéo de démo du site (`public/assets/video/demo-creation.mp4`) est utilisable telle quelle.
3. **Pinterest** : épingles « idée cadeau Saint-Valentin / fête des mères » vers les pages d'occasion.
4. **Micro-influenceurs** couple et lifestyle (10 000 à 50 000 abonnés) : page offerte et code promo Stripe.
5. **Groupes Facebook « idées cadeaux », mariage, maîtresses d'école** : répondre utilement, sans spammer.
6. **Le bouche-à-oreille intégré** : chaque page offerte et chaque vidéo souvenir affichent « crée la tienne ».


## Référencement (SEO) : ce qui est en place

- **Une seule adresse par page** : `http://`, `www.` et la barre finale redirigent (301) vers `https://unepagepourtoi.fr/...`.
- **Balises** : titre, description et adresse canonique sur chaque page ; aperçus de partage (Open Graph, Twitter).
- **Données structurées** : FAQ, produit avec prix, organisation, fil d’Ariane, articles. À vérifier sur https://search.google.com/test/rich-results.
- **Sitemap** : avec dates de mise à jour.
- **Guides** sous `/idees/...` : contenus qui répondent aux recherches courantes (« lettre d’amour », « texte fête des mères »…).
- **Test automatique** : `npm test` vérifie titres, descriptions, h1 unique, canonique et JSON-LD.

**À faire chaque année :**
- mettre à jour les dates des fêtes (constante `WHEN` dans `scripts/build.mjs`) ;
- mettre à jour les années dans les titres des guides (`scripts/guides.mjs`).

**Pour ajouter un guide :** ajoute une entrée dans `scripts/guides.mjs`, puis `npm run deploy:worker`. Il apparaît tout seul dans `/idees`, le sitemap et les pages occasions.
