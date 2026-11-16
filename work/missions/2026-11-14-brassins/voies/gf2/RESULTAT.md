OK — gfa, gfc, gfd corrigées : trois genres nets (empiler, relier, ouvrir à côté), 12 images

## Points
- [x] gfa n° 1 : DO 1,062 à J+0, visible à 390 (graphe J+0…J+10, 11 colonnes)
- [x] gfa n° 2 : °C cuve jour par jour sous la courbe (19,3 · 19,6 · 19,4 · 19,1 ; auj. « non mesurée », cercle pointillé), consigne en pointillé 19 → 21 → 2 ; FG stable « 2 relevés égaux ○=○ → » à J+8–J+9
- [x] gfa n° 3 : « α du lot non saisi » remplace la plage du catalogue (aucun α de lot dans les données)
- [x] gfa n° 4 : à 1280, bande °C cuve sous le graphe ; colonne droite : houblons puis tâches J+7 et J+10, sans vide
- [x] gfa n° 5 : « Quand ajouter ? » et la ligne « Dry hop · J+6 » retirés ; date dite une fois ; « cuve — » → « °C cuve auj. non mesurée »
- [x] gfc n° 7 : DO 1,062 à J+0, °C cuve jour par jour, ○=○ dans le graphe ; α du lot ; « Quand ajouter ? » et « J+6 » des cartes retirés ; bande °C portée à 70 px, « consigne » posé à J+8 sous le trait (plus de chevauchement avec « auj. non mesurée ») ; pied ramené à « densité · °C cuve » (non mesurée dit une fois, dans le graphe)
- [x] gfc n° 8 : colonne « aujourd'hui » cernée en pointillé et légendée « auj. » en tête, sans aplat (la bande FG garde seule le vert)
- [x] gfd n° 9 : refaite en « ouvrir le jour à côté » : graphe entier à gauche (≈ 212 px à 390, J+0…J+10 à pas constant), la colonne J+6, son onglet et le panneau droit forment une seule forme or (« J+6 dim. 15.11 », Citra et Mosaic empilés) ; la prévision J+6 → J+10, ○=○ et l'arrivée dans la bande FG restent à découvert ; DO, °C cuve en quinconce, α du lot ; « Quand ajouter ? » retiré
- [x] gfd n° 10 : geste « après Citra coché » : carte bordée de vert, « 14.11 », bouton vert « −100 g au stock », arômes et α gardés ; Mosaic garde « Ajouté auj. » ; titre « Citra ajouté, Mosaic demain » ; pastille verte sur l'axe à auj.
- [x] gfd n° 11 : axe à pas constant (vu sur la capture) ; la ligne « Écart assumé : l'axe n'est pas à pas constant… » retirée de NOTE.md
- [x] notes : NOTE.md des trois réécrites : Chaleur, Idée, Ce qui change (≤ 15 mots), Geste (gfa « après "Mesurer" », gfc et gfd « après Citra coché ») ; plages α et « Quand ajouter ? » retirées (sauf la mention « retiré »)

## Fichiers écrits
- `work/missions/2026-11-14-brassins/voies/gf/gfc/etat.html` et ses 4 PNG ; `work/missions/2026-11-14-brassins/voies/gf/gfd/etat.html` (réécrit) et ses 4 PNG ; `gfa/`, `gfc/`, `gfd/` `NOTE.md` ; `gf2/tests.txt`.
- gfa/etat.html et ses PNG : inchangés depuis la passe précédente (déjà corrigés, images vues).
- Générateur gfd (hors dépôt) : scratchpad `gf2-gfd-gen.cjs`, `gf2-gfd.css`, `gf2-gfd.js` ; ancien gfd copié en `gf2-gfd-ancien.html`.

## Critères (sortie dans `gf2/tests.txt`)
G1 COCHE OK · G2 IMAGES OK · G3 IDENTITE OK 3/3 · G4 NOTE OK 3 (voir tests.txt). Tests : aucune suite Vitest (rien dans `src/`).

## Captures (toutes ouvertes)
- `work/missions/2026-11-14-brassins/voies/gf/gfa/gfa-{repos-390-clair,geste-390-clair,repos-390-cave,repos-1280-clair}.png`
- `work/missions/2026-11-14-brassins/voies/gf/gfc/gfc-{repos-390-clair,geste-390-clair,repos-390-cave,repos-1280-clair}.png`
- `work/missions/2026-11-14-brassins/voies/gf/gfd/gfd-{repos-390-clair,geste-390-clair,repos-390-cave,repos-1280-clair}.png`

## Risques ouverts
- gfd en cave : la pastille « 14 » (auj., paille) et « 15 » (J+6, or) sont proches de teinte ; distinctes par la forme (cadre pointillé d'auj., colonne or de J+6), pas par la couleur seule.
- gfd à 390 : graphe étroit (≈ 18 px par jour) ; les dates du mois remplacent les J+n sous chaque jour (J+0 et J+10 aux bouts).
- gfc à 1280 : tâches J+7 et J+10 sous le pli (non demandé pour gfc).

Prédiction du brasseur : « gfd, là je vois mon graph en entier et le dry hop à côté, ok ; les trois se distinguent. »
CONNAISSANCE : l'α du lot réservé n'est pas dans les données communes des maquettes Brassins (BRIEF-AUTEUR, DONNEES-COMMUNES).
LEÇON PROPOSÉE : aucune
