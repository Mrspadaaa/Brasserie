# Gates: voie t1 — problèmes du test d'écran efff31bd

OWNS: src/ui/finance/fiche, src/ui/finance/TransactionDetails.tsx, src/ui/finance/mouvement, src/ui/finance/MovementSheet.tsx, src/ui/finance/ExpenseSheet.tsx, src/ui/finance/modifier, src/components/EditTransactionModal.tsx, src/domain/finance/correctionMontant.ts, work/missions/2026-11-14-finances/voies/q5/emulateur.mjs, tests, work/missions/2026-11-14-finances/voies/u1

Scope: Écritures : apport annulable (19), retirer une écriture payée (20), Nouvelle dépense à 1280 (18).

- [ ] G1: les tests touchés passent
  CHECK: node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/u1/tests.txt
  EXPECT: VITEST OK
  EVIDENCE: pending

- [ ] G2: le build passe
  CHECK: node work/missions/2026-11-14-finances/outils/lire.mjs work/missions/2026-11-14-finances/voies/u1/build.txt "built in" BUILD
  EXPECT: BUILD OK
  EVIDENCE: pending

- [ ] G3: le typage passe
  CHECK: node work/missions/2026-11-14-finances/outils/tsc.mjs
  EXPECT: TSC OK
  EVIDENCE: pending

- [ ] G4: les rangées v6a restent conformes
  CHECK: node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000
  EXPECT: V6A OK
  EVIDENCE: pending

- [ ] G5: l'émulateur accepte chaque plan
  CHECK: node work/missions/2026-11-14-finances/outils/lire.mjs work/missions/2026-11-14-finances/voies/u1/emulateur.txt "EMULATEUR OK" EMULATEUR
  EXPECT: EMULATEUR OK
  EVIDENCE: pending
