# Audit juridique et produit BailClear
Mise à jour : 15 novembre 2026.

## Conclusion exécutive
**La commercialisation reste bloquée.** BailClear automatise des calculs et des contrôles déterministes, mais ne certifie pas qu'un bail réel autorise une révision. Le service reste un outil d'aide au calcul et de préparation d'un modèle de courrier, pas une consultation juridique.

## Révision IRL
L'article 17-1 de la loi du 6 juillet 1989 exige une clause de révision. La date de révision est celle prévue au bail. Si le bail ne précise pas le trimestre de référence, on retient le dernier IRL publié à la date de signature. À la date de révision, on utilise le dernier indice disponible pour ce trimestre, comparé au même trimestre de l'année précédente. La hausse est plafonnée à la variation annuelle de l'IRL. Le bailleur doit manifester sa volonté de réviser dans l'année ; si sa demande est tardive mais dans le délai, l'effet ne commence qu'à la date de la demande. Après un an, la révision de l'année est perdue.

L'application peut contrôler les dates, le choix d'indice, le ratio et le délai. Elle ne lit pas le bail et ne peut donc pas confirmer que la clause existe, que le trimestre sélectionné est celui du contrat, ni que les montants saisis sont exacts.

## DPE et gel des loyers
Le gel des révisions pour les logements F ou G dépend du territoire et de la date de conclusion, renouvellement ou reconduction : métropole et Corse à compter du 24 août 2022 ; territoires relevant de l'article 73 à compter du 1er juillet 2024.

Le formulaire demande la classe et la date du DPE, la signature initiale du bail et le statut/date de la dernière reconduction. Un DPE réalisé du 1er janvier 2018 au 30 juin 2021 n'est plus valable depuis le 1er janvier 2025 ; les DPE réalisés à compter du 1er juillet 2021 sont valables dix ans. Le contrôle de date n'authentifie pas le document auprès de l'ADEME et ne vérifie pas la classe réelle. En 2026, le facteur de conversion de l'électricité a changé : l'utilisateur doit consulter le DPE ou l'attestation à jour.

## Régimes et situations exclues
Les régimes inconnus, conventions Anah, logements sociaux, loi de 1948, baux mobilité et situations hors périmètre sont bloqués. L'encadrement local des loyers, les compléments de loyer et les plafonds locaux ne sont pas vérifiés. Ces éléments dépendent de données géographiques et contractuelles particulières ; une règle nationale unique ne suffit pas.

## Loyer, charges et documents
Le loyer hors charges saisi doit inclure le complément de loyer lorsqu'il fait partie du loyer contractuel à réviser. Les charges ne sont pas multipliées par le ratio IRL. Un forfait de charges peut faire l'objet d'une révision distincte selon le bail et les règles applicables ; BailClear le laisse inchangé et affiche un avertissement. L'avis d'échéance ne vaut pas quittance. La quittance atteste un paiement intégral ; le reçu concerne un paiement partiel. BailClear ne prouve ni l'envoi ni la réception d'un courrier. Le calcul de prorata reste une estimation.

## Automatisation des données IRL
L'actualisation utilise les séries INSEE BDM/SDMX : 001515333 (métropole), 010760507 (Corse), 010760509 (territoires de l'article 73). Le parseur rejette les séries manquantes, les observations non définitives, les doublons, périodes invalides et valeurs non positives.

Le fichier initial est un jeu de secours partiel ; la première récupération réussie doit le remplacer par l'historique complet. Le workflow quotidien met à jour les indices et crée une alerte en cas d'échec. Le calcul est suspendu lorsque le dernier rafraîchissement date de plus de quatorze jours. DATE_JO sert de borne prudente : l'INSEE peut mettre une valeur en ligne avant sa parution au Journal officiel. Les cas situés à proximité d'une publication sont suspendus pour vérifier la date exacte sur insee.fr.

