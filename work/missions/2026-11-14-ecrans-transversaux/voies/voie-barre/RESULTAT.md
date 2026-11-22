OK — voie-barre : SERIE OK, 4 variantes, préférée b3 (l'orgue des rubriques)

## Fichiers écrits (tous dans voies/voie-barre/)
- `fabrique.mjs` (source unique des 4 maquettes et des captures, puppeteer-core, Chrome headless)
- `b1.html` … `b4.html` (statiques, sans script de jeu, polices Google seules)
- 16 captures : `b1-a-390.png`, `b1-b-390.png`, `b1-cave-390.png`, `b1-1280.png`, idem b2, b3, b4
- `NOTE.md` (une ligne par variante, rien de perdu, jugement, boosters), `controle.txt`

## Lignes par variante
- b1 · le + à ordre figé · froide · 10, 11, 12, 13 · fini, captures regardées
- b2 · la rangée Créer · tiède · 10, 11, 12 · fini, captures regardées
- b3 · l'orgue des rubriques · chaude · 10, 11, 12 · fini, captures regardées (corrigé : Compagnon débordait, étiquette flottante retirée)
- b4 · l'éventail au pouce · chaude · 11, 12 (10 en partie) · fini, captures regardées (corrigé : libellé Compagnon coupé au bord)

## Critère
- G1 : `node work/missions/2026-11-14-ecrans-transversaux/controle-serie.mjs voie-barre b1,b2,b3,b4` → `SERIE OK` (exit 0)
- `git status` : seuls des fichiers de la voie ajoutés ; rien dans `src/`.

## Prédiction
« L'orgue, je vois tout de suite où je crée et dans quelle rubrique ; l'éventail est joli mais il me cache les onglets. »

DÉCISION À PRENDRE : b4 à 1280 met les rubriques dans l'en-tête (segment central) ; à accorder avec la voie menu si elle est retenue.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
