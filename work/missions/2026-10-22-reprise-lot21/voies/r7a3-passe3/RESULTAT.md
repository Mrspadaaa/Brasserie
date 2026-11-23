OK — a1 passe 3 sans vide : remplissage 0,41 → 0,64 (r6n2 0,70), 77 mots, critères verts

## Fichiers écrits
Tous dans `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe3/` :
- `a1/etat.html` ;
- `concepts/a1.mjs`, `socle.mjs` (certificat du lot dans la fiche) et `generer.mjs` ;
- `NOTE.md` ;
- `captures/a1-390.png`, `captures/a1-premier-ecran.png` et `captures/a1-toucher-390.png` ;
- dans `captures/travail/` : `capturer.mjs`, `geste.json`, `panel.json`, et une copie du concept avant
  l'épaississement.

La passe 2 n'a pas été modifiée. Rien n'a été écrit hors du périmètre possédé.

## Remplissage avant → après
0,414 (passe 2) → **0,643**. r6n2 est à 0,704. Le gain vient d'idées, pas de texte : de 79 à 77 mots.

Ajouté :
- un ruban par famille sous chaque barre : les 24 moments du rail, couleur qui fonce avec la valeur, trait orangé
  hors du style, hachuré inconnu, case du moment cerclée (greffes d8 et e1) ;
- la ligne Amertume avec son ruban d'IBU orangé là où c'est trop amer, et « 60+? » à cru (b4, d1) ;
- la loupe à mini-barres chiffrées (e5) ;
- la ligne du doigt « contre ★ actif · 2 j : floral ≈−11 · résineux ≈−7 · trop amer » (b4) ;
- la courbe d'activité de la levure sur le dock (f5, g6) ;
- les pastilles d'étape trop amères soulignées en orangé ;
- le certificat du lot ID7-2573 dans la fiche (d5, b4).

Rapproché :
- barres de 18 px et rubans de 15 px ;
- figure étirée jusqu'au dock.

Corrigé :
- les cases ne se chevauchent plus entre deux étapes ;
- « sans gain » en pointillé et non plus en hachuré ;
- classes préfixées par composant (L26).

## Sorties décisives
Chaque critère est joué depuis la racine.

| critère | sortie |
|---|---|
| G1 | **COMMUN OK** |
| G2 | **MOTS OK**, 77 mots |
| G3 | **UNE-QUESTION OK (1 groupe libre : moment)** |
| G4 | **ACQUIS OK (4/4 : geste, frise, valeurs, levure)** |
| G5 | **PAGE OK** |
| G6 | **PANEL OK** : a1 0,643, r6n2 0,704 |
| G7, G8 | joués après l'écriture de ce rapport : **EXISTENT OK 5** et **NOTE OK** |

Geste au doigt : d'actif · 2 j (~+22) à 20′ (≈+11, ≈119 IBU trop amer, « contre ★ »). La loupe fait 66 px par
cran contre 11,8 px sur le rail.

## Captures ouvertes
Dans `passe3/captures/` : a1-premier-ecran.png, a1-toucher-390.png et a1-390.png.

## Prédiction
« là c'est dense et je vois tout de suite où chaque arôme monte. Le ruban sous chaque barre c'est top, mais les
rubans pâles se ressemblent un peu. »

CONNAISSANCE : `controle-panel` prend pour fond la couleur la plus fréquente, et ne compte un pixel différent qu'au-delà
de 60 d'écart RVB. Sur fond blanc, le gris de page `#eef0f4` et les pistes `#f1f2f5` comptent donc comme du vide.
Une teinte de famille à moins de 35 % d'opacité aussi : les rubans de la passe 3 n'ont compté qu'avec un plancher
d'opacité de 0,35. Les pistes comptent grâce à leur zone du style `#d9dce3`.

LEÇON PROPOSÉE : avant de remplir un vide, lire comment la mesure voit le vide. Un aplat pâle (opacité sous 0,35,
gris de page) reste du vide pour `controle-panel` comme pour l'œil. Mettre le contenu dans les lignes plutôt que
d'espacer les lignes : `justify-content: space-between` étire sans rien remplir.
