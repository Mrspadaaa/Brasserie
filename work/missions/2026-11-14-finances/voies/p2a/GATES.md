# Gates: voie p2a — passe 2 des candidates

OWNS: work/missions/2026-11-14-finances/voies/p2a

Scope: candidates s2b, s1b, s2a corrigées selon le critique, au repos et après le geste.

- [ ] G1: les candidates corrigées ont leurs fichiers, base v6a gardée
  CHECK: node work/missions/2026-11-14-finances/outils/controle-serie.mjs work/missions/2026-11-14-finances/voies/p2a s2bp2,s1bp2,s2ap2
  EXPECT: SERIE OK
  EVIDENCE: pending

- [ ] G2: s2bp2 se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-finances/voies/p2a/s2bp2/etat.html
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G3: s1bp2 se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-finances/voies/p2a/s1bp2/etat.html
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G4: s2ap2 se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-finances/voies/p2a/s2ap2/etat.html
  EXPECT: PAGE OK
  EVIDENCE: pending
