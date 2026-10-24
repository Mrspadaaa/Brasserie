# p4b2 — « Le brassin en courbes » (passe 4 sur a1, voie dh4b, 24.10 ; retouches du conseil dh4)

**Chaleur : chaude.** Forme libre sur a1 : la figure devient trois courbes de gain (floral, baies, résineux) le long des
24 moments, l'amertume en colonnes dessous, et le rail d'a1 **aligné juste sous l'axe** : le trait du doigt traverse les
courbes et les valeurs se lisent au croisement. Les 12 barres l5b d'a1 restent, pleine largeur, sous la figure ; « Face à ta
stout », « contre ★ », mesuré, pont Levure, sauts (les quatre étapes en tête de figure), boutons de jours et loupe sont ceux
d'a1. Régénérer : `node generer.mjs` ; captures : `node ../p4b-commun/capturer.mjs p4b2`.

## Retouches du conseil (`conseil-dh4/verdict.md`), avec leur mesure
- **Noyau et Baies** : « ? → ~+21 » dans les barres (avant inconnu, gain connu), stub hachuré au pied ; sur les courbes, le
  gain de baies est tracé tel quel (il est connu) ; aucun « 0 » (`valeursZero: 0`).
- **Loupe hors figure** : la loupe d'a1 est **en flux sous le rail** (plus en surimpression) : pendant le geste elle pousse
  les boutons de jours et le bloc des barres de 66 px, le graphique et le rail ne bougent pas. Intersection mesurée au DOM
  avec le graphique (`.p4b2-svg`), les étapes et le bloc des barres : **0 px²** à 20′, au whirlpool et à après · 7 j.
- **Bosse de levure hachurée**, dite « levure active · possible, non chiffrée » (deux lignes sous l'axe), « levure finie » à
  droite ; les marques « mesuré » (● 38 µg/L, ● 1 h ≈ 96 h) remontées au-dessus de l'axe.
- **Étiquettes floral / baies disjointes** : les noms de courbe sont à la fin des courbes, ou au début quand le doigt est
  dans les 110 derniers px ; noms et valeurs écartés de 16 px ; le chiffre d'IBU passe sous le dernier chiffre de courbe.
  Boîtes mesurées au DOM (`getBoundingClientRect`) : **0 px² de chevauchement** entre noms, valeurs et IBU à 60′, 20′,
  whirlpool, actif · 2 j et après · 7 j.
- **Pastille du pouce** sur l'axe : rétablie, placée sous le rail (0 px² sur le graphique, mesuré).
- **Boutons de jours d'a1** (1 · 2 · 3 · 7 j, pointillés « sans gain ») sous le rail, dans le groupe `data-libre`.

## Améliorations du brief prises
- **1, l'arôme entre deux moments** : points pleins là où le moteur calcule (60′, 10′, whirlpool, actif, après), segments en
  pointillé et plus pâles entre eux ; un point sur le rail par moment calculé ; valeurs « ≈ ».
- **3, la courbe de levure sur la frise** : bosse hachurée « possible, non chiffrée » sur l'actif, « levure finie » après.
- **4, l'inconnu n'est jamais zéro** : Pépins et Melon hachurés « ? », Noyau et Baies « ? → gain ».

## Greffes
Courbes de g1 ; courbe d'activité de f5 et g6 ; marques « mesuré » sur l'axe de c7 ; « sans gain » de e2 ; ★ et « contre ★ »
d'a1 et b4 ; boutons de jours d'a1.

## Ce qui tient
- Le piège et la réponse en une figure ; ★ au-dessus de l'actif ; l'amertume orangée de 60′ à 25′, hachurée à cru.
- Le rail sous l'axe : le doigt et la figure partagent la même géométrie ; loupe ×5,9 ; 42 mots hors données.

## Dernière retouche du critique (« Après le conseil »)
- La valeur « ? → ~+8 » passait sur deux lignes et la page faisait 855 px : colonne de valeur élastique et sans retour à la
  ligne, forme compacte « ?→~+21 », lignes de barres à 19 px, bloc resserré. Mesuré au DOM à actif · 2 j, 20′ et après · 7 j :
  **0 valeur sur deux lignes, page à 844 px** ; loupe toujours à 0 px² de la figure (3/3).

## Ce qui casse
- Floral ~+22 et baies ~+21 restent deux courbes voisines ; disjointes en étiquettes, pas en tracé.
- Pendant le geste, le bloc des barres descend de 66 px (la loupe en flux) : le doigt reste sur le rail, mais la page bouge.

## Contrôles (rejoués après les retouches)
| critère | sortie |
|---|---|
| G2 `controle-commun --sans=mots` | **COMMUN OK** |
| G3 `controle-une-question` | **UNE-QUESTION OK (1 groupe libre : moment)** |
| G4 `mots-premier-ecran --max=80 --sans-donnees` | **MOTS OK**, 40 mots |

Geste : d'actif · 2 j (~+22, 60+?) à 20′ (≈+11, ≈119, « contre ★ : floral ≈−11 · résineux ≈−7 · trop amer »). Captures
ouvertes : `captures/p4b2-premier-ecran.png`, `p4b2-pendant.png`, `p4b2-apres.png`, `p4b2-apres-7j.png`, `p4b2-touche-actif.png`.
