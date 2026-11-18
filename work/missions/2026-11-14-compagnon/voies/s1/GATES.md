# Gates: voie s1 — mini maquettes du compagnon : la réponse d’abord

OWNS: work/missions/2026-11-14-compagnon/voies/s1

Scope: quatre mini maquettes statiques du compagnon, 4 cadres chacune, clair et cave.

- [ ] G1: les quatre variantes ont etat.html, captures clair et cave, NOTE, 4 cadres, aucun nom de modèle, sans type number
  CHECK: node work/missions/2026-11-14-compagnon/outils/controle-serie.mjs work/missions/2026-11-14-compagnon/voies/s1 s1a,s1b,s1c,s1d
  EXPECT: SERIE OK
  EVIDENCE: pending

- [ ] G2: s1a se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-compagnon/voies/s1/s1a/etat.html
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G3: s1b se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-compagnon/voies/s1/s1b/etat.html
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G4: s1c se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-compagnon/voies/s1/s1c/etat.html
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G5: s1d se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-compagnon/voies/s1/s1d/etat.html
  EXPECT: PAGE OK
  EVIDENCE: pending
