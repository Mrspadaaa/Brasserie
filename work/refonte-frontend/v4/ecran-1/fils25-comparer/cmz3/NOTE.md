# cmz3 · Comparer, en pellicule

Série cmz (libre, brief minimal). **Chaleur : chaude** (forme libre). Base : l'écran Comparer de la maquette jouable,
reprise en entier (liste dans `../cmz1/NOTE.md`).

## L'idée (une seule) — `data-greffe="pellicule-moments"`
Une pellicule de cinq vignettes au-dessus du radar, une par moment (60′, 10′, whirlpool, actif, après). Dans chaque
vignette, une barre par houblon, à sa couleur : la famille visée gagnée sur ta stout à ce moment ; ★ au meneur, un trait
orangé au sommet de la barre d'un houblon qui sort de ta 16D. D'un coup d'œil : presque rien à 60′, Galaxy en tête à chaud
(et qui sort dès le whirlpool), Idaho 7 qui le dépasse au dry hop. La vignette touchée s'encadre d'orangé, dit son IBU
(houblon retenu), et devient l'écran : radar, têtes, rangées, réponse à ce moment. La pastille de la famille (floral ·
agrumes · tropicaux, y1b) choisit ce que dessinent les vignettes.

## Ce qu'il a demandé, et où c'est
1. Choisir quand : la pellicule, `[data-role="quand-comparer"]`, vignettes `data-moment`.
2. Hors 16D : chip noir `[data-role="hors-16d"]` sous chaque tête, liste dans la fiche.
3. Huiles : `data-greffe="huiles"` dans chaque tête.
4. Moins de texte : 99 mots au premier écran (base : 114) ; l'IBU n'est écrit que sur la vignette choisie.
5. ⇄ × ＋ recherche, Nugget en pointillé, « ~ simulé » à un toucher.

## Données
Les mêmes que cmz1 (`../cmz1/donnees-moteur.ts`). Barres des vignettes : crans gagnés, échelle commune (1,5 cran ou le
max), inconnu hachuré.

## Ce qui tient
- La comparaison « à quel moment » se fait avant tout toucher : cinq instantanés côte à côte, puis l'écran de la base.
- La famille des vignettes se change (floral, agrumes, tropicaux) sans mot ajouté.

## Ce qui casse ou reste douteux
- Les vignettes font 70 px : trois barres de 9 px, lisibles mais petites ; à quatre houblons elles se serrent.
- Le radar est réduit à 216 px de haut pour que les têtes restent au premier écran.
- Radar r2 superposé gardé ; dock présent, feuilles non jouées.

## Contrôles (joués une fois, depuis la racine)
- `mots-premier-ecran --max=100` : 99 mots, MOTS OK. `controle-pictos-trait` : 49 pictos, 0 faute, TRAIT OK.
- `controle-quand-comparer` : OK — 4 moments, les valeurs changent. QUAND OK.
- `controle-hors-16d --min=3 --premier-ecran` : HORS-16D OK. `controle-panel` (série) : PANEL OK.
- `controle-commun --sans=mots` : tout OK sauf standard (indicatif). `controle-alpha` : 1 voie sans α (Nugget, la
  référence : α à l'appui long, comme la base D40 bis).
- Gestes joués au doigt : GESTES OK ; largeur 390, 0 erreur.

Captures : `captures/cmz3.png`, `cmz3-moment.png` (10′), `cmz3-long.png`, `cmz3-nelson.png`, `cmz3-plus.png`.
