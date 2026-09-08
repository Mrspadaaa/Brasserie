# Solver houblon × levure × timing

Révision du 8 septembre 2026. Guide de formulation expérimental pour L’Affinée.

## Utilisation

Pendant la création ou la modification d’une recette, ouvrir **Construire le goût de ma bière → Trouver mon combo**. Le même atelier reste accessible dans l’Index Houblon.

Choisir un style de départ, les familles souhaitées et celles à éviter, puis éventuellement favoriser ou éviter thiols, terpènes et phénols de levure. Le style est un preset éditorial modifiable, pas une conformité BJCP certifiée. Une famille à éviter signifie « rester dans la classe discrète » ; cela ne garantit pas son absence chimique.

Le solver explore les variétés, les souches et les timings disponibles, à plusieurs doses explicitement enregistrées dans le guide. Il peut conserver la souche actuelle. Une souche non résolue n’est pas remplacée silencieusement. Le programme choisi préremplit dose, température de contact et durée :

1. valeur choisie dans la plage du protocole publié si disponible ;
2. pour un ajout en fermentation active, température du premier palier planifié ;
3. sinon, proposition éditoriale sourcée.

Ces valeurs sont des **conditions proposées**, jamais une mesure de cuve ni un optimum garanti. Leur provenance reste consultable et les champs sont modifiables. Un zéro saisi est conservé.

Les programmes documentés et les nouvelles extrapolations sont présentés séparément. Le résultat d’un essai porte sur son protocole complet. Changer sa levure, sa dose, son timing ou ses autres ingrédients n’hérite pas automatiquement du résultat mesuré.

Le bouton d’application ajoute le programme, ou remplace seulement l’ajout choisi. Il conserve les autres ingrédients et paliers. Un changement de souche affecte toute la bière et remet sa quantité à vérifier. La consultation d’une recette terminée reste sans écriture ; ses variantes se comparent avant toute modification explicite.

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
