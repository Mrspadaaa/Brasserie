# Revue visuelle du simulateur de recette — 9 septembre 2026

## Périmètre réellement inspecté

Les quinze captures `cases-00`, `documente`, `cumul-20`, `lecture` et `variante`, chacune en **320, 390 et 1280 px**, ont été ouvertes et examinées avec `view_image`. Elles proviennent du parcours sur le build compilé, dans `%TEMP%/laffinee-hop-qa-evidence/`. La série inspectée initialement a été produite vers 12:27 (Europe/Zurich). Les noms sont réutilisés lors des exécutions suivantes : cette heure distingue le constat initial de sa vérification après correction.

Cette inspection porte sur les zones visibles de ces captures. Elle ne constitue pas, à elle seule, une preuve de navigation au clavier, d’absence de débordement de toute la page ou d’absence de requêtes réseau.

| Écran inspecté | Constat visuel initial |
| --- | --- |
| `cases-00-{320,390,1280}.png` | État compact sans intensité quantifiable : radar sans faux point central, une explication, repères documentaires et autres familles repliés. Les cases passent sur deux lignes sur mobile sans tronquer leur libellé. |
| `documente-{320,390,1280}.png` | Mode complet explicitement demandé : bandes aromatiques bornées et familles indéterminées distinctes, plages et confiance lisibles. À 1280 px, le radar descendait presque hors du premier écran. |
| `cumul-20-{320,390,1280}.png` | Le titre identifie l’ensemble des vingt ajouts et la levure ; les deux cases sont cochées. Les intensités 0–100 restent explicitement indéterminées. Même décalage vertical du radar à 1280 px. |
| `lecture-{320,390,1280}.png` | Même présentation compacte en recette enregistrée, sans champs de modification de recette ; détails repliés et action explicite pour explorer une variante. |
| `variante-{320,390,1280}.png` | Variante réellement ouverte : houblon, souche, moment, dose, température et durée. Les trois champs numériques tiennent à 320 px. La variante conserve davantage d’aide que l’état compact, après une action explicite de l’utilisateur. |

Les douze libellés du radar courant ne se chevauchent pas dans les captures inspectées. Les axes propres à une étude et non applicables ne créent plus un second « Agrumes » inconnu dans ce radar ; ils restent consultables dans la table complète. Les axes et leurs échelles scientifiques ne sont pas fusionnés.

## Défauts confirmés et corrections

1. **Radar desktop éloigné du haut de la table complète.** L’alignement vertical centré de la grille faisait dépendre sa position de la hauteur des treize lignes. Le mode complet utilise maintenant un alignement en haut ; l’état compact conserve son alignement équilibré.
2. **Compagnon flottant devant le contenu mobile.** À 320/390 px, la bulle recouvrait notamment des confiances et des résumés « Composition » / « Calcul » ; à 1280 px elle restait en dehors de la colonne. Le raccourci mobile possède maintenant une place réservée dans la barre d’étapes du wizard et à côté du bouton de brassage dans le pied de recette. Il ouvre le même chat et conserve le contexte du brouillon. La bulle n’est masquée que sur ces écrans mobiles. Les autres écrans et le bureau conservent leur disposition.

La pastille des conversations en cours est une commande indépendante : aucune de ces quinze captures ne contenait cette pastille, et son placement n’est donc pas déclaré validé par cette revue.

## Vérifications fonctionnelles associées

Après ces corrections : `HopAromaChart`, `HopRecipeSimulationPanel` et `brewerNavigation` passent, soit **23 tests** ; `tsc --noEmit` passe. Le test du raccourci intégré vérifie l’ouverture d’un seul dialogue avec le bon brouillon, sans soumission d’une question IA.

Le rapport automatique de la série initiale indique, pour chaque largeur, zéro erreur enregistrée, zéro requête distante, zéro écriture et zéro requête pendant les changements de simulation. La mise à jour du cumul de vingt ajouts y prend environ 12–15 ms. Ce sont les mesures du parcours QA avec les adaptateurs réseau/persistance isolés, pas une mesure des quotas de production.

## Vérification après correction

Quatre captures régénérées ont ensuite été ouvertes : `cases-00-320.png`, `documente-1280.png`, `lecture-390.png` et `variante-320.png`. Le radar de la table complète commence maintenant en haut et reste visible. Sur les trois vues mobiles, le compagnon occupe sa place dans l’en-tête du wizard ou le pied de recette, sans recouvrir les graphiques ni leurs détails. Le bouton de brassage et les libellés voisins restent lisibles.

Une autre anomalie signalée dans `details-390.png` a été corrigée dans `RecipePage` : le ratio d’empâtage est formaté en français à deux décimales (`3,90 L/kg`), au lieu d’afficher sa représentation flottante complète. `recipeEditing`, `HopRecipePanel` et `brewerNavigation` passent après cette correction, soit 22 tests.

Une inspection complémentaire a ensuite ouvert **neuf captures** : `chimie`, `details` et `cumul-20`, chacune à 320, 390 et 1280 px.

| Captures complémentaires ouvertes | Résultat observé |
| --- | --- |
| `chimie-{320,390,1280}.png` | La section identifie des quantités introduites, avant extraction et fermentation. La bande des acides alpha est affichée avec ses bornes et son unité (`2 880–3 360 mg`). Les autres analytes visibles restent « Non quantifiable », sans barre assimilable à un zéro. Les noms des formes cystéinylées et glutathionylées tiennent dans les vues mobiles, sans recouvrement par le compagnon. |
| `details-{320,390,1280}.png` | Les limites des intervalles et les versions des modèles sont accessibles après ouverture du détail. Le ratio corrigé `3,90 L/kg` est maintenant vérifié visuellement aux trois largeurs. Les paliers, leurs durées et leurs températures sont alignés et lisibles. Les boutons du pied n’empiètent pas sur les lignes visibles. |
| `cumul-20-{320,390,1280}.png` | La mention des vingt ajouts, la levure et les deux cases cochées restent visibles. Le radar est placé en haut à 1280 px ; ses libellés ne se chevauchent pas sur les trois vues. Les tableaux distinguent l’intensité indéterminée, sa plage 0–100 et sa confiance. Les contrôles du compagnon ne recouvrent plus ces éléments. |

La dernière série a corrigé la fixture Wyeast 1728 en « liquide ». La capture finale `details-390.png` a été ouverte après régénération : elle affiche bien cette forme et `3,90 L/kg`. Aucun défaut de mise en page supplémentaire nécessitant une correction de code n’a été relevé. La série navigateur finale passe aux trois largeurs ; ses mesures figurent dans `hop-recipe-browser-qa.md`.
