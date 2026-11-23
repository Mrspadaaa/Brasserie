OK — huit concepts Dryhopper série F, forme libre sur la baseline, moment seul facteur libre

## Concepts (tous chauds, VOIE.md : 8 chaude)

| id | chaleur | ce qu'il montre | geste | vraie valeur | levure |
|---|---|---|---|---|---|
| f1 La cuve en coupe | chaude | la journée en colonne : chaudière → whirlpool → cuve ; barres l5b à droite | jeton glissé de haut en bas | E07 Sharp 2014 (régimes) | pont Levure › |
| f2 La balance de ta dégustation | chaude | floral gagné contre résineux ajouté, pistes d'objectif ; « il va contre ta dégustation, actif vaut mieux qu'après » | rail par 5′ | E03 myrcène Idaho 7 0,085 mg/L, ×7 sous Azacca | dernière étape (CO₂ emporte ~−0,6 cran) |
| f3 Le cadran | chaude | radar 12 axes, moments en anneau | molette circulaire | E10 Titus 2021 (1 h se sent à 30 j) | pont Levure › |
| f4 La carte de chaleur | chaude | 12 familles × 11 moments, cases pleines, crans 16D en points | doigt sur l'en-tête, par 5′ | E08 Schmidt 2019 (2 jours) | dernière étape |
| f5 L'agenda du brassin | chaude | J0 (minutes, WP) puis J+1…J+12, courbe d'US-05, barre de contact | cône glissé sur l'agenda | E08 | dernière étape (la levure trace actif / après) |
| f6 Le barboteur | chaude | ce que la vapeur, le CO₂ ou rien emporte, hachuré sur chaque barre | rail par 5′ | E05 Wolfe 2012 (pic 3–6 h) | dernière étape (Pomona : agrumes ~+13 points) |
| f7 Le nez du verre | chaude | 12 bulles dans leur anneau « haut de la 16D » au-dessus de la stout | dock sous le pouce | E03 jury CATA Idaho 7, linalol 38 ± 13 µg/L | pont Levure › |
| f8 Le compromis | chaude | amertume (~IBU) × fruité (crans), un point par moment, rectangle 16D | rail par 5′ | E07 | pont Levure › |

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-f/generer-f.mjs`, `capturer-f.mjs`, `NOTE.md`
- `serie-f/f1/etat.html` … `serie-f/f8/etat.html` (générés)
- `serie-f/captures/f1-390.png` … `f8-390.png`, `f1-60-390.png` … `f8-60-390.png`, `f1-fiche-390.png` ;
  `serie-f/captures/travail/sonde-fiche.mjs`, `sonde-fiche2.mjs` (sondes de l'appui long)
- ce RESULTAT.md

## Sorties décisives
- G1 `controle-commun … --sans=mots` : **COMMUN OK** (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende, parlant, brutes OK).
- G2 `controle-une-question` : **UNE-QUESTION OK (1 groupe libre : moment)**, huit pages « libres : moment · contexte : houblon, dose, levure, base ».
- D99 `controle-acquis` : ACQUIS ECHEC (acquis de Comparer, ne s'applique pas à Dryhopper) ; recopié dans la NOTE.
- MOTS `--max=80` : 95 à 159 mots, MOTS ECHEC 8/8 (indicatif en v0 ; y1b : 134).
- Captures : aucune erreur de page, largeur 390 partout ; f6 à 925 px de haut (étape levure sous le pli).

## Captures ouvertes
f1-390.png, f2-390.png, f3-390.png, f4-390.png, f5-390.png, f6-390.png, f7-390.png, f8-390.png, f1-fiche-390.png,
f3-60-390.png, f4-60-390.png, f6-60-390.png (toutes dans `serie-f/captures/`). Corrigé après lecture : jeton qui cachait
« actif » (f1), « 60′ » coupé (f3), en-têtes collés et noms tronqués (f4), étiquettes cachées (f5), chaudière qui fumait en
actif (f6, `hidden` inopérant sur un `<g>` SVG), arc décoratif remplacé par des anneaux par famille (f7), axes rognés (f8).

## Prédiction
« f4 et f8 pas mal, f2 intéressant mais c'est l'idée pas hyper bien réalisé, f3 et f7 une sacrée dinguerie ou n'importe
quoi selon l'humeur ; attention trop de texte en bas (mesuré, levure) » — il gardera la carte de chaleur et le compromis,
et demandera la loupe ×3 d'y1b sur les rails.

DÉCISION À PRENDRE : aucune (les formes levure « dernière étape » / « pont » sont montrées 4 et 4, comme demandé).

CONNAISSANCE : Idaho 7 à 4 g/L dans la stout 16D, d'après la grille : à tout moment le moteur ajoute plus de résineux
(~+1,4 cran en dry hop) que de floral (~+1,2), donc contre la dégustation du 18.10 (« plus floral, moins résineux ») ;
actif bat après parce que le CO₂ emporte ~−0,6 cran de résineux. Or E03 mesure un myrcène ×7 sous Azacca pour Idaho 7
en bière : le moteur suit la fiche (pin, résine), pas la mesure. À confronter (L14) avant de conseiller Idaho 7 au brasseur.

LEÇON PROPOSÉE : une maquette qui porte la fiche à l'appui long doit ouvrir strictement avant les délais du contrôle
(650 ms toucher, 900 ms survol) et avaler le clic synthétisé qui suit le relâchement (il tombe sur le voile et referme) ;
le 23.10, deux allers-retours FICHE ECHEC pour cela. À écrire dans le brief des séries ou en témoin de `controle-fiche`.
