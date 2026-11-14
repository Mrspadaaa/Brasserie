# Voie t2b — tour 2 Gemini 4 : Routes Flash-Lite et tâches courtes : `readHopCoa`, `diagnoseBatch`, `lookup_brewing_reference`, les deux lectures parallèles Flash-Lite des justificatifs (Hydrogen@low/minimal à la place ? coût et temps comptent fort), et toute autre tâche de `TASKS` (`functions/src/prompts.ts`) restée sur 3.8 non couverte par t2a/t2c (liste-les toutes d'abord)

- Agent : auteur · Modèle : sonnet · Plafond : 150 tours · Décideur : pilote (brasseur, 14.11 : budget 15 CHF pour ce tour)
- Lis d'abord `../../TOUR2.md` (règles communes, à suivre telles quelles).
- Budget de la voie : 5 CHF au plus ; relis le cumul de `work/missions/2026-11-14-gemini4/journal-tour2.md` avant chaque passe (deux autres voies y ajoutent ; ajoute sans réécrire) ; arrêt si cumul ≥ 14,5.

## Objectif
Pour chaque usage de : Routes Flash-Lite et tâches courtes : `readHopCoa`, `diagnoseBatch`, `lookup_brewing_reference`, les deux lectures parallèles Flash-Lite des justificatifs (Hydrogen@low/minimal à la place ? coût et temps comptent fort), et toute autre tâche de `TASKS` (`functions/src/prompts.ts`) restée sur 3.8 non couverte par t2a/t2c (liste-les toutes d'abord) — trouver l'appel en production (modèle, réflexion, fonction Firebase), la vérité ou la grille, puis le tableau de comparaison et la recommandation (TOUR2.md).

## Contrôles
- Tests : `npx vitest run tests/unit/banc-* tests/unit/models* --reporter=dot > work/missions/2026-11-14-gemini4/voies/t2b/tests.txt` (plus les tests de tes nouveaux scripts).
- `npx tsc --noEmit -p .` et `-p functions`.

## Possède
Nouveaux `scripts/banc-t2-*` (préfixe propre à la voie : `banc-t2b-*`) et leurs tests, options ajoutées aux bancs existants de son périmètre sans changer leur sortie par défaut, `work/missions/2026-11-14-gemini4/voies/t2b/**`, lignes ajoutées à `journal-tour2.md`. Rien dans `src/` ni `functions/src/`.

## Rendre
`RESULTAT.md` tenu au fil (après chaque passe ; à 150 k : « REPRISE : <fichier> ») : tableaux, coût de la voie, recommandations, diff proposé. Une ligne.
