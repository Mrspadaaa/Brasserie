# Gates: voie s3 — mini maquettes : préréglages et saisie, chaude

OWNS: work/missions/2026-11-14-finances/voies/s3

Scope: quatre mini maquettes statiques de v6a avec un filtre du … au …, au repos et après le geste.

- [ ] G1: les quatre variantes ont etat.html, repos, après et NOTE, base v6a gardée, sans type number
  CHECK: node work/missions/2026-11-14-finances/outils/controle-serie.mjs work/missions/2026-11-14-finances/voies/s3 s3a,s3b,s3c,s3d
  EXPECT: SERIE OK
  EVIDENCE: pending

- [ ] G2: s3a se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-finances/voies/s3/s3a/etat.html
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G3: s3b se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-finances/voies/s3/s3b/etat.html
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G4: s3c se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-finances/voies/s3/s3c/etat.html
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G5: s3d se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-finances/voies/s3/s3d/etat.html
  EXPECT: PAGE OK
  EVIDENCE: pending
