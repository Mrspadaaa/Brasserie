# p4b5 — « Trois moments sous le pouce » (passe 4 sur a1, voie dh4b, 24.10 ; reprise après REJET, puis retouches du conseil dh4)

**Chaleur : chaude.** Forme libre sur a1 : la figure compare trois moments côte à côte, le moment sous le pouce au milieu,
ouvert (barres l5b avec rond « avant » et chiffre), un voisin de chaque côté : barre de gain seule, sans rond, chiffrée.
Les 12 familles sont alignées en lignes, l'œil lit d'un trait comment chacune monte ou tombe d'un cran à l'autre.
Toucher un voisin y va. Le dock garde les quatre pastilles d'étape, le rail et la loupe d'a1 ; « Face à ta stout »,
« contre ★ », mesuré et pont Levure sont ceux d'a1. Régénérer : `node generer.mjs` ; captures :
`node ../p4b-commun/capturer.mjs p4b5`.

## Retouches du conseil (`conseil-dh4/verdict.md`), avec leur mesure
- **Noyau et Baies** : « ?→~+21 » (forme compacte, la colonne de valeur s'élargit seule sur ces deux lignes), stub hachuré
  au pied de chaque barre dans les trois colonnes ; aucun « 0 » (`valeursZero: 0`).
- **Loupe hors figure** : rail descendu de 10 px dans le dock ; la loupe d'a1 (60 px) couvre les pastilles ; intersection
  mesurée au DOM avec la figure (`.p4b5-grille`) : **0 px²** à 20′, au whirlpool et à après · 7 j.

## Reprise après le verdict du critique (REJET : « barres des voisins illisibles, 7 px sous un rond de 12 px »)
- Cinq colonnes → trois (voisin · ici · voisin) : cellules de 85 px, barres de gain à 12 px de haut (14 au milieu) sur des
  pistes de 51 à 55 px (DOM) ; plus de rond « avant » chez les voisins ; chaque colonne chiffrée ; amertume chiffrée partout
  (à 20′ : ≈129 · ≈119 · ~110) ; aux bouts du rail, les deux voisins du même côté (60′ · 55′ · 50′) ; loupe d'a1 rétablie.

## Améliorations du brief prises
- **1, l'interpolation dite** : en-tête en pointillé et « ≈ » pour une colonne interpolée, plein et « ~ » pour une calculée.
- **5, deux facteurs à l'écran** : en dry hop, les voisins sont des jours (1 j · 2 j · 3 j) ; « = » devant le chiffre marque
  un jour sans gain.
- **6, la lecture sans légende** : trois colonnes alignées, toutes chiffrées, ● / ○ sous l'en-tête pour mesuré / jamais mesuré.

## Greffes
Les cases comparées dont celle du doigt s'ouvre (e3) ; la mesure par colonne (c7) ; « sans gain » (e2) ; pastilles, sauts,
loupe et « contre ★ » d'a1 et b4.

## Ce qui tient
- La comparaison des étapes sans glisser, en gardant le geste et la loupe d'a1 ; 45 mots hors données ; un écran.

## Ce qui casse
- Les pistes des voisins font 51 px : les écarts de 1 point se lisent au chiffre, pas à la barre ; sur Noyau et Baies,
  « ?→~+21 » rétrécit encore la piste (≈ 30 px).
- Trois colonnes : un seul cran de chaque côté ; la loupe du rail complète.

## Contrôles (rejoués après les retouches)
| critère | sortie |
|---|---|
| G2 `controle-commun --sans=mots` | **COMMUN OK** |
| G3 `controle-une-question` | **UNE-QUESTION OK (1 groupe libre : moment)** |
| G4 `mots-premier-ecran --max=80 --sans-donnees` | **MOTS OK**, 45 mots |

Geste : d'actif · 2 j (colonnes 1 j | 2 j | 3 j, ~+22, 60+?) à 20′ (colonnes 25′ | 20′ | 15′, ≈+11, ≈119), loupe ×5,6.
Captures ouvertes : `captures/p4b5-premier-ecran.png`, `p4b5-pendant.png`, `p4b5-apres.png`, `p4b5-60.png`.
