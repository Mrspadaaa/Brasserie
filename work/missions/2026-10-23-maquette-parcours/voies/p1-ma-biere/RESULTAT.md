OK — Ma bière, fiche et Substituer jouables en React ; G1 à G16 verts, D98 vert

## Fichiers écrits (dans « Possède » seulement)
- `prototypes/houblons-v4/parcours/src/ecrans/ma-biere/` : `index.tsx`, `Rail.tsx` (moment par 5′, loupe),
  `RadarBiere.tsx` (m4), `Lentille.tsx` (SegmentedControl balisé), `repere.ts` (ce qui vient de changer),
  `ma-biere.css`, `jeu.mjs` (18 gestes), `NOTE.md`.
- `…/ecrans/fiche/` : `index.tsx` (route), `FicheHoublon.tsx` (composant et `useFiche`), `briques.tsx` (AlphaLu,
  Usage, StockIcone, Intensite, Autres), `gestes.ts` (appui long, survol), `Silhouette.tsx`, `fiche.css`,
  `jeu.mjs` (10 gestes), `NOTE.md`.
- `…/ecrans/substituer/` : `index.tsx`, `substituer.css`, `jeu.mjs` (7 gestes), `NOTE.md`.
- Sortie de construction : `prototypes/houblons-v4/maquettes/parcours-p1/`. `git status` : rien d'autre à moi.

## Sortie décisive de chaque critère (dernier rejeu, sur le socle corrigé)
- G1 `CONSTRUIT OK (8 pages)` · G2 `TYPES OK` · G3 `COMMUN OK` (ma-biere) · G4 `ma-biere 65 mots` / `MOTS OK`
- G5 `MA-BIERE OK` · G6 `ALPHA OK` · G7 `FICHE OK 1/1` · G8 `FICHE-BASELINE OK` (7 familles, 7 pictos, 0 faute)
- G9 `SANS-FAMILLE OK` (Nugget à 14 % : rien à montrer au repos). En plus, sur Substituer au seuil 0,25 :
  `SANS-FAMILLE OK (2 houblon(s) au-dessus de 25 %, part « autres » visible)` (Nelson Sauvin 83 %, Galaxy 29 %).
- G10 `COMMUN OK` (substituer) · G11 `ETAPE OK (substituer)` · G12 `PONTS OK (19 gestes, recalcul médian 1,1 ms)`
- G13 `Test Files 1 passed` · G14 `APP INTACTE OK` · G15 `NOTE OK`
- Demande du pilote (1) : `UNE-QUESTION OK (1 groupe libre : houblon)`. `data-libre="houblon"` est sur le groupe des
  remplaçants, `data-lecture` sur les lentilles. « Remplacer › » ne porte plus le nom, que D98 lisait comme un
  second choix : le nom est dans le dock, à gauche.
- Demande du pilote (2), corrigée chez moi :
  - `data-role="fiche"` est reposé à chaque image jusqu'à l'attache de la feuille (portail), 30 images au plus ;
  - le click qui suit l'appui long est avalé en capture pendant 350 ms (`avalerClic`, `fiche/gestes.ts`) ;
  - le pont provisoire de Comparer peut tomber.
- Mon contournement « Ma bière cachée sous un outil » est retiré. Le repère de changement survit au démontage :
  un instantané au niveau du module, et `noterAvant` appelé par Substituer.

## Captures ouvertes et regardées (scratchpad, dossier `p1/`)
- 390 px :
  - `p1/cap/ma-biere-390.png` et `p1/cap/ma-biere-radar-390.png` ;
  - le geste, doigt posé (loupe 10′ 5′ **0′** WP actif 1 j) : `p1/cap/ma-biere-glisser-pendant-390.png` ;
  - `p1/cap/fiche-390.png` et `p1/cap/substituer-390.png` ;
  - parcours entier : `p1/ponts/11-ajouter-a-ma-biere.png` (ligne Idaho 7 ajoutée, barres « ~+27 » floral) et
    `p1/ponts/13-remplacer.png` (« à la place de Nugget », IBU 60).
- 1280 px : `p1/cap/ma-biere-1280.png`, `p1/cap/ma-biere-survol-1280.png` (le survol de 900 ms ouvre la fiche) et
  `p1/cap/substituer-1280.png`.
- Chemin complet du dossier : `C:\Users\mrspa\AppData\Local\Temp\claude\C--Users-mrspa--codex-worktrees-openai-clean-start-Brasserie\6bed03f4-a8d6-468f-8115-deafa40df0cf\scratchpad\p1\`.

## Écarts et raisons (détail dans les NOTE)
- Rail du moment horizontal, sur la ligne du houblon, au lieu du rail vertical de l8 : un geste par ligne, le même
  modèle que la frise de Dryhopper, et un geste que le script peut jouer. Il demande 14 px de doigt au moins par
  cran (D46).
- Dose de Substituer au demi-gramme : le gramme du moteur laissait jusqu'à 0,65 IBU d'écart, et le contrat demande
  0,5.
- `data-houblon` porte le nom (et non la clé) dans Substituer et sur la part « autres » : D100 les cherche par nom.

## Besoins dans le socle (au pilote)
- `SegmentedControl` (app) n'accepte pas d'attribut par option : `data-e` et `data-vue` sont posés après le rendu.
- `Sheet` n'accepte pas de `data-*` : `data-role="fiche"` est posé par le DOM.
- Le cadre paille autour de `main` paraît encore sur mes captures à 1280 px de Substituer, prises après le
  correctif annoncé : à vérifier sur le dernier socle (D33, « des truc jaune »).
- Convention de `data-houblon` à trancher pour tout le parcours : la clé, que demande le contrat (`--ponts`), ou le
  nom, que lit D100.

Prédiction : « Ma bière, vachement bien, je vois enfin l'α, le rôle et ce que chaque houblon apporte. Mais le rail
est petit, et Substituer est dense : il faut défiler pour voir les autres. »

DÉCISION À PRENDRE : la convention de `data-houblon` (clé ou nom). D100 et `controle-alpha` lisent le nom, les
ponts lisent la clé.
CONNAISSANCE : à 60′ dans la stout 16D, aucun remplaçant en stock de Nugget ne baisse le résineux de plus de
~1 point simulé. La part dégustée domine : Substituer ne répond pas à « moins résineuse ».
LEÇON PROPOSÉE : un contrôle qui cherche le premier `[data-houblon]` visible lit aussi l'écran du dessous. Un écran
recouvert doit être démonté, pas seulement rendu inerte (fait par le socle le 23.10).
