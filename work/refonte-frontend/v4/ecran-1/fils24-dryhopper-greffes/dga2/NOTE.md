# dga2 — « Le graphique est la frise »

**Chaleur : tiède.** **Greffe : `data-greffe="frise-y1b"`**, sur la frise sous l'axe (`#dga2-frise`).

**Base** : l'écran Dryhopper de la maquette jouable, chargé tel quel (`prototypes/houblons-v4/maquettes/parcours/dryhopper/etat.html`,
React, moteur en direct) ; « la meilleure version est celle de l'app jouable mais il lui faut quelques améliorations ».

## L'idée, une seule
Plus de rail à part : **le pouce glisse sur le graphique lui-même** (ou sur la frise dessous). La frise de y1b devient l'axe
du graphique : le jeton nommé « ● Idaho 7 · actif 2 j » suit le trait du doigt sous l'axe, avec son bec à l'aplomb du
moment ; dessous, les minutes par 15′, WP, puis les jours de contact (bleus quand la levure travaille, gris pointillés
« sans gain » comme les boutons de la maquette).
**Sous le doigt, la frise s'ouvre en œil de poisson** (le dock d'Apple, « UX apple qui zoom focus la où on est », D47) :
chaque moment voisin y a son étiquette, écartée jusqu'à ×6 et grossie, les lointaines s'effacent ; c'est la loupe.

## Comment elle tient la base
Le vrai rail de la maquette reste l'état (retiré de l'écran) ; le doigt sur le graphique le pilote aux flèches. Tout le
reste est la maquette, recalculée par son moteur.

## Ce qui tient
- La cible du geste est grande (tout le graphique, 352 × 233 px) au lieu d'un rail de 26 px : là où l'œil regarde.
- Joué : actif 2 j → whirlpool → 15′ (≈+12, IBU ~110 orangé), la frise ouverte autour de 15′ (20′ 15′ 10′ 5′ 0′ lisibles,
  `captures/dga2-geste.png`), doigt levé (`dga2-apres.png`) ; toucher le bord gauche du graphique → 60′.
- 1 écran ; la frise prend 62 px contre 74 pour le rail et les jours qu'elle remplace.

## Ce qui casse
- Le graphique n'est plus défilable au doigt (touch-action: none) : la page tient dans un écran, donc sans perte ici.
- Près des bords, l'œil de poisson n'a de place que d'un côté (à 15′, deux étiquettes à gauche).
- Mots : 126 (sa base : 106) ; hors données 43 (41). Les ajouts sont des minutes et des jours.

## Contrôles (sorties recopiées)
Voir `RESULTAT.md` de la voie.
