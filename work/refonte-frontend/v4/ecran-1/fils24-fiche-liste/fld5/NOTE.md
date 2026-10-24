# fld5 — carte

- **Chaleur : tiède** (forme imposée par la série d : une représentation distincte).
- Houblon par défaut : Citra cryo (`etat.html`) ; autre état capturé : Nelson Sauvin (et Nugget). Les cinq houblons du brief : `h-<houblon>.html` (lien dans la légende « ? »).
- Question : « Que sent ce houblon, dit avec ses mots ? » ; facteur libre : la façon de dire ses mots ; houblon, fiche g1 et style 16D en contexte.

## Idée
Le radar devient la carte : chaque famille citée porte ses mots en légende au bout de son axe, avec son picto ; les mots que le radar ne sait pas dessiner ont leur territoire « Hors carte » (bloc gris foncé), sous la roue, au même corps.

## Ce qui tient
Une seule figure : la forme et ses mots se lisent ensemble ; Citra cryo, Nugget : chaque pointe dit ce qu'elle contient. Nelson Sauvin : deux pointes « catégorie » et tout le reste hors carte.

## Ce qui casse
Rayon du radar réduit (environ 78 px au lieu de 115) pour loger les mots autour : écart à g1 assumé, raison : les mots sur la carte. Collisions possibles quand trois familles voisines sont citées (Nugget, côté gauche).

## Baseline (plancher g1, règle n° 1)
Cadre g1 repris : feuille, nom et repère ⊙ (à la couleur du houblon), α en plage des fiches puis lot et jauge (« ≠ fiches » quand le lot sort de la plage), usage en mot, stock en petit badge, radar d'abord (D115) avec « n/N », « ? » hachurés et flèches de sa demande, « + Floral / − Résineux », ♡ ⊘ et « Comparer » en pied, croix de 44 px (icône 20 px, D109). Pictos au trait de la planche v3 (épicé : cannelle et clou croisés), couleurs des familles, au style par défaut et absolu à un toucher, légende derrière « ? », appui long (et survol long par zone, sur le nom) → fiche courte. Honnêteté : chaque mot vient de `pack-fiches.json`, traduit (« black currant » → cassis, « White wine » → vin blanc…), n/N = fiches qui le citent, catégories Hopsteiner distinguées des mots de dégustation, familles non décrites « ? », jamais zéro. Aucun écart à la baseline, sauf la taille du radar (voir « Ce qui casse »).

## Contrôles (joués le 24.10)
- `controle-commun.mjs … --page=etat.html --sans=mots` (série) : **COMMUN OK** (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende, parlant, brutes ; mots sauté par le brief).
- `mots-premier-ecran.mjs --sans-donnees --max=80` : 72 mots (hors données), MOTS OK.
- `controle-sans-famille.mjs` : Nelson Sauvin non montré au repos sur etat.html ; SANS-FAMILLE OK (série).
- `controle-une-question.mjs` : ECHEC, 2 fautes : « aucun sélecteur libre » (le facteur libre est la représentation, fixe dans un concept) et « pas de ligne de contexte » (le contexte est le cadre g1 et la bande de l'étape). Titre-question lu : oui.
- `controle-panel.mjs` (8 premiers écrans de la série) : remplissage médian 0,65, ressemblance 0,87, 0 paire identique : **PANEL OK**.

## Captures
`captures/fld5-premier-ecran.png`, `fld5-page.png`, `fld5-fiche.png` (fiche courte à l'appui long), et l'autre houblon : `fld5-<houblon>.png` et `-page.png`.
Générateur : `fld5/gen.mjs` (socle commun : `fld1/socle.mjs`, captures : `fld1/captures.mjs`).
