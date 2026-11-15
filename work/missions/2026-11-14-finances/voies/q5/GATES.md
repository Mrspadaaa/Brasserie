# Gates: voie q5 — corrections de la relecture des paiements

OWNS: src/ui/finance/modifier, src/components/EditTransactionModal.tsx, src/domain/finance/correctionMontant.ts, tests/unit/correctionMontant.test.ts, tests/integration/modifierMontant.test.tsx, src/ui/finance/payer, work/missions/2026-11-14-finances/voies/q5

Scope: B1 et M1 à M5 corrigés, plans prouvés à l'émulateur.

- [ ] G1: les tests passent
  CHECK: node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/q5/tests.txt
  EXPECT: VITEST OK
  EVIDENCE: pending

- [ ] G2: l'émulateur accepte chaque plan
  CHECK: node work/missions/2026-11-14-finances/outils/lire.mjs work/missions/2026-11-14-finances/voies/q5/emulateur.txt "EMULATEUR OK" EMULATEUR
  EXPECT: EMULATEUR OK
  EVIDENCE: pending

- [ ] G3: le typage passe
  CHECK: node work/missions/2026-11-14-finances/outils/tsc.mjs
  EXPECT: TSC OK
  EVIDENCE: pending
