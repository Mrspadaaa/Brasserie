OK — M : 10 passés de KO à OK, 3 encore KO ; existants : 122 OK, 4 KO

Mécanique seulement, aucun jugement d'écran. Banc : copie `C:/Users/mrspa/AppData/Local/Temp/deploy-hosting-qr` détachée sur 60a8c25f (HEAD vérifié), `scripts/g-banc.mjs` identique à `scripts/check-invoice-journey-emulator.mjs` du worktree. Manifeste fabriqué hors Git : `C:/Users/mrspa/AppData/Local/Temp/bauhaus-0211/rejeu-bauhaus.json`.

## Fichiers écrits
- `work/missions/2026-10-31-ecran-depense/voies/g6-rejeu/RESULTAT.md` (ce fichier)
- Dans la copie de banc (sorties du banc, hors Git du worktree) : `deploy-hosting-qr/work/missions/2026-10-31-ecran-depense/voies/g1-audit/apres-A`, `apres-B`, `apres-C`, `apres-D`, `apres-G1` à `apres-G4` ; `bilan-g.txt` (lignes apres ajoutées)
- Hors de ma voie, par le mode d'emploi : `work/missions/2026-10-31-ecran-depense/voies/g1-audit/groupes-fin-apres.txt` (worktree)
- Résumés : `C:/Users/mrspa/AppData/Local/Temp/bauhaus-0211/resume-avant.txt`, `resume-apres.txt`

## Tableau M1 à M13 (total des verdicts, toutes mesures × cas × largeurs × thèmes)
| M | avant OK/KO | après OK/KO |
|---|---|---|
| M1 | 0/8 | 0/8 |
| M2 | 4/4 | 8/0 |
| M3 | 0/8 | 8/0 |
| M4 | 24/16 | 40/0 |
| M5 | 60/32 | 60/12 |
| M6 | 38/18 | 36/0 |
| M7 | 4/4 | 8/0 |
| M8 | 0/28 | 16/0 |
| M9 | 0/4 | 4/0 |
| M10 | 8/8 | 16/0 |
| M11 | 0/4 | 0/4 |
| M12 | 0/4 | 4/0 |
| M13 | 20/20 | 40/0 |

Passés de KO à OK entièrement : M2, M3, M4, M6, M7, M8, M9, M10, M12, M13 (10). Encore KO : M1 (g-repos, g-brassage : 8 KO, inchangé), M11 (g-remplir : 4 KO, inchangé), M5 (32 KO → 12 KO, partiel). Les totaux avant et après ne portent pas sur les mêmes cas (avant partiel, autres groupes) : à comparer groupe par groupe.

## Groupes g (390 et 1280, clair et sombre)
| groupe | avant OK/KO | après OK/KO | statut |
|---|---|---|---|
| G1 (g-repos, g-puces) | 20/58 | 40/6 | exit 1, pas de garde |
| G2 (g-plier, g-plateaux) | 68/30 | 98/0 | exit 0 |
| G3 (g-remplir, g-regrouper) | 10/12 | 10/4 | exit 1, pas de garde |
| G4 (g-brassage) | 72/58 | 104/14 | exit 1, pas de garde |

KO après : G1 = M1 g-repos (4) + M5 g-puces sombre (2). G3 = M11 g-remplir (4). G4 = M1 g-brassage (4) + M5 g-brassage (10).

## Cas existants (A à D)
| groupe | après OK/KO | base (b3ab392e) |
|---|---|---|
| A (etats, doublon, doc5, finances, doc6) | 48/2 | 48/2 |
| B (autre-numero, rattacher, minuscules, doc1) | 10/0 | 10/0 |
| C (doc4, hors-ligne, doc3, doc2) | 14/0 | 14/0 |
| D (doc14) | 50/2 | 50/2 |

KO existants (inchangés par rapport à la base) : A « Même achat » ne crée ni dépense ni écriture (390 et 1280, doc6) ; D aucune pastille TVA sur une TVA juste par taux (390 et 1280, doc14 c).
E (drive-fond) non lancé, voir Doutes.

## Groupes arrêtés
Aucun. Aucune garde mémoire (`GARDE MÉMOIRE`) ni `ARRÊT` dans les journaux ; aucun groupe n'a été relancé.

## Chemins des captures « après » (dossiers ; `find <dossier> -name '*.png'` donne la liste)
- `C:/Users/mrspa/AppData/Local/Temp/deploy-hosting-qr/work/missions/2026-10-31-ecran-depense/voies/g1-audit/apres-A/` (42 png)
- `…/g1-audit/apres-B/` (26 png)
- `…/g1-audit/apres-C/` (16 png)
- `…/g1-audit/apres-D/` (20 png)
- `…/g1-audit/apres-G1/` (14 png)
- `…/g1-audit/apres-G2/` (40 png)
- `…/g1-audit/apres-G3/` (12 png)
- `…/g1-audit/apres-G4/` (54 png)

Aucune capture n'a été ouverte ici (L12) : le pilote juge les pièces.

## Doutes et limites
- GATES.md absent du dossier de la voie : seules les étapes de VOIE.md ont servi de critères.
- Étape 4 : `groupes-existants.sh` enchaîne aussi le groupe E (drive-fond), que VOIE.md exclut. Les groupes A à D ont été lancés un à un par `lancer-g.sh`, avec les mêmes arguments que le script.
- `groupes-fin-apres.txt` est écrit dans le worktree (`g1-audit/`) par le mode d'emploi, hors de mon périmètre.
- Les `bilan-g.txt` contiennent aussi des lignes `base-*` et `essai-g*` antérieures : seules les lignes `apres` ont été lues.
- Le résumé `resumer-mesures.mjs` ne distingue pas les cas absents des cas KO ; les totaux du tableau ont été additionnés depuis sa sortie.
- M1 et M11 restent KO sur la version corrigée, et M5 reste partiel : à juger par le pilote avant toute suite.
- Le plancher mémoire et le `bilan-g.txt` du banc ont tourné à 5,1 à 5,9 Go libres ; pas de garde déclenchée.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : avant de lancer un script de lot, lire la liste des groupes qu'il enchaîne : `groupes-existants.sh` inclut E (drive-fond) alors que la voie le déclarait hors périmètre ; lancer les groupes un à un avec les mêmes arguments.
