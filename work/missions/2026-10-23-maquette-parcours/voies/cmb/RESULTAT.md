OK — cmb1 à cmb4 : Comparer jouable, cinq moments, huiles, étapes ensemble ; G1 G2 G3 verts

## Fichiers écrits (Possède)
- `work/refonte-frontend/v4/ecran-1/fils25-comparer/cmb1/` à `cmb4/` : `etat.html` (page jouable, rendu au repos prérendu), `assets/` (script et feuille construits), `NOTE.md`, `source/` (le code React de la variante, à greffer : `index.tsx`, `calcul.ts`, `Ensemble.tsx`, et `Rail.tsx` / `Frise.tsx` / `Plans.tsx`, plus les deux scripts de construction).
- `work/refonte-frontend/v4/ecran-1/fils25-comparer/captures/cmb{1..4}.png`, `-moment.png` (10′), `-long.png`, `-nelson.png` ; `cmb4-puce.png` (la puce de moment ouverte).
- Méthode : copie de `prototypes/houblons-v4/parcours` dans un miroir sous `os.tmpdir()` (jonctions vers `src/`, `node_modules/`…), écran Comparer modifié, construit par `construire.mjs` ; rien d'écrit hors de Possède.

## Les quatre (une idée chacune, sur la base jouable)
- cmb1 (tiède) : rpb1, le rail de cinq arrêts 60′ · 10′ · WP | actif · après, le meneur au-dessus ; Nugget en pointillé dans les barres.
- cmb2 (tiède) : rpz4, l'écart face au retenu à droite de chaque barre, coloré selon sa demande ; barre segmentée des moments.
- cmb3 (chaude) : rpb3, la frise est le sélecteur (toucher ou glisser), curseur noir.
- cmb4 (chaude) : w2, chacun à son meilleur moment (« ★ chacun »), « tous à », puce de moment par tête.
- Communs : cinq moments simulés par le moteur ; huiles (rpz2) dans chaque tête, Saaz en repère ; étapes ensemble au premier écran (D107) ; texte inutile retiré.

## Critères
- G1 : `VARIANTES-CMP-4` (mots : cmb1 95, cmb2 100, cmb3 93, cmb4 99 ; MOTS OK)
- G2 : `TRAIT OK` (57, 57, 57, 56 pictos, 0 faute)
- G3 : `QUAND OK` (60′, 10′, whirlpool, dry hop ; cmb4 aussi « meilleur »)
- Hors gates : COMMUN OK (`--sans=mots`) ; CHOIX OK ×4 (sur le dossier construit du miroir, `--ecran=comparer`) ; PANEL ECHEC (ressemblance 0,96).

## Prédiction
« Là je peux enfin choisir quand ; la frise et les plans me parlent, mais où sont passées mes rangées ? »

DÉCISION À PRENDRE : la base au premier plan (règle n° 1, brief) et la diversité du panel (`controle-panel`) se contredisent : radar et têtes identiques donnent 0,96 de ressemblance. Et D107 (étapes ensemble, au repos, au premier écran) avec cinq moments et ≤ 100 mots pousse les rangées sous le pli. À lui : étapes ensemble en nombres, ou en dessin seul.

CONNAISSANCE : `variantes.mjs` lit `etat.html` sans le jouer ; une page React construite n'y a que la coquille : il faut la prérendre (`source/prerendu.mjs`) ou que le contrôle rende la page. `controle-comparer-etapes` exige les étapes au premier écran (cadre défilant), pas seulement à l'écran après défilement.

LEÇON PROPOSÉE : une série qui reprend la maquette jouable joue `controle-choix` dès le premier rendu : retirer une ligne « inutile » (« dans la cuve ») ou un lien (panel OSU) casse un acquis gardé (états, D114).

## Passe 2 (cmb2, son choix) — cmb2a à cmb2d
OK — cmb2a–cmb2d : cmb2 gardée, ses quatre commentaires corrigés ; VARIANTES-CMP-4, TRAIT OK, QUAND OK

