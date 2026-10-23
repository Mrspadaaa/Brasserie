# Gates: voie p7-implementation — la maquette est-elle prête à porter dans l'app ?

OWNS: work/missions/2026-10-23-maquette-parcours/voies/p7-implementation/RESULTAT.md

Scope: relecture indépendante, en lecture seule, de ce qu'il faudra faire pour porter la maquette jouable dans l'app, avec un verdict par zone, les bloquants et l'effort.

- [ ] G1: le rapport couvre toutes les zones demandées
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p7-implementation/RESULTAT.md --contient "## Zones,## Recette : types,## Maquette seulement,## Persistance,## Performance,## Tests,## Bloquants,## Effort"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G2: le rapport s'appuie sur le code de l'app et de la maquette, fichiers cités
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p7-implementation/RESULTAT.md --contient "src/types/index.ts,useFullScreenRoute,src/moteur/index.ts,src/etat/,window.__parcours"
  EXPECT: NOTE OK
  EVIDENCE: pending
