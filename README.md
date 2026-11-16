# Une page pour toi

Site de **pages cadeaux personnalisées** : lettre, photos, frise de souvenirs, cartes à retourner, compteur de jours, musique (YouTube ou Spotify) et question secrète. La page est offerte par lien ou par QR code (une carte A6 est fournie à imprimer). Prix : **9,90 €**, en paiement unique.

- **Démarrer (micro-entreprise, Stripe, mise en ligne)** : [`docs/DEMARRAGE.md`](docs/DEMARRAGE.md)
- **Stratégie, concurrence, plan sur 90 jours, critères d'arrêt** : [`docs/STRATEGIE.md`](docs/STRATEGIE.md)

## Fonctionnement

1. L'acheteur crée sa page sur `/creer`. L'aperçu se met à jour en direct et le brouillon reste sur son appareil (IndexedDB).
2. Au clic sur « Publier », il accepte les CGV et renonce à son droit de rétractation (art. L221-28 13°). Le brouillon est envoyé avec les photos, déjà compressées dans le navigateur et débarrassées de leurs données EXIF/GPS. Le paiement passe ensuite par Stripe Checkout.
3. La page `/merci` vérifie le paiement **côté serveur** auprès de Stripe ; le webhook sert de filet de sécurité. La page devient publique sur `/p/<id>` pour 2 ans.
4. Un lien secret `/creer?edit=<id>#t=<jeton>` permet de modifier ou supprimer la page. Seule l'empreinte SHA-256 du jeton est stockée.
5. Chaque page a un bouton « Signaler », traité dans la console `/admin`.

## Architecture

```
public/            site statique (généré par scripts/build.mjs + JS vanilla, aucune dépendance externe)
  assets/js/       editor.js, viewer.js, render.js, merci.js, occasions.js (données partagées)
functions/api/     Cloudflare Pages Functions : pages, photos, checkout, confirm, stripe-webhook, report, admin
lib/               config (prix, durées), validation, stockage KV, Stripe, crypto
site.config.json   identité légale (à compléter) → injectée dans les mentions légales et les CGV
tests/             tests unitaires (node --test)
```

**Stockage** : Cloudflare KV, avec une expiration automatique qui applique les durées RGPD :
- brouillons non payés : 48 h ;
- pages payées : 2 ans ;
- traces de retrait : 30 jours ;
- signalements : 1 an.

**Sécurité** :
- CSP stricte (aucun script inline) ;
- rendu uniquement via `textContent` ;
- signature des images vérifiée (JPEG, PNG ou WebP) ;
- identifiants de 12 caractères aléatoires ;
- jetons de 256 bits ;
- signature du webhook vérifiée (HMAC, tolérance de 5 min) ;
- pages privées en `noindex`, et `Disallow` dans robots.txt.

## Commandes

```bash
npm install
npm run build     # régénère les pages HTML (après modification de site.config.json, occasions.js ou config.js)
npm run dev       # serveur local http://localhost:8788 (paiement simulé si DEV_FAKE_PAYMENT=1 dans .dev.vars)
npm test          # tests unitaires
npm run deploy    # déploiement manuel via wrangler (sinon : connexion Git dans Cloudflare Pages)
```

## Personnaliser

- **Prix** : `lib/config.js` (`PRICE_CENTS` et `PRICE_LABEL`), puis `npm run build`. Les tests vérifient la cohérence.
- **Occasions, textes, idées, FAQ, thèmes** : `public/assets/js/occasions.js`, puis `npm run build`.
- **Page de démonstration** : `public/assets/demo/` (servie sur `/p/demo`).
