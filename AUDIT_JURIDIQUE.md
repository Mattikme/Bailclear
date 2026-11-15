# Audit juridique et produit BailClear
Mise à jour : 15 novembre 2026.

## Conclusion exécutive
**La commercialisation reste bloquée.** BailClear peut automatiser des contrôles arithmétiques et des règles juridiques déterministes de révision annuelle IRL. Il ne peut pas certifier seul qu'un bail réel autorise la hausse ni interpréter sans validation une évolution de la loi. Le service est un outil d'aide au calcul et de préparation d'un modèle de courrier, pas un avis juridique.

## 1. Révision annuelle IRL
L'article 17-1 de la loi du 6 juillet 1989 exige une clause de révision. La date de révision est celle prévue au bail ; à défaut de précision sur le trimestre, la référence est le dernier IRL publié à la date de signature du contrat. À la date de révision, on retient la dernière observation définitive disponible pour ce trimestre et on la compare à l'indice du même trimestre un an auparavant. Le nouvel indice ne correspond donc pas nécessairement à l'année civile de la date anniversaire.

La hausse ne peut pas dépasser la variation annuelle de l'IRL. La demande doit intervenir dans l'année suivant la date prévue ; passé ce délai, la révision de l'année concernée est perdue. Si la demande est tardive mais encore dans le délai, elle prend effet à compter de la demande, sans rétroactivité. Le moteur vérifie les dates, la clause déclarée, le trimestre, les observations officielles et le calcul ; il ne lit pas le bail et ne valide pas que la clause ou les montants correspondent au contrat réel.

## 2. DPE et gel des loyers
Le gel des révisions des logements classés F ou G dépend du territoire et de la date de conclusion, renouvellement ou reconduction : métropole et Corse à compter du 24 août 2022 ; territoires de l'article 73 à compter du 1er juillet 2024.

Les contrôles demandent la classe et la date de réalisation du DPE, la date de signature initiale du bail, le statut de renouvellement/reconduction et sa date la plus récente. Les DPE réalisés du 1er janvier 2018 au 30 juin 2021 ont cessé d'être valables au 1er janvier 2025. Ceux réalisés à compter du 1er juillet 2021 sont valables dix ans. Le contrôle de date n'authentifie pas le document auprès de l'ADEME et ne vérifie pas la classe réelle du logement. Le facteur de conversion de l'électricité a changé en 2026 : l'utilisateur doit consulter le DPE ou l'attestation ADEME à jour.

## 3. Régimes et situations non couverts
Le moteur bloque les régimes inconnus, les logements conventionnés Anah, les logements sociaux, la loi de 1948, les baux mobilité et les situations hors périmètre. L'encadrement local des loyers dépend de la commune, de la catégorie de logement et d'autres caractéristiques ; il n'est pas vérifié. Les compléments de loyer, plafonds locaux, conventions et clauses particulières nécessitent un examen distinct.

## 4. Loyer, charges et documents
Le loyer hors charges saisi doit inclure le complément de loyer lorsqu'il fait partie du loyer contractuel à réviser. Les charges ne sont pas multipliées par le ratio IRL. Un forfait de charges peut faire l'objet d'une révision distincte selon les conditions et clauses applicables ; BailClear le laisse inchangé et affiche un avertissement.

Le document généré est un avis d'échéance, non une quittance. Une quittance atteste le paiement intégral des sommes dues ; un reçu concerne un paiement partiel. L'application ne prouve ni l'envoi de la notification, ni sa réception, ni le paiement. Le prorata reste une estimation calendaire ; le préavis, la remise des clés et le bail peuvent influer sur le montant dû.

