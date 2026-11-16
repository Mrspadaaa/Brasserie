# Gates: voie s4 — Correctifs FN-1, FN-3 à FN-12 du jeu en ligne

OWNS: src/ui/finance/modifier, src/components/EditTransactionModal.tsx, src/domain/finance/correctionMontant.ts, src/ui/finance/payer, src/ui/finance/fiche, src/ui/finance/TransactionDetails.tsx, src/ui/finance/mouvement, src/ui/finance/MovementSheet.tsx, src/ui/finance/CategoryTag.tsx, src/ui/finance/ExpenseSheet.tsx, src/domain/finance/ledger.ts, tests/unit/correctionMontant.test.ts, tests/integration/modifierMontant.test.tsx, tests/integration/payerVirement.test.tsx, tests/integration/ficheBarre.test.tsx, tests/integration/apportPoches.test.tsx, tests/integration/fnJeuEnLigne.test.tsx, work/missions/2026-11-14-finances/voies/q5/emulateur.mjs, work/missions/2026-11-14-finances/voies/s4

Scope: Correctifs FN-1, FN-3 à FN-12 du jeu en ligne, porté, typé, testé.

- [ ] G1: les tests de la voie passent
  CHECK: node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/s4/tests.txt
  EXPECT: VITEST OK
  EVIDENCE: pending

- [ ] G2: le typage passe
  CHECK: node work/missions/2026-11-14-finances/outils/tsc.mjs
  EXPECT: TSC OK
  EVIDENCE: pending

- [ ] G3: les rangées v6a restent conformes
  CHECK: node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000
  EXPECT: V6A OK
  EVIDENCE: pending
