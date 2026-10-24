# fld3 — nuage

- **Chaleur : tiède** (forme imposée par la série d : une représentation distincte).
- Houblon par défaut : Nelson Sauvin (`etat.html`) ; autre état capturé : Motueka. Les cinq houblons du brief : `h-<houblon>.html` (lien dans la légende « ? »).
- Question : « Que sent ce houblon, dit avec ses mots ? » ; facteur libre : la façon de dire ses mots ; houblon, fiche g1 et style 16D en contexte.

## Idée
Ses mots de dégustation en nuage : la taille dit le nombre de fiches qui citent le mot, la couleur sa famille, le noir un mot hors des 12 au même corps qu'un autre. Le nom d'une famille et les catégories Hopsteiner sortent du nuage (le radar les dit déjà).

## Ce qui tient
Nelson Sauvin redevient « incroyable » : vin blanc, groseille à maquereau, raisin en très gros. Motueka : citron vert et mojito dominent, ce qui dit « frais, citron vert » plutôt qu'« ultra fruité ».

## Ce qui casse
Un nuage noir pour Nelson Sauvin : la couleur des familles n'y aide pas ; la place d'un mot dans le nuage ne veut rien dire.

## Baseline (plancher g1, règle n° 1)
Cadre g1 repris : feuille, nom et repère ⊙ (à la couleur du houblon), α en plage des fiches puis lot et jauge (« ≠ fiches » quand le lot sort de la plage), usage en mot, stock en petit badge, radar d'abord (D115) avec « n/N », « ? » hachurés et flèches de sa demande, « + Floral / − Résineux », ♡ ⊘ et « Comparer » en pied, croix de 44 px (icône 20 px, D109). Pictos au trait de la planche v3 (épicé : cannelle et clou croisés), couleurs des familles, au style par défaut et absolu à un toucher, légende derrière « ? », appui long (et survol long par zone, sur le nom) → fiche courte. Honnêteté : chaque mot vient de `pack-fiches.json`, traduit (« black currant » → cassis, « White wine » → vin blanc…), n/N = fiches qui le citent, catégories Hopsteiner distinguées des mots de dégustation, familles non décrites « ? », jamais zéro. Aucun écart à la baseline.

## Contrôles (joués le 24.10)
- `controle-commun.mjs … --page=etat.html --sans=mots` (série) : **COMMUN OK** (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende, parlant, brutes ; mots sauté par le brief).
- `mots-premier-ecran.mjs --sans-donnees --max=80` : 59 mots (hors données), MOTS OK.
- `controle-sans-famille.mjs` : Nelson Sauvin 83 % ✓ (part « autres » dessinée), SANS-FAMILLE OK.
- `controle-une-question.mjs` : ECHEC, 2 fautes : « aucun sélecteur libre » (le facteur libre est la représentation, fixe dans un concept) et « pas de ligne de contexte » (le contexte est le cadre g1 et la bande de l'étape). Titre-question lu : oui.
- `controle-panel.mjs` (8 premiers écrans de la série) : remplissage médian 0,65, ressemblance 0,87, 0 paire identique : **PANEL OK**.

## Captures
`captures/fld3-premier-ecran.png`, `fld3-page.png`, `fld3-fiche.png` (fiche courte à l'appui long), et l'autre houblon : `fld3-<houblon>.png` et `-page.png`.
Générateur : `fld3/gen.mjs` (socle commun : `fld1/socle.mjs`, captures : `fld1/captures.mjs`).
