# dga4 — « Le calendrier de la cuve »

**Chaleur : chaude.** **Greffe libre : `data-greffe="calendrier-cuve"`** (la frise de y1b refaite en temps du brassin), sur
le calendrier (`#dga4-cal`).

**Base** : l'écran Dryhopper de la maquette jouable, chargé tel quel (`prototypes/houblons-v4/maquettes/parcours/dryhopper/etat.html`,
React, moteur en direct) ; « la meilleure version est celle de l'app jouable mais il lui faut quelques améliorations ».

## L'idée, une seule
La frise en **jours du brassin**, où, quand et combien de jours d'un seul coup d'œil : à gauche le jour du brassage, zoomé
(flamme, « J0 · brassage », 60′ · 30′ · 0′ · WP, un cran par 5′) ; à droite la cuve, J1 à J12, avec la levure au travail
(bosse hachurée, bulles, non chiffrée comme sous le graphique de la maquette). À chaud, Idaho 7 est un jeton ; **à froid,
c'est une barre** : elle commence pendant la fermentation (≈J2) ou après (≈J5), **on tire son bout pour les jours de
contact** (1, 2, 3, 5, 7), et le jour où on retire le houblon s'écrit sur l'axe (« ≈J4 », « ≈J9 »). Les jours où la
maquette dit « sans gain » sont hachurés sous la barre, avec le mot.

## Honnêteté
≈J2 et ≈J5 ne viennent pas du moteur : ce sont les bornes de la bosse de levure de p4b2f (« fin vers J+5, à confirmer à
la densité ») ; d'où le « ≈ ». Les jours de contact et « sans gain » sont ceux de la maquette (ses boutons de jours ;
5 j n'a pas de bouton : « sans gain » si 7 j l'est).

## Ce qui tient
- Le geste répond à « combien de jours » en tirant, pas en choisissant un bouton : joué, actif 2 j → tirer le bout →
  actif 7 j, « sans gain » sur 5 jours, retrait ≈J9 (`captures/dga4-geste.png`) ; la maquette dit « contre ★ : floral ~+0 »
  (le gain s'arrête à 2 j : la barre le montre avant même de lire le chiffre).
- Toucher le brassage → minute la plus proche (40′), la cuve après J5 → après 3 j, WP → whirlpool : vérifiés.
- 1 écran ; 84 px contre 74 pour le rail et les jours.

## Ce qui casse
- L'ébullition (13 moments) tient dans 35 % de la largeur : on y vise au 5′ près grâce au graphique au-dessus (le trait
  suit), pas à la frise seule.
- Le calendrier n'est plus aligné sur le graphique (qui reste par moments) : deux échelles l'une sous l'autre.
- Mots : 124 (sa base : 106) ; hors données 49 (41).

## Contrôles (sorties recopiées)
Voir `RESULTAT.md` de la voie.
