# Gates: voie p2c — passe 2 de s2d

OWNS: work/missions/2026-11-14-compagnon/voies/p2c

Scope: la candidate s2d complète, 12 cadres, clair et cave.

- [ ] G1: 12 cadres, captures clair et cave, NOTE, aucun nom de modèle, sans type number
  CHECK: node work/missions/2026-11-14-compagnon/outils/controle-serie.mjs work/missions/2026-11-14-compagnon/voies/p2c p2c --complet
  EXPECT: SERIE OK
  EVIDENCE: pending

- [ ] G2: la page se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-compagnon/voies/p2c/p2c/etat.html
  EXPECT: PAGE OK
  EVIDENCE: pending