## 5. Actualisation automatique des IRL
La chaîne d'actualisation télécharge les séries BDM/SDMX officielles de l'INSEE : 001515333 (métropole), 010760507 (Corse), 010760509 (territoires de l'article 73). Le parseur rejette les séries manquantes, les observations non définitives, doublons, périodes invalides et valeurs non positives.

Le jeu initial du dépôt est un jeu de secours limité aux observations récentes ; la première récupération réussie doit le remplacer par l'historique complet. Le workflow quotidien met à jour les valeurs et crée une alerte en cas d'échec. Le calcul est suspendu lorsque le dernier rafraîchissement date de plus de quatorze jours. La date DATE_JO sert de borne prudente : les publications sur insee.fr peuvent précéder la parution au Journal officiel. Les situations dans une fenêtre de trois jours autour d'une publication sont bloquées pour vérifier la date exacte de mise en ligne.

## 6. Automatisation du droit : limites et gouvernance
Les règles déterministes peuvent être automatisées : dates, délais, seuils géographiques, validité temporelle du DPE, comparaison d'indices et calculs. Elles sont versionnées et couvertes par des tests.

La veille compare quotidiennement des pages officielles et signale les variations. Une variation de page ne prouve pas un changement de loi. Le moteur ne doit jamais être réécrit automatiquement à partir d'une modification de page ou d'une réponse d'IA. Tout changement doit être analysé (texte, champ, entrée en vigueur, dispositions transitoires), traduit en règle versionnée, testé et approuvé par une personne compétente.

## 7. Risque de consultation juridique réglementée
L'article 54 de la loi n° 71-1130 encadre la consultation juridique habituelle et rémunérée ainsi que la rédaction habituelle d'actes sous seing privé pour autrui. Un avertissement « ceci n'est pas un conseil juridique » ne suffit pas, à lui seul, à déterminer que ces dispositions ne s'appliquent pas.

La qualification dépend des fonctions réelles de BailClear : calcul général, diagnostic individualisé, analyse d'une situation particulière, génération d'un courrier personnalisé et modèle économique. Un avocat doit examiner ce périmètre avant toute commercialisation. C'est un blocage juridique majeur.

## 8. Évolutions réglementaires d'octobre 2026
L'arrêté du 9 octobre 2026 modifie la notice d'information annexée à certains contrats de location à compter de son entrée en vigueur. BailClear génère une notification de révision et un avis d'échéance, pas un bail ni sa notice. Pour conclure ou renouveler un bail, il faut utiliser la notice officielle en vigueur.

## 9. Vente aux consommateurs
Avant toute vente, il faut finaliser l'identité et les coordonnées du professionnel, la forme/statut, l'immatriculation, les prix TTC, les caractéristiques du service, les modalités et délais de fourniture, les garanties, les réclamations, le médiateur de la consommation et le droit de rétractation.

Un contenu numérique fourni immédiatement peut nécessiter un consentement exprès préalable, la reconnaissance de la perte du droit de rétractation lorsque les conditions légales sont réunies et la confirmation requise sur support durable. Le dépôt ne contient aucun paiement, compte client, webhook, abonnement ou délivrance payante.

## 10. Données personnelles et hébergement
Les dossiers sont conservés dans localStorage sur l'appareil. Il n'y a ni compte, ni synchronisation, ni sauvegarde distante. Une personne utilisant le même profil navigateur/appareil peut potentiellement accéder aux dossiers.

La politique de confidentialité est un brouillon. Il faut identifier le responsable du traitement, les finalités, bases légales, durées, destinataires, sous-traitants, journaux, transferts, droits et contact. Le dépôt ne révèle pas les paramètres du compte Cloudflare de production. Les éventuels cookies et traceurs doivent être examinés au regard de l'article 82 de la loi Informatique et Libertés et des règles CNIL ; le seul code du dépôt ne certifie pas leur absence en production.

## 11. Bloquants avant lancement
1. Avis d'un avocat sur le périmètre de consultation juridique et de génération de courrier personnalisé.
2. Vérification professionnelle du moteur de calcul et des règles DPE/IRL, y compris les territoires.
3. Inventaire RGPD réel et finalisation de la politique de confidentialité.
4. Identité réelle du vendeur, mentions légales et coordonnées d'hébergement contractuelles.
5. CGV, prix, médiateur, rétractation et parcours d'achat conformes.
6. Paiement sécurisé côté serveur et délivrance vérifiable.
7. Tests navigateurs et vérification du déploiement Cloudflare Pages.

## Sources officielles
- Loi du 6 juillet 1989, article 17-1 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043977085
- Loi du 6 juillet 1989, article 21 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000028806698
- Service-Public, révision du loyer : https://www.service-public.gouv.fr/particuliers/vosdroits/F1311
- Service-Public, validité DPE : https://www.service-public.gouv.fr/particuliers/vosdroits/F16096
- Code de la construction et de l'habitation, article D126-19 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043818603
- INSEE, API BDM SDMX : https://www.insee.fr/fr/information/2862759
- Arrêté du 9 octobre 2026 : https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054992497
- Loi n° 71-1130, article 54 : https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000006903350
- Code de la consommation, L221-5 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563141
- Code de la consommation, L221-13 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563210
- Code de la consommation, L221-28 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563170
- CNIL, cookies et traceurs : https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/FAQ

Cet audit est un examen technique et documentaire, non une consultation juridique ni une certification de conformité.
