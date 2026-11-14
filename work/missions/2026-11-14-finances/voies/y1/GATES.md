# Gates: voie y1 — Synthèse ramenée à g3a ; diagnostic Annuel

OWNS: src/ui/finance/synthese, src/ui/finance/synthese.css, work/missions/2026-11-14-finances/voies/y1

Scope: Sur ses données (ventes 5 695,00 contre dépenses 265,40), la Synthèse reste g3a.

- [ ] G1: le contrôle SYNTHESE passe sur le banc
  CHECK: node work/missions/2026-11-14-finances/voies/y1/controle-synthese.mjs 3000
  EXPECT: SYNTHESE OK
  EVIDENCE: pending

- [ ] G2: le témoin rouge du code actuel est gardé
  CHECK: node work/missions/2026-11-14-finances/outils/lire.mjs work/missions/2026-11-14-finances/voies/y1/temoin-head.txt "SYNTHESE ECHEC" TEMOIN
  EXPECT: TEMOIN OK
  EVIDENCE: pending

- [ ] G3: le typage passe
  CHECK: node work/missions/2026-11-14-finances/outils/tsc.mjs
  EXPECT: TSC OK
  EVIDENCE: pending

- [ ] G4: les tests finances passent
  CHECK: node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/y1/tests.txt
  EXPECT: VITEST OK
  EVIDENCE: pending

- [ ] G5: le diagnostic Annuel est écrit avec un verdict
  CHECK: node work/missions/2026-11-14-finances/outils/lire.mjs work/missions/2026-11-14-finances/voies/y1/DIAG-ANNUEL.md Verdict DIAG
  EXPECT: DIAG OK
  EVIDENCE: pending
