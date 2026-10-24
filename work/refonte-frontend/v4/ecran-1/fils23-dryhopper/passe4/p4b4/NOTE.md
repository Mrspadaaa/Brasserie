# p4b4 — « Le duel contre ★ » (passe 4 sur a1, voie dh4b, 24.10)

**Chaleur : chaude.** Forme libre sur a1 : les barres l5b se mettent face à face. À gauche, le moment sous le pouce
(barres ancrées au centre, qui poussent vers la gauche) ; à droite, la référence, ★ le meilleur pour sa demande, ou d'un
toucher de lecture le dry hop après fermentation de même durée. L'écart se lit au centre, sous la famille, orangé quand
ce moment perd. Le dock d'a1 (pastilles, jours, rail, loupe), « Face à ta stout », mesuré et pont Levure restent.
Régénérer : `node generer.mjs` ; captures : `node ../p4b-commun/capturer.mjs p4b4`.

## Améliorations du brief prises
- **6, la lecture sans légende** : deux colonnes, l'écart au centre ; à 20′ chaque famille perd (≈−11 floral, ≈−10 baies)
  et l'amertume dit « trop amer » ; à ★ tout est « = ». Les pastilles du dock disent l'écart de floral de chaque étape
  contre ★ : 60′–0′ −20…−9, WP −9, actif ★, après +1.
- **2, le contour chaleur / CO₂** : « contre après » met à droite le dry hop après de même durée ; la part que ce moment n'a
  pas est hachurée orangée (chaleur) ou pointillée bleu-gris (CO₂) : à actif · 2 j, le CO₂ emporte ~−6 résineux, ~−5
  végétal, ~−2 baies ; à 20′, la chaleur emporte ≈−12 floral, ≈−13 résineux.
- **4, l'inconnu n'est jamais zéro** : Pépins et Melon hachurés « ? » des deux côtés, « ? » au centre.

## Greffes
« contre ★ » de b4 (chiffré par famille, plus en une ligne) ; « trop amer » de a8 ; « le CO₂ emporte ~−6 résineux » de
d1/d2 ; « le meilleur » rappelé de g4 ; loupe ×5,6 (écart de floral des voisins), pastilles, jours et sauts d'a1.

## Ce qui tient
- La question « est-ce mieux ou moins bien que ★ ? » se lit famille par famille en un regard ; le toucher de lecture ne
  change que la colonne de droite (D98 : un seul facteur libre, groupe `data-lecture`).
- 42 mots hors données ; un écran ; loupe ×5,6.

## Ce qui casse
- Les barres sont plus courtes que dans a1 (deux colonnes de 130 px) : les petites familles (épicé, herbacé) deviennent
  des traits.
- Le trait « moitié du style » n'est pas la zone grise d'a1 : moins visible, dit dans le « ? ».
- À ★, la page est une colonne de « = » : juste, mais vide d'enseignement tant qu'on ne glisse pas.

## Contrôles
| critère | sortie |
|---|---|
| G2 `controle-commun --sans=mots` | **COMMUN OK** (après balisage `data-role="zone"` du trait de style, S2 d'au-style) |
| G3 `controle-une-question` | **UNE-QUESTION OK (1 groupe libre : moment)** — 9 contrôles |
| G4 `mots-premier-ecran --max=80 --sans-donnees` | **MOTS OK**, 42 mots |
| `controle-panel` (hors critères) | PANEL ECHEC : p4b4 0,49 de remplissage |

Geste : d'actif · 2 j (★, « = » partout, 60+?) à 20′ (≈+11, écart floral ≈−11, ≈119 « trop amer »). Captures ouvertes :
`captures/p4b4-premier-ecran.png`, `p4b4-pendant.png`, `p4b4-apres.png`, `p4b4-contre-apres.png` (20′ contre après · 2 j,
hachure chaleur), `p4b4-contre-apres-actif.png` (actif · 2 j contre après · 2 j, pointillé CO₂).
