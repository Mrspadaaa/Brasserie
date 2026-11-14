OK — carnet de recettes : 4 mini maquettes (froide, 2 tièdes, chaude), repos, geste, comparer

## Variantes
| id | chaleur | idée | images |
|---|---|---|---|
| e8a | froide | Le carnet remis d'aplomb : cartes actuelles, phrase-réponse, jauge alcool/style, lots en pastilles | repos, geste, comparer, vide (390 clair) |
| e8b | tiède | La frise des lots : une rangée par recette sur l'année, historique OG → FG déplié, « Saison écoulée · Rebrasser » ; comparaison en haltères | repos, geste, comparer (390 clair), repos 390 cave, repos 1280 |
| e8c | tiède | Le duel d'abord : « Laquelle brasser ensuite ? », deux cases VS, tuiles couleur bière ; comparaison en papillon | repos, geste, comparer (390 clair) |
| e8d | chaude | Le comptoir aux verres : verres sur étagère (alcool = hauteur), recette servie en pleine page, lots en tickets, deux verres trinquent, corde à nœuds | repos, geste, comparer (390 clair) |

Meilleure (cave et 1280) : e8b.

## Fichiers écrits
`e8a/`, `e8b/`, `e8c/`, `e8d/` (chacun `etat.html`, PNG, `NOTE.md`), `capture.mjs`, `tests.txt`, `RESULTAT.md`. Rien hors de `voies/e8/`.

## Critères (sortie décisive, `tests.txt`)
- G1 : SERIE OK
- G2 : ETATS OK
- G3 : HORS OK
- Tests : aucune suite Vitest (rien dans `src/`).

## Images ouvertes (Read)
Toutes les 16 ont été ouvertes au moins une fois. Après la dernière retouche, `e8d-repos` a été rouvert. Trois retouches mineures n'ont pas été revues : l'axe des mois de `e8b` (« sept » retiré, « nov » et « 14 » écartés), la ligne de compte de `e8c-repos` (texte remis en bloc, « APA ») et le bas de `e8d-geste`. À rouvrir par le pilote ou l'exécutant.

## Code lu (L02)
- `CatalogCards.tsx` `RecipeCard` ;
- `ProductionCatalog.tsx` : sélection 2/2, liste vide, feuille « Brassins de … » ;
- `RecipeComparison.tsx` : profil visé, grain, houblons par étape, levure et procédé.

Les fonctions gardées, déplacées ou non dessinées sont détaillées dans chaque NOTE.md. Ranger, favoris, filtres et tri ne sont dessinés qu'en e8a.

## Prédiction
« La frise (e8b), je vois enfin mes lots et ce qu'il faut rebrasser ; les verres (e8d), c'est fun, mais la hauteur pour l'alcool je dois l'apprendre. »

DÉCISION À PRENDRE : aucune (il choisit sur la page).
CONNAISSANCE : `src/data/brewingStylesBootstrap.json` donne les bandes BJCP 2021 (OG, FG, alcool, IBU, SRM) de chaque style. Une recette sans IBU peut ainsi montrer la bande du style à la place du « — » nu.
LEÇON PROPOSÉE : dans une maquette statique, une règle `[data-x]{display:none}` suivie d'une règle de classe `display:flex` laisse visibles tous les états à la fois. Masquer par état avec `:not([data-x~=etat])` et `!important` (vu sur e8a, première capture).
