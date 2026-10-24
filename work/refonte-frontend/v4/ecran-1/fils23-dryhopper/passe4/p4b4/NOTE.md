# p4b4 — « Le duel contre ★ » (passe 4 sur a1, voie dh4b, 24.10 ; retouches du conseil dh4)

**Chaleur : chaude.** Forme libre sur a1 : les barres l5b se mettent face à face. À gauche, le moment sous le pouce
(barres ancrées au centre, qui poussent vers la gauche) ; à droite, la référence, ★ le meilleur pour sa demande, ou d'un
toucher de lecture le dry hop après fermentation de même durée. L'écart se lit au centre, sous la famille, orangé quand
ce moment perd. Le dock d'a1 (pastilles, jours, rail, loupe), « Face à ta stout », mesuré et pont Levure restent.
Régénérer : `node generer.mjs` ; captures : `node ../p4b-commun/capturer.mjs p4b4`.

## Retouches du conseil (`conseil-dh4/verdict.md`), avec leur mesure
- **Noyau et Baies** : « ? → ~+21 » des deux côtés (à 20′ : « ? → ≈+11 » face à « ? → ~+21 »), stub hachuré au pied de
  chaque barre (à droite pour la colonne de gauche, dont la barre pousse vers la gauche) ; l'écart au centre reste chiffré
  (≈−10) ; aucun « 0 » (`valeursZero: 0`).
- **Loupe hors figure** : la loupe d'a1 (60 px) couvre les pastilles et les jours du dock ; intersection mesurée au DOM avec
  la figure (`#p4b4-fig`) : **0 px²** à 20′, au whirlpool et à après · 7 j.

## Améliorations du brief prises
- **6, la lecture sans légende** : deux colonnes, l'écart au centre ; à 20′ chaque famille perd (≈−11 floral, ≈−10 baies)
  et l'amertume dit « trop amer » ; à ★ tout est « = ». Les pastilles du dock disent l'écart de floral de chaque étape
  contre ★ : 60′–0′ −20…−9, WP −9, actif ★, après +1.
- **2, le contour chaleur / CO₂** : « contre après » met à droite le dry hop après de même durée ; la part que ce moment n'a
  pas est hachurée orangée (chaleur) ou pointillée bleu-gris (CO₂) : à actif · 2 j, le CO₂ emporte ~−6 résineux, ~−5
  végétal, ~−2 baies ; à 20′, la chaleur emporte ≈−12 floral, ≈−13 résineux.
- **4, l'inconnu n'est jamais zéro** : Pépins et Melon hachurés « ? » des deux côtés, Noyau et Baies « ? → gain ».

## Greffes
« contre ★ » de b4 (chiffré par famille) ; « trop amer » de a8 ; « le CO₂ emporte ~−6 résineux » de d1/d2 ; « le meilleur »
rappelé de g4 ; loupe ×5,6 (écart de floral des voisins), pastilles, jours et sauts d'a1.

## Ce qui tient
- « Est-ce mieux ou moins bien que ★ ? » se lit famille par famille ; le toucher de lecture ne change que la colonne de
  droite (D98 : un seul facteur libre, groupe `data-lecture`) ; 50 mots hors données ; un écran.

## Ce qui casse
- Les barres sont plus courtes que dans a1 (deux colonnes de 130 px) : les petites familles deviennent des traits.
- Au repos sur ★, la page est une colonne de « = » (le critique : ouvrir sur « contre après », non fait : pas de greffe
  croisée ni de changement de forme avant son choix).
- La loupe dit l'écart contre la référence, pas le gain (retouche « derrière » du conseil, non demandée pour p4b4).

## Contrôles (rejoués après les retouches)
| critère | sortie |
|---|---|
| G2 `controle-commun --sans=mots` | **COMMUN OK** |
| G3 `controle-une-question` | **UNE-QUESTION OK (1 groupe libre : moment)** |
| G4 `mots-premier-ecran --max=80 --sans-donnees` | **MOTS OK**, 50 mots |

Geste : d'actif · 2 j (★, « = » partout, 60+?) à 20′ (≈+11, écart floral ≈−11, ≈119 « trop amer »). Captures ouvertes :
`captures/p4b4-premier-ecran.png`, `p4b4-pendant.png`, `p4b4-apres.png`, `p4b4-contre-apres.png`, `p4b4-contre-apres-actif.png`.
