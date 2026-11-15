# Gates: voie q6 — problèmes du test d'écran 8151bee7

OWNS: src/ui/finance/payer, src/ui/finance/mouvement, src/ui/finance/MovementSheet.tsx, src/ui/finance/modifier, src/components/EditTransactionModal.tsx, src/domain/finance/correctionMontant.ts, src/ui/finance/TransactionRow.tsx, src/ui/finance/operations.css, tests/unit/correctionMontant.test.ts, tests/integration/modifierMontant.test.tsx, tests/integration/payerVirement.test.tsx, tests/integration/apportPoches.test.tsx, work/missions/2026-11-14-finances/voies/q5/emulateur.mjs, work/missions/2026-11-14-finances/voies/q6

Scope: problèmes 1 à 11 du verdict 8151bee7 corrigés.

- [ ] G1: les tests passent
  CHECK: node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/q6/tests.txt
  EXPECT: VITEST OK
  EVIDENCE: pending

- [ ] G2: l'émulateur accepte chaque plan
  CHECK: node work/missions/2026-11-14-finances/outils/lire.mjs work/missions/2026-11-14-finances/voies/q6/emulateur.txt "EMULATEUR OK" EMULATEUR
  EXPECT: EMULATEUR OK
  EVIDENCE: pending

- [ ] G3: les rangées v6a restent conformes
  CHECK: node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000
  EXPECT: V6A OK
  EVIDENCE: pending

- [ ] G4: le typage passe
  CHECK: node work/missions/2026-11-14-finances/outils/tsc.mjs
  EXPECT: TSC OK
  EVIDENCE: pending
