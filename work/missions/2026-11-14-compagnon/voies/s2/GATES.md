# Gates: voie s2 — mini maquettes du compagnon : le geste et le temps

OWNS: work/missions/2026-11-14-compagnon/voies/s2

Scope: quatre mini maquettes statiques du compagnon, 4 cadres chacune, clair et cave.

- [ ] G1: les quatre variantes ont etat.html, captures clair et cave, NOTE, 4 cadres, aucun nom de modèle, sans type number
  CHECK: node work/missions/2026-11-14-compagnon/outils/controle-serie.mjs work/missions/2026-11-14-compagnon/voies/s2 s2a,s2b,s2c,s2d
  EXPECT: SERIE OK
  EVIDENCE: pending

- [ ] G2: s2a se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-compagnon/voies/s2/s2a/etat.html
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G3: s2b se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-compagnon/voies/s2/s2b/etat.html
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G4: s2c se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-compagnon/voies/s2/s2c/etat.html
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G5: s2d se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-compagnon/voies/s2/s2d/etat.html
  EXPECT: PAGE OK
  EVIDENCE: pending
