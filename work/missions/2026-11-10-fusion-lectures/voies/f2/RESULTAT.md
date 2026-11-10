OK — bloquants 1, 2, 3, 4 corrigés côté serveur (nom voté, annoncés voté, triplet complété), 5 : filtre serveur du cache + cause client = déploiement

Worktree `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/epic-banach-4c4f89`, HEAD fd2bd816. Ni commit, ni stash, ni déploiement, aucun appel Gemini.

## Fichiers écrits
- `functions/src/invoiceScanVote.ts` (seul fichier de code touché) : `ligneDuNomMajoritaire` (vote du nom), `completerTriplet` (prix et unité), `printedLineCount` ajouté à la boucle `voterComptage` de `lectureFusionnee`, `rangsHorsPiece` + filtre dans `retireesParLaTroisieme`.
- `tests/unit/invoiceFusionF2.test.ts` (12 tests ; 5 rouges sur HEAD avant la correction, écrits d'abord : L13).
- Banc, `work/missions/2026-11-10-fusion-lectures/banc/` : `rejouer.ts` et `comparer.mjs` (6 critères neufs, voir plus bas) ; `noms.ts`, `finale.ts`, `perdus.ts`, `diff-noms.ts` (vues terminal, rien d'écrit ; `diff-noms.ts` demande une copie temporaire de HEAD, retirée).
- Dans `voies/f2/` : `avant-f2.json`, `apres-f2.json`, `comparaison.txt`, `tests.txt`, `tests-serveur.txt`, `tsc.txt`, `tsc-functions.txt`, `build.txt`.

## Ce qui a été fait, par bloquant
1. et 4. **Le nom est voté comme le montant** (`ligneDuNomMajoritaire`). Le nom des deux Flash-Lite remplace celui de la 3.8 seulement si : les deux lisent la ligne au montant retenu et s'accordent (ressemblance ≥ 0,6) ; le nom de la 3.8 ne ressemble à aucun des deux (< 0,5) ; et c'est le nom d'une ligne d'un AUTRE créneau lu par une Flash-Lite (preuve d'un glissement). Une 3.8 qui traduit ou complète un nom garde le sien ; trois lectures qui se contredisent : la 3.8 reste. Mesure sur les 141 tirages à trois lectures : 7 noms changent, tous dans doc24 t1 (b1-r1-t3), et les 7 sont justes contre la vérité (COLLE→CUTTER 2,40, CUTTER→APPRET 18,90, APPRET→TREROOYER 4,25, ETERE→CHANTILLES 6,50, CHANTLLES→METRE 7,90, METRE→GANTS 8,50, GANTS→OPSHGE 3,10). Aucun faux changement ailleurs.
2. **`printedLineCount` voté** par `voterComptage` (la 3.8 doit lire le même nombre qu'une autre lecture ; sinon absent). « annoncés 23 » ne sort plus d'une lecture seule.
3. **Triplet complété** (`completerTriplet`) : un prix nul de la 3.8 prend celui que deux lectures lisent (ou celui d'une seule qui tient quantité × prix = montant) ; une unité vide prend celle que les autres lectures lisent sans se contredire ; seules comptent les lectures de la même quantité. La valeur lue par la 3.8 reste la sienne ; deux unités contradictoires : l'unité reste vide (jamais devinée).
5. **Rabais total.** Serveur : `retireesParLaTroisieme` n'écrit plus au cache un total, un sous-total, un règlement ni un rabais global (somme d'au moins deux autres remises, à un centime) : même règle que `rangsHorsPiece` du client, portée dans `functions/` qui ne peut rien importer de `src/`. **Cause du pied du jeu 8, côté client : le jeu 8 tournait sur l'hébergement `ed9eb964`, qui n'a PAS `rangsHorsPiece`** (le commit 0a43b8d3, « DP-2 : lignes retirées sans sous-totaux », n'est pas ancêtre de `ed9eb964`). Dans le flux neuf, `finale.ts:296` filtre déjà ces lignes avec `rangsHorsPiece` sur `courant.lines` ; le pilote porte le client : redéployer l'hébergement depuis la branche, puis rejouer Sun Store au jeu 9. Le flux neuf n'a aucune liste serveur (les lignes perdues se déduisent côté client des rangs provisoires) : un correctif serveur ne peut pas le couvrir.

## Banc (217 tirages enregistrés, hors ligne, `rejouer.ts` ; avant = HEAD fd2bd816, après = voie)
Critères du mission (inchangés) : justes 3 269 → 3 269, quantités 3 037 → 3 037, totaux 208 → 208, faux verts 4 → 4, `sommeVerteFausse` 61 → 61, `pairesFausses` 16 → 16, retirées doublons 0 → 0. **Aucun recul** (`comparaison.txt` : 0 « RECUL »), aucun document en recul.
Critères neufs (leçon du critique : le final a-t-il perdu ou inventé quelque chose que les lectures avaient ?), tous à la baisse :

| critère | avant | après |
|---|---|---|
| `annonceSansMajorite` (nombre annoncé lu par une seule lecture) | 50 | 16 |
| `annonceFausse` (annoncé ≠ lignes de la vérité) | 91 | 59 |
| `prixPerdus` (prix nul alors qu'une lecture le lisait à ce montant) | 85 | 20 |
| `unitesPerdues` | 137 | 35 |
| `nomsContreMajorite` (nom étranger aux deux Flash-Lite, pris à une autre ligne) | 10 | 3 |
| `nomsDecales` (jugé sur la vérité) | 28 | 23 |
| `pairesNoms` (corrections barrées au nom d'une voisine) | 49 | 42 |

Pièces de la mission : Sun Store (doc26, 6 tirages) 7 lignes, total juste sur 5 tirages sur 6 comme avant ; doc27 17/17 ; doc24 (BAUHAUS) les totaux restent justes, l'écart reste rouge, aucun chiffre inventé.

## Contrôles
- `npx tsc --noEmit -p .` racine : 0 erreur ; `functions/` : 0 erreur (fichiers vides).
- `npx vitest run tests/unit/depense tests/unit/finance --reporter=dot > …/f2/tests.txt` : 223 fichiers passés, 1 sauté, **2 897 tests passés, 0 rouge** (`tests.txt`).
- Serveur et lecture : `tests/unit/invoice*`, `banc-lecture*`, `banc-noms*`, `financeInvoice` : 18 fichiers, **523 tests passés** (`tests-serveur.txt`). Les 12 rouges déjà sur HEAD sont hors de ces dossiers : je n'ai pas rejoué la suite complète (12 min) ; aucun fichier hors `invoiceScanVote.ts` n'a été touché, et les tests qui l'importent passent.
- `npm run build` : vert, DRAPEAUX OK (`build.txt`).
- Essais : un seul par critère ; un test faux de ma part corrigé (noms trop proches, trois lectures qui s'accordent en fait) et deux tests du rabais total qui ne déclenchaient pas la 3.8 (rendus non vides).

## Doutes et limites
- **Limite honnête, BAUHAUS doc24 t1 / t4** : quand les trois lectures décalent les noms différemment (aucune majorité), les 8 noms posés sur le montant voisin restent (le banc `doc24 t1` : la 3.8 a sauté le nom TREROOVER et tous les noms suivants glissent d'un rang ; la Flash-Lite 1 a les bons noms, la Flash-Lite 2 est décalée autrement). Le vote ne peut rien inventer ; seul un jeu où les deux Flash-Lite s'accordent (c'est celui du jeu 8 : le provisoire avait les bons noms) est corrigé. Le désaccord reste dit. Piste non faite : aligner les séquences de NOMS entre lectures (sans le montant) pour repérer le nom que la 3.8 a sauté ; c'est une deuxième étape, sur un module qui a déjà eu des rustines : à voir avec l'état de l'art avant (L29).
- Sur les 13 « corrections barrées » du jeu 8, par la vérité du banc : 8 étaient des noms faux de la 3.8 (corrigés par le vote quand les Flash-Lite s'accordent) et 5 étaient justes (la 3.8 a corrigé un nom que la Flash-Lite avait glissé : PINCEAU 3,40, ROBAN 4,50, COLLE 5,20, CUTTER 2,40, JEU DE CLES 8,90). Ces cinq barrés restent : ce sont de vraies corrections. Le constat « les barrés disent vrai pour les 13 » du critique est trop large.
- L'ordre des lignes finales du jeu 8 (PINCEAU en 2e, APPRET en 5e, avant TURBINE) est celui de la 3.8 (pivot). Pas touché.
- Pas de lecture Gemini réelle : le skill réserve la passe payante au pilote et le banc hors ligne mesure déjà les 217 tirages. Une lecture BAUHAUS neuve n'apporterait qu'un tirage de plus ; le vrai test est le jeu en ligne 9 après redéploiement.
- Les lectures du jeu 8 n'ont pas été enregistrées (seules les captures et les journaux de rangées) : le cas exact « Flash-Lite d'accord, 3.8 décalée » est reproduit par un test fictif et par doc24 t1 de `banc-b1-r1-t3`, pas par ses tirages.
- Sous 40 pièces par genre, les mesures sont un indice, pas une preuve.

DÉCISION À PRENDRE : redéployer l'hébergement depuis la branche (client avec `rangsHorsPiece`) avant le jeu 9, sinon le pied « Rabais total » reste au jeu 9. Recommandation : oui, avec l'aiTask de cette voie (un seul fichier serveur changé).
CONNAISSANCE : le jeu 8 de la mission fusion-lectures tournait sur un hébergement sans `rangsHorsPiece` (0a43b8d3 absent de `ed9eb964`) ; un constat de jeu en ligne se lit d'abord à la version servie.
LEÇON PROPOSÉE : un banc de fusion se juge à « le final a-t-il perdu ou inventé quelque chose que les lectures avaient ? » (prix, unité, nom, nombre annoncé), pas seulement aux montants au bon rang : les 6 critères neufs de `rejouer.ts` le font, et ont trouvé 85 prix et 137 unités perdus que les critères « justes ≥ production » laissaient verts.
