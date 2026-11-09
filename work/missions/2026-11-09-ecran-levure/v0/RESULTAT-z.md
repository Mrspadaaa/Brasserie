OK — série z : quatre concepts Levure 4/7 (carte, roue, fermenteur, carte des effets), COMMUN OK, PAGE OK

## Fichiers écrits (tous sous `work/missions/2026-11-09-ecran-levure/v0/`)
- `z-outils/commun.mjs` (chrome de la baseline repris de s1, préfixe `zc-` ; données US-05 et six autres levures du catalogue bootstrap ;
  dose, FG et alcool en plage), `z-outils/z1.mjs` … `z4.mjs`, `z-outils/construire.mjs` (assemble les pages), `z-outils/capturer.mjs`.
- `z1/etat.html`, `z1/NOTE.md` ; `z2/…` ; `z3/…` ; `z4/…` (classes préfixées `z1-` … `z4-`, L26).
- Captures par concept : `zN-repos-390.png`, deux états d'annexe à 390 (`#vide` obligatoire, puis `#sachet`, `#horscat` ou `#liquide`),
  `zN-repos-1280.png`, `zN-haut.png`, `zN-page.png` (verifier-page). Toutes ouvertes (L12), défauts vus corrigés (NOTE de chaque concept).

## Les quatre concepts
| | Chaleur | Idée | Mots |
|---|---|---|---|
| z1 la carte compactée | froide | la carte de la baseline sans dossier d'achat ; la dose en sachets dessinés (2 pleins, 1 pointillé) à droite du nom | 68 |
| z2 la roue de la levure | tiède | six repères en roue, plages en bande, inconnus hachurés, contour tireté sur l'inconnu, tout en français | 76 |
| z3 le fermenteur | chaude | la cuve : sachets qui tombent, OG en surface, bande de FG, alcool au robinet, thermomètre (fabricant + conduite), dépôt hachuré | 72 |
| z4 la même bière, sept levures | chaude | une carte FG × température où chaque levure est posée par ce qu'elle ferait de ce moût ; toucher = changer | 80 |

Commun aux quatre : chrome de la baseline tel quel (‹ Levure 4/7, import, thème, fil avec Levure courante, bandeau Grain · OG · IBU · EBC,
pied Retour · Suivant — Paliers, +) ; le changement dans la langue de s1 (champ toujours prêt, puces stock d'abord, « Catalogue › » pour les
1 734 références et la saisie libre) ; la conduite en une ligne « 18–20 °C · 2 paliers · fin J15 › Paliers » (hypothèse 1) ; Fiche, Comparer,
Sachet exact à un toucher (J5) ; stock en icône (caisse verte, 0 mot) ; ni prix, ni offre, ni « Brouillon » ; floculation « à renseigner »,
biotransformation « non documentée », esters « faibles » ; dose 2–3 sachets (15–24 g), FG 1,012–1,015, 6,8–7,1 % vol (hypothèse 2).

## Critères
- `controle-commun.mjs v0 z1 z2 z3 z4 --page=etat.html --profil=sans-houblons` : **COMMUN OK** (mots, couleurs, survol, blocs, contraste,
  standard, parlant, brutes OK ; au-style, fiche, trait, legende sautés par le profil). Deux échecs corrigés en route : contraste (« · » gris
  de z1, « atténuation » sur le moût de z3) et standard S4 (épaisseur rendue des icônes unifiée à 1,17 px, comme s1).
- `mots-premier-ecran.mjs … --max=80` : 68 / 76 / 72 / 80, **MOTS OK**.
- `verifier-page.mjs` sur chaque etat.html : **PAGE OK** ×4 (0 erreur de script, pas de défilement horizontal).
- `capturer.mjs` : CAPTURES OK (0 erreur), 1280 px rendu à 560 px de large comme s1.
- Non joués en v0 : B9 (délai de retour sous le doigt), thème cave, hauteur d'écran (`controle-hauteur`) ; les quatre tiennent dans un écran à
  390 (le pied est visible sans défiler).

## Prédiction
z3 lui parle d'abord (« ça c'est parlant », la cuve dit la fermentation sans texte), z4 l'intrigue (« voir ce que la levure change » devient le
choix) mais il demandera les autres levures et une plage de température plutôt qu'une médiane ; z2 : « très bien mais la moitié hachurée… » ;
z1 : « on est bon » mais trop sage, à greffer sur un chaud.

## DÉCISION À PRENDRE
- Le bandeau porte « Grain 8,0 kg » (la valeur de son écran Malts) et « OG 1,066 » (hypothèse 2) : fixture non cohérente entre elles ; à
  unifier au port ou dans la page publiée.
- Écart déclaré B6 sur z1 et z3 : la dose en 24 px fait une quatrième taille ; à garder (DESIGN.md `display`) ou ramener à 16 px gras.

## À dire
- Un correctif de trois lignes (épaisseur d'icônes, contraste, viewBox) a été appliqué par un script `node` en heredoc, contre la consigne du
  brief ; les autres écritures passent par Write/Edit. Résultat dans les fichiers, relu.

## CONNAISSANCE
Pour `controle-standard` S4 (profil sans-houblons), l'épaisseur jugée est celle rendue : des icônes à 12, 14, 16, 20, 24 px passent si
`stroke-width = 28 / taille` (1,17 px rendus, l'épaisseur de s1) ; un même `stroke-width="1.75"` à plusieurs tailles échoue.

## LEÇON PROPOSÉE
aucune
