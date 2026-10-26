# dga3 — « Le tambour »

**Chaleur : tiède.** **Greffe : `data-greffe="frise-y1b"`**, sur le tambour (`#dga3-tb`).

**Base** : l'écran Dryhopper de la maquette jouable, chargé tel quel (`prototypes/houblons-v4/maquettes/parcours/dryhopper/etat.html`,
React, moteur en direct) ; « la meilleure version est celle de l'app jouable mais il lui faut quelques améliorations ».

## L'idée, une seule
La frise de y1b retravaillée en **tambour** (le sélecteur d'heure du téléphone, couché) : Idaho 7 reste au repère du
milieu, **c'est le brassin qui défile sous le pouce**. Chaque moment a sa case de 48 px : la minute ou le jour de contact,
le floral gagné en barre et en chiffre (lu sur le bandeau de la maquette, cran par cran), « sans gain » quand la maquette
le dit ; la case du repère en 22 px, ses voisines en 16 px. Dessous, la bande des étapes (ébullition, WP, « actif ·
levure » en bleu, après), l'étape du repère écrite à côté de lui. La loupe est permanente : on lit les moments voisins
sans poser le doigt.

## Comment elle tient la base
Le vrai rail de la maquette reste l'état (retiré de l'écran) ; chaque case franchie le pose aux flèches ; toucher une case
l'amène au repère. Tout le reste est la maquette.

## Ce qui tient
- Les chiffres de la frise sont gros et ne se chevauchent jamais (48 px par moment au lieu de 11 à 15 px sur le rail).
- Joué : glisser vers la droite de 7 cases depuis actif 2 j → 20′ (≈+11, IBU ~121), la frise suit le pouce au pixel
  (`captures/dga3-geste.png`), au lever elle se cale (`dga3-apres.png`) ; toucher la 2ᵉ case à droite → actif 5 j.
- 1 écran ; 88 px contre 74 pour le rail et les jours.

## Ce qui casse
- On ne voit que 7 à 8 moments à la fois : pour aller de 60′ à après 7 j, il faut deux ou trois glissés (la rangée
  d'étapes de la maquette, au-dessus du graphique, reste le saut rapide).
- Le sens est inversé par rapport au rail (on tire le brassin vers la droite pour revenir plus tôt), comme un tambour.
- Mots : 143 (sa base : 106) ; hors données 45 (41). Les ajouts sont des minutes, des jours et des floraux, cases hors
  de vue masquées.

## Contrôles (sorties recopiées)
Voir `RESULTAT.md` de la voie.
