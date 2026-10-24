OK — planche des six graphes : chacun figé tel quel, deux lectures au doigt dessous

## Fichiers écrits (tous dans `work/refonte-frontend/v4/ecran-1/fils24-graphes/`)
- `gr1/` à `gr6/` : `etat.html` et `NOTE.md` (rôle jeu court, ce qui tient, ce qui casse, sorties des contrôles).
- `captures/` : `<id>-repos.png`, `<id>-toucher.png` (lecture b, doigt tenu), `<id>-toucher-c.png` (lecture c), `<id>-page.png` ; 390 × 844 tactile, toutes ouvertes.
- `assets/style.css` (copie de la feuille de la maquette rendue), `outils/extraits/` (DOM figés), `outils/extraire.mjs`, `extraire-objectifs.mjs`, `generer.mjs`, `lectures.js`, `capturer.mjs`, `notes.mjs`.

## Méthode
Pour **a** (« tel qu'il est »), le DOM rendu de ses écrans choisis (reprises r2 à r5 : `parcours-biere`, `parcours-fiche`, `parcours-suggerer`, `parcours-comparer`, `parcours-etape`) est figé dans l'état voulu, en lecture seule de `prototypes/` : rien n'est redessiné. **b** et **c** reprennent le même DOM, avec une autre lecture au doigt (bulle près du doigt, rayon ou ligne cernée). Au repos, aucune légende écrite. Toutes les classes sont préfixées `jg-` (L26).
- gr1 barres l5b : 1b le mot sous le doigt ; 1c le haut du 16D nommé, et la barre remplie au doigt.
- gr2 absolu : 2b le mot sous le doigt ; 2c la vue reste au style, et la barre absolue apparaît sous le doigt tenu.
- gr3 radar m4 et grille : 3b le sommet au doigt (son rayon et sa ligne de grille) ; 3c la grille au doigt, avec « 16D » nommé.
- gr4 radar h4 de la fiche : 4b les mots des fiches au doigt ; 4c face à ma bière (floral, résineux).
- gr5 traits de Suggérer : 5b le cran au doigt (« +1,6 cran du 16D ») ; 5c les crans comptés (crans vides montrés).
- gr6 radar r2 : 6b un houblon à la fois ; 6c l'axe au doigt (rang des trois houblons et place face à la 16D).

## Critères
- G1 → `JEU-BIEN`.
- G2 → `COMMUN OK` : couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant et brutes OK ; mots sauté (`--sans=mots`). Au premier essai, COULEURS ECHEC sur gr3 et gr5 (2 teintes). Corrigé avec deux vrais éléments de la base : les cartes d'objectif de Suggérer en 5a, et la bande des familles de Nugget dans la ligne de contexte.
- `git status` : rien hors de « Possède ». `extraire.mjs` et `sonde2.mjs` (sonde supprimée) apparaissent suivis : un commit les a pris pendant la coupure.

## Captures
`work/refonte-frontend/v4/ecran-1/fils24-graphes/captures/gr{1..6}-repos.png`, `-toucher.png`, `-toucher-c.png`, `-page.png`.

## Prédiction
« Ah, là je vois lequel me bloque : les petits traits, et 5c ou 1b se lisent sans légende. » Il désignera probablement 5c et 1b. Il trouvera la page longue, puisque chaque graphe y est montré trois fois.

DÉCISION À PRENDRE : 3c ajoute une lentille Au style · Absolu au radar m4, que la maquette n'a pas en mode Radar (D75). 4c lit les flèches de la fiche comme ses objectifs de Ma bière. Ces deux points sont à lui montrer, pas à imposer.

CONNAISSANCE : figer le DOM rendu de la maquette jouable (outerHTML et `style.css` copiée) donne une copie exacte d'un écran choisi, contrôlable par controle-commun. Il faut renommer dans l'extrait `data-houblon`, `ligne-houblon`, `legende` et les id de React, qui appartiennent à la page.

LEÇON PROPOSÉE : aucune
