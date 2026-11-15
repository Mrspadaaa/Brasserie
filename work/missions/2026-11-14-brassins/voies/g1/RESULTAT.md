OK — 5 bloquants k1 corrigés, images régénérées ; G3 KO : DEFAUTS-RECURRENTS modifié avant g1

## Bloquants
- [x] e2c n° 1 : courbe Densité du 1280 redessinée à l'échelle (viewBox 300 × 180, étiquettes 12 px, courbe plus haute) ; dates et 1,010 lisibles.
- [x] e2d n° 1 : fond de feuille de l'app ; couleur de bière seulement dans le verre (bulles) et les contenants ; boutons, puces, pastilles de la trousse (glisser aux couleurs du bouton principal, noir en clair, jaune en cave).
- [x] e2d n° 2 : annulée : verre plein gris (220 px au lieu de 60 % d'écran), sans pointillés.
- [x] e4b n° 1 : geste : cuve F3 vide, fond de lie sans chiffre ; « pertes 2 L depuis les 24 L brassés · F3 vide » dans le résumé sous le titre.
- [x] e4d n° 1 : fond de feuille de l'app (aplats beige, taupe, brun retirés) ; bon de tirage en carte blanche bordée ; tampon gardé.

## Non bloquants faits
- e2c n° 2 (« − » côté 1,000), n° 3 (cadres pleins pâles), n° 4 (trait rouge dans la cuve).
- e2d n° 3 (boutons centrés), n° 4 (OG Stout 1,059 → 5,9 % juste), n° 5 (vides retirés), n° 6 (« cuve — · consigne 2 °C »).
- e4b n° 2 (piste neutre, repère « max 66 »), n° 3 (pointillés et hachures → pleins), n° 4 (« Tirée : 22 L »).
- e4d n° 2 (casse de phrase), n° 3 (piste neutre, « 66 max »), n° 4 (traits pleins), n° 5 (« 6 × 33 cl », « 2 L », « 20 L », « 22 L »), n° 6 (« Revenir en garde ? »), n° 7 (1280 et geste cave ajoutés à capture.mjs).
- Non fait : le mono dans les phrases (commun, non bloquant) reste, faute de règle d'une ligne sûre sur toutes les variantes.

## Fichiers écrits
- `voies/e2/e2c/etat.html`, `voies/e2/e2d/etat.html`, `voies/e4/e4b/etat.html`, `voies/e4/e4d/etat.html`, `voies/e4/capture.mjs` (plan e4d : + geste-390-cave, repos-1280-clair), les 4 NOTE.md (section « Corrections g1 »), PNG régénérés.
- `voies/g1/RESULTAT.md`, `voies/g1/tests.txt`.

## Sorties décisives
- `controle-identite.mjs voies/e2 voies/e4` : IDENTITE OK 8/8.
- G1 COCHE OK 5 ; G2 IMAGES OK ; G3 HORS KO : seul `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` sort de la mission ; il était déjà modifié au début de la voie (git status de départ), g1 n'y a pas écrit. Sorties dans `tests.txt`.

DÉCISION À PRENDRE : committer ou rendre au pilote le changement en cours de DEFAUTS-RECURRENTS.md (hors voie) ; G3 passe ensuite.

## Captures (toutes ouvertes, planches contact comprises)
- e2c : `voies/e2/e2c/e2c-{repos,geste,conditionne,termine,annule}-390-clair.png`, `-repos-390-cave`, `-conditionne-390-cave`, `-repos-1280-clair`.
- e2d : `voies/e2/e2d/e2d-{repos,geste,conditionne,termine,annule}-390-clair.png`, `-repos-390-cave`, `-geste-390-cave`, `-repos-1280-clair`.
- e4b : `voies/e4/e4b/e4b-{repos,geste,retour}-390-clair.png`, `-repos-390-cave`, `-repos-1280-clair`.
- e4d : `voies/e4/e4d/e4d-{repos,geste,retour}-390-clair.png`, `-repos-390-cave`, `-geste-390-cave`, `-repos-1280-clair`.

Prédiction : « Là ça ressemble à l'app ; le verre de bulles et le bon tamponné se lisent tout de suite. »

Tests : aucune suite Vitest (rien dans `src/`) ; sortie des CHECK dans `tests.txt`.

CONNAISSANCE : un SVG en viewBox large rendu dans une colonne étroite divise ses polices (760 → 300 px : 16 px devient 6 px) ; dimensionner la viewBox à la largeur rendue.
LEÇON PROPOSÉE : aucune
