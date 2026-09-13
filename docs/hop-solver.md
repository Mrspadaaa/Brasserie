# Solver houblon × levure × timing

Révision du 12 septembre 2026. Guide de formulation expérimental pour L’Affinée.

## Utilisation

Pendant la création ou la modification d’une recette, ouvrir **Construire le goût de ma bière → Trouver mon combo**. Le même atelier reste accessible dans l’Index Houblon.

Choisir un style de départ, les familles souhaitées et celles à éviter, puis éventuellement favoriser ou éviter thiols, terpènes et phénols de levure. Le style est un preset éditorial modifiable, pas une conformité BJCP certifiée. Une famille à éviter signifie « rester dans la classe discrète » ; cela ne garantit pas son absence chimique.

Le catalogue des houblons distingue les **usages documentés pour le style** des références **à explorer**. Ces usages proviennent de fiches fabricant ou de recettes publiées, avec leurs sources consultables dans le programme proposé. Un usage générique « IPA » n’est pas transformé en preuve spécifique Hazy ou anglaise. L’absence de référence n’établit aucune incompatibilité. La recherche aromatique affine ce choix ; le nom d’une variété ne reçoit aucun bonus de popularité.

La sélection manuelle limite les variétés effectivement comparées. **Automatique** réouvre le catalogue complet, sous le budget éventuel du mode rapide. Les essais comportant un houblon hors sélection ne sont pas proposés partiellement. Une référence sélectionnée devenue indisponible ou archivée produit une erreur explicite. Modifier le choix annule les résultats précédents ; aucune importation ni modification de recette n’a lieu pendant la comparaison.

