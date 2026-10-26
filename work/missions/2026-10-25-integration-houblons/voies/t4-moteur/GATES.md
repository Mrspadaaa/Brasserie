# Gates: voie t4-moteur — le moteur v4 dans src/domain/hopIndex/v4/, une seule copie

OWNS: src/domain/hopIndex/v4/, src/data/hopV4/, prototypes/houblons-v4/src/, prototypes/houblons-v4/data/, prototypes/houblons-v4/parcours/src/, prototypes/houblons-v4/tests/, prototypes/houblons-v4/parcours/outils/portabilite.mjs, prototypes/houblons-v4/parcours/ARCHITECTURE.md, prototypes/houblons-v4/maquettes/parcours/, work/missions/2026-10-25-integration-houblons/voies/t4-moteur/

Scope: le moteur et ses données déménagent dans src/, la maquette et les tests les importent de là, rien de plus au démarrage.

- [ ] G1: le moteur est dans src/ et nulle part ailleurs, sans process.env ni alias ; tests du prototype verts ; build vert ; démarrage ≤ 919 ko gzip
  CHECK: node work/missions/2026-10-25-integration-houblons/voies/t4-moteur/verifier.mjs
  EXPECT: MOTEUR OK
  EVIDENCE: pending

- [ ] G2: la maquette rend la même chose (batterie entière, construction comprise)
  CHECK: node prototypes/houblons-v4/parcours/outils/batterie.mjs
  EXPECT: BATTERIE OK 46/46
  EVIDENCE: pending

- [ ] G3: les états de ses maquettes choisies tiennent
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours
  EXPECT: ETATS OK
  EVIDENCE: pending
