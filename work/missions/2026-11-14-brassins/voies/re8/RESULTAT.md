OK — e8a à e8d rhabillées à l'identité de l'app, 18 captures refaites

## Variantes
- [x] e8a : trousse et chrome de l'onglet (Recettes active) ; jetons ; phrase en id-display 28/600 ; noms en id-title ; lots en pastilles d'état de l'app ; filtres id-puce ; Comparer id-btn ; comparer en feuille de l'app ; « + Recette » remplacé par le + de l'app · écart restant : carte plus haute que la carte de brassin (jauges et houblons en plus, voulu) ; « 24 L » en mono un peu espacé.
- [x] e8b : chrome et ligne d'outils de l'app (« 5 recettes · 10 lots », loupe, Comparer) ; bandeau noir de la Saison devenu id-panneau, « Rebrasser » primaire ; frise, historique OG → FG et haltères recolorés en jetons · écart restant : la frise (rangs à pastille ronde, ligne d'aujourd'hui rouge) reste un genre absent de l'app ; étiquettes des haltères collées aux points, comme avant.
- [x] e8c : chrome de l'onglet ; question en id-display (36/900 avant) ; cases du duel en pointillé de l'app, VS et numéros en paille ; tuiles en EBC (rayon 16, noms 18/600, alcool mono 24/600), état en id-pastille, tri en id-segments ; « Nouvelle recette » en tuile pointillée ; papillon posé dans une feuille de l'app · écart restant : les tuiles restent des aplats de couleur pleins, plus vifs que les cartes de l'app (c'est l'idée) ; Pils en or à 50 % sur blanc.
- [x] e8d : chrome de l'onglet ; comptoir de bois devenu id-panneau, verres à l'encre du thème ; recette servie en panneau EBC rayon 16 (nom 76/900 devenu 28/600) ; tickets sur la surface du thème ; corde dans une feuille de l'app · écart restant : « Rebrasser » en encre fixe sur l'or (la paille se perdait en cave), seul primaire hors paille ; à l'état geste, les pastilles 1 et 2 frôlent « Le comptoir ».

## Fichiers écrits
- `work/missions/2026-11-14-brassins/voies/e8/e8{a,b,c,d}/etat.html` (réécrits), `e8{a,b,c,d}/NOTE.md` (section « Rhabillage à l'identité (re8, 15.11) »).
- `work/missions/2026-11-14-brassins/voies/e8/capture.mjs` (plan complété d'un `repos-390-cave` pour e8a, e8c, e8d).
- `work/missions/2026-11-14-brassins/voies/re8/tests.txt`, ce fichier.

## Critères (sortie dans tests.txt)
- G1 : `IDENTITE OK 4/4`.
- G2 : `RHABILLE OK`.
- G3 : `HORS OK`.
- Tests : aucune suite Vitest (rien dans `src/`).
- Captures : 8 PNG e8c/e8d sans `DEBORD` ni `ERREUR`.

## Captures (toutes ouvertes)
- e8a : `voies/e8/e8a/e8a-repos-390-clair.png`, `-geste-390-clair`, `-comparer-390-clair`, `-vide-390-clair`, `-repos-390-cave`.
- e8b : `voies/e8/e8b/e8b-repos-390-clair.png`, `-geste-390-clair`, `-comparer-390-clair`, `-repos-390-cave`, `-repos-1280-clair`.
- e8c : `voies/e8/e8c/e8c-repos-390-clair.png`, `-geste-390-clair`, `-comparer-390-clair`, `-repos-390-cave`.
- e8d : `voies/e8/e8d/e8d-repos-390-clair.png`, `-geste-390-clair`, `-comparer-390-clair`, `-repos-390-cave`.
- Comparées à `a1-banc/captures/liste-remplie-390-clair.png` : même en-tête, mêmes sous-onglets, même barre du bas et même +, même encre, mêmes pastilles ; feuilles avec la poignée, le titre et la croix de l'app.

Prédiction : « Là ça ressemble à l'app » ; il jugera e8c et e8d sur leur idée (duel, comptoir), plus sur l'habillage.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : la trousse ne fournit pas d'encre pour distinguer deux bières pâles (NEIPA et Pils tombent toutes deux en `--ebc-gold`) ; la Pils prend gold à 50 %, posé sur blanc pour rester pâle en cave. Sur un aplat de bière, la paille de l'action (`--ebc-straw` en cave) se confond avec l'or : l'encre fixe 17/17/17 y tient mieux.
LEÇON PROPOSÉE : aucune.
