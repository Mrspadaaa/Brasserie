OK — 4 carnets compacts pour 35 recettes : liste, tableau, sommaire par style, carte couleur × alcool

## Lecture (5 lignes)
1. Ses mots : « Le carnet de recettes, pas très compact, pas super convaincu quand il y aura des dizaines de recette » ; e8a à e8d refusées (« j'ai déjà donné mon avis »).
2. Lecture : une carte par recette tient 3 recettes par écran ; à 35, il faut retrouver d'un coup d'œil (chercher, trier, regrouper), et garder lots et comparaison à un toucher.
3. Genres : e8na froide, la liste de l'app en lignes ; e8nb tiède, le tableau trié au doigt ; e8nc tiède, le sommaire par style ; e8nd chaude, la carte couleur × alcool.
4. Au repos : e8na = lignes à deux étages dans un panneau ; e8nb = en-têtes de colonnes, chiffres alignés, rangées zébrées ; e8nc = noms en flux sous 7 titres de style ; e8nd = un nuage de points sur deux axes.
5. Aucune ne reprend cartes, frise sur l'année, duel ou étagère.

## Fichiers écrits (tous sous voies/e8n/)
- e8na/ (froide, la liste de l'app en lignes), e8nb/ (tiède, le tableau trié au doigt, + 1280), e8nc/ (tiède, le sommaire par style), e8nd/ (chaude, la carte couleur × alcool) : etat.html, NOTE.md, 6 PNG chacune (7 pour e8nb).
- capture.mjs, tests.txt, RESULTAT.md.

## Critères (sortie décisive, détail dans tests.txt)
- G1 : SERIE OK
- G2 : IDENTITE OK 4/4
- G3 : NOTE OK 4
- Tests : aucune suite Vitest (rien dans src/).
- Hors GATES, controle-panel.mjs sur les 4 repos : PANEL ECHEC, ressemblance moyenne 0,92 (seuil 0,90), 0 paire presque identique, remplissage médian 0,59. Cause : l'en-tête, les sous-onglets et la barre du bas de l'app, imposés par la trousse d'identité (BR-ID), pèsent environ un quart de chaque capture ; au contenu, les 4 diffèrent (lignes, tableau zébré, jetons en flux, nuage de points).

## Captures (toutes ouvertes)
- e8na : e8na/e8na-{repos-390-clair,geste-390-clair,historique-390-clair,comparer-390-clair,vide-390-clair,repos-390-cave}.png
- e8nb : mêmes six + e8nb/e8nb-repos-1280-clair.png
- e8nc : e8nc/e8nc-{…six…}.png
- e8nd : e8nd/e8nd-{…six…}.png

## Ce qui se voit au repos, à 390
- e8na : 12 lignes à deux étages dans un panneau.
- e8nb : tableau, en-têtes Alcool / Lots / Dernier, 13 rangées zébrées.
- e8nc : 7 titres de style, environ 30 jetons en flux.
- e8nd : un nuage de 35 points, environ 27 nommés, sur couleur × alcool.

## Prédiction
« La carte, c'est la plus parlante (je vois où sont mes IPA), mais pour retrouver vite je prends le sommaire par style ; le tableau, c'est propre mais c'est Excel. »

DÉCISION À PRENDRE : aucune (le brasseur choisit sur la page). Le pilote juge s'il faut assouplir controle-panel pour des maquettes qui portent le chrome imposé de l'app.

CONNAISSANCE : aucune.
LEÇON PROPOSÉE : controle-panel mesure la ressemblance sur toute la capture ; depuis la trousse d'identité (BR-ID), le chrome commun suffit à pousser une série d'écrans d'onglet au-dessus de 0,90. Mesurer la diversité sous les sous-onglets (zone de contenu) pour les séries à l'identité de l'app.
