OK — e2a à e2d rhabillées en feuilles de l'app, IDENTITE OK 4/4, 32 images refaites

## Variantes
- [x] e2a : feuille de l'app sur la liste (voile), bloc-réponse teinté par état (water / hop / cuivre / or / gris, fond 13 %, bord 55 %), `id-display` 28/600, curseur m2 de la trousse, onglets Mesures / Carnet / Dossier, boutons et pastilles `id-`, pied de feuille · écart restant : quasi nul face à `fiche-fermentation-390-clair.png` ; le bloc-réponse teinté et la courbe épaisse restent les seuls ajouts visuels.
- [x] e2b : frise dans une feuille (Carnet et Dossier en boutons fantômes dans l'en-tête), rail aux couleurs des pastilles de l'app (production, hop, water, cuivre), bascules 52 × 32, puces `id-puce` au verdict · écart restant : la frise des jours (cases vertes à 44 px) et le titre en deux couleurs sont plus marqués que l'app.
- [x] e2c : cuve et contenants dans une feuille, pastille d'étape dans l'en-tête, acier en gris de jetons, bière `--ebc-gold`, Stout `--ebc-stout` · écart restant : le dessin de la cuve (120 px) reste un objet que l'app ne dessine nulle part ; 1280 : feuille de 42 rem à deux colonnes, plus serrée que la v0.
- [x] e2d : le verre devient le corps de la feuille (mousse = page, bière EBC), chiffres ramenés de 96 px à 28 px, pilules ramenées au rayon 10 · écart restant : le plus loin de l'app (fond doré plein, bulles) ; l'idée a perdu son chiffre géant, la couleur et les bulles la portent seules.

## Fichiers écrits
- `work/missions/2026-11-14-brassins/voies/e2/e2a|e2b|e2c|e2d/etat.html` (réécrits), `NOTE.md` (section « Rhabillage re2 » ajoutée), 32 PNG.
- `work/missions/2026-11-14-brassins/voies/e2/capture.mjs` : chaque variante ajoute `repos-390-cave`, `geste-390-cave` (e2c garde `conditionne-390-cave`) et `repos-1280-clair`.
- `work/missions/2026-11-14-brassins/voies/re2/tests.txt`, ce fichier. Originaux copiés dans `%TEMP%/re2-orig/`.

## Critères (sorties décisives, `tests.txt`)
- G1 : `IDENTITE OK 4/4`
- G2 : `RHABILLE OK`
- G3 : `HORS OK`
- Tests : aucune suite Vitest (rien dans `src/`).

## Captures
- `voies/e2/<id>/<id>-{repos,geste,conditionne,termine,annule}-390-clair.png`, `<id>-repos-390-cave.png`, `<id>-geste-390-cave.png` (e2c : `conditionne-390-cave`), `<id>-repos-1280-clair.png`.
- Ouvertes : e2a-repos-390-clair en plein format, à côté de l'app ; en planches (`%TEMP%/re2-m1.png`, `re2-m2.png`) : e2a geste, conditionne, repos cave ; e2b repos, geste, repos cave ; e2c repos, conditionne, repos cave ; e2d repos, conditionne, repos cave.
- Pas encore ouvertes (contexte à 170 k) : les états termine et annule des quatre, geste-390-cave et les 1280. Captures régénérées sans erreur de page ni débordement.

## Prédiction
« Là oui, ça ressemble à l'app » pour e2a et e2c ; pour e2d : « joli, mais ce n'est plus l'app ».

DEMANDE EXECUTANT : ouvrir (Read) les 19 captures non vues, listées ci-dessus, dans `work/missions/2026-11-14-brassins/voies/e2/<id>/`, puis signaler un débordement, un texte coupé ou un bouton masqué par le pied (attendu : aucun).

DÉCISION À PRENDRE : e2b, e2c et e2d étaient des fiches plein écran avec « Retour ». Je les ai posées en feuille, comme l'exige la consigne (« une fiche ou une saisie est une feuille de l'app »), avec Carnet et Dossier dans l'en-tête. La trousse permet aussi `data-sous="aucun"` (plein écran), si le pilote préfère garder leur forme.
Chiffre à vérifier sans y toucher : dans e2c (conditionné), l'OG de la Stout est 1,059, alors qu'e2a et e2d donnent 1,058.

CONNAISSANCE : un bloc d'état se rhabille à l'identité de l'app par un fond teinté à 13 % et un bord à 55 % de son jeton sémantique, comme l'encadré « Ajouts réservés » de l'app, plutôt qu'en aplat plein avec du texte blanc.
LEÇON PROPOSÉE : aucune
