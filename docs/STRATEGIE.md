# Stratégie : pourquoi ce projet, comment le vendre, quand arrêter

> **Mise à jour du 17/11/2026 : prix ramené à 4,90 €** après comparaison avec la concurrence. Ouvella est à 9,99 €, LovePaper à 4,90 € avec des options payantes, YourLovePage à 6,99 $. Une formule « Premium » à 9,90 € viendra quand on aura des fonctions exclusives : message vocal, ouverture programmée, photos illimitées, vidéo HD sans signature, page à vie. Les chiffres ci-dessous, calculés à 9,90 €, sont à diviser par deux environ.

> **Mise à jour du 18/11/2026 : options ajoutées.** Chaque option est facultative dans l’éditeur.
> - **Gratuites** (elles font revenir et partager) : quiz, 6 langues, fond d’écran, vidéo souvenir.
> - **Premium**, la page passe à **9,90 €** : message vocal, carte de groupe, ouverture programmée. Le prix est recalculé par le serveur au paiement ; une option premium ne peut pas être ajoutée gratuitement à une page payée 4,90 €.
> - **Tout reste offert jusqu’au 30/11.**
> - **Plus tard** : lieux sur une carte, calendrier à portes.

## 1. Comment l'idée a été choisie

**Recherche menée le 16/11/2026** par 3 recherches parallèles :
- des petits sites rentables à l'étranger (Hacker News, IndieHackers, Flippa, TrustMRR, Starter Story) ;
- des besoins mal servis en France ;
- des niches de référencement Google (SEO) françaises et leur monétisation.

Trois critiques ont ensuite débattu de la sélection : un avocat du diable, un pragmatique technique et juridique, et un spécialiste de l'acquisition de clients.

**Ce qu'on a appris :**
- La publicité seule rapporte très peu en France. Il faut environ 50 000 pages vues par mois pour 75 à 200 € par mois.
- Les petits succès rapides vendent tous **un livrable à paiement unique** (10 à 100 €).
- Un nouveau site met **6 à 12 mois** à se positionner sur Google.

**Idées écartées :**

| Idée | Raison |
|---|---|
| Calculateurs de paie pour assistante maternelle | Responsabilité en cas d'erreur, même piège que BailClear |
| DPE 2027 | Fenêtre de 6 semaines, rien à vendre |
| Compteur de nuitées Airbnb | Trop lourd pour un débutant |
| Plus-values boursières | Risque fiscal, saisonnier |
| Agenda pour liseuse | reMarkable vient de sortir le sien |
| Calendrier de garde alternée | Le gratuit est partout |
| Sites de calculateurs | Revenus publicitaires lents |

**Idée retenue : la page cadeau personnalisée.**
- **Modèle prouvé** : YourLovePage.com (en anglais) a fait **2 346 $ sur 30 jours**, chiffre vérifié via Stripe, avec 22 000 visiteurs par mois, à 9,99 $.
- **Zéro risque juridique métier** : pas de calcul, pas de conseil. Il reste le statut d'hébergeur de contenus, géré par le signalement et la modération intégrés.
- **Viralité intégrée** : chaque page offerte affiche « Créée avec Une page pour toi — crée la tienne ».
- **Des échéances qui poussent à acheter** : Noël, la Saint-Valentin, les fêtes des grands-mères, des mères et des pères, la fin d'année scolaire.

## 2. La concurrence en France (vérifiée le 16/11/2026)

**Concurrents directs :**
- **Ouvella** (ouvella.com) : 9,99 €, lettre, photos, musique, QR code. Seulement 5 avis Trustpilot.
- **lovepaper.app/fr**, **2-luv.com/fr**, **loveqr.app/fr** : produits internationaux traduits, centrés sur le couple.
- **Etsy** : « surprises numériques QR » à partir de 1,34 €, mais faites à la main et en différé.

**Ton positionnement :**
1. **100 % français**, avec le tutoiement et les fêtes françaises.
2. **Toutes les occasions**, pas seulement le couple : fête des mères, des grands-mères, maîtresse, demande de témoin. Cela étale les ventes sur l'année.
3. **Aperçu complet gratuit** avant de payer.
4. **Carte QR à imprimer** fournie : le cadeau devient physique.
5. **Sans compte**, et respect de la vie privée : pas de traceurs, données GPS des photos supprimées.

## 3. Les chiffres

**Ce qu'il te reste sur une vente à 9,90 € :**
- Frais Stripe : environ 0,40 € (cartes européennes standard).
- Cotisations sociales : environ 2 à 2,50 € selon ta catégorie.
- **Reste : environ 7 €.**

**Coûts fixes :** environ 10 € par an de domaine, plus le médiateur. Le plan Cloudflare à 5 $ par mois ne devient utile qu'au-delà de 40 à 80 pages par jour.

