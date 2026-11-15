# BailClear — application statique Cloudflare Pages

## Fonctionnalités présentes
- Calculateur de révision du loyer IRL avec sélection historique des indices INSEE.
- Contrôles de vigilance sur clause, délai, DPE, reconduction, régime locatif et type de charges.
- Courrier de notification et avis d'échéance distinct d'une quittance.
- Calculateur indicatif de prorata calendaire.
- Espace bailleur local : plusieurs biens, historique, import/export JSON et rappels visibles à l'ouverture.
- Impression / enregistrement PDF via le navigateur.

## Limites réelles
- Dossiers conservés dans le navigateur : pas de compte, synchronisation serveur, sauvegarde distante ou notification quand le site est fermé.
- Le dernier rafraîchissement INSEE réussi le 15 novembre 2026 a enregistré 96 observations par territoire, du T4 2002 au T3 2026. Le workflow quotidien poursuit l'actualisation ; un jeu de données âgé de plus de 14 jours bloque le calcul.
- Le diagnostic est une aide à la vigilance, pas une validation juridique. Le site ne lit pas le bail, n'authentifie pas le DPE et ne vérifie pas les plafonds locaux.
- Le prorata est une estimation arithmétique ; préavis, remise des clés et contrat peuvent modifier les sommes dues.
- Paiements, ventes, codes d'activation, comptes, e-mails et stockage privé ne sont pas implémentés.

## Bloquants avant toute vente
1. Faire examiner par un avocat le risque de consultation juridique réglementée lié au diagnostic et au courrier personnalisé.
2. Renseigner l'identité réelle, forme/statut, adresse, immatriculation, régime TVA et contact du vendeur.
3. Confirmer les mentions légales et l'entité d'hébergement.
4. Finaliser la politique RGPD après inventaire des traitements, journaux, traceurs, durées, sous-traitants et transferts.
5. Mettre en place les informations précontractuelles, prix TTC, caractéristiques, confirmation durable, médiation et rétractation.
6. Pour une fourniture numérique immédiate, recueillir et conserver les consentements/confirmations requis lorsque l'exception au droit de rétractation s'applique.
7. Mettre en place une vérification de paiement côté serveur ; aucun déblocage par URL ou code côté navigateur.
8. Tester le site en navigateur et vérifier la mise en production Cloudflare Pages.

## Automatisation des données et du droit
- Les indices sont téléchargés chaque jour depuis l'API SDMX BDM de l'INSEE pour la métropole, la Corse et les territoires de l'article 73.
- Le moteur sélectionne le dernier IRL publié à la date de signature lorsque le bail ne précise pas le trimestre, puis la dernière observation disponible de ce même trimestre à la date de révision.
- Les observations provisoires, incohérentes ou trop anciennes sont rejetées ; les cas proches des dates de publication sont suspendus pour contrôle.
- Le ruleset juridique est versionné et testé. La veille crée des alertes sur les textes officiels, mais aucune interprétation ou modification du droit n'est déployée automatiquement.

## Déploiement
Projet statique Cloudflare Pages : preset de framework None, commande de build vide, répertoire de sortie à la racine du dépôt.

## Références
- INSEE, API BDM SDMX : https://www.insee.fr/fr/information/2862759
- Service-Public, révision du loyer : https://www.service-public.gouv.fr/particuliers/vosdroits/F1311
- Service-Public, validité DPE : https://www.service-public.gouv.fr/particuliers/vosdroits/F16096
- Loi du 6 juillet 1989, article 17-1 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043977085
- Loi du 31 décembre 1971, article 54 : https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000006903350
