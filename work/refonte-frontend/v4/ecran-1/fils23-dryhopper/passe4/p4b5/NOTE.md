# p4b5 — « Cinq moments sous le pouce » (passe 4 sur a1, voie dh4b, 24.10)

**Chaleur : chaude.** Forme libre sur a1 : la loupe devient la figure. Cinq colonnes, le moment sous le pouce au milieu,
ouvert (barres l5b chiffrées, amertume), ses deux voisins de chaque côté fermés (les mêmes barres, sans chiffre) ; les 12
familles sont alignées en lignes et l'œil lit d'un trait comment chacune monte ou tombe d'un cran à l'autre. Toucher un
voisin y va. Le dock garde les quatre pastilles d'étape et le rail d'a1 ; « Face à ta stout », « contre ★ », mesuré et pont
Levure sont ceux d'a1. Régénérer : `node generer.mjs` ; captures : `node ../p4b-commun/capturer.mjs p4b5`.

## Améliorations du brief prises
- **1, l'interpolation dite** : une colonne interpolée a un en-tête en pointillé et « ≈ » (30′, 25′, 20′, 15′), une colonne
  calculée un en-tête plein et « ~ » (10′) ; les points calculés sont aussi marqués sur le rail.
- **5, deux facteurs à l'écran** : en dry hop, les voisins sont des jours (1 j · 2 j · 3 j · 5 j) : la durée de contact se
  lit sans second geste, et « = » marque les jours sans gain (3 j, 5 j).
- **6, la lecture sans légende** : cinq colonnes alignées, le milieu chiffré, ● / ○ sous l'en-tête pour « mesuré » /
  « jamais mesuré » (c7).

## Greffes
Les cases comparées dont celle du doigt s'ouvre (e3) ; la mesure par colonne (c7) ; « sans gain » (e2) ; pastilles d'étape,
sauts et « contre ★ » d'a1 et b4.

## Ce qui tient
- La comparaison des étapes sans glisser, que le tri demandait (relance « e3 + a8 + c7 »), en gardant le geste d'a1.
- La figure tient lieu de loupe : 44 px par colonne contre 11,8 sur le rail (×3,7, L12), mesurée par `P4LOUPE` dans
  `geste.json` ; la loupe flottante d'a1 est retirée (elle ferait double emploi).
- 40 mots hors données ; un écran ; D98 vert (les boutons de colonne sont des sauts, dans le groupe `data-libre`).

## Ce qui casse
- Les barres des voisins font 44 px : on voit les ordres de grandeur, pas les petits écarts (floral 1 j → 2 j).
- Aux deux bouts du rail (60′, après · 7 j), des colonnes sont vides.
- L'amertume des voisins n'est qu'une barre sans chiffre ; le « trop amer » ne se lit que sur la colonne ouverte.

## Contrôles
| critère | sortie |
|---|---|
| G2 `controle-commun --sans=mots` | **COMMUN OK** (après `data-role="zone"` sur le trait de style, S2, et fond blanc sous le chiffre ouvert : contraste 4,43 → OK) |
| G3 `controle-une-question` | **UNE-QUESTION OK (1 groupe libre : moment)** — 10 contrôles |
| G4 `mots-premier-ecran --max=80 --sans-donnees` | **MOTS OK**, 40 mots |
| `controle-panel` (hors critères) | PANEL ECHEC : p4b5 0,50 de remplissage |

Geste : d'actif · 2 j (colonnes WP | 1 j | 2 j | 3 j | 5 j, ~+22, 60+?) à 20′ (colonnes 30′ | 25′ | 20′ | 15′ | 10′, ≈+11,
≈119, « contre ★ : floral ≈−11 · résineux ≈−7 · trop amer »). Captures ouvertes : `captures/p4b5-premier-ecran.png`,
`p4b5-pendant.png`, `p4b5-apres.png`.
