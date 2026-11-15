# BailClear — application statique Cloudflare Pages

## Fonctionnalités présentes
- Calculateur de révision IRL et documents locatifs.
- Courrier de notification et avis d'échéance distinct d'une quittance.
- Calculateur indicatif de prorata calendaire.
- Espace bailleur local : plusieurs biens, historique, import/export JSON et rappels visibles à l'ouverture.
- Impression / enregistrement PDF via le navigateur.

## Limites réelles
- Dossiers conservés dans le navigateur : pas de compte, synchronisation serveur, sauvegarde distante ou notification lorsque le site est fermé.
- Les indices intégrés doivent être actualisés après chaque publication INSEE. Les valeurs présentes sont celles de la métropole ; elles ne conviennent pas à la Corse ni aux collectivités ultramarines.
- Le contrôle juridique est une aide à la vigilance, pas une validation automatisée. Le bail, sa clause, la date de demande, le territoire et la situation DPE doivent être vérifiés.
- Le prorata est une estimation arithmétique ; préavis, remise des clés et contrat peuvent modifier les sommes dues.
- Paiements, ventes, codes d'activation, comptes, e-mails et stockage privé ne sont pas implémentés.

## Bloquants avant toute vente
1. Renseigner identité réelle, forme/statut, adresse, immatriculation, régime TVA et contact du vendeur.
2. Confirmer les mentions légales et l'entité d'hébergement.
3. Finaliser la politique RGPD après inventaire des traitements, journaux, traceurs, durées, sous-traitants et transferts.
4. Mettre en place un parcours de commande avec informations précontractuelles, prix TTC, caractéristiques, délai de fourniture, confirmation durable, médiation et rétractation.
5. Si fourniture immédiate de contenu numérique : recueillir et conserver le consentement exprès et la reconnaissance de perte du droit de rétractation lorsque les conditions légales sont réunies.
6. Mettre en place la vérification de paiement côté serveur. Aucun déblocage par URL ou code côté navigateur.
7. Faire relire les documents et règles métier par un professionnel du droit.

## Références officielles
- INSEE, série IRL métropole 001515333 : https://www.insee.fr/fr/statistiques/serie/001515333
- Loi du 6 juillet 1989, articles 17-1 et 21 : https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000509310
- Code de la consommation, articles L.221-5, L.221-13 et L.221-28 : https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000032221319/

## Déploiement
Projet statique Cloudflare Pages : framework preset `None`, commande de build vide, répertoire de sortie `/`.


## Qualité et veille
- npm test : tests unitaires des règles métier sans dépendance externe.
- npm run check : syntaxe JavaScript, identifiants DOM, JSON-LD et contrôles de régression.
- GitHub Actions compare quotidiennement les pages officielles Légifrance, INSEE et Service-Public. Une modification crée une alerte à examiner ; aucune règle de droit n'est modifiée ou déployée automatiquement.
- Indices préremplis au 15 octobre 2026 pour métropole, Corse et collectivités article 73.
- Bail mobilité, contrats inconnus/hors périmètre, clause non confirmée, dates/DPE manquants et situations DPE F/G concernées : document bloqué.
- Le produit ne contrôle pas l'encadrement local des loyers, les conventions Anah ni tous les régimes particuliers. Vérification humaine du bail et du DPE obligatoire.


Le formulaire exige désormais un choix explicite du trimestre IRL et ne préremplit plus le loyer ni les charges avec des valeurs d'exemple.
