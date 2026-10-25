# Gates: voie t5b-voies — proposeVoies : l'effet d'un houblon à un moment mis en cache et partagé

OWNS: src/domain/hopIndex/v4/voies.ts, src/domain/hopIndex/v4/profil-simule.ts, src/domain/hopIndex/v4/yeast.ts, src/domain/hopIndex/v4/lru.ts, prototypes/houblons-v4/tests/, prototypes/houblons-v4/maquettes/parcours/, work/missions/2026-10-25-integration-houblons/voies/t5b-voies/

Scope: proposer à froid divisé par trois au moins, mêmes résultats, maquette inchangée.

- [ ] G1: empreinte de proposer inchangée, proposer froid ×5 au tiers au plus de l'avant, tests du prototype verts
  CHECK: node work/missions/2026-10-25-integration-houblons/voies/t5b-voies/verifier.mjs
  EXPECT: VOIES OK
  EVIDENCE: pending

- [ ] G2: la maquette rend la même chose
  CHECK: node prototypes/houblons-v4/parcours/outils/batterie.mjs
  EXPECT: BATTERIE OK 46/46
  EVIDENCE: pending

- [ ] G3: les états de ses maquettes choisies tiennent
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours
  EXPECT: ETATS OK
  EVIDENCE: pending