- Fichiers : `fils25-comparer/cmb2a/` à `cmb2d/` (`etat.html` prérendu et jouable, `assets/`, `NOTE.md`, `source/`) ; captures `cmb2{a..d}.png`, `-moment.png` (60′), `-nelson.png`, `-long.png`.
- Communs : pastille critère avec son mot ; « whirlpool » en clair ; dans chaque tête et sous les rangées, seuls les mots hors des 12 familles, derrière un losange au trait (« vraiment hors 16D, avec le icône ») ; radar au style normalisé au moment, par axe (ce que chaque houblon ajoute, à l'échelle du meilleur apport du moment) : à 60′, les trois formes se séparent.
- Les quatre diffèrent : a, segments nommés sur deux lignes et radar agrandi en place ; b, pictos de moment et sélecteur au-dessus du radar ; c, phrase du moment et radar pleine largeur ; d, deux boîtes « brassage » / « dry hop » et clé des couleurs sous le radar.
- Critères : `VARIANTES-CMP-4` ; `TRAIT OK` (44 pictos, 0 faute chacune) ; `QUAND OK` ; MOTS OK (99, 93, 92, 96).
- Prédiction : « Là le radar à 60′ montre enfin la différence ; je prends les boîtes brassage / dry hop ».
- DÉCISION À PRENDRE : au style, le radar montre désormais l'apport (ta stout au centre) et non plus le niveau de la bière ; ta stout reste visible en Absolu. Normalisation par axe : une différence de 0,1 cran à 60′ pèse un tiers d'axe (plancher 0,3 cran) ; à lui de dire si le plancher convient.

## Passe 2, retouches de la critique (cmb2a à cmb2d)
OK — mots précis avec picto à côté du losange hors 16D, échelle du radar écrite ; gates vertes
- « ses mots » comme sur sa capture : dans chaque tête, ◇ hors des 12 familles d'abord, puis le mot précis avec son picto (citron vert, orange) ; la liste complète sous les rangées (citron vert, pamplemousse…). Le « +n » qui débordait est retiré.
- Radar au style : « bord : le meilleur » au pied du radar (0,3 cran au moins, dans l'aria-label et au survol).
- Critères : `VARIANTES-CMP-4` ; `TRAIT OK` (59 pictos, 0 faute chacune) ; `QUAND OK` ; MOTS OK (100, 97, 96, 100). Captures reprises et ouvertes (`cmb2{a..d}.png`, `-moment.png`, `-nelson.png`, `-long.png`).
- Reste à voir avec lui : où est ta stout au radar en mode style (elle est le centre) ; le radar en héros (cmb2c) contre les rangées des familles.

## Passe 3 (depuis cmb2d) — cmb3a à cmb3d
OK — cmb3a–cmb3d : sélecteur de cmb2, ses mots visibles, barres et radar normalisés, quatre genres de radar
- Départ : cmb2d (vue agrandie sans version ; première de la rangée, tête de la critique), écrit dans chaque NOTE.
- Communs : points de couleur et pastilles noires retirés (bande des étapes sous les têtes, « ses mots » en liste avec picto ou losange, deux par houblon au premier écran) ; barres des familles normalisées au moment et au style (apport en crans, à l'échelle du meilleur du moment, 0,3 cran au moins) ; sélecteur de cmb2 tel quel ; radar centré, textes d'explication retirés.
- Radars : a un radar par houblon (ta stout en anneau) ; b deux contours, le second à toucher ; c médaillon et familles devant (ta stout en anneau) ; d rose à pétales. Ta stout montrée dans a et c, pas dans b et d.
- Critères : `VARIANTES-CMP-4` ; `TRAIT OK` (85, 61, 61, 61 pictos, 0 faute) ; `QUAND OK` ; MOTS OK (84, 96, 93, 94). Captures ouvertes, comparées à cmb2d.
- Prédiction : « Les petits radars, enfin je vois chaque houblon ; et à 60′ ça bouge ».
- DÉCISION À PRENDRE : dans cmb3a, sélecteur et bande passent au-dessus des radars et les têtes sous le premier écran ; dans cmb3c, les rangées perdent leurs noms (picto seul) pour tenir 100 mots.
