# Gates: voie t6b-async — interface asynchrone des calculs lourds ; les écrans passent par l'adaptateur

OWNS: src/domain/hopIndex/v4/client.ts, src/domain/hopIndex/v4/index.ts, prototypes/houblons-v4/parcours/src/moteur/, prototypes/houblons-v4/parcours/src/ecrans/, prototypes/houblons-v4/tests/, prototypes/houblons-v4/maquettes/parcours/, work/missions/2026-10-25-integration-houblons/voies/t6b-async/

Scope: le client asynchrone, aucun écran sur le moteur par défaut, rien de visible ne change.

- [ ] G1: client asynchrone, aucun import de valeur du moteur dans les écrans, test du client, tests du prototype verts
  CHECK: node work/missions/2026-10-25-integration-houblons/voies/t6b-async/verifier.mjs
  EXPECT: ASYNC OK
  EVIDENCE: pending

- [ ] G2: la maquette rend la même chose (batterie entière, sortie du rail comprise)
  CHECK: node prototypes/houblons-v4/parcours/outils/batterie.mjs
  EXPECT: BATTERIE OK 46/46
  EVIDENCE: pending

- [ ] G3: les états de ses maquettes choisies tiennent
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours
  EXPECT: ETATS OK
  EVIDENCE: pending

- [ ] G4: le build de l'app reste vert
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: pending
