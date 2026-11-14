# Gates: voie f1 — Port 1:1 de s2ap2

OWNS: src/ui/finance/operations, src/ui/finance/PlageMois.tsx, src/ui/finance/TransactionJournal.tsx, src/ui/finance/operations.css, tests/unit/operationsPlageJours.test.ts, work/missions/2026-11-14-finances/voies/f1

Scope: Opérations reçoit la frise des jours de s2ap2, plus compacte, avec deux champs du … au … à l'ordinateur.

- [ ] G1: le contrôle de la frise passe sur le banc
  CHECK: node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000
  EXPECT: FRISE OK
  EVIDENCE: pending

- [ ] G2: le témoin rouge du code d'avant est gardé
  CHECK: node work/missions/2026-11-14-finances/outils/lire.mjs work/missions/2026-11-14-finances/voies/f1/temoin-head.txt "FRISE ECHEC" TEMOIN
  EXPECT: TEMOIN OK
  EVIDENCE: pending

- [ ] G3: les rangées v6a restent intactes
  CHECK: node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000
  EXPECT: V6A OK
  EVIDENCE: pending

- [ ] G4: les tests passent
  CHECK: node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/f1/tests.txt
  EXPECT: VITEST OK
  EVIDENCE: pending

- [ ] G5: l'inventaire de la maquette est écrit
  CHECK: node work/missions/2026-11-14-finances/outils/lire.mjs work/missions/2026-11-14-finances/voies/f1/INVENTAIRE.md "hors plage" INVENTAIRE
  EXPECT: INVENTAIRE OK
  EVIDENCE: pending
