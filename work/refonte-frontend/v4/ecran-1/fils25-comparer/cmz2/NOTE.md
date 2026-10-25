# cmz2 · Comparer, au cadran

Série cmz (libre, brief minimal). **Chaleur : chaude** (forme libre). Base : l'écran Comparer de la maquette jouable,
reprise en entier (voir la liste dans `../cmz1/NOTE.md` : même coquille, titre, contexte, radar r2, Ta stout, têtes,
⇄ × ＋, rangées, réponse, Placer, dock).

## L'idée (une seule) — `data-greffe="cadran-radar"`
Le « quand » est une horloge : les cinq moments forment une couronne autour du radar r2, dans l'ordre du brassage
(60′ en haut à gauche → 10′ → whirlpool → dry hop actif → après en bas à gauche, la flèche du temps dans l'ouverture du
bas). Toucher un segment fait tourner le radar à ce moment : les polygones des houblons bougent, les têtes, les rangées
et la réponse suivent. Le segment choisi est noir ; sous la couronne, le moment en toutes lettres et l'IBU du houblon
retenu à ce moment (« ? » à froid). Un point à la couleur du houblon qui mène le floral marque chaque segment : on lit
d'un coup « Galaxy à chaud, Idaho 7 au froid » avant de toucher.

## Ce qu'il a demandé, et où c'est
1. Choisir quand : la couronne, `[data-role="quand-comparer"]`, segments `data-moment`.
2. Hors 16D : chip noir `[data-role="hors-16d"]` sous chaque tête (◇ = hors des 12 familles), liste entière dans la fiche.
3. Huiles : `data-greffe="huiles"`, goutte + barre 0–5 mL/100 g + plage, dans chaque tête.
4. Moins de texte : 98 mots au premier écran (base : 114) ; les IBU de chaque segment sont dans son libellé, pas écrits.
5. ⇄ × ＋ recherche, Nugget en pointillé au même moment, « ~ simulé » à un toucher.

## Données
Les mêmes que cmz1 (`../cmz1/donnees-moteur.ts`, moteur de la maquette, 4 g/L, US-05, cinq moments).

## Ce qui tient
- Le radar reste le centre de l'écran (son acquis), et le moment lui est attaché : rien n'est ajouté au-dessus du tableau.
- Lisible à distance : un seul segment noir, une flèche, un mot.

## Ce qui casse ou reste douteux
- Le cadran coûte 100 px de plus qu'un radar nu : les rangées commencent à 630 px, 8 rangées visibles au premier écran.
- Les mots suivent l'arc : « whirlpool » se lit tourné sur le côté droit. Si ça gêne, « WP » ou un mot droit.
- Radar r2 superposé gardé (« on va en parler ») ; dock présent, feuilles non jouées (un toucher le dit).

## Contrôles (joués une fois, depuis la racine)
- `mots-premier-ecran --max=100` : 98 mots, MOTS OK. `controle-pictos-trait` : 45 pictos, 0 faute, TRAIT OK.
- `controle-quand-comparer` : OK — 4 moments (60′, 10′, wp′, dry hop), les valeurs changent. QUAND OK.
- `controle-hors-16d --min=3 --premier-ecran` : HORS-16D OK. `controle-panel` (série) : PANEL OK.
- `controle-commun --sans=mots` : tout OK sauf standard (indicatif). `controle-alpha` : ALPHA OK sur cmz2.
- Gestes joués au doigt : GESTES OK (× ⇄ ＋ recherche « nelson », 10′, appui long) ; largeur 390, 0 erreur.

Captures : `captures/cmz2.png`, `cmz2-moment.png` (10′), `cmz2-long.png`, `cmz2-nelson.png`, `cmz2-plus.png`.
