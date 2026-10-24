# fld2 — barre des mots et puces (g1 affinée)

- **Chaleur : froide** (son choix g1 affiné, rien d'autre).
- Houblon par défaut : Nugget (`etat.html`) ; autre état capturé : Motueka. Les cinq houblons du brief : `h-<houblon>.html` (lien dans la légende « ? »).
- Question : « Que sent ce houblon, dit avec ses mots ? » ; facteur libre : la façon de dire ses mots ; houblon, fiche g1 et style 16D en contexte.

## Idée
La bande des 12 carrés de g1 devient une barre dont chaque part est le nombre de mots de la famille (gris neutre : hors des 12, D100) ; au style, une accolade « 16D » coiffe les familles attendues. Dessous, chaque mot est une puce à la couleur de sa famille, ses fiches en points (●●○○ sur 4).

## Ce qui tient
Nugget : la barre montre d'un coup que ses mots sont surtout tropicaux et que le 16D n'attend que floral, herbacé, terreux ; Motueka montre « mojito ●● » à part, au même poids que « citron vert ●● ».

## Ce qui casse
Deux lectures de la part (barre, puces) pour une même chose ; les points sur 4 se comptent mal.

## Baseline (plancher g1, règle n° 1)
Cadre g1 repris : feuille, nom et repère ⊙ (à la couleur du houblon), α en plage des fiches puis lot et jauge (« ≠ fiches » quand le lot sort de la plage), usage en mot, stock en petit badge, radar d'abord (D115) avec « n/N », « ? » hachurés et flèches de sa demande, « + Floral / − Résineux », ♡ ⊘ et « Comparer » en pied, croix de 44 px (icône 20 px, D109). Pictos au trait de la planche v3 (épicé : cannelle et clou croisés), couleurs des familles, au style par défaut et absolu à un toucher, légende derrière « ? », appui long (et survol long par zone, sur le nom) → fiche courte. Honnêteté : chaque mot vient de `pack-fiches.json`, traduit (« black currant » → cassis, « White wine » → vin blanc…), n/N = fiches qui le citent, catégories Hopsteiner distinguées des mots de dégustation, familles non décrites « ? », jamais zéro. Aucun écart à la baseline.

## Contrôles (joués le 24.10)
- `controle-commun.mjs … --page=etat.html --sans=mots` (série) : **COMMUN OK** (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende, parlant, brutes ; mots sauté par le brief).
- `mots-premier-ecran.mjs --sans-donnees --max=80` : 69 mots (hors données), MOTS OK.
- `controle-sans-famille.mjs` : Nelson Sauvin non montré au repos sur etat.html ; SANS-FAMILLE OK (série).
- `controle-une-question.mjs` : ECHEC, 2 fautes : « aucun sélecteur libre » (le facteur libre est la représentation, fixe dans un concept) et « pas de ligne de contexte » (le contexte est le cadre g1 et la bande de l'étape). Titre-question lu : oui.
- `controle-panel.mjs` (8 premiers écrans de la série) : remplissage médian 0,65, ressemblance 0,87, 0 paire identique : **PANEL OK**.

## Captures
`captures/fld2-premier-ecran.png`, `fld2-page.png`, `fld2-fiche.png` (fiche courte à l'appui long), et l'autre houblon : `fld2-<houblon>.png` et `-page.png`.
Générateur : `fld2/gen.mjs` (socle commun : `fld1/socle.mjs`, captures : `fld1/captures.mjs`).
