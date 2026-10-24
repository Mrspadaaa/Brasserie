# fld1 — rangées (g1 affinée)

- **Chaleur : froide** (son choix g1 affiné, rien d'autre).
- Houblon par défaut : Cascade (`etat.html`) ; autre état capturé : Nelson Sauvin. Les cinq houblons du brief : `h-<houblon>.html` (lien dans la légende « ? »).
- Question : « Que sent ce houblon, dit avec ses mots ? » ; facteur libre : la façon de dire ses mots ; houblon, fiche g1 et style 16D en contexte.

## Idée
La liste de g1 telle qu'il l'a vue (picto, famille, n/N, mots dessous), corrigée de ses quatre défauts : la famille ne redit plus son nom en mot (les familles « nommées seules » tiennent sur une ligne), « 1er » une seule fois, tout en français (mot d'origine dans la légende), et les mots hors des 12 prennent leur rang par nombre de fiches, au même poids qu'une famille.

## Ce qui tient
Nelson Sauvin ouvre sa liste sur « vin blanc², groseille à maquereau², raisin², fruité², sauvignon blanc » ; Agrumes et Épicé y sont dits « catégories déclarées par Hopsteiner, sans mot de dégustation ». La bande des 12 de g1 gagne une case grise « autres ».

## Ce qui casse
Reste une liste : peu de gain visuel face à g1 ; l'exposant ² se lit mal à 12 px.

## Baseline (plancher g1, règle n° 1)
Cadre g1 repris : feuille, nom et repère ⊙ (à la couleur du houblon), α en plage des fiches puis lot et jauge (« ≠ fiches » quand le lot sort de la plage), usage en mot, stock en petit badge, radar d'abord (D115) avec « n/N », « ? » hachurés et flèches de sa demande, « + Floral / − Résineux », ♡ ⊘ et « Comparer » en pied, croix de 44 px (icône 20 px, D109). Pictos au trait de la planche v3 (épicé : cannelle et clou croisés), couleurs des familles, au style par défaut et absolu à un toucher, légende derrière « ? », appui long (et survol long par zone, sur le nom) → fiche courte. Honnêteté : chaque mot vient de `pack-fiches.json`, traduit (« black currant » → cassis, « White wine » → vin blanc…), n/N = fiches qui le citent, catégories Hopsteiner distinguées des mots de dégustation, familles non décrites « ? », jamais zéro. Aucun écart à la baseline.

## Contrôles (joués le 24.10)
- `controle-commun.mjs … --page=etat.html --sans=mots` (série) : **COMMUN OK** (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende, parlant, brutes ; mots sauté par le brief).
- `mots-premier-ecran.mjs --sans-donnees --max=80` : 54 mots (hors données), MOTS OK.
- `controle-sans-famille.mjs` : Nelson Sauvin non montré au repos sur etat.html ; SANS-FAMILLE OK (série).
- `controle-une-question.mjs` : ECHEC, 2 fautes : « aucun sélecteur libre » (le facteur libre est la représentation, fixe dans un concept) et « pas de ligne de contexte » (le contexte est le cadre g1 et la bande de l'étape). Titre-question lu : oui.
- `controle-panel.mjs` (8 premiers écrans de la série) : remplissage médian 0,65, ressemblance 0,87, 0 paire identique : **PANEL OK**.

## Captures
`captures/fld1-premier-ecran.png`, `fld1-page.png`, `fld1-fiche.png` (fiche courte à l'appui long), et l'autre houblon : `fld1-<houblon>.png` et `-page.png`.
Générateur : `fld1/gen.mjs` (socle commun : `fld1/socle.mjs`, captures : `fld1/captures.mjs`).
