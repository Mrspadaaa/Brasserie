# ROUGES — suite complète (voie r3, 15.11 nuit)

Commande : `npx vitest run --reporter=dot --no-color` (tests-complet.txt) : 61 fichiers rouges, 16 tests rouges, 14 174 verts, 1 264 fichiers verts, 2 ignorés.
Base : `../f2/ROUGES.md` (59 fichiers, 14 tests, rejoués sur la base en ligne par f2) et `../r2/ROUGES.md`. Comparaison par `comm` sur les noms de fichier : 57 fichiers rouges d'ici sont dans la base ; 2 de plus (ci-dessous), aucun disparu.
Aucun rouge ne vient des 8 vues ni des FN : les fichiers que ces ports avaient cassés (brewBudgetSheet, brewBudgetDialog, coutBrassinCorrections, coutBrassinRenvois, renvoisPartout, budgetPiles, fx1, synthese, brewerChat, equipmentProjects, financeAnnuelSaisie, financeWorkspace, soldeDepartCause, impotBiereSheet, payerVirement) sont réalignés ou corrigés et verts.

| fichier | base rouge | cause |
| --- | --- | --- |
| tests/integration/expenseSheet.test.tsx | oui (1 test : « lit dès le choix du fichier… », `equipmentAction` « new » au lieu de « none ») | rejoué sur la base 92055daa (worktree temporaire, node_modules relié) : même échec ; ExpenseSheet.tsx n'a pas changé depuis. Absent de la liste de f2, vert dans la passe de r2 : cause non établie (piste : dépendance à l'heure, la passe tourne à 23 h). Non touché par un port. |
| tests/integration/fuzzSaisie.test.tsx | non (vert seul) | rouge seulement sous la charge de la suite (délai dépassé) ; vert seul 3 fois ; déjà vu sous charge par r2 (`../r2/ROUGES.md`) |
| tests/integration/recipeAiWorkflow.test.tsx, recipeEditing.test.tsx, yeastPitchingExecution.test.tsx | oui | base f2 : assertions de recette et de levure, sans rapport avec la finance |
| 49 fichiers de `tests/unit` et `tests/integration` (serveur, Gemini, levures, houblons, `functions/`) | oui | base f2 : dépendances de `functions/` absentes du worktree (« Cannot find package »), fichiers non chargés |
| tests/unit/brewerHopAdviceTransportV1.browser.test.ts | oui (verte seule : chemin de `@noble/hashes`) | base f2 : le test attend `node_modules` dans le worktree |

(La liste exacte des 59 fichiers de base est dans `../f2/ROUGES.md` ; la comparaison par `comm` est reproductible sur `tests-complet.txt`.)
