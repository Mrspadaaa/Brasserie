OK — 119 défauts jugés : 39 gardés, 69 à adapter, 6 caducs, 5 jury ; D4 et D69 ne tournent plus, D94 échoue.

## Fichiers écrits
- `work/refonte-frontend/v4/tournoi/outils/portee-defauts.json` (119 entrées, une par ligne D de DEFAUTS-COURT, champs du contrat + `script` en plus pour regrouper).
- `work/missions/2026-10-22-systeme-agents/voies/a1-audit-defauts/AUDIT.md` (bilan, 8 constats, `## À adapter` en 7 groupes, `## Caducs`, `## Portée par sujet` pour les 14 mots + jeux par type de voie).
- Fichiers de travail, hors dépôt : `C:\Users\mrspa\AppData\Local\Temp\claude\C--Users-mrspa--codex-worktrees-openai-clean-start-Brasserie\01f603d2-0856-450c-8222-d9df700d1e73\scratchpad\a1\` (harnais.mjs, generer.mjs, audit.mjs, résultats bruts `phase1.json`, `resultats.json`, `base-*.txt`). Aucun script de contrôle modifié ; `capture.mjs`, `jouer-boosters.mjs` et `controle-lot.mjs` n'ont été joués que sur une copie dans le scratchpad (ils écrivent `captures/` dans le dossier joué).

## Critères
- G1 : `PORTEE COMPLETE 119`.
- G2 : `CHAMPS OK 119`.
- G3 : `NOTE OK`.
- G4 : `JUGES OK`. D4 : `non` (controle-lot ne lit pas le format ; copie : remplissage 0,91 / 0,85 / 0,95 par boîtes, mais 0,70 / 0,57 / 0,66 en pixels avec controle-panel). D69 : `non` (controle-rail : « RAIL OK 0/0 » sur les pages actuelles, « aucune ligne de houblon repérable » sur copie ; RAIL OK 1/1 seulement sur la base consolide, 83 s). D94 : `oui`, LISIBLE ECHEC sur les trois pages (Comparer L5, Dryhopper L2, baseline L4).
- Essais : un par critère.

## Constats décisifs
1. **9 scripts impriment « OK 0/0 » (code 0) sur un dossier au format actuel** (coherence, comparer, detail, objets, palette, radar, rail, recette, suggestions) : faux vert, 51 lignes D. Joués sur la base consolide v4.10 (`ecran-1/base consolide`) ils sont corrects : rail, recette, radar, détail, comparer, objets, palette, cohérence OK 1/1.
2. **D4 est mesuré trop large.** Seuil 0,80 en boîtes d'éléments (`capture.mjs`) : g1 0,85. En pixels (`controle-panel`, étalonné sur le lot 21 / lot 23) : g1 0,57. Un écran à moitié vide peut passer 0,80. `controle-panel` tourne déjà sur le format actuel (PANEL OK sur les trois captures, médiane 0,66).
3. **Quatre défauts gardés échouent déjà sur les pages actuelles** : D93 (fiche-baseline), D94 (lisible), D95 (simulation), D96 (cumul, levure, biotransformation). Aucun GATES de `work/missions/*/voies/` ne cite controle-lisible, controle-simulation, controle-cumul-levure ni controle-fiche-baseline (0 occurrence, grep).
4. **Plafond de mots : 70 dans `controle-commun`, 80 dans D1 et la spec.** Comparer (79) et Dryhopper (77) échouent le premier, passent le second.
5. D2 : Dryhopper g1 a 5 tailles de texte (12, 13, 14, 17, 20 px), DESIGN.md en permet 3. D8 `check-spec` est rouge (260/264 citations).

## Doutes et limites
- `tourne` suit la consigne (pages actuelles listées). Les scripts d'ancien format qui passent sur la base consolide sont notés `non` / `a-adapter` avec ce résultat dans `resultat` ; ils gardent la base, pas les écrans d'outil.
- « Portée » est mon jugement d'après les mots du défaut ; plusieurs `verdict: garde` ont ECHEC hors de leur portée (D76, D78, D80, D84, D92, D98, D99, D100, D104 sur les pages sans voies, sans objectifs ou sans NOTE) : voir le rappel de lecture dans AUDIT.md.
- D26 mis en `caduc` (« identique hors composant » contredit L07 et SPEC § 0) : jugement du pilote à confirmer ; sinon `a-adapter`.
- D52 et D52 bis mis en `caduc` d'après D52 bis lui-même (« sans s'appliquer à la base v4.10 »). D14 et D21, D37 caducs d'après leurs révisions écrites (D97 + D14 bis, D23, D37 révisé).
- `palette` donne ECHEC sur copie pour Comparer et Dryhopper (6 teintes) : cause non élucidée, notée comme telle.
- Deux lignes (`Légende bis`, `Barres l5b`) ne sont pas des lignes D de DEFAUTS-COURT au sens de la GATE ; non incluses (D89 et D84 les portent).
- `controle-acquis.mjs` et `controle-une-question.mjs` ont été modifiés par une autre session pendant l'audit (option `--outil=dryhopper`, `--edition`) ; les verdicts D98 et D99 sont ceux de leur état au moment du jeu (ACQUIS OK 4/4 avec `--outil=dryhopper`).

DÉCISION À PRENDRE : `portee-defauts.json` est ignoré par git (`.gitignore` ligne 57, `/work/refonte-frontend/**` ; seuls `.md` et `.mjs` sont rouverts), comme le piège M05. Options : (a) ajouter `!/work/refonte-frontend/v4/tournoi/outils/portee-defauts.json` à `.gitignore`, (b) le déplacer sous `cerveau/` ou `docs/agents/`. Recommandation : (a), la ligne existe déjà pour les mesures du panel (M14). Je ne touche ni `.gitignore` ni git (hors de mon périmètre).

DÉCISION À PRENDRE : plafond de mots au premier écran, 70 (`controle-commun`) ou 80 (D1, SPEC § 0, D25 bis). Recommandation : 80 pour tout (c'est le mot du brasseur et de la spec), et ramener `controle-commun` à `--max=80`. À trancher avant de mettre `controle-commun` dans les GATES de Dryhopper et Comparer.

CONNAISSANCE : sur une page au format actuel, 9 scripts d'ancien format (rail, radar, recette, detail, comparer, suggestions, objets, palette, coherence) impriment « OK 0/0 » avec le code 0 ; un GATES doit exiger N/N avec N ≥ 1 (ou l'id nommé dans la sortie). Le remplissage D4 existe en deux mesures qui ne se comparent pas : boîtes (`capture.mjs`, seuil 0,80) et pixels (`controle-panel.mjs`, médiane 0,55 / plancher 0,50) ; Dryhopper g1 = 0,85 contre 0,57. Liste, par sujet, des contrôles qui tournent aujourd'hui sur les pages actuelles : `AUDIT.md`, « Portée par sujet ».

LEÇON PROPOSÉE : un contrôle écrit pour un format de dossier doit refuser un dossier qu'il ne sait pas lire (code 2, « 0 page lue »), jamais « OK 0/0 ». Le 23.10, neuf scripts de contrôle passaient au vert sur le format actuel en ne lisant rien, et le lanceur de la règle 3 (controle-lot) n'apparaissait dans aucun GATES. Faire : chaque GATES de voie cite ses scripts de CHECK par la liste « Portée par sujet » et un script contrôle `systeme.mjs` que la sortie nomme au moins une page lue ; une règle d'un registre dont le lanceur ne tourne plus sur le format courant se signale à l'ouverture du lot.
