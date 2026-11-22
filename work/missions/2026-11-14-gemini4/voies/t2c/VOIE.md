# Voie t2c — tour 2 Gemini 4 : Compagnon hors analyse : relecture (`review`), recherche web (`research`, fournisseurs), mode Approfondi (analyse haute) ; et le niveau Max (`TIERS.max`, réflexion haute) des tâches qui l'offrent (diagnostic de fermentation, déclaration, anomalie des comptes)

- Agent : auteur · Modèle : sonnet · Plafond : 150 tours · Décideur : pilote (brasseur, 14.11 : budget 15 CHF pour ce tour)
- Lis d'abord `../../TOUR2.md` (règles communes, à suivre telles quelles).
- Budget de la voie : 4.5 CHF au plus ; relis le cumul de `work/missions/2026-11-14-gemini4/journal-tour2.md` avant chaque passe (deux autres voies y ajoutent ; ajoute sans réécrire) ; arrêt si cumul ≥ 14,5.

## Objectif
Pour chaque usage de : Compagnon hors analyse : relecture (`review`), recherche web (`research`, fournisseurs), mode Approfondi (analyse haute) ; et le niveau Max (`TIERS.max`, réflexion haute) des tâches qui l'offrent (diagnostic de fermentation, déclaration, anomalie des comptes) — trouver l'appel en production (modèle, réflexion, fonction Firebase), la vérité ou la grille, puis le tableau de comparaison et la recommandation (TOUR2.md).

## Contrôles
- Tests : `npx vitest run tests/unit/banc-* tests/unit/models* --reporter=dot > work/missions/2026-11-14-gemini4/voies/t2c/tests.txt` (plus les tests de tes nouveaux scripts).
- `npx tsc --noEmit -p .` et `-p functions`.

## Possède
Nouveaux `scripts/banc-t2-*` (préfixe propre à la voie : `banc-t2c-*`) et leurs tests, options ajoutées aux bancs existants de son périmètre sans changer leur sortie par défaut, `work/missions/2026-11-14-gemini4/voies/t2c/**`, lignes ajoutées à `journal-tour2.md`. Rien dans `src/` ni `functions/src/`.

## Rendre
`RESULTAT.md` tenu au fil (après chaque passe ; à 150 k : « REPRISE : <fichier> ») : tableaux, coût de la voie, recommandations, diff proposé. Une ligne.
