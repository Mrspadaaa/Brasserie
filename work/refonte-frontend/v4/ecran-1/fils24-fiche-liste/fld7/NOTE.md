# fld7 — cible

- **Chaleur : chaude** (forme libre).
- Houblon par défaut : Nugget (`etat.html`) ; autre état capturé : Citra cryo (et l'absolu de Nugget). Les cinq houblons du brief : `h-<houblon>.html` (lien dans la légende « ? »).
- Question : « Que sent ce houblon, dit avec ses mots ? » ; facteur libre : la façon de dire ses mots ; houblon, fiche g1 et style 16D en contexte.

## Idée
Ses mots tombent sur une cible face au style de sa bière : centre, ce que le 16D attend (floral, herbacé, terreux, BJCP) ; autour, ce qu'il n'attend pas ; bord sombre, ce dont le style ne dit rien (hors des 12, « ? »). Absolu : la cible se range par fiches qui citent (centre : toutes ses fiches).

## Ce qui tient
Le seul concept où « au style » change la forme : Nugget, son houblon de stout, met géranium, floral, herbacé, terreux au centre ; Citra cryo n'y met que « floral ». Le geste au style / absolu se voit.

## Ce qui casse
La place autour d'un anneau ne veut rien dire ; la cible prend une hauteur d'écran sous le radar.

## Baseline (plancher g1, règle n° 1)
Cadre g1 repris : feuille, nom et repère ⊙ (à la couleur du houblon), α en plage des fiches puis lot et jauge (« ≠ fiches » quand le lot sort de la plage), usage en mot, stock en petit badge, radar d'abord (D115) avec « n/N », « ? » hachurés et flèches de sa demande, « + Floral / − Résineux », ♡ ⊘ et « Comparer » en pied, croix de 44 px (icône 20 px, D109). Pictos au trait de la planche v3 (épicé : cannelle et clou croisés), couleurs des familles, au style par défaut et absolu à un toucher, légende derrière « ? », appui long (et survol long par zone, sur le nom) → fiche courte. Honnêteté : chaque mot vient de `pack-fiches.json`, traduit (« black currant » → cassis, « White wine » → vin blanc…), n/N = fiches qui le citent, catégories Hopsteiner distinguées des mots de dégustation, familles non décrites « ? », jamais zéro. Aucun écart à la baseline.

## Contrôles (joués le 24.10)
- `controle-commun.mjs … --page=etat.html --sans=mots` (série) : **COMMUN OK** (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende, parlant, brutes ; mots sauté par le brief).
- `mots-premier-ecran.mjs --sans-donnees --max=80` : 70 mots (hors données), MOTS OK.
- `controle-sans-famille.mjs` : Nelson Sauvin non montré au repos sur etat.html ; SANS-FAMILLE OK (série).
- `controle-une-question.mjs` : ECHEC, 2 fautes : « aucun sélecteur libre » (le facteur libre est la représentation, fixe dans un concept) et « pas de ligne de contexte » (le contexte est le cadre g1 et la bande de l'étape). Titre-question lu : oui.
- `controle-panel.mjs` (8 premiers écrans de la série) : remplissage médian 0,65, ressemblance 0,87, 0 paire identique : **PANEL OK**.

## Captures
`captures/fld7-premier-ecran.png`, `fld7-page.png`, `fld7-fiche.png` (fiche courte à l'appui long), `fld7-absolu.png`, et l'autre houblon : `fld7-<houblon>.png` et `-page.png`.
Générateur : `fld7/gen.mjs` (socle commun : `fld1/socle.mjs`, captures : `fld1/captures.mjs`).
