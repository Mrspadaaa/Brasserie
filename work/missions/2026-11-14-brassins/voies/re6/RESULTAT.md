OK — e6a à e6d rhabillées à l'identité de l'app, IDENTITE OK 4/4, 15 images refaites

## Variantes
- [x] e6a : palette propre, onglets et barre du bas maison retirés → chrome de la trousse ; titre 30/800 → id-display 28/600 ; phases en id-pastille, styles en id-style, actions en id-btn-secondaire, puces id-puce à compte, barre d'état 4 px aux jetons hop/water/attention/ebc-copper ; vide en id-panneau (primaire + secondaire), familles Citra/Mosaic aux couleurs de familyTokens · écart restant : la carte garde sa barre d'état gauche et son chiffre clé en mono 18 que la carte de l'app n'a pas (c'est l'idée) ; sinon même grain que liste-remplie-390-clair.
- [x] e6b : bandeau « BRASSINS » majuscule → rangée outils de l'app (« 5 brassins », chercher, filtrer) ; 32/800 (44 au bureau) → id-display 28 ; préréglages en id-segments ; fenêtre et poignées de la frise en ebc-straw (noir en clair, paille en cave) ; punaises et pastilles « en cours / en retard » en id-pastille ; 1280 : filtres en id-puce, styles en id-style, dossier en id-segments · écart restant : la frise (panneau 16, barres arrondies) n'a pas d'équivalent dans l'app ; au bureau la largeur suit id-main (56rem), plus 1280 plein.
- [x] e6c : écran gris maison + fausse feuille → vraie feuille de l'app (poignée, rayon 24, titre, ×, pied fixe) posée sur la vraie liste voilée (outils, compte sur le bouton de filtres, « Vue filtrée · … » + Effacer) ; nombre 64/800 → id-reading-grand 28 ; tuiles, bande des 5, plage alcool, bascule aux jetons ; « Voir les N » en id-btn-primaire (seul primaire) · écart restant : la feuille est plus haute que celles de l'app (80 dvh, contenu dense) ; la liste derrière est presque illisible sous le voile, comme dans l'app.
- [x] e6d : sol sombre fixe (#1d1a17, #4a413a, #8a6a45) → plan aux jetons des deux thèmes (panneau cave-900, cuves cave-950, liquide hop / water à 30 %, carton ebc-amber / ebc-copper, bouteilles ebc-copper) ; 30/800 → id-display ; boutons des cuves en id-btn-secondaire ; « 6 j » en id-pastille alert · écart restant : le plan dessiné (cuves, cônes, bouteilles) reste un objet propre à la variante ; en clair il perd le contraste « cave » de l'ancienne version (écart noté dans NOTE.md).

## Fichiers écrits
- `work/missions/2026-11-14-brassins/voies/e6/e6a|e6b|e6c|e6d/etat.html` (réécrits, trousse en lien relatif `../../../outils/identite/`)
- `work/missions/2026-11-14-brassins/voies/e6/*/NOTE.md` (ligne re6 ajoutée ; e6d : écart du sol)
- 15 PNG refaits par `voies/e6/capture.mjs` (mêmes noms, plan inchangé)
- `work/missions/2026-11-14-brassins/voies/re6/tests.txt`, `RESULTAT.md`

## Critères (sortie décisive, `tests.txt`)
- G1 : `IDENTITE OK 4/4`
- G2 : `RHABILLE OK`
- G3 : `HORS OK`
- Tests : aucune suite Vitest (rien dans `src/`).

## Captures
Ouvertes : e6a repos, geste, vide ; e6b repos 390 clair, repos 390 cave, repos 1280 clair, geste, vide ; e6c repos, geste (avant et après correctif) ; e6d repos, geste.
Comparées à `a1-banc/captures/liste-remplie-390-clair.png` (via la démo de la trousse, identique) : même en-tête, mêmes sous-onglets, même barre du bas, même gris de carte, mêmes pastilles et styles.
Non ouvertes (contexte à 165 k, consigne « vers 150 k, rends ») : e6c-vide-390-clair.png, e6c-defile-390-clair.png, e6d-vide-390-clair.png. Rendues sans erreur ni débord (capture.mjs), IDENTITE OK sur repos.
Correctif vu à l'image : e6c geste, le panneau des résultats s'écrasait dans la feuille (flex-shrink) → `.id-feuille-corps>*{flex-shrink:0}` ; e6d, la ligne de liquide de F1 barrait « NEIPA » → liquide sous un dôme de 48 px.

Prédiction : « Là oui, c'est l'app » ; il regardera la frise et le plan pour l'idée, plus pour le style.

DÉCISION À PRENDRE : aucune.
DEMANDE EXECUTANT : ouvrir (Read) `voies/e6/e6c/e6c-vide-390-clair.png`, `e6c-defile-390-clair.png`, `voies/e6/e6d/e6d-vide-390-clair.png` et signaler texte coupé, chevauchement ou zone vide ; rien à relancer.
CONNAISSANCE : une feuille de la trousse (`.id-feuille-corps`, flex colonne à défilement) écrase un enfant à `overflow:hidden` ; poser `flex-shrink:0` sur ses enfants.
LEÇON PROPOSÉE : aucune.
