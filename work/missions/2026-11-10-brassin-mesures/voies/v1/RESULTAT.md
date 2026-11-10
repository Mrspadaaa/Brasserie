OK — page de 10 mini maquettes sur z1, état « aucun relevé », PAGE OK

## Fichiers écrits (tous dans l'OWNS)
- `voies/v1/etat.html` — z1 repris tel quel (classes `vm-…`, L26), dix variantes ; `?v=m1…m10&moment=sacc|og&etat=repos|toucher|apres|raison&theme=cave`.
- `voies/v1/capturer.mjs` (captures 390 × 2 tactile, cave, 1280), `voies/v1/montage.mjs` (planches de contrôle dans `os.tmpdir()`), `voies/v1/page.cjs` (génère la page).
- `voies/v1/captures/*.png` (47 captures + 3 de verifier-page), `voies/v1/tests.txt`.
- `page/index.html` + `page/img/` (sa capture, z1 mesure, z1 ébullition, toutes les captures).

## Variantes (une idée chacune, le reste = z1)
| id | idée | axes |
|---|---|---|
| m2 | « Relevés du jour » présent à vide sous l'horloge, case « ? » par mesure attendue, cible et heure | invitation, après |
| m6 | La piste du palier : mesures en points sur la piste (comme les ajouts), liste « Mesures » à toucher | invitation, après |
| m8 | Suivi thermique réduit à la flèche de z1 « ? °C → 67 » ; montée et maintien sous ⌄ | renvoi (suivi réduit), invitation |
| m1 | « relevé — » devient un bouton « ? » dans l'horloge ; pH sur une ligne de l'horloge | invitation |
| m3 | Pied « Mesurer » avec le nombre attendu ; onglets attendus pointés dans la feuille | invitation (pied), renvoi |
| m4 | Ligne dans « À anticiper », bouton rond thermomètre (≠ case) ; faite, cochée avec sa valeur | invitation, après |
| m5 | La bande vide : cible dessinée au repos, « ? » dedans ; faite, trait dans la bande | invitation, après |
| m7 | La mesure due tient le bouton noir du pied ; puis « pH · dès 13 h 15 » en attente | renvoi, après |
| m9 | « à relever » souligné ; « Pourquoi maintenant ⌄ » replié dans la feuille, ouvert en deux lignes | renvoi (raison à un toucher) |
| m10 | Trois tuiles sous le temps : consigne 67 °C · relevé « ? » · pH à venir | invitation (A3 côte à côte), après |

Chaque toucher ouvre la feuille Mesurer de z1 sur l'onglet attendu (Temp.), cible en bande 66–68, champ vide (`type="text" inputmode="decimal"`), Enregistrer grisé tant que rien n'est saisi. Inconnu = « ? », jamais 0. Après le relevé, l'horloge dit « relevé 66,4 » et la carte « Relevés du jour » de z1 paraît ; le pH reste attendu (dès 13 h 15). Deuxième moment : Refroidissement, densité initiale (cible 1,062) et volume au fermenteur (24 L), même règle.
Données : palier de sa capture (LOT-016, 59:36, maintien 67 °C, Pilsner Malz 6,6 kg, flocons d'avoine 2 kg, fin 14 h 05) ; cible pH 5,2–5,5 et « 10 à 15 min après l'empâtage » repris de l'app (BrewDayMeasurements, aide du pH) ; OG 1,062 = exemple.

## Critère décisif
`node scripts/agents/verifier-page.mjs work/missions/2026-11-10-brassin-mesures/page/index.html --page-lot --captures work/missions/2026-11-10-brassin-mesures/voies/v1/captures/page`
→ `PAGE OK (55 images chargées, lisible à 390 et 1280 px, sans erreur)` (dans `tests.txt`). Tests : aucune suite vitest (rien dans `src/`).

## Captures
`voies/v1/captures/<v>-palier-repos-390.png`, `-palier-toucher-390`, `-palier-apres-390`, `-refroidi-repos-390` pour m1 à m10 ; `m9-palier-raison-390` ;
m2, m6, m8 : `-palier-repos-cave-390`, `-palier-toucher-cave-390`, `-palier-repos-1280`, `-palier-toucher-1280` ; page : `page-haut.png`, `page-page.png`, `page-ordinateur.png`.
Ouvertes : les 41 captures 390 clair (en planches de 4), m8 cave, m2 1280 toucher, page-ordinateur. Non ouvertes une à une : m2 et m6 cave, m6 et m8 1280, page-haut, page-page — à regarder par le critique.

## Limites connues
- Horloge à 390 : « maintien 67 °C » et le relevé passent sur deux lignes (comme dans sa capture), à cause des cinq boutons.
- Graduations de l'échelle de la feuille collées au bord de la bande (hérité de z1).
- m6 : la piste du palier a peu de points (2 mesures + fin) ; sa lisibilité à 12 px est à juger.
- m10 au refroidi : un cadre sans minuteur (tuiles seules) ; m1 au refroidi retombe sur « Relevés du jour ».

Prédiction : « m2 ou m8, c'est clair, je vois ce qu'il faut mesurer et je touche » ; il risque de trouver m3 et m9 trop discrets.

DÉCISION À PRENDRE : aucune (le brasseur choisit sur la page ; un mélange invitation + renvoi est possible, par ex. m2 + m7).
CONNAISSANCE : la cible du pH d'empâtage est 5,2–5,5 dans l'app (BrewDayMeasurements) contre 5,2–5,4 dans la maquette z1 ; à aligner au port.
LEÇON PROPOSÉE : aucune
