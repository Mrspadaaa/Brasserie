# Compris : voie r2-details

## Objectif
Fermer les cinq détails (3 à 7) laissés par la relecture de r1 : chacun est soit corrigé, soit prouvé par un test qui a échoué d'abord
(ou par mutation). Il s'agit de `stockQuantityFor` (ligne sans poids face à un article au poids connu), du texte « en cours » du
rattachement, de la preuve par mutation des témoins R1, R1b et R3, de la branche « rejet confirmé », et du fichier changé alors qu'une
confirmation reste en attente (`pendingId`). Le plan tranche le détail 7 et dit pourquoi.

## Écrit dans
- `src/services/purchaseEntry.ts`
- `src/ui/finance/ExpenseSheet.tsx`
- `tests/unit/purchaseEntry.test.ts`
- `tests/unit/depense/raccord/`
- `work/missions/2026-10-31-ecran-depense/voies/r2-details/COMPRIS.md`
- `work/missions/2026-10-31-ecran-depense/voies/r2-details/PLAN.md`
- `work/missions/2026-10-31-ecran-depense/voies/r2-details/RESULTAT.md`

## Fini quand
- G1 : `comprendre` rend `COMPRIS OK`.
- G2 : deux regards neufs ont relu `PLAN.md`, la revue est triée, aucun bloquant sans sort (`REVUE OK`).
- G3 : `npm run build` affiche `built in`.
- G4 : `npx tsc --noEmit -p .` passe (`TYPES OK`).
- G5 : les tests de `tests/unit/depense`, `purchaseEntry`, `purchasePrefill`, `stockLineMatching`, `expenseSheet`, `jus0Journey`,
  `driveFileStore`, `financeDocumentPersistence` et `equipmentProjects` passent (`TESTS DETAILS OK`).
- G6 : `RESULTAT.md` contient `TEMOIN AVANT`, `SACHET_MAX_G`, `Rattacher le justificatif`, `mutation`, `isConfirmedWriteRejection`,
  `pendingId` et `Rien ne se perd`.
- Premier temps : COMPRIS, G1, PLAN.md, puis arrêt avec `PLAN PRÊT — 5 défauts`. Aucun code avant la revue triée.

## Ne fait pas
- Ne modifie ni `stockLineMatching.ts` (lecture, import de `SACHET_MAX_G` seulement), ni `purchasePrefill.ts`, `geminiScanner.ts`,
  `functions/` (voie l2), ni `InvoiceScanReview.tsx`, `BrewWizard.tsx`, `src/domain/fermentables/`.
- Dans `ExpenseSheet.tsx`, ne touche que `attach()` et `pendingId` : aucun élément visible neuf, l'écran est refait ensuite.
- Pas de Gemini ni de Drive réels, pas de commit, pas de `git stash`, pas d'installation, rien dans `brasseur/`, `functions/.env`, `.codex/`.
- Aucun champ retiré d'un document Firestore.

## Doutes
- `tests/integration/expenseSheet.test.tsx` est aussi dans le Possède (même ligne que `purchaseEntry.test.ts`) mais le contrôleur ne le lit
  pas ; je n'y écrirai qu'en cas de besoin, mes tests vont dans `tests/unit/depense/raccord/`.
- La consigne décrit les détails 3 à 6 comme à corriger ; or le dépôt à HEAD (`0ec04f8f`) contient déjà, selon `r1-raccord/RESULTAT.md`,
  les corrections de la relecture pour 3, 4, 5 et 6. Je le vérifie dans le code avant de rien écrire : ce qui existe est rejoué et cité, pas refait.
- Détail 7 : le bouton « Changer » est déjà `disabled` tant que `pendingId` est posé ; reste `attach()` lui-même, sans garde. Le plan tranche.
