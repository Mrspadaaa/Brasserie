OK — gr5 b (cran au doigt) et c (crans comptés) rendus dans Suggérer, 17/17 états verts

## Fichiers écrits
- `prototypes/houblons-v4/parcours/src/ecrans/suggerer/bulle.tsx` : la bulle dit une ligne, comme gr5 (« Agrumes · +1,6 cran du 16D · ton objectif · avec Motueka ») ; code du style passé au fournisseur ; signe vrai, « · hors du style », « ne bouge pas », « non établi : inconnu, pas zéro ».
- `…/suggerer/briques.tsx` : `traitsDe` (places de trait dessinées) ; `Traits` reçoit `avec`, `plafond`, `etat`, `etatVide` et dessine les crans vides ; `Calme` et `CaseInconnue` reçoivent `avec`.
- `…/suggerer/index.tsx` : `plafond` par groupe (le plus grand effet du groupe, en places de trait, calculé du moteur) ; `data-etat` des deux états sur la première voie ; une demi-ligne dans la légende du « ? ».
- `…/suggerer/suggerer.css` : crans vides (1 px #8a8a86, comme gr5), case touchée cernée (carré arrondi à l'encre), bulle blanche à bord noir de 1,5 px, sans flèche.
- `…/suggerer/jeu.mjs` : le geste D110 attend la nouvelle phrase.
- `…/suggerer/NOTE.md` : section « Reprise gr5 ».
- `work/refonte-frontend/v4/choix/etats/suggerer.json` : ajout de `etat-sugg-gr5-cran` (toucher, `.jg-l[data-jg="b"] li [data-role="cible"][data-famille="citrus"]`, attendu « Agrumes · +1,6 cran du 16D · ton objectif · avec Motueka », interdit « 1 trait = 1 cran du style ») et de `etat-sugg-gr5-crans-comptes` (repos, `.jg-l[data-jg="c"] li .jg-vide`, attendu « même effet sur tes objectifs », « Motueka », « Agrumes +1,6 cran »). Les deux sont mesurés sur la page gr5. Aucun autre état n'a été touché.

## Critères (rejoués après la dernière construction)
- G1 `construire.mjs --sortie=…/parcours-suggerer` → `CONSTRUIT OK (9 pages)`
- G2 `controle-etats.mjs --choisie --ecran=suggerer` → `ETATS OK (17/17) ; 3 voulu(s) non rejoué(s) sur ses maquettes choisies` (gr5-cran OK, gr5-crans-comptes OK sur sa page gr5)
- G3 → `ETATS OK (17/17) ; 3 voulu(s) non rejoué(s)` (les 15 états de q2b et les 2 de gr5)
- G4 → `CHOIX OK (1 écran(s) conforme(s) à son choix ; 0 ouvert(s))` puis `COMMUN OK` (avec mots sauté)
- En plus : `controle-traits.mjs` → `TRAITS OK (6 touchés, 2 largeurs)` ; `jouer-parcours.mjs --etape=suggerer` → `ETAPE OK (suggerer)` ; `controle-teinte.mjs` → `TEINTE OK 6/6` ; `verifier-types.mjs` → `TYPES OK`.
- Au premier essai, CHOIX ECHEC : `controle-traits` règle 3, bulle à 136 px du picto (largeur 300 px, posée au-dessus du nom). Corrigé avec une largeur de 240 px : la bulle est à 110 px.

## États rendus (captures 390 × 844 tactile, ouvertes à côté de celles de gr5)
- etat-sugg-gr5-cran : `prototypes/houblons-v4/maquettes/parcours-suggerer/captures-gr5/etat-sugg-gr5-cran-construite.png`, à côté de `work/refonte-frontend/v4/ecran-1/fils24-graphes/captures/gr5-toucher.png`. On voit la même chose : la case Agrumes de Motueka cernée et la bulle au-dessus de sa ligne. Seule différence : le retour à la ligne se fait après « 16D · » (gr5 : après « ton objectif · »).
- etat-sugg-gr5-crans-comptes : `…/captures-gr5/etat-sugg-gr5-crans-comptes-construite.png`, à côté de `…/captures/gr5-toucher-c.png`. Mêmes crans vides : Motueka floral 1 + 1 vide, agrumes 2 ; Aurum herbacé demi + 1 vide, terreux 1 + 1 vide.
- Celeia apparaît en 5e voie du premier groupe (moteur en direct ; gr5 en figeait 4). Les groupes du bas ont été regardés : Remplacer Nugget (plafond 1, pas de crans vides, contours de baisse intacts) et Dry hop (1 cran vide, orangé hors style intact).

## Prédiction
« Oui, c'est ça : je compte les crans et le doigt me dit lequel » ; il pourrait trouver les crans vides encore fins à 390 px (défaut déjà noté dans la NOTE de gr5).

DÉCISION : plafond des crans vides **par groupe**, et non sur toute la liste. Sa page gr5 ne montrait qu'un seul groupe (2). Sur tout l'écran, l'assemblage et le dry hop (2,6 à 2,7 crans) l'auraient porté à 3, et le premier groupe aurait différé de sa capture.
DÉCISION : le compte se fait en places de trait dessinées (un demi compte une place), pas en `ceil(data-crans)` comme sa page. Les résultats sont identiques sur sa page, et le compte reste juste à 2,1 crans.
DÉCISION : la clé « 1 trait = 1 cran du style » (D110) disparaît de la bulle, comme dans gr5. « cran du 16D » dit l'unité.
DÉCISION : bulle de 240 px de large (gr5 : 300) pour tenir la règle 3 de D110 (à 120 px au plus du picto). « ton objectif » et « avec … » ne se coupent pas.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
