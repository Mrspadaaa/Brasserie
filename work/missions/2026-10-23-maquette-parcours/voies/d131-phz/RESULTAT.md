OK — quatre jeux acceptés et retouchés : trois pictos de Nelson Sauvin, mot précis écrit, sans césure

## Fichiers écrits (passe 2, en place, dans le périmètre)
- `work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d/phz1/etat.html`, `phz1/NOTE.md` — Code (tiède, REJET v0) : le code reste sur la
  planche, à part ; dans les cartes, les objets de phz2 (greffe), pastille à 19–22 px.
- `…/phz2/etat.html`, `phz2/NOTE.md` — Contenant (tiède, ACCEPTÉ en tête) : cannabis à sept folioles et gingembre en rhizome (pha1).
- `…/phz3/etat.html`, `phz3/NOTE.md` — Clef (chaude, REJET v0) : sept folioles, alvéole, pichet, grappe de points pleins, rhizome ;
  gardés grain de café, verre « Y », bocal, bulle « en plus ».
- `…/phz4/etat.html`, `phz4/NOTE.md` — Un seul trait (chaude, ACCEPTÉ) : raisin et groseille de phz2, sept folioles, rhizome, bulle
  « en plus » (plus de « … »).
- Captures (390 × 844, ×2) : `…/captures/phz{1..4}-planche.png`, `-carte.png`, `-galaxy-saaz.png`, `-fiche.png`, et le côte à côte avec la
  maquette telle quelle, la vraie page entière puis la même page avec les pictos posés (version courte) : `phz{1..4}-cote-carte.png`,
  `-cote-galaxy-saaz.png`, `-cote-fiche.png` (28 captures). Toutes ouvertes.
- Scripts dans `os.tmpdir()` seulement (gen.mjs, transform.js, jeux.json). `git status` : rien hors du périmètre.

## Retouche courte (après la passe 2 jugée)
- Nelson Sauvin : trois pictos dans Comparer, la groseille en clair (Citra la dit aussi) ; « pamplemousse » sans césure ; le premier mot
  précis (le plus court) écrit dans la pastille courte, greffe de pha4 ; citronnelle et gingembre en mot clair sur la planche. Recapturé,
  captures rouvertes (phz2-carte, phz2-planche) ; G1 `JEUX-BIEN-4`, G2 `TRAIT OK`. La DÉCISION « deux ou trois » ci-dessous est tranchée par
  le pilote : trois, la partagée en clair.

## Critères
- G1 : `JEUX-BIEN-4`. G2 : `TRAIT OK` (phz1 144, phz2 160, phz3 144, phz4 160 pictos de famille visibles, 0 faute).
- `controle-panel.mjs` planches : `PANEL OK` ; cartes : `PANEL ECHEC` par construction (même carte, par contrat du brief).

## Retouches communes faites (VERDICTS.md)
1. Version textuelle : la pastille passe à la ligne dans sa colonne (plus de « vin blanc +», « pamplemous »), « dans » reste à la même
   hauteur dans toutes les têtes (le bloc précis vient après la pastille), la pastille ne redit plus le bloc précis ; Citra, sans mot
   propre, n'a plus de pastille en textuel (jamais une pastille vide). Target en textuel : pastille sur trois lignes (marmelade, doux,
   tabacco), c'est la version longue.
2. Comptes : « +n » ne compte que les mots sans picto ; sauvignon blanc → vin blanc et dank → cannabis ne comptent pas. Nelson Sauvin a
   DEUX pictos dans ce Comparer (groseille à maquereau n'y est pas « lui seul » : Citra cryo le dit aussi, d'après l'aria-label du
   moteur) et TROIS dans la fiche (face à Boomerang, Herkules, Phoenix, CTZ). Le « 3 » du pilote vaut pour la fiche ; en Comparer, dire
   trois serait inventer.
3. « herbe » retiré de Saaz (redit Végétal) : doux, noble, citron.
4. Barre huile gardée partout (Galaxy 45 px, Saaz 9 px) : sur le côte à côte, elle ajoute ≈ 20 px sous la pastille et pousse le tableau
   d'autant dans Galaxy / Saaz seulement ; le reste de la tête ne bouge pas.

## Prédiction
« phz2 c'est bien intégré, le cannabis maintenant c'est ça, et la barre huile on voit direct » ; il garde phz2 (ou phz4 pour le style) et
redira que gingembre, citronnelle et curry ne se reconnaissent toujours pas : ces trois mots n'ont de bon picto dans aucune des huit séries.

DÉCISION À PRENDRE : Nelson Sauvin, deux ou trois pictos dans Comparer ? Les données disent deux face à Citra cryo (groseille partagée) ;
si le brasseur veut toujours voir tout ce que le houblon dit de plus que les 12 familles (pas seulement « lui seul » face aux autres), la
règle de la pastille change pour tout Comparer, pas seulement pour les pictos.

CONNAISSANCE : la maquette jouable accepte des routes directes (`#/comparer?h=a,b,c`, `#/fiche/<clé>`) rendues depuis `file://` ; une voie
peut y injecter symboles, style et transformation puis capturer la vraie page entière : c'est le côte à côte le plus honnête (rien recopié).
LEÇON PROPOSÉE : aucune.
