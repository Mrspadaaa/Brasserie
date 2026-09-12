# Informations de levure utiles au brassage

Recherche et implémentation du 12 septembre 2026. Ce complément prolonge la [recherche blé](yeast-wheat-style-evidence.md), la [recherche houblons](yeast-hop-practical-evidence.md) et la [validation du parcours levure](yeast-frontend-flow-validation.md).

## Besoin et choix produit

Le style limite les souches à comparer ; le caractère recherché aide ensuite à comprendre les différences. Le brasseur doit aussi savoir préparer le produit, anticiper sa mousse et sa sédimentation, et retrouver ces repères au moment d’ensemencer. Ces informations ne doivent pas encombrer les réglages quotidiens.

Une ligne repliée **Fiche de la souche · repères pratiques** est intégrée dans le scénario, l’overview et le helper du jour de brassage. Une grille compacte affiche les caractéristiques documentées, puis des rubriques de préparation, fermentation et conservation. Les absences sont regroupées ; les conditions détaillées et les liens restent dans un second niveau. Les visualisations de température, DF documentaire et dose existantes continuent à servir la comparaison.

## Informations pratiques vérifiées

| Produit exact | Information utilisable | Conséquence dans l’application |
|---|---|---|
| [Fermentis US-05](https://fermentis.com/en/product/safale-us-05/) | Ajout direct ou réhydratation facultative ; cette dernière utilise un rapport en **poids**, à 25–29 °C, 15–30 min. | Deux méthodes distinctes, conditions de conservation et sachet ouvert consultables. Aucun volume de levain ni viabilité supposés. |
| [Fermentis W-68](https://fermentis.com/en/product/safale-w-68/) | Ajout direct à 20–32 °C ; fermentation à 18–26 °C. La réhydratation de cette notice utilise un rapport en **volume**, à 20–28 °C. | Protocole propre à W-68. La validation distingue sa température d’ajout direct de sa consigne principale ; 30 °C peut être un ajout documenté, mais reste hors fenêtre de fermentation. |
| [Wyeast 3068](https://wyeastlab.com/product/weihenstephan-weizen/) | Demande de 33 % d’espace libre, soufre susceptible de se dissiper pendant la maturation, suspension persistante après atténuation. | Repères pour dimensionner la cuve et interpréter l’aspect du brassin, sans date automatique de fin de fermentation. |
| [Wyeast 3638](https://wyeastlab.com/product/bavarian-wheat/) | Même demande d’espace libre explicitement publiée ; comportement poudreux et soufré également décrit pour cette souche. | Informations référencées à sa propre fiche, sans les déduire de sa parenté avec 3068. |
| [Wyeast 3944](https://wyeastlab.com/product/belgian-witbier/) | La fiche demande également 33 % d’espace libre. | Le helper mousse de la Witbier dispose désormais de cette valeur sourcée. |
| [Wyeast 1318](https://wyeastlab.com/product/london-ale-iii/) | Forte floculation et usage NEIPA/Hazy cités ensemble ; association décrite avec les houblons tropicaux tardifs et à cru. | L’interface distingue floculation et résultat visuel, et conserve une interaction houblon qualitative. |

Les procédures et chiffres sont des observations fabricant. La phrase reliant floculation, trouble et absence de date garantie est une interprétation prudente de la fiche 1318, pas un essai comparatif de clarification. Les descriptions sont reformulées ; les dates de publication absentes restent inconnues.

## Sélection élargie par style

Le comparateur passe de 24 à **38 références distinctes**, avec **153 observations fabricant** supplémentaires. Les souches de laboratoires différents gardent leur identité ; leur présence dans un même style ne signifie pas qu’elles sont équivalentes.

| Complément | Produits ajoutés à la sélection | Différences utiles |
|---|---|---|
| [Belgique et Saison : sources et limites](yeast-belgian-enrichment.md) | Wyeast 1214, 3787, 3522, 3711 ; White Labs WLP500, WLP530 ; Fermentis BE-256 | Démarrage, fruité et épices décrits, mousse, atténuation et statut STA1 lorsqu’il est publié. |
| [Lager et ales anglaises : sources et limites](yeast-lager-enrichment.md) | Wyeast 2124, 2308, 1968 ; White Labs WLP830, WLP002 ; Fermentis S-189, S-23 | Usages selon la température, maturation et diacétyle, finale, floculation ou sédimentation, préparation et conservation des produits secs. |

Les 19 pages primaires effectivement utilisées dans ces deux lots ont été archivées avec leurs empreintes de contenu. Deux pages de commande chargées uniquement par JavaScript ont été écartées comme preuves de forme. Les rapports liés précisent les sources, les divergences et les limites de chaque souche ; le [complément d’import](yeast-style-enrichment-supplement.json) conserve les identifiants, faits et reçus de collecte.

Quelques distinctions sont déterminantes pour l’usage : la sédimentation rapide de S-189 n’est pas rebaptisée floculation élevée ; le texte de 1968 sur le fruité à 23 °C n’étend pas sa fenêtre fabricant ; l’information qualitative de White Labs sur la β-lyase de WLP830 reste accessible à l’IA même si un ancien champ personnel est « inconnu ». Aucun rendement en thiols ni score aromatique n’en est déduit.

## Transmission et limites

- Les nouvelles caractéristiques conservent leurs sources, valeurs, unités, bornes et conditions. Une valeur « au moins » reste une borne ; deux valeurs différentes restent séparées. Une tolérance à l’alcool ne devient pas une prédiction de degré final.
- Les protocoles pratiques exigent une correspondance de produit et de forme. Une culture renseignée comme levain ou de forme inconnue ne reçoit pas le protocole de levure sèche. La notice du conditionnement et du lot reste nécessaire.
- Le compagnon IA reçoit les observations et les notes pratiques avec leurs sources. Son résumé initial inclut les repères les plus utiles ; les listes bornées indiquent leur éventuelle limitation. Les conditions de préparation ne sont pas des mesures du brassin.
- Le jour de brassage lit la recette figée du brassin. Ouvrir une fiche n’enregistre aucun ajout, ne change aucune dose et ne remplace pas le journal de mesures.
- L’import/export conserve l’identité, la forme, l’objectif et les réglages de recette. L’encyclopédie documentaire reste référencée par produit, séparée des paramètres propres au brassin.
- Un ancien enregistrement sans catalogue peut recevoir la fiche du même ID et de la même forme. Les catalogues personnels, contradictions et catalogues explicitement vides restent prioritaires ; aucun nom approchant n’est substitué.
- Les signes explicites POF `+`, `-` et `−` sont reconnus. Une absence, un point d’interrogation ou une donnée contradictoire ne devient pas un statut négatif.

## Validation

**198 tests ciblés réussis** dans 13 fichiers : 23 pour les deux lots documentaires, 19 pour l’enrichissement et les références, 53 pour l’interface partagée, l’IA et le brassin, puis 103 pour les simulations et les parcours de transfert et de recette. Les oracles des deux lots ont été relancés indépendamment lors de l’intégration. Les builds de l’application et des fonctions serveur réussissent.

Les cas vérifiés couvrent notamment le choix de 3787, son application et son aller-retour texte, la forme du produit, la conservation des informations personnelles, les bornes d’ensemencement de W-68, le contexte IA et la recette figée du brassin. Les protocoles secs exigent une forme sèche explicitement renseignée.

La revue réelle de Chrome utilise l’application React et ses composants avec un stockage de test isolé. Elle commence à **375 px**, puis couvre **320, 430 et 1 280 px** : choix de 3787 et S-189 par style, ouverture et fermeture des détails et sources, commande au clavier, application du scénario, enregistrement, overview et jour de brassage. Elle produit 29 captures, dont une avec texte agrandi à 200 %. Aucun débordement horizontal ni erreur JavaScript n’a été relevé ; l’ouverture des fiches ne provoque pas d’écriture. Les captures utiles ont été regardées, pas seulement générées.

| Vue inspectée | Avant | Après |
|---|---|---|
| Téléphone, vue principale compacte | [375 px](yeast-recipe-evidence/information-before-375.png) | [375 px, détails fermés](yeast-recipe-evidence/information-closed-375.png) |
| Informations pratiques | — | [Préparation US-05](yeast-recipe-evidence/information-preparation-375.png), [conditions et sources](yeast-recipe-evidence/information-sources-375.png) |
| Nouvelles souches | — | [3787, téléphone 375 px](yeast-recipe-evidence/information-belgian-375.png), [S-189, téléphone 320 px](yeast-recipe-evidence/information-lager-320.png) |
| Ordinateur | [Éditeur 1 280 px](yeast-recipe-evidence/information-before-1280.png) | [Overview 1 280 px](yeast-recipe-evidence/information-overview-1280.png) |
| Jour de brassage | — | [Recette figée, 430 px](yeast-recipe-evidence/information-brew-day-430.png), [texte à 200 %](yeast-recipe-evidence/information-text-200-percent-375.png) |

La critique UX a conduit à regrouper les caractéristiques absentes sur une seule ligne, conserver les sources au second niveau, distinguer sédimentation et floculation, et afficher explicitement une température dans ou hors fenêtre. Le brasseur garde les réglages et comparaisons visibles avant de consulter les protocoles. Les liens de source en double sont regroupés dans la liste documentaire ; les conditions propres à chaque observation restent consultables.

La transmission à l’IA est vérifiée au niveau des données et des outils, sans appel payant à un modèle. Les transferts utilisent les tests d’intégration et de sérialisation, complétés par le [parcours navigateur d’import/export précédent](yeast-frontend-flow-validation.md). Cette passe ne répète pas un appel de production ni le parcours presse-papiers déjà vérifié. Le complément de 14 fiches a été transmis au responsable de la synchronisation du catalogue, qui a confirmé son import sans conflit et un second passage sans écriture. Aucun déploiement du frontend n’a été effectué dans cette passe.

Les neuf critères de livraison et la vérification des délégations sont suivis dans `.unlazy/yeast-style-enrichment/`. Le [script de revue visuelle](../../scripts/check-yeast-information-ui.mjs) permet de rejouer les interactions avec Chrome installé et Puppeteer ; les adaptations de test remplacent uniquement le stockage, l’authentification et les appels distants.
