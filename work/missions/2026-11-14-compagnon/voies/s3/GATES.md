# Gates: voie s3 — mini maquettes du compagnon : représentations et place

OWNS: work/missions/2026-11-14-compagnon/voies/s3

Scope: quatre mini maquettes statiques du compagnon, 4 cadres chacune, clair et cave.

- [ ] G1: les quatre variantes ont etat.html, captures clair et cave, NOTE, 4 cadres, aucun nom de modèle, sans type number
  CHECK: node work/missions/2026-11-14-compagnon/outils/controle-serie.mjs work/missions/2026-11-14-compagnon/voies/s3 s3a,s3b,s3c,s3d
  EXPECT: SERIE OK
  EVIDENCE: pending

- [ ] G2: s3a se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-compagnon/voies/s3/s3a/etat.html
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G3: s3b se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-compagnon/voies/s3/s3b/etat.html
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G4: s3c se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-compagnon/voies/s3/s3c/etat.html
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G5: s3d se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-compagnon/voies/s3/s3d/etat.html
  EXPECT: PAGE OK
  EVIDENCE: pending
