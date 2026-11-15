# Audit juridique et produit BailClear — 15 novembre 2026

## Conclusion
**Commercialisation non validée.** Le dépôt ne permet pas de certifier la conformité juridique du produit ni de l'éditeur. Les paiements sont désactivés. Les anciennes pages contenaient des affirmations non vérifiées sur le statut de l'éditeur, la TVA, Stripe et le traitement des données ; elles ont été retirées ou signalées comme restant à compléter.

## Corrections réalisées dans cette branche
- Suppression de la mention d'un prix de 9 € et du parcours de déverrouillage Pro fictif.
- Suppression du statut « micro-entreprise » et des coordonnées éditeur non confirmées.
- Réécriture des pages de confidentialité et conditions : elles ne prétendent plus que Stripe est actif ni qu'aucune donnée technique ne peut être traitée par l'hébergeur.
- Clarification de l'avis d'échéance : il ne prouve pas le paiement. L'article 21 de la loi du 6 juillet 1989 prévoit une quittance détaillant les sommes versées ; en cas de paiement partiel, un reçu est délivré.
- Mise à jour des indices métropolitains T1 à T3 2026 : T1 146,60 ; T2 148,37 ; T3 148,06. T3 2025 = 145,77.
- Correction du contrôle du délai d'un an : comparaison de dates calendaires avec ajout d'une année plutôt qu'un seuil fixe de 365 jours.
- Suppression de la préremplissage des dates et identités fictives.
- Le diagnostic ne donne plus un feu vert juridique automatique. Il affiche les points à vérifier, et le territoire/ DPE sont pris en compte de manière prudente.
- Le calcul de prorata est explicitement présenté comme une estimation, pas comme une somme juridiquement certaine.

## Points de droit vérifiés
1. **Révision IRL** : l'article 17-1 de la loi n° 89-462 exige une clause de révision, fixe la date et la référence de l'indice, limite la demande à un an après la date de prise d'effet et rend la hausse applicable à compter de la demande si elle est tardive.
2. **DPE F/G** : l'article 17-1 interdit les révisions pour les logements F/G selon les dates d'application légales. Le cas concret dépend de la date de conclusion, renouvellement ou reconduction et du territoire ; un simple champ « classe DPE » ne suffit pas.
3. **Quittance** : article 21, loi n° 89-462 : quittance gratuite à la demande, détaillant les sommes versées ; reçu en cas de paiement partiel.
4. **Vente numérique** : articles L.221-5 et L.221-13 du Code de la consommation imposent les informations précontractuelles et la confirmation sur support durable. L'exception au droit de rétractation pour contenu numérique (L.221-28, 13°) suppose notamment consentement exprès préalable, reconnaissance de la perte du droit et confirmation requise.
5. **Mentions légales** : Service-Public rappelle l'obligation d'identification de l'éditeur et de l'hébergeur.

## Bloquants avant toute vente
- Identité réelle du vendeur, forme/statut, adresse, immatriculation, régime TVA et adresse de contact à confirmer.
- Adresse de l'hébergeur et sous-traitants exacts à vérifier sur les contrats.
- Politique RGPD à compléter après inventaire réel des traitements, journaux, traceurs, durées et transferts.
- Prix TTC, contenu précis du pack, modalités de fourniture, support client, garanties, médiateur de la consommation et processus de rétractation à définir.
- Paiement absent : aucun webhook serveur, aucune preuve durable de commande, aucun déverrouillage fiable.
- Les indices Corse et Outre-mer ne sont pas inclus dans les valeurs préremplies. Le site doit demander des valeurs officielles saisies par l'utilisateur pour ces territoires.
- Pas de tests de bout en bout sur le compte Cloudflare de production ni de revue juridique par avocat.

## Sources officielles
- Légifrance, loi n° 89-462, article 17-1 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043977085/
- Légifrance, loi n° 89-462, article 21 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000028806698/
- Service-Public, IRL : https://www.service-public.gouv.fr/particuliers/vosdroits/F13723
- INSEE, série IRL métropole : https://www.insee.fr/fr/statistiques/serie/001515333
- Légifrance, Code de la consommation, L.221-5 : https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000032221319/
- Légifrance, Code de la consommation, L.221-13 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563210/
- Légifrance, Code de la consommation, L.221-28 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563170/
- Entreprendre.Service-Public, mentions légales : https://entreprendre.service-public.gouv.fr/vosdroits/F37351

Cet audit est une analyse technique et documentaire, pas un avis juridique ni une certification de conformité.


## Revue contradictoire complémentaire — 15 novembre 2026

### Défauts supplémentaires identifiés
- Les indices Corse et des collectivités régies par l'article 73 n'étaient pas intégrés. Les paires annuelles officielles jusqu'au T3 2026 sont désormais préremplies par territoire.
- Le formulaire ne demandait pas le type de contrat ni la présence d'une clause annuelle. Le bail mobilité et les contrats inconnus/hors périmètre sont désormais bloqués ; l'absence de clause connue bloque aussi le document.
- Le contrôle exige la date de conclusion/dernière reconduction et les informations essentielles du courrier.
- Le rappel anniversaire est corrigé pour les échéances autour du changement d'année.
- Le 29 février déclenche une vérification humaine au lieu d'un calcul de délai arbitraire.
- Le contrôle reste partiel : il ne vérifie pas l'encadrement local des loyers, les conventions Anah, les baux spéciaux ou toutes les clauses.

### Indices territoriaux officiels
Les valeurs jusqu'au T3 2026 sont détaillées dans SCOPE_PRODUIT.md. Source : INSEE, 15 octobre 2026, https://www.insee.fr/fr/statistiques/9081853 ; Journal officiel, 16 octobre 2026, https://www.legifrance.gouv.fr/jorf/id/JORFARTI000054989041.

### Automatisation mise en place
- Tests unitaires des règles métier.
- Contrôle statique HTML/JavaScript/JSON-LD.
- Veille quotidienne de pages officielles Légifrance, INSEE et Service-Public.
- Une modification de source crée une alerte GitHub pour analyse humaine. La veille ne modifie jamais automatiquement le droit applicable ni le code de production.

### Limites persistantes
Les indices sont préremplis mais ne se mettent pas automatiquement à jour dans l'interface. La commercialisation reste bloquée. Pas de backend, compte, paiement, synchronisation, sauvegarde serveur ni notification utilisateur. Pas de test navigateur ou de production Cloudflare confirmé. Revue juridique professionnelle nécessaire.


### Contrôle de la date de publication de l'indice
Le module bloque désormais un calcul si l'indice sélectionné n'était pas encore publié à la date de révision indiquée. Les dates de publication utilisées pour les paires intégrées sont celles des publications INSEE correspondantes (T1 15 avril, T2 10 juillet, T3 15 octobre 2026 ; T4 2025 publié le 15 janvier 2026). Vérification par tests ajoutée. L'utilisateur doit encore confirmer que la paire choisie est celle visée par son bail.
