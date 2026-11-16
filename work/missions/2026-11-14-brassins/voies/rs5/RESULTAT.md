OK — s5a, s5b, s5c rhabillées à la trousse d'identité, 11 images refaites, IDENTITE OK 3/3

## Variantes
- [x] s5a : feuille de l'app (poignée, rayon 24, ×) posée sur la liste des brassins ; « Dry hop demain » en `id-display` 28/600 ; tuiles en panneaux 16 (densité neutre, °C cuve teinte `--water`, demain encadrée `--ebc-straw-bord` avec le seul bouton primaire « Ajouter ») ; 1,018 en `id-reading-grand` ; jauge à axe brisé, « stable ? = ? », consigne 19 → 21 → 2 gardées et recolorées ; geste = `id-curseur` m2 de la trousse (1,016, hier marqué, bande 1,014–1,010) ; 1280 : feuille 42rem, densité en large avec relevés, °C et demain côte à côte (les « autres cuves » de la v0 sont la liste sous le voile) · écart restant : chiffres à 28 px au lieu de 76, la tuile densité n'est plus noire (l'aplat d'affiche cède au panneau), « Citra + Mosaic · puis garde dès que stable » passe sur deux lignes.
- [x] s5b : feuille de l'app sur la liste ; deux carrés en panneaux (densité neutre, °C cuve `--water`), crans en `--hop`, consigne en `--attention` avec légende ; le grand cadran garde la réponse en `id-display`, bandeau `--hop`/14 %, cases de 44 px (cochée : aplat `--hop` + icône check) ; outils courbe/carnet/stock en `id-puce` ; « Quand ajouter ? » en `id-btn-secondaire` · écart restant : « OG 1,062 · FG visée 1,014–1,010 » passe sur deux lignes à 390.
- [x] s5c : écran de l'onglet (en-tête, sous-onglets Brassins, barre du bas, +) ; rail de cuverie aux teintes des pastilles d'état (hop, alert, water, cuivre) ; cadrans SVG recolorés par jetons (`style`, pas d'attribut) ; « À 0,004 de la bande » en `id-display` ; « Relever » seul primaire ; frise J0–J+11 en `--hop`/`--attention`/`--water` ; liste = cuverie en panneaux teintés ; geste = feuille de l'app « °C de la cuve » avec `id-curseur` (19,2, consigne repère, hier) · écart restant : ~170 px vides sous la frise au repos 390 (contenu plus court que la v0 depuis que les cases de jours passent à 64 px).

## Fichiers écrits
- `work/missions/2026-11-14-brassins/voies/s5/s5a/etat.html`, `s5b/etat.html`, `s5c/etat.html` (trousse par lien relatif `../../../outils/identite/`)
- `work/missions/2026-11-14-brassins/voies/s5/capture.mjs` : capture cave ajoutée à s5b et s5c (`repos-390-cave`)
- `work/missions/2026-11-14-brassins/voies/rs5/` : `assembler.mjs` (split/join, L26), `liste-fond.html` (liste de la démo de la trousse), `v0/` (copie des trois etat.html d'avant), `tests.txt`, ce fichier
- Bandes de familles : un seul élément en dégradé à arrêts francs (sinon 5 à 6 % d'éléments hors palette avec les pastilles de style de la liste de fond).

## Critères (sorties dans `tests.txt`)
- G1 : `IDENTITE OK 3/3`
- G2 : `RHABILLE OK`
- G3 : `HORS OK`
- Tests : aucune suite Vitest (rien dans `src/`).

## Captures (`work/missions/2026-11-14-brassins/voies/s5/`)
- Ouvertes : `s5a/s5a-repos-390-clair.png`, `s5a-geste-390-clair.png`, `s5a-repos-390-cave.png`, `s5a-repos-1280-clair.png` (avant le correctif de la colonne °C, voir plus bas), `s5b/s5b-geste-390-clair.png`, `s5c/s5c-repos-390-clair.png`.
- Refaites, non ouvertes (contexte à 150 k, consigne de VOIE) : `s5a/s5a-repos-1280-clair.png` après correctif (`.s5a-cons{align-self:stretch}` à ≥ 1024), `s5b/s5b-repos-390-clair.png`, `s5b-repos-390-cave.png`, `s5c/s5c-geste-390-clair.png`, `s5c-liste-390-clair.png`, `s5c-repos-390-cave.png`.
- Comparaison à l'app (`a1-banc/captures/fiche-fermentation-390-clair.png`) : même feuille (poignée, titre 14/600 + sous-titre 12, ×, voile flou sur l'en-tête), mêmes boutons et pastilles ; l'écart restant est la densité des tuiles (plus de données que la fiche réelle, voulu par l'idée).

## DEMANDE EXECUTANT
1. Ouvrir (Read) les 6 captures « non ouvertes » ci-dessus ; signaler tout débordement, texte coupé ou élément invisible en cave.
2. Si une retouche suit : `node work/missions/2026-11-14-brassins/voies/s5/capture.mjs <id>` puis les trois CHECK de `rs5/GATES.md` (attendu : `IDENTITE OK 3/3`, `RHABILLE OK`, `HORS OK`).

Prédiction : « Là oui, ça ressemble à l'app ; le 1,018 en grand me manque un peu, mais je lis tout de suite Dry hop demain. »

DÉCISION À PRENDRE : aucune (la NOTE.md de chaque variante décrit encore l'habillage v0 : à mettre à jour si le pilote la montre).
CONNAISSANCE : le contrôle d'identité compte les pastilles de style (`id-style[data-teinte]`) de la trousse comme hors palette ; une liste de fond sous une feuille plus des aplats de familles dépassent les 5 % ; un dégradé (fond calculé transparent) n'est pas compté.
LEÇON PROPOSÉE : aucune
