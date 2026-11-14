OK — 4 maquettes Carnet et Dossier (froide, 2 tièdes, chaude), repos, geste, dossier

## Fichiers écrits (tous dans voies/e3/)
- `capture.mjs` (copie adaptée de s5), `tests.txt`
- `e3a/`, `e3b/`, `e3c/`, `e3d/` : `etat.html`, `NOTE.md`, PNG

## Variantes
| id | chaleur | idée | livre |
|---|---|---|---|
| e3a | froide | Carnet et Dossier remis d'aplomb (3 rubriques gardées, notes en cartes éditables, recette figée cochée) | NEIPA |
| e3b | tiède | Le fil du brassin, jour par jour (bulles datées, Dicter en héros, recette en ticket) | NEIPA |
| e3c | tiède | La prochaine version, d'après tes notes (figée face à la prochaine, curseur m2, déstockage du dry hop) | NEIPA ; cave et 1280 |
| e3d | chaude | Le verre annoté de la Stout (zones à toucher, échelles « trop peu → juste → trop », bouteilles et fût dessinés) | Stout |

## Critères (sortie dans tests.txt)
- G1 : SERIE OK
- G2 : ETATS OK
- G3 : HORS OK

## Captures (toutes ouvertes)
- `e3a/e3a-repos-390-clair.png`, `e3a-geste-390-clair.png`, `e3a-dossier-390-clair.png`
- `e3b/e3b-repos-390-clair.png`, `e3b-geste-390-clair.png`, `e3b-dossier-390-clair.png`
- `e3c/e3c-repos-390-clair.png`, `e3c-geste-390-clair.png`, `e3c-dossier-390-clair.png`, `e3c-repos-390-cave.png`, `e3c-repos-1280-clair.png`
- `e3d/e3d-repos-390-clair.png`, `e3d-geste-390-clair.png`, `e3d-dossier-390-clair.png`
- Ouvertes avant les retouches finales et non rouvertes : e3a, e3b et e3d (remplissage, chevauchements) ; e3c, dossier et 1280.

## Limites connues
- e3c à 1280 : le tiers bas reste vide (en passe 2, mettre le dossier en troisième colonne).
- Bas d'écran du dossier peu rempli en e3d. Le dossier de e3a fait 858 px de haut.
- `impeccable` et `ui-design-system` n'ont pas été chargés, faute de budget de contexte. `boosters-ux` l'a été.
- Notes, malts et Stout sont fictifs ; le détail est dans chaque NOTE.md.

Prédiction : « e3c, enfin un carnet qui sert à quelque chose ; le verre de la Stout, ça claque. »

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : l'écran actuel n'affiche ni la recette figée ni les ingrédients sortis du stock dans Dossier (BatchDetailSheet.tsx l. 248-278, 448-468). Seul un rappel du stock y renvoie vers Mesures.
LEÇON PROPOSÉE : aucune.
