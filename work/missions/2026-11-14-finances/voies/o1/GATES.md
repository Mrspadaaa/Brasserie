# Gates: voie o1 — Opérations : rangées en v6a

OWNS: src/ui/finance/TransactionRow.tsx, src/ui/finance/operations.css, src/ui/finance/journal.css, work/missions/2026-11-14-finances/voies/o1

Scope: Les rangées d'Opérations (en-têtes de catégorie et opérations) reprennent « Lignes serrées v6a » telle quelle, à la place de v6b.

- [ ] G1: le contrôle V6A passe sur le banc
  CHECK: node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000
  EXPECT: V6A OK
  EVIDENCE: pending

- [ ] G2: le témoin rouge du code actuel est gardé
  CHECK: node work/missions/2026-11-14-finances/outils/lire.mjs work/missions/2026-11-14-finances/voies/o1/temoin-head.txt "V6A ECHEC" TEMOIN
  EXPECT: TEMOIN OK
  EVIDENCE: pending

- [ ] G3: le typage passe
  CHECK: node work/missions/2026-11-14-finances/outils/tsc.mjs
  EXPECT: TSC OK
  EVIDENCE: pending

- [ ] G4: les tests finances passent
  CHECK: node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/o1/tests.txt
  EXPECT: VITEST OK
  EVIDENCE: pending