**Scénarios honnêtes pour la première saison (jusqu'au 14/02/2027) :**

| Scénario | Ventes | Chiffre d'affaires |
|---|---|---|
| Pessimiste (aucune vidéo ne décolle) | 0 à 10 | < 100 € |
| Réaliste (vidéos publiées chaque jour, 1 ou 2 qui marchent) | 30 à 150 | 300 à 1 500 € |
| Optimiste (une vidéo virale) | 300+ | 3 000 € et plus sur la seule semaine de la Saint-Valentin |

**Le prix :**
- Garde 9,90 € au lancement.
- Teste 12,90 € à partir de la fête des mères si la conversion est bonne. Modifie `lib/config.js`, qui sert de référence, puis lance `npm run build` et `npm test`.

## 4. Plan d'action sur 90 jours

### Semaine 1 (du 17 au 23/11)
- [ ] Créer la micro-entreprise, puis acheter le domaine (voir `DEMARRAGE.md`).
- [ ] Ouvrir Cloudflare et Stripe, mettre en ligne en mode test, puis passer en mode réel.
- [ ] Créer **3 vraies pages de démonstration** avec des proches (avec leur accord) : un couple, une maman, une grand-mère.
- [ ] Ouvrir des comptes **TikTok**, **Instagram** et **Pinterest** au nom de « Une page pour toi ».

### Du 24/11 au 24/12 : le test Noël
- **1 à 2 vidéos courtes par jour**, sans montrer ton visage. Formats qui marchent dans cette niche :
  1. *« Sa réaction quand elle scanne le QR code »* : filmer de dos ou seulement les mains, avec l'accord de la personne.
  2. *« Je lui ai fait un site pour Noël »* : défilement de la page à l'écran, avec une musique tendance.
  3. *« Cadeau de dernière minute à moins de 10 € »* : démonstration en 30 secondes.
  4. *« Ma grand-mère découvre sa page »* : l'émotion, avec la carte QR dans une enveloppe.
  5. *« 5 idées de phrases pour ta lettre »* : contenu utile, avec la page en arrière-plan.
- **Pinterest** : 3 épingles par jour (« cadeau Noël couple original », « cadeau dernière minute »), liées aux pages occasions.
- **Bouche-à-oreille** : propose à 10 amis une page offerte en échange d'une vidéo de réaction (ta preuve sociale).

### Du 26/12 au 14/02 : la Saint-Valentin (le gros pic)
- Continuer les vidéos chaque jour, en accélérant à partir du 1er février.
- **Micro-influenceurs couple et lifestyle** (10 000 à 50 000 abonnés) : contacte-en 10 à 20.
  - Offre-leur une page gratuite et un code promo à leur nom (−20 % pour leur audience).
  - Ajoute 2 à 3 € par vente utilisée, payés par virement : un contrat simple suffit.
- Message clé : *« prête en 10 minutes, même le 14 au soir »*. C'est la vraie force face aux fleurs et à Etsy.

### Du 15/02 au 07/03
- **Bilan des chiffres**, puis pousser la fête des grands-mères (7 mars 2027).

### Ensuite
- **Fête des mères** (30 mai 2027), le deuxième pic.
- **Fête des pères** (20 juin).
- **Cadeau pour la maîtresse** (fin juin et début juillet) : cible les groupes de parents d'élèves.

## 5. Les indicateurs à suivre (chaque semaine)

- **Visiteurs** sur la page « Créer » : Cloudflare Web Analytics, gratuit et sans cookie, à activer dans Cloudflare Pages.
- **Taux de paiement** parmi les visiteurs de la page « Créer » : vise 2 à 5 %.
- **Ventes par source** : demande « Comment nous as-tu connus ? » aux premiers clients, ou suis l'utilisation des codes promo.
- **Clics sur « Crée la tienne »** depuis les pages offertes : c'est la mesure de la viralité.

## 6. Critères d'arrêt ou de bascule (à respecter)

- **Moins de 10 ventes au 20/02/2027** malgré au moins 40 vidéos publiées :
  - le produit ou le canal ne fonctionne pas, il faut arrêter les efforts ;
  - garder le site en ligne (il ne coûte presque rien) ;
  - passer à l'idée de secours.
- **30 ventes ou plus** : améliorer en V2 :
  - envoi du lien de modification par e-mail ;
  - option « page à vie » à 19,90 € ;
  - pages collaboratives où plusieurs personnes écrivent ;
  - plus de thèmes.

## 6 bis. Options payantes à ajouter après le lancement

- **Fond d'écran personnalisé** (2,90 € en option, ou inclus dans une formule « Premium » à 14,90 €) :
  - un montage des photos de la page au format écran de téléphone ;
  - la zone de l'horloge est laissée libre, avec un petit mot ou une date discrète ;
  - plusieurs modèles : collage, polaroïds, cœur de photos, minimaliste ;
  - généré dans le navigateur, comme la vidéo souvenir, donc sans coût de serveur.
- **Vidéo souvenir en HD sans la signature « Une page pour toi »** (option payante, la version avec signature restant gratuite pour la viralité).
- **Page « à vie »** au lieu de 2 ans.

## 7. Idées de secours (qui réutilisent la même base technique)

1. **Générateur de chasse au trésor d'anniversaire** pour enfants : le parent saisit le prénom, l'âge et le lieu, et reçoit un PDF immédiat à 9 à 12 €.
   - Une annonce Etsy US réalise environ 1 600 ventes par an (estimation).
   - Aucun générateur instantané trouvé en France.
2. **Agenda PDF pour liseuse** au format français : petit marché, mais technique très simple.