Cette séparation reflète les guides BJCP : l’[American IPA](https://www.bjcp.org/style/2021/21/ipa/) admet une grande diversité de houblons, la [Double IPA](https://www.bjcp.org/style/2021/22/22A/double-ipa/) conserve une expression houblonnée avec une fermentation neutre à légèrement fruitée, tandis que l’[English IPA](https://styles.bjcp.org/bjcp-2021-beer/12/12c-english-ipa) privilégie les ingrédients britanniques, notamment en finition. Le type de houblon ne remplace ni le contrôle de la levure ni celui des paliers.

Le mode **Ciblée · rapide**, choisi par défaut, présélectionne les variétés et les souches avant d’explorer les timings et les doses enregistrées dans le guide. Le mode **Exhaustive** examine toutes les associations du domaine défini. Il peut conserver la souche actuelle. Une souche non résolue n’est pas remplacée silencieusement. Le programme choisi préremplit dose, température de contact et durée :

1. valeur choisie dans la plage du protocole publié si disponible ;
2. pour un ajout en fermentation active, température du premier palier planifié ;
3. sinon, proposition éditoriale sourcée.

Ces valeurs sont des **conditions proposées**, jamais une mesure de cuve ni un optimum garanti. Leur provenance reste consultable et les champs sont modifiables. Un zéro saisi est conservé.

Les programmes documentés et les nouvelles extrapolations sont présentés séparément. Le résultat d’un essai porte sur son protocole complet. Changer sa levure, sa dose, son timing ou ses autres ingrédients n’hérite pas automatiquement du résultat mesuré.

Le bouton d’application ajoute le programme, ou remplace seulement l’ajout choisi. Il conserve les autres ingrédients et paliers. Un changement de souche affecte toute la bière et remet sa quantité à vérifier. La consultation d’une recette terminée reste sans écriture ; ses variantes se comparent avant toute modification explicite.

## Recherche ciblée, coût et arrêt

Le produit variétés × souches × timings × doses peut dépasser un million de scénarios. La présélection du mode ciblé utilise seulement des informations déjà chargées :

- variétés : exclusions documentées, usages du style documentés, références présentes dans la recette, familles aromatiques recherchées, présence d’essais ou de modèles dédiés ;
- souches : souche actuelle, compatibilité POF et température documentée, présence de références utilisables, orientation β-lyase si demandée.

Ces critères se comparent dans cet ordre, sans somme pondérée. Un identifiant stable départage les égalités. Une information manquante ne devient ni une absence d’arôme ni une exclusion. La souche imposée est conservée, même sans modèle dédié. Les programmes publiés applicables aux levures et timings autorisés sont tous examinés, en dehors du budget de présélection.

Pour laisser apparaître plusieurs variétés, les résultats exploratoires retiennent la meilleure condition évaluée pour chaque couple houblon / levure. Tous les timings et doses du domaine restent évalués, et les essais publiés conservent leur identité. L’usage documenté oriente l’ordre d’affichage mais ne modifie ni les scores sensoriels ni leurs incertitudes.

Le budget technique est de **24 variétés et 8 souches au maximum**, réduit si nécessaire pour rester sous **2 048 variantes**, auxquelles s’ajoutent les programmes publiés. Un domaine plus petit est examiné entièrement. Ces limites sont des budgets de calcul, pas des coefficients chimiques ni des poids de confiance. La présélection peut manquer une meilleure piste : son résultat ne certifie aucun optimum global. Le mode exhaustif conserve le domaine complet aux doses et timings définis, sans garantir la justesse sensorielle du modèle.

Les prédictions, marges, risques et règles de classement sont identiques dans les deux modes. Les descripteurs documentaires sont mis en cache pendant la recherche ; ils ne sont pas recalculés pour chaque dose. Le moteur ne crée pas de tableau contenant le million de scénarios.

Un second profilage a identifié la normalisation répétée des mêmes textes comme premier coût de préparation. Les descriptions valides et les termes sont maintenant normalisés une seule fois par contexte de recherche. Les preuves, négations, limites de mots et exclusions du contexte bière restent identiques. Les caches sont locaux au calcul ; une révision des données repart avec un nouveau contexte. Le calcul partagé par le compagnon bénéficie aussi de cette préparation.

Le calcul s’exécute **sur l’appareil, dans un worker**, sans appel IA ni lecture ou écriture Firestore par scénario. Les données du catalogue ont leur chargement habituel ; parcourir davantage de scénarios ne multiplie pas ces lectures. Seule l’application explicite du programme peut enregistrer ses références manquantes, dont uniquement les souches retenues, puis modifier la recette.

Les premières pistes deviennent consultables pendant le calcul. La progression est actualisée au plus quatre fois par seconde, avec un dernier résultat à la fin. **Arrêter la recherche** termine le worker et conserve les résultats partiels ; quitter l’écran termine aussi le worker. Les autres commandes restent accessibles. Changer un critère, la recette ou les données réellement utilisées annule la recherche et invalide ses anciens résultats ; une notification sans changement de contenu ne l’annule pas. Sans worker disponible, un repli local cède régulièrement la main au navigateur et reste annulable.

Lorsque les meilleures pistes n’ont pas changé, le worker transmet uniquement la progression ; les profils, explications et sources déjà reçus restent en mémoire dans l’interface. Toute nouvelle sélection et le résultat final incluent à nouveau leurs détails. Ce mécanisme économise les copies entre worker et interface ; il ne retire aucune provenance.

### Vérification reproductible

`tests/unit/hopSolverPerformance.test.ts` utilise le catalogue complet : **1 638 633 scénarios possibles, 1 731 examinés en mode ciblé** pour trois timings et une cible agrumes. Il contrôle la conservation des essais publiés, l’identité des prédictions retenues avec le mode exhaustif, la stabilité de la sélection, les contraintes de recette et l’absence de service réseau dans les dépendances du worker. Mesure locale Node du 8 septembre 2026 : environ 0,2 s jusqu’aux premières pistes et 0,4 s pour terminer ; ce n’est pas une promesse de durée sur téléphone.

`scripts/check-hop-solver-speed.mjs`, sur le serveur Vite local, vérifie le vrai worker avec le catalogue complet à 320, 390 et 1 280 px : résultats progressifs, commandes accessibles, arrêt, invalidation après changement de style, navigation et aucune écriture de recherche. Après compilation, `HOP_SOLVER_BUILT_WORKER=1` vérifie le même parcours avec le worker de production. Mesures Chrome de ce dernier sur cette machine : premières pistes entre 233 et 238 ms, recherche terminée entre 449 et 451 ms, arrêt entre 27 et 37 ms. En exécutant simultanément compilation et suite de tests, la recherche prenait 1,2 à 1,7 s. Les largeurs mobiles simulent la mise en page, pas la puissance d’un téléphone. `scripts/check-hop-solver.mjs` vérifie ensuite l’application, l’enregistrement et la consultation sans modification. Les accès distants sont bloqués pendant ces vérifications ; les rapports et captures restent dans `.codex-remote-attachments/`.

Après le second audit du 8 septembre 2026, sur le même catalogue et la même machine : préparation Node d’environ 190 à 19 ms, recherche Node complète d’environ 0,4 à 0,16 s ; worker compilé dans Chrome, premières pistes en 89–90 ms et fin en 224–226 ms. L’arrêt reste à 24–29 ms. Le contrôle navigateur vérifie aussi les messages de progression allégés en mode exhaustif. `hopDescriptorCache.test.ts` compare les preuves du catalogue avec la recherche lexicale historique et vérifie les négations, les sources invalides et la prise en compte des révisions. Ces gains ne modifient ni la présélection ni les formules sensorielles.

## Contraintes et recette existante

Les exclusions sont vérifiées hors de la somme pondérée d’adéquation. Un candidat en conflit reste consultable dans les pistes écartées, mais ne peut pas être appliqué. Une incertitude reste visible et ne bloque pas une piste.

Le classement est lexicographique : conflits, incertitudes des critères demandés, familles recherchées documentées, borne basse d’adéquation, largeur de plage, identifiant stable. Les règles sont des conventions de choix, pas des probabilités. Une préférence et une exclusion contradictoires sont signalées.

Les ajouts existants sont réévalués avec la souche proposée. Leur quantité de dry-hop s’ajoute à celle du programme ; une dose inconnue rend le total inconnu. Le repère éditorial de revue à 8 g/L n’est ni un seuil de défaut ni un plafond. Le risque de hop creep provient de sa politique documentaire séparée.

Le profil total de plusieurs houblons n’est pas obtenu en additionnant leurs graphes : la levure serait comptée plusieurs fois et les interactions de perception ne sont pas étalonnées. Le grist, la couleur, l’oxydation et les paliers ne donnent pas encore de correction aromatique numérique. Cette limite est conservée dans les plages du modèle ; les contraintes de fermentation connues sont affichées à part.

Thiols/précurseurs, terpènes et phénols sont des orientations documentaires. Une présence analytique dans le houblon ne donne pas une concentration finale en bière. Une activité β-lyase ne prouve ni un rendement ni un caractère POF. Les polyphénols du houblon sont distincts des phénols volatils de levure.

Les fiches [Wyeast 3068](https://wyeastlab.com/product/weihenstephan-weizen/) et [Wyeast 3724](https://wyeastlab.com/product/belgian-saison/) ajoutent respectivement un profil de girofle documenté et une souche de saison. Les températures fabricant sont conservées comme données documentaires, publication non datée et consultation au 8 septembre 2026. La 3724 est accompagnée de l’avertissement diastaticus/STA1 ; son rendement aromatique reste inconnu. Aucun chiffre de β-lyase n’est déduit.

## Données et modification

`kind: solver` utilise la collection existante `hopKnowledge`. Les presets, doses candidates, conditions et repères sont modifiables dans l’éditeur de connaissances, avec source et version. Aucune DSL ni nouvelle Cloud Function.

`scripts/build-hop-solver.mjs` produit le guide initial ; les chiffres proposés portent une attribution éditoriale explicite. `scripts/build-hop-dose-study.mjs` reconstruit les courbes observées et leurs transformations reproductibles.

Le modèle initial intact `2026-09-08.1` reçoit à la lecture la révision `2026-09-08.2`. Le test est une égalité complète du contenu canonique, pas uniquement du numéro de version. Toute personnalisation, désactivation ou donnée invalide reste prioritaire. La lecture n’écrit pas ; l’application explicite enregistre cette révision une fois. Les instantanés historiques conservent leurs coefficients et leur ancien algorithme.

## Ce qui est étayé par les essais

L’essai [Lafontaine et Shellhammer, 2018](https://onlinelibrary.wiley.com/doi/full/10.1002/jib.517), tableau 3, fournit cinq doses Cascade : 0, 2, 3,86, 8 et 16 g/L. Les moyennes agrumes sont 1,9 ; 4,4 ; 5,8 ; 7,1 ; 7,0 ; les moyennes herbacé/thé 2,5 ; 4,3 ; 5,7 ; 7,4 ; 10,4 sur 15. Un lot de cônes et une bière clarifiée ne représentent pas toutes les associations.

Deux usages sont séparés :

- **Courbe contextuelle** : interpolation linéaire entre observations, dans le domaine variété/souche/forme/matrice/température/contact de l’essai. Projection sur 0–100 explicitement conventionnelle. Résidu reconstruit en retirant tour à tour les trois doses intérieures ; il n’a aucune couverture statistique certifiée.
- **Transfert exploratoire** : différence au témoin divisée par le plus grand incrément observé ; mélange de cette forme relative avec la réponse générique. Poids de transfert initial compris entre 0 et 1, repère central 0,5 : hypothèse non ajustée. Cette enveloppe conserve la forme générique et ne fabrique pas un gain de précision. Au-delà de 16 g/L, forme transférée inconnue et absence de repère central transféré.

Les essais qualitatifs multi-houblons sont des pistes documentées, jamais des lignes d’intensité numérique inventées. Les répétitions de juges ou analyses ne sont pas comptées comme autant de brassins indépendants.

## Résultat de l’audit mathématique

Le détail se trouve dans [la revue des invariants](hop-math-audit.md). L’audit corrige des erreurs de cohérence ; il ne démontre pas une augmentation de justesse sensorielle. Les nouvelles courbes utilisent plus directement les observations disponibles, mais leur transfert reste à valider sur d’autres lots et brassins. Aucun intervalle n’est annoncé à 95 %.
