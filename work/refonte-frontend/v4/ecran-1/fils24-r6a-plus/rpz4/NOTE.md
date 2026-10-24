# rpz4 · Chaque barre dit son écart

Lot « r6a++ » (24.10, soir), série rpz (libre, brief minimal). Chaleur : **chaude**. Greffe : `ecart-face-au-retenu`.
Page `etat.html` : r6a reprise telle quelle (split/join, L26) ; classes `rpz4-…`. Captures `../captures/rpz4.png`
(premier écran), `rpz4-390.png` (page entière), `rpz4-galaxy.png` (Galaxy retenu).

## L'idée, une seule
Ses mots : « Mais il faut aussi que on voit comme il faut les différence ! » (D131). Sous chaque barre des deux
colonnes non retenues, **l'écart signé face au houblon retenu**, en crans de ta 16D (cran = largeur de la bande du
style / 3, la même règle que les « ~+0,9 » de r6a) : une mini barre divergente (plein à droite = plus que le retenu,
creux à gauche = moins, 1 cran = 32 % de la demi-barre) et le nombre en mono (« +1,5 », « −0,4 », « ≈ » sous 0,05 cran,
« ? » si l'un des deux est inconnu). Une ligne au-dessus des rangées le dit : « sous la barre : l'écart face à Idaho 7,
en crans de ta 16D ». La colonne retenue garde ses barres r6a, sans écart (c'est le zéro). Toucher une autre tête
recalcule tout : Galaxy retenu → Idaho 7 floral « +0,4 ».

Ce qu'on y lit d'un coup : Galaxy fait +2,2 crans de tropicaux et +1,5 d'agrumes et de noyau de plus qu'Idaho 7, et
−0,4 de floral ; Cascade est à ≈ partout sauf +0,9 d'épicé et +0,7 d'agrumes.

## Ce qui tient
- r6a entière ; rien de déplacé, chaque cellule gagne une ligne de 12 px.
- Honnêteté : calculé à partir des mêmes centres `RD` que r6a (`data-nature="simule"`) ; inconnu → « ? », jamais 0 ;
  cohérent avec r6n2 (« Idaho 7 devant Cascade ~0,4 cran » : ici Cascade floral −0,4).
- Baseline : pictos au trait, couleur de la famille sur la barre d'écart, thème clair. 71 mots au premier écran ; le
  tableau tient presque dans le premier écran (bas à 849 px).
- Légende : « L'écart, sous la barre » dans le « ? ».

## Ce qui casse ou reste douteux
- Les rangées passent de 22 à ~38 px (46 pour Floral et Résineux) : +~110 px, le tableau frôle le bord du premier
  écran (849 px pour 844).
- La colonne retenue a du vide sous ses barres ; voulu (c'est la référence), mais un critique peut le trouver creux.
- Première version : 1 cran = 11 % de la demi-barre, +0,7 faisait 4 px, invisible ; porté à 32 %.
- En Absolu, l'écart reste en crans du style (la lentille ne change que les barres r6a) ; à dire ou à convertir.

## Contrôles joués
- TRAIT OK (28 pictos, 0 faute). COMMUN OK (--sans=mots).
- PANEL ECHEC sur les quatre captures (ressemblance 0,93 ; rpz1 ~ rpz4 à ≥ 0,95) : attendu, même base r6a imposée.
- Geste : toucher Galaxy → « retenu = Galaxy », 20 écarts recalculés, Idaho 7 floral « +0,4 ».
