# Gates: voie p2b — passe 2 des candidates

OWNS: work/missions/2026-11-14-finances/voies/p2b

Scope: candidates s3b, s3c corrigées selon le critique, au repos et après le geste.

- [ ] G1: les candidates corrigées ont leurs fichiers, base v6a gardée
  CHECK: node work/missions/2026-11-14-finances/outils/controle-serie.mjs work/missions/2026-11-14-finances/voies/p2b s3bp2,s3cp2
  EXPECT: SERIE OK
  EVIDENCE: pending

- [ ] G2: s3bp2 se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-finances/voies/p2b/s3bp2/etat.html
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G3: s3cp2 se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-finances/voies/p2b/s3cp2/etat.html
  EXPECT: PAGE OK
  EVIDENCE: pending
