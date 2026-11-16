OK — e7a à e7d rhabillées à l'identité de l'app, 16 captures refaites

## Variantes
- [x] e7a : jetons et classes id- à la place de sa palette ; titre 31/800 ramené à `id-display` 28/600 ; segments OG/FG/Alcool/Volume dans le style des sous-onglets (sélection noire en clair, paille en cave) ; puces `id-pastille` ; écarts en hop / water / attention ; teintes de bière en EBC ; chrome de l'onglet Brassins ; deux colonnes à 1280. · écart restant : la bascule Archives est dessinée à la main (la trousse n'a pas d'interrupteur).
- [x] e7b : le bloc encre (affiche) devient un `id-panneau` ; carton de tir recoloré (anneau `cave-texte-50`, bande hop à 30 %, axes `cave-texte-400`, graisses 600) ; choix de paire en `id-segments` ; scores en pastilles ; le dock à 5 entrées devient un panneau dans la page, au-dessus de la barre de l'app. · écart restant : à 390, les totaux et le dock sont sous le pli (le carton fait 366 px).
- [x] e7c : cases en teinte à 20 % avec bord à 60 % (comme les pastilles d'état de l'app) au lieu des aplats blancs sur couleur ; colonne choisie cerclée `cave-texte-50` ; en-têtes de colonne en segments ; titre 33/40 px ramené à 28 ; mise en page à 1280 dans le `main` de 56 rem. · écart restant : les cases teintées crient moins que les aplats de la v0 ; la frise des lots garde ses aplats EBC.
- [x] e7d : fond crème et titre 44/900 retirés (page `cave-950`, 28/600) ; cuves sur `cave-850`, contour `cave-texte-200`, trait de cible `cave-texte-50` ; le dock encre devient `id-segments-large` ; le ruban devient des `id-puce` ; cuves centrées et raccourcies pour tenir avec le chrome. · écart restant : le densimètre (geste) garde son blanc et son noir fixes, permis mais plus vifs que le reste de l'app.

## Fichiers écrits
- `work/missions/2026-11-14-brassins/voies/e7/e7a/etat.html`, `e7b/etat.html`, `e7c/etat.html`, `e7d/etat.html` (trousse chargée par lien relatif, chrome `data-chrome="onglet"`, `data-sous="brassins"`)
- `work/missions/2026-11-14-brassins/voies/e7/capture.mjs` : chaque variante a maintenant repos 390 clair, geste 390 clair, repos 390 cave, repos 1280 clair (mêmes noms qu'avant pour les anciennes)
- `work/missions/2026-11-14-brassins/voies/e7/e7?/NOTE.md` : une ligne « Retouches re7 » ajoutée à chacune
- `work/missions/2026-11-14-brassins/voies/re7/tests.txt`, `RESULTAT.md`

## Critères (sortie dans tests.txt)
- G1 : `IDENTITE OK 4/4`
- G2 : `RHABILLE OK`
- G3 : `HORS OK`
- Tests : aucune suite Vitest (rien dans `src/`).

## Captures (toutes ouvertes)
`work/missions/2026-11-14-brassins/voies/e7/<id>/<id>-{repos-390-clair,geste-390-clair,repos-390-cave,repos-1280-clair}.png`, pour e7a, e7b, e7c et e7d (16 au total).
Comparaison avec l'app (`a1-banc/captures/liste-remplie-390-clair.png` et `-cave.png`) : même en-tête, mêmes sous-onglets, même barre du bas, mêmes panneaux à 16 px, même encre, même mono pour les chiffres. Ce qui reste propre aux maquettes, ce sont les graphes (barres d'écart, carton, cases, cuves).

Prédiction : « Là ça ressemble à l'app » ; il jugera ensuite les idées, plus l'habillage.

DÉCISION À PRENDRE : aucune
CONNAISSANCE : avec la trousse, les teintes de bière se tirent des jetons EBC (`gold`, `gold / .55` pour une Pils, `amber`, `stout`) ; `--ebc-straw` est la couleur d'action (noire en clair), pas une bière.
LEÇON PROPOSÉE : aucune
