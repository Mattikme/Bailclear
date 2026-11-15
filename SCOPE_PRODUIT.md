# Périmètre produit et juridique de BailClear
Mise à jour : 15 novembre 2026.

## Fonction couverte
Calcul indicatif de révision annuelle IRL et préparation d'un modèle de notification pour les baux de résidence principale vides ou meublés du parc privé classique non conventionné, sous réserve que la situation relève effectivement de la loi n° 89-462 du 6 juillet 1989.

## Cas bloqués
- Bail mobilité, régime Anah, logement social, loi de 1948, régime inconnu ou situation particulière.
- Absence de clause annuelle ou clause non vérifiée.
- DPE inconnu, date du DPE manquante/invalide ou DPE expiré.
- DPE F/G et bail conclu, renouvelé ou reconduit à compter du seuil territorial applicable.
- Signature initiale, statut de reconduction requis ou date de dernière reconduction manquants.
- Date de révision ou de demande manquante/invalide.
- Paire IRL indisponible, données INSEE trop anciennes ou date proche d'une publication.
- Champs indispensables du courrier incomplets.
- Date de révision au 29 février : contrôle du délai suspendu pour revue humaine.

## Règles contrôlées
- Clause annuelle, date contractuelle, délai d'un an, perte du droit à révision de l'année écoulée et prise d'effet à la demande si celle-ci est tardive.
- Trimestre stipulé au bail ; à défaut, dernier IRL publié à la date de signature.
- Dernière observation définitive disponible de ce trimestre à la date de révision, comparée au même trimestre de l'année précédente.
- Gel DPE F/G par territoire, date de signature initiale et dernière reconduction déclarée.
- Validité temporelle du DPE par date de réalisation.
- Type de charges et avertissement en cas de forfait.

## Ce que BailClear ne décide pas
Le produit ne lit pas le bail et ne confirme pas que la clause est valide. Il ne vérifie pas l'encadrement local des loyers, les conventions Anah, logements sociaux, loi de 1948, compléments de loyer contestables, authenticité du DPE, classe réelle du logement ni le bien-fondé d'une demande litigieuse. Les charges au forfait ne sont pas révisées par le moteur. L'avis d'échéance ne vaut pas quittance.

## IRL et automatisation
Sources INSEE BDM/SDMX : 001515333 (métropole), 010760507 (Corse), 010760509 (territoires de l'article 73). Le workflow récupère quotidiennement l'historique, valide les séries et observations, puis met à jour le jeu de données. Le fichier inclus au départ est un secours partiel ; la première récupération réussie doit confirmer l'historique complet. DATE_JO est une borne prudente ; les cas proches d'une publication sont suspendus pour vérifier la date exacte sur insee.fr. Un jeu de données de plus de quatorze jours bloque le calcul.

## Gouvernance juridique
Les règles déterministes sont versionnées et testées. La veille compare les sources officielles et ouvre une alerte en cas de modification ou d'indisponibilité. Elle ne modifie jamais automatiquement le moteur juridique. Toute évolution doit être analysée, traduite en tests, approuvée puis publiée par une personne compétente.

## Commercialisation
Commercialisation non validée. Une revue d'avocat est nécessaire sur le risque de consultation juridique réglementée lié au diagnostic individualisé et au courrier personnalisé. Les mentions légales, CGV, identité du vendeur, RGPD, médiation, rétractation et paiement restent à finaliser.

## Sources
- Loi n° 89-462, article 17-1 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043977085
- Service-Public, révision du loyer : https://www.service-public.gouv.fr/particuliers/vosdroits/F1311
- Service-Public, validité DPE : https://www.service-public.gouv.fr/particuliers/vosdroits/F16096
- INSEE, API SDMX : https://www.insee.fr/fr/information/2862759
- Loi n° 71-1130, article 54 : https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000006903350

Ce document décrit le périmètre logiciel et ne constitue pas un avis juridique.
