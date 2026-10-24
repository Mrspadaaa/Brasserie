# p4b2 — « Le brassin en courbes » (passe 4 sur a1, voie dh4b, 24.10)

**Chaleur : chaude.** Forme libre sur a1 : la figure devient trois courbes de gain (floral, baies, résineux) le long des
24 moments, l'amertume en colonnes dessous, et le rail d'a1 **aligné juste sous l'axe** : le trait du doigt traverse les
courbes et les valeurs se lisent au croisement. Les 12 barres l5b d'a1 restent, pleine largeur, sous la figure ; « Face à ta
stout », « contre ★ », mesuré, pont Levure, sauts (les quatre étapes en tête de figure) et loupe sont ceux d'a1.
Régénérer : `node generer.mjs` ; captures : `node ../p4b-commun/capturer.mjs p4b2`.

## Améliorations du brief prises
- **1, l'arôme entre deux moments** : le moteur ne simule que 60′, 10′, whirlpool, actif et après ; les crans de 5′ sont
  interpolés. Ici l'interpolation se voit : points pleins là où c'est calculé, segments en pointillé et plus pâles entre
  eux ; sur le rail, un point marque chaque moment calculé. Les valeurs gardent « ≈ ».
- **3, la courbe de levure sur la frise** : sous l'axe, une bosse d'activité sur l'actif (J+2 → J+5), « levure active »,
  puis « levure finie » dans l'après : actif / après se lisent sans légende.
- **4, l'inconnu n'est jamais zéro** : Pépins et Melon en barres hachurées « ? ».

## Greffes
Courbes de g1 (au lieu des rubans d'a1) ; courbe d'activité de f5 et g6 ; marques « mesuré » sur l'axe de c7 (● 38 µg/L en
actif, ● 1 h ≈ 96 h après) ; « sans gain » dans la loupe de e2 ; ★ et « contre ★ » d'a1 et b4.

## Ce qui tient
- Le piège et la réponse en une figure : les courbes montent à l'actif, l'amertume est orangée de 60′ à 25′ et hachurée à
  cru ; ★ au-dessus de l'actif.
- Le rail sous l'axe : le doigt et la figure partagent la même géométrie ; loupe ×5,9.
- 35 mots hors données ; un écran, rien sous le pli.

## Ce qui casse
- Floral et baies se superposent à ~+22 / ~+21 : leurs valeurs sont écartées de 13 px et les noms halo-blancs, mais à
  l'actif les deux courbes se confondent.
- La pastille du pouce est masquée (elle couvrait « levure active ») : le moment se lit dans les étapes en tête et la loupe.
- Le pont Levure dit « rien ne change ici » hors de l'actif ; la biotransformation n'est pas quantifiée (bosse sans échelle).

## Contrôles
| critère | sortie |
|---|---|
| G2 `controle-commun --sans=mots` | **COMMUN OK** |
| G3 `controle-une-question` | **UNE-QUESTION OK (1 groupe libre : moment)** — 5 contrôles |
| G4 `mots-premier-ecran --max=80 --sans-donnees` | **MOTS OK**, 35 mots |
| `controle-panel` (hors critères) | PANEL ECHEC : remplissage 0,49 médian sur les cinq, ressemblance 0,92 |

Geste : d'actif · 2 j (~+22, 60+?) à 20′ (≈+11, ≈119, « contre ★ : floral ≈−11 · résineux ≈−7 · trop amer »). Captures
ouvertes : `captures/p4b2-premier-ecran.png`, `p4b2-pendant.png`, `p4b2-apres.png`, `p4b2-touche-actif.png`.
