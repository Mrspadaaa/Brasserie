---
name: acquis-valides
description: Éléments de l'outil houblons que le brasseur a validés. Chaque brief de lot les reprend et un contrôle vérifie leur présence (leçon L06).
type: produit
maj: 2026-10-23
sources: work/refonte-frontend/v4/SPEC-BRASSEUR.md ; work/refonte-frontend/registre.md (retour du lot 21, 20.10)
---

Ce qui a été gagné ne doit pas disparaître au lot suivant. Le radar l'a fait au lot 21
(« pas de radar grpah ? »). Chaque ligne cite sa preuve dans SPEC-BRASSEUR.md.
Plancher à enrichir, pas plafond ([[le-brasseur-choisit]]).

| Acquis | Ses mots | Où le reprendre |
|---|---|---|
| Code couleur des arômes | « j'aime bien le code couleur pour savoir quelle arôme ça ajoute » (18.10) | toutes les cartes de houblon |
| Glisser le moment comme un curseur, par 5′ | « pouvoir glisser comme un slider le moment de l'ajout » (18.10) | rail des étapes, y1b |
| Barres de type l5b | « Meilleures bar » ; « Les bar de ce type sont plus informative » (19.10) | barres de voie et pistes d'objectif |
| Disposition l8 | « la manière dont sont disposés les choses j'aime beaucoup !! » (19.10) | ordre de l'écran |
| Radars m4 et h4, sans légende écrite | « Radar: m4 h4 très bien » (19.10) | Ma bière, fiche face à ta demande |
| Comparer : variante 3 (barres et radar) | « J'aime beaucoup la variante 3 », à compléter par l'intervalle de confiance et le style (18.10) | comparateur 1:1 |
| Fiche g1 ; fiche courte type Citra cryo | « la v1 est la meilleure » ; « Ça c'est très bien » (19.10) | fiche au long appui |
| Suggestions s5, et « + » vers Comparer | « s5 semble vraiment le mieux » ; « un + qui ajoute le houblon à la comparaison » (19.10) | Suggestions → Comparer |
| y1b, le brassin au doigt | « y1b est de mon point de vue semble meilleur » (20.10) | outil du « quand » |
| Panel OSU de y3 (sans la molette encombrante) | « la panel osu j'aime assez » (20.10) | comparateur 1:1 |
| Manière de comparer de w2 | « pas trop mal dans la manière de comparé » (20.10) | comparateur 1:1 |
| Vraies valeurs de v1, moins austères | « meilleur vu de comparaison sur des vrai valeur » (20.10) | comparateur 1:1 |
| r6a, avec les éléments qu'il a notés ailleurs | « r6a est le meilleur mais reprendre trop peu d'éléments que j'avais noté bon ou intéressant des autres variante » (22.10) | Comparer (reprise r6n1, r6n2) |
| r6n2 : le premier écran de r6a, le reste à un toucher sous un dock ; la référence de densité | « r6n2 donne vraiment bien » (23.10) | Comparer ; niveau attendu d'un panel (M14) |
| Picto « épicé » : cannelle et clou croisés (f1 de la série F, r4d) | « Mon Picto préféré est cannelley clou croisé. Ça doit être changé dans la baseline » (23.10) | symbole `p-spice` de `fils17-standard/v3/planche.html` |

Contrôle de présence, écrit le 22.10 : `controle-acquis.mjs` (D99). Sur un écran Comparer, il exige
le radar, la chimie, le panel OSU et les vraies valeurs, balisés `data-acquis`. À ajuster avant le
lot 22 pour accepter un acquis « à un toucher ».
Inventaire complet de ce qu'il a noté bon ou intéressant, avec ses mots, la variante et la capture :
`work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/elements-notes.json` (37 éléments, 19 variantes, 22.10).
Une variante de reprise le prouve par une section « ## Reprise » et des marqueurs `data-element` (D104,
`controle-reprise.mjs`).
Voir [[outils-houblons]].
