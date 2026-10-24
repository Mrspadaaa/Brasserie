# Gates: voie r15a-critique — dryhopper, fiche, etape, état par état

OWNS: work/missions/2026-10-23-maquette-parcours/voies/r15a-critique/RESULTAT.md

Scope: un verdict par état (RECONNU, ÉCART ou EN ATTENTE) sur ses trois images, et un verdict par écran, comme le brasseur.

- [ ] G1: chaque état de sa part a son verdict, au format exact
  CHECK: node work/missions/2026-10-23-maquette-parcours/voies/avis-complet.mjs work/missions/2026-10-23-maquette-parcours/voies/r15a-critique/RESULTAT.md dryhopper fiche etape
  EXPECT: AVIS-COMPLET-57
  EVIDENCE: pending

- [ ] G2: une section par écran, sur les captures du soir
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/r15a-critique/RESULTAT.md --contient "## dryhopper,## fiche,## etape,-construite.png"
  EXPECT: NOTE OK
  EVIDENCE: pending
