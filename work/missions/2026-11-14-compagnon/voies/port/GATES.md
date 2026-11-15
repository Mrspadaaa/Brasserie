# Gates: voie port — p2a portée 1:1

OWNS: work/missions/2026-11-14-compagnon/voies/port

Scope: (et, hors dépôt, le worktree compagnon-p2a : src/ui, tests) le compagnon prend la forme p2a, typé, testé, build vert, sans nom de modèle à l'écran.

- [ ] G1: aucun nom de modèle ni de fournisseur rendu
  CHECK: node work/missions/2026-11-14-compagnon/outils/controle-port.mjs noms
  EXPECT: PORT OK
  EVIDENCE: pending

- [ ] G2: types sans erreur
  CHECK: node work/missions/2026-11-14-compagnon/outils/controle-port.mjs tsc
  EXPECT: PORT OK
  EVIDENCE: pending

- [ ] G3: tests du compagnon verts
  CHECK: node work/missions/2026-11-14-compagnon/outils/controle-port.mjs tests
  EXPECT: PORT OK
  EVIDENCE: pending

- [ ] G4: build vert
  CHECK: node work/missions/2026-11-14-compagnon/outils/controle-port.mjs build
  EXPECT: PORT OK
  EVIDENCE: pending
