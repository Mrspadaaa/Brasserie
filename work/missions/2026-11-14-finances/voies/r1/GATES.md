# Gates: voie r1 — Correctifs du test d'écran : Synthèse et Annuel

OWNS: src/ui/finance/synthese, src/ui/finance/synthese.css, src/ui/finance/FinanceOverview.tsx, src/ui/finance/annuel, src/ui/finance/TaxWorkspace.tsx, src/ui/finance/TaxClosingSheet.tsx, src/ui/finance/tax.css, src/ui/finance/TransactionDetails.tsx, tests/unit/annuelPiecesAClasser.test.ts, work/missions/2026-11-14-finances/voies/r1

Scope: problèmes 1, 2, 3, 7, 8, 9, 10 et 12 du test d'écran corrigés sur Synthèse et Annuel.

- [ ] G1: chaque point corrigé passe au banc
  CHECK: node work/missions/2026-11-14-finances/voies/r1/controle-r1.mjs 3000
  EXPECT: R1 OK
  EVIDENCE: pending

- [ ] G2: le témoin rouge d'avant est gardé
  CHECK: node work/missions/2026-11-14-finances/outils/lire.mjs work/missions/2026-11-14-finances/voies/r1/temoin-head.txt "R1 ECHEC" TEMOIN
  EXPECT: TEMOIN OK
  EVIDENCE: pending

- [ ] G3: le contrôle Synthèse g3a reste vert
  CHECK: node work/missions/2026-11-14-finances/voies/y1/controle-synthese.mjs 3000
  EXPECT: SYNTHESE OK
  EVIDENCE: pending

- [ ] G4: le contrôle Annuel reste vert
  CHECK: node work/missions/2026-11-14-finances/voies/a1/controle-annuel.mjs 3000
  EXPECT: ANNUEL OK
  EVIDENCE: pending

- [ ] G5: les tests passent
  CHECK: node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/r1/tests.txt
  EXPECT: VITEST OK
  EVIDENCE: pending
