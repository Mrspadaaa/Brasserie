OK — planche série C : 8 signes « épicé », 8 genres, à 12/16/24 px et sur cartes

## Fichiers écrits (tous dans « Possède »)
- `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-c/v0/generer.mjs` → `etat.html`
- `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-c/v0/capturer.mjs`, `NOTE.md`
- `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-c/v0/captures/planche-390.png`, `tailles-390.png`, `cartes-390.png`
- travail : `captures/travail/` (voir.mjs, loupe.mjs, bloc.mjs, loupe.png, c4.png, captures de la base)
- `git status --short` après la voie : rien hors de ces chemins (`pistes-l5f.png` à la racine existait avant).

## Les 8 propositions

| Id | Nom | Genre | Ce qu'elle dit à un brasseur | Risque de confusion |
| --- | --- | --- | --- | --- |
| c1-initiale | É | lettre | L'initiale, accent compris, se lit sans apprentissage | Un mot parmi onze dessins |
| c2-diese | Dièse | signe musical | ♯ = « relevé », le mot de cuisine juste pour le poivré doux | À 12 px, se lit « # » (hashtag) |
| c3-pique | Pique | jeu de mots | ♠ « ça pique » un peu ; une silhouette unique | Sens « piquant », proche du refus du piment |
| c4-cycle | Cycle | molécule | Les huiles épicées du houblon (humulène, caryophyllène) en formule | Hexagone comme l'icône de stock ; « insecte » à 12 px |
| c5-fumet | Fumet vif | signe olfactif | L'odeur qui monte, en dents : vive, pas chaude | Filets d'odeur lus « chaud » ; « ss » à 12 px |
| c6-eclat | Éclat | éclat | Une pointe vive à quatre branches | L'étincelle dit souvent « IA » |
| c7-xin | Xīn 辛 | idéogramme | Le caractère qui veut dire « épicé » (chinois, japonais) | Inconnu ; « pylône » à 12 px |
| c8-meandre | Méandre | motif | La grecque des routes d'Orient | Sans sens d'avance ; « @ carré » à 12 px |

Écartés pendant la passe, après la loupe : le carreau (losange), trop proche de l'éclat à 12 px ; le soufre
des alchimistes (triangle sur une croix), lu comme le sapin de Résineux.

## Sorties décisives
- G1 : `PLANCHE OK (8 variantes)` (12/16/24 px chacune, 14 voisins, herbal et green présents)
- G2 : `v0 · 173 pictos de famille · 0 faute(s)` / `TRAIT OK`
- G3 : `PAGE OK (0 images chargées, 390 px, sans erreur)`
- G4 : `EXISTENT OK 5`
- G5 : `NOTE OK`
- G6 : `NOTE OK`

## Captures ouvertes et regardées
- `captures/planche-390.png` : la planche entière, l'avant (5 cercles) puis les huit blocs.
- `captures/tailles-390.png` : chaque signe à 24, 16 et 12 px, et à 12 px entre la feuille et les brins.
- `captures/cartes-390.png` : chaque signe sur Saaz, Hallertau Mittelfrüh et Cascade.
- `captures/travail/loupe.png` (vrais pixels à densité 1, ×3) : c'est là que chaque signe a été nommé à
  12 px ; `captures/travail/c4.png` : un bloc à densité 3.

Prédiction : « Enfin des vraies propositions, É et 辛 je comprends, le # on dirait un hashtag, le reste faut
l'apprendre… mais c'est l'idée. »

DÉCISION À PRENDRE : aucune dans mon contrat ; le pique (c3) garde une part de « piquant » : à montrer, pas à
recommander.

CONNAISSANCE : un picto au trait 2.571 sur une viewBox de 24 demande au moins 2 unités de jour entre deux
traits pour rester séparé à 12 px (1 px rendu) ; deux silhouettes à quatre pointes (losange, étincelle) se
confondent à 12 px, et un triangle sur une hampe devient le sapin de Résineux. Dans l'app, le hachuré veut
dire « inconnu » : jamais de hachures dans un picto.

LEÇON PROPOSÉE : aucune (méthode tenue : loupe des vrais pixels à densité 1 avant les captures, ce qui a
écarté deux dessins avant le critique).