## Automatisation des changements de loi
Les règles déterministes peuvent être automatisées : dates, délais, seuils territoriaux, validité temporelle du DPE, comparaison d'indices et calculs. Elles sont versionnées et couvertes par des tests. La veille détecte les changements des pages officielles mais une modification de page n'est pas en soi une modification du droit. Le moteur juridique ne doit jamais être réécrit automatiquement par l'IA ou par comparaison d'empreintes. Toute évolution doit être analysée dans son champ et ses dates d'entrée en vigueur, traduite en règle versionnée, testée puis approuvée par une personne compétente.

## Risque de consultation juridique réglementée
L'article 54 de la loi n° 71-1130 encadre la consultation juridique habituelle et rémunérée ainsi que la rédaction habituelle d'actes sous seing privé pour autrui. Un simple avertissement indiquant que le produit n'est pas un conseil juridique ne suffit pas à trancher l'application de ces dispositions. L'activité réelle de BailClear — diagnostic individualisé, analyse de situation, génération d'un courrier personnalisé et éventuelle commercialisation — doit être examinée par un avocat avant toute vente. C'est un blocage juridique majeur.

## Vente, confidentialité et données
Les mentions légales et CGV restent à compléter : identité du vendeur, forme/statut, adresse, immatriculation, contact, prix TTC, caractéristiques du service, fourniture, garanties, réclamations, médiateur et rétractation. Aucun paiement, compte, webhook, abonnement ni délivrance payante n'est présent dans le dépôt.

Les dossiers sont dans localStorage, sur l'appareil ; pas de compte, synchronisation ou sauvegarde distante. Une autre personne utilisant le même profil du navigateur peut potentiellement accéder aux dossiers. La politique de confidentialité reste un brouillon : responsable de traitement, finalités, bases légales, durées, sous-traitants, journaux Cloudflare, transferts et droits doivent être inventoriés. Le dépôt ne permet pas de vérifier les paramètres Cloudflare en production ni d'affirmer qu'aucun traceur n'est installé.

La vente à distance de contenu numérique exige le traitement des informations précontractuelles, de la confirmation sur support durable, du droit de rétractation et, si une exception pour fourniture immédiate est utilisée, des consentements et reconnaissances requis. Les obligations de médiation de la consommation doivent également être traitées.

## Évolution réglementaire d'octobre 2026
L'arrêté du 9 octobre 2026 modifie la notice d'information annexée à certains contrats de location. BailClear produit une notification de révision et un avis d'échéance, pas un bail ni sa notice. Les utilisateurs qui concluent ou renouvellent un bail doivent utiliser la notice officielle en vigueur.

## Bloquants avant lancement
1. Avis d'un avocat sur le périmètre de consultation juridique et de rédaction de courrier.
2. Revue professionnelle des règles IRL/DPE et des calculs.
3. Finalisation RGPD après inventaire de production.
4. Mentions légales, identité vendeur et CGV définitives.
5. Parcours d'achat avec prix, médiateur et rétractation.
6. Paiement sécurisé côté serveur et délivrance vérifiable.
7. Tests navigateurs et vérification du déploiement Cloudflare Pages.

## Sources officielles
- Loi du 6 juillet 1989, article 17-1 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043977085
- Loi du 6 juillet 1989, article 21 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000028806698
- Service-Public, révision du loyer : https://www.service-public.gouv.fr/particuliers/vosdroits/F1311
- Service-Public, validité DPE : https://www.service-public.gouv.fr/particuliers/vosdroits/F16096
- Code de la construction et de l'habitation, D126-19 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043818603
- INSEE, API BDM SDMX : https://www.insee.fr/fr/information/2862759
- Arrêté du 9 octobre 2026 : https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054992497
- Loi n° 71-1130, article 54 : https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000006903350
- Code de la consommation, articles L221-5, L221-13, L221-28 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563141 ; https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563210 ; https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563170
- CNIL, cookies et traceurs : https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/FAQ

Cet audit est un examen technique et documentaire, non une consultation juridique ou une certification de conformité.
