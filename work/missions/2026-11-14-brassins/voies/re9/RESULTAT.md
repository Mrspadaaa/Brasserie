OK — e9a à e9d rhabillées à l'identité de l'app, IDENTITE OK 4/4, 14 images refaites

## Variantes
- [x] e9a : sections en `id-puce`, cartes `id-carte` + `id-style`, piste d'avancement teintée (attention / hop, case courante pleine), bouton primaire de l'app, tarifs au curseur m2 de la trousse, marge en `id-reading-grand` · écart restant : une rangée de plus que l'app (Matériel ↗ + Réfléchir) sous les sous-onglets.
- [x] e9b : sa barre du bas propre devient une rangée de rubriques à icônes sous les sous-onglets (la barre du bas est celle de l'app) ; bandes en sémantique (cave-850, attention, hop, water), points en couleur EBC · écart restant : bandes pleines hop et water plus saturées que tout écran de l'app actuelle.
- [x] e9c : rubriques sur les jetons `--area-*` (production, finances, agenda), filtres en `id-puce`, feuille « Noter » = feuille de l'app (poignée, rayon 24, ×, pied), ticket de tarif recoloré, deux colonnes à 1280 · écart restant : la frise datée n'a pas d'équivalent dans l'app (composition propre gardée).
- [x] e9d : quadrants en hop / attention / cave, pastilles d'idée et bouteille en EBC, tuiles en `--area-*`, lectures en mono ≤ 28 px · écart restant : la carte carrée et la bouteille restent des objets neufs, hors vocabulaire de l'app (idée chaude gardée).

## Fichiers écrits
- `work/missions/2026-11-14-brassins/voies/e9/e9a|e9b|e9c|e9d/etat.html` (réécrits sur la trousse), `NOTE.md` (section « Rhabillage » ajoutée), PNG refaits par `capture.mjs` (noms inchangés) ; `voies/re9/tests.txt`, ce fichier. Copie d'avant : `%TEMP%/re9-e9-avant/`.

## Critères (sortie complète : `voies/re9/tests.txt`)
- G1 : `IDENTITE OK 4/4` (avant : `IDENTITE ECHEC 0/4`, tailles 29 à 34 px, graisses 800 et 900, couleurs hors jetons jusqu'à 25 %).
- G2 : `RHABILLE OK`.
- G3 : `HORS OK`.
- Tests : aucune suite Vitest (rien dans `src/`).

## Captures (ouvertes : e9a repos et tarifs, e9b repos, e9c planche repos / geste / tarifs / cave, e9d planche repos / geste / tarifs)
- `voies/e9/e9a/e9a-{repos,geste,tarifs}-390-clair.png` ; `e9b/e9b-{repos,geste,tarifs}-390-clair.png` ;
  `e9c/e9c-{repos,geste,tarifs}-390-clair.png`, `e9c-repos-390-cave.png`, `e9c-repos-1280-clair.png` ; `e9d/e9d-{repos,geste,tarifs}-390-clair.png`.
- Non ouvertes en plein format, faute de contexte (150 k) : e9a geste, e9b geste et tarifs, e9c 1280. `capture.mjs` signale « POLICE? » sur e9c et e9d (`document.fonts.check` du mono à froid) ; les images montrent bien Source Sans 3 et IBM Plex Mono.
- Comparé à `a1-banc/captures/liste-remplie-390-clair.png` (via la démo de la trousse) : même en-tête, mêmes sous-onglets, même barre du bas, mêmes cartes, mêmes pastilles.

Prédiction : « Là oui, ça ressemble à l'app » ; e9d pourrait encore lui sembler un objet à part.

DEMANDE EXECUTANT : ouvrir (Read) `e9a-geste-390-clair.png`, `e9b-geste-390-clair.png`, `e9b-tarifs-390-clair.png`, `e9c-repos-1280-clair.png` et signaler un débord, un texte illisible ou un contraste faible. Sur demande du pilote : captures cave et 1280 des e9a, e9b et e9d, dans `voies/re9/`, sans toucher à `capture.mjs`.

CONNAISSANCE : texte posé sur un accent plein (hop, water, attention, area) → `rgb(var(--cave-950))`, blanc en clair et sombre en cave, lisible dans les deux thèmes.
LEÇON PROPOSÉE : aucune
